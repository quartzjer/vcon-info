// Inspector Tree Component - Vanilla JS replacement for React TreeNode components
import { stateManager } from '../state-manager.js';

export class InspectorTree {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for state changes
    stateManager.subscribe('vconData', (vconData) => {
      this.render(vconData);
    });
    
    stateManager.subscribe('expandedNodes', () => {
      this.render(stateManager.getState('vconData'));
    });
    
    stateManager.subscribe('selectedParty', () => {
      this.render(stateManager.getState('vconData'));
    });
  }

  render(vconData) {
    if (!vconData) {
      this.container.innerHTML = '<p class="text-gray-400 text-sm">No valid vCon data to display</p>';
      return;
    }

    this.container.innerHTML = this.buildTree(vconData);
    this.attachEventListeners();
  }

  buildTree(data) {
    return `
      <div class="space-y-2">
        ${this.renderNode('vcon', data.vcon, 'text-blue-400')}
        ${this.renderNode('uuid', data.uuid, 'text-green-400')}
        ${data.created_at ? this.renderNode('created_at', data.created_at, 'text-purple-400') : ''}
        ${data.updated_at ? this.renderNode('updated_at', data.updated_at, 'text-purple-400') : ''}
        ${this.renderComplexNode('parties', data.parties)}
        ${data.dialog ? this.renderComplexNode('dialog', data.dialog) : ''}
        ${data.analysis ? this.renderComplexNode('analysis', data.analysis) : ''}
        ${data.attachments ? this.renderComplexNode('attachments', data.attachments) : ''}
      </div>
    `;
  }

  renderNode(key, value, colorClass = 'text-gray-300') {
    const displayValue = typeof value === 'string' ? value : JSON.stringify(value);
    return `
      <div class="flex items-start gap-2">
        <span class="text-gray-400 font-mono text-sm">${key}:</span>
        <span class="${colorClass} font-mono text-sm break-all">${this.escapeHtml(displayValue)}</span>
      </div>
    `;
  }

  renderComplexNode(key, value) {
    const isExpanded = stateManager.isNodeExpanded(key);
    const hasContent = Array.isArray(value) ? value.length > 0 : value && Object.keys(value).length > 0;
    
    if (!hasContent) {
      return `
        <div class="flex items-start gap-2">
          <span class="text-gray-400 font-mono text-sm">${key}:</span>
          <span class="text-gray-500 font-mono text-sm">[]</span>
        </div>
      `;
    }

    const chevronIcon = isExpanded ? '▼' : '▶';
    const content = isExpanded ? this.renderComplexContent(key, value) : '';

    return `
      <div class="space-y-1">
        <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-1 rounded" data-toggle-node="${key}">
          <span class="text-gray-400 select-none w-3 text-center">${chevronIcon}</span>
          <span class="text-gray-400 font-mono text-sm">${key}:</span>
          <span class="text-gray-500 font-mono text-sm">[${Array.isArray(value) ? value.length : Object.keys(value).length}]</span>
        </div>
        ${content ? `<div class="ml-6">${content}</div>` : ''}
      </div>
    `;
  }

  renderComplexContent(key, value) {
    if (key === 'parties') {
      return this.renderParties(value);
    } else if (key === 'dialog') {
      return this.renderDialog(value);
    } else if (key === 'analysis') {
      return this.renderAnalysis(value);
    } else if (key === 'attachments') {
      return this.renderAttachments(value);
    }
    
    // Default rendering for other complex objects
    return this.renderGenericObject(value);
  }

  renderParties(parties) {
    return parties.map((party, index) => {
      const isSelected = stateManager.getState('selectedParty') === index;
      const bgClass = isSelected ? 'bg-blue-500/20 border-blue-500/30' : 'bg-gray-700';
      
      return `
        <div class="mb-2 p-3 rounded border ${bgClass} cursor-pointer party-item" data-party-index="${index}">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-mono text-xs text-gray-400">Party ${index}</span>
            ${party.role ? `<span class="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">${party.role}</span>` : ''}
          </div>
          <div class="space-y-1 text-sm">
            ${party.name ? `<div><span class="text-gray-400">name:</span> <span class="text-gray-300">${this.escapeHtml(party.name)}</span></div>` : ''}
            ${party.tel ? `<div><span class="text-gray-400">tel:</span> <span class="text-blue-400">${this.escapeHtml(party.tel)}</span></div>` : ''}
            ${party.email ? `<div><span class="text-gray-400">email:</span> <span class="text-blue-400">${this.escapeHtml(party.email)}</span></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderDialog(dialog) {
    return dialog.map((item, index) => {
      const typeColor = {
        'recording': 'text-orange-300',
        'text': 'text-green-300',
        'transfer': 'text-blue-300',
        'incomplete': 'text-red-300'
      }[item.type] || 'text-gray-300';

      return `
        <div class="mb-2 p-3 rounded bg-gray-700 border border-gray-600">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-mono text-xs text-gray-400">Dialog ${index}</span>
            <span class="px-2 py-1 rounded text-xs bg-gray-600 ${typeColor}">${item.type}</span>
          </div>
          <div class="space-y-1 text-sm">
            ${item.start ? `<div><span class="text-gray-400">start:</span> <span class="text-purple-400">${this.escapeHtml(item.start)}</span></div>` : ''}
            ${item.duration ? `<div><span class="text-gray-400">duration:</span> <span class="text-yellow-400">${item.duration}s</span></div>` : ''}
            ${item.parties ? `<div><span class="text-gray-400">parties:</span> <span class="text-blue-400">[${item.parties.join(', ')}]</span></div>` : ''}
            ${item.mediatype ? `<div><span class="text-gray-400">mediatype:</span> <span class="text-green-400">${this.escapeHtml(item.mediatype)}</span></div>` : ''}
            ${item.body ? `<div><span class="text-gray-400">body:</span> <span class="text-gray-300 truncate block">${this.escapeHtml(String(item.body).substring(0, 100))}${String(item.body).length > 100 ? '...' : ''}</span></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderAnalysis(analysis) {
    return analysis.map((item, index) => {
      return `
        <div class="mb-2 p-3 rounded bg-gray-700 border border-gray-600">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-mono text-xs text-gray-400">Analysis ${index}</span>
            <span class="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">${item.type}</span>
          </div>
          <div class="space-y-1 text-sm">
            ${item.dialog !== undefined ? `<div><span class="text-gray-400">dialog:</span> <span class="text-blue-400">${Array.isArray(item.dialog) ? `[${item.dialog.join(', ')}]` : item.dialog}</span></div>` : ''}
            ${item.mediatype ? `<div><span class="text-gray-400">mediatype:</span> <span class="text-green-400">${this.escapeHtml(item.mediatype)}</span></div>` : ''}
            ${item.body ? `<div><span class="text-gray-400">body:</span> <span class="text-gray-300">${this.escapeHtml(JSON.stringify(item.body, null, 2))}</span></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderAttachments(attachments) {
    return attachments.map((item, index) => {
      return `
        <div class="mb-2 p-3 rounded bg-gray-700 border border-gray-600">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-mono text-xs text-gray-400">Attachment ${index}</span>
            <span class="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-300">${item.type}</span>
          </div>
          <div class="space-y-1 text-sm">
            ${item.mediatype ? `<div><span class="text-gray-400">mediatype:</span> <span class="text-green-400">${this.escapeHtml(item.mediatype)}</span></div>` : ''}
            ${item.url ? `<div><span class="text-gray-400">url:</span> <a href="${this.escapeHtml(item.url)}" class="text-blue-400 hover:text-blue-300 break-all">${this.escapeHtml(item.url)}</a></div>` : ''}
            ${item.content_hash ? `<div><span class="text-gray-400">hash:</span> <span class="text-gray-300 font-mono text-xs truncate block">${this.escapeHtml(item.content_hash)}</span></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderGenericObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => `
        <div class="mb-1">
          <span class="text-gray-400 font-mono text-sm">[${index}]:</span>
          <span class="text-gray-300 font-mono text-sm">${this.escapeHtml(JSON.stringify(item, null, 2))}</span>
        </div>
      `).join('');
    } else {
      return Object.entries(obj).map(([key, value]) => `
        <div class="mb-1">
          <span class="text-gray-400 font-mono text-sm">${key}:</span>
          <span class="text-gray-300 font-mono text-sm">${this.escapeHtml(JSON.stringify(value, null, 2))}</span>
        </div>
      `).join('');
    }
  }

  attachEventListeners() {
    // Node toggle events
    this.container.querySelectorAll('[data-toggle-node]').forEach(element => {
      element.addEventListener('click', (e) => {
        const node = e.currentTarget.dataset.toggleNode;
        stateManager.toggleNode(node);
      });
    });

    // Party selection events
    this.container.querySelectorAll('.party-item').forEach(element => {
      element.addEventListener('click', (e) => {
        const partyIndex = parseInt(e.currentTarget.dataset.partyIndex);
        const currentSelected = stateManager.getState('selectedParty');
        stateManager.setSelectedParty(currentSelected === partyIndex ? null : partyIndex);
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}