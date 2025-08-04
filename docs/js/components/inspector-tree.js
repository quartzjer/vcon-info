// Inspector Tree Component - Refactored with shared utilities and base class
import { BaseComponent } from './base-component.js';
import { stateManager } from '../state-manager.js';
import { createPropertyRow, createExpandableNode, createPartyCard, createDialogCard, createAnalysisCard, createAttachmentCard } from '../utils/templates.js';

export class InspectorTree extends BaseComponent {
  constructor(containerId) {
    super(containerId);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Use base class method for automatic cleanup tracking
    this.subscribeToState(stateManager, 'vconData', (vconData) => {
      this.render(vconData);
    });
    
    this.subscribeToState(stateManager, 'expandedNodes', () => {
      this.render(stateManager.getState('vconData'));
    });
    
    this.subscribeToState(stateManager, 'selectedParty', () => {
      this.render(stateManager.getState('vconData'));
    });
  }

  render(vconData) {
    if (!vconData) {
      this.showEmpty('No valid vCon data to display');
      return;
    }

    this.updateContent(this.generateTreeHTML(vconData));
  }

  generateTreeHTML(data) {
    return `
      <div class="space-y-2">
        ${createPropertyRow('vcon', data.vcon, 'text-blue-400')}
        ${createPropertyRow('uuid', data.uuid, 'text-green-400')}
        ${data.created_at ? createPropertyRow('created_at', data.created_at, 'text-purple-400') : ''}
        ${data.updated_at ? createPropertyRow('updated_at', data.updated_at, 'text-purple-400') : ''}
        ${this.renderExpandableNode('parties', data.parties)}
        ${data.dialog ? this.renderExpandableNode('dialog', data.dialog) : ''}
        ${data.analysis ? this.renderExpandableNode('analysis', data.analysis) : ''}
        ${data.attachments ? this.renderExpandableNode('attachments', data.attachments) : ''}
      </div>
    `;
  }

  renderExpandableNode(key, value) {
    const isExpanded = stateManager.isNodeExpanded(key);
    const hasContent = Array.isArray(value) ? value.length > 0 : value && Object.keys(value).length > 0;
    
    const expandableHeader = createExpandableNode(key, value, isExpanded, hasContent);
    const content = isExpanded ? this.renderExpandableContent(key, value) : '';

    return `
      <div class="space-y-1">
        ${expandableHeader}
        ${content ? `<div class="ml-6">${content}</div>` : ''}
      </div>
    `;
  }

  renderExpandableContent(key, value) {
    switch (key) {
      case 'parties':
        return this.renderParties(value);
      case 'dialog':
        return this.renderDialog(value);
      case 'analysis':
        return this.renderAnalysis(value);
      case 'attachments':
        return this.renderAttachments(value);
      default:
        return this.renderGenericObject(value);
    }
  }

  renderParties(parties) {
    return parties.map((party, index) => {
      const isSelected = stateManager.getState('selectedParty') === index;
      return createPartyCard(party, index, isSelected);
    }).join('');
  }

  renderDialog(dialog) {
    return dialog.map((item, index) => createDialogCard(item, index)).join('');
  }

  renderAnalysis(analysis) {
    return analysis.map((item, index) => createAnalysisCard(item, index)).join('');
  }

  renderAttachments(attachments) {
    return attachments.map((item, index) => createAttachmentCard(item, index)).join('');
  }

  renderGenericObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        createPropertyRow(`[${index}]`, JSON.stringify(item, null, 2), 'text-gray-300')
      ).join('');
    } else {
      return Object.entries(obj).map(([key, value]) => 
        createPropertyRow(key, JSON.stringify(value, null, 2), 'text-gray-300')
      ).join('');
    }
  }

  attachEventListeners() {
    // Use delegated event listeners for better performance
    this.addDelegatedEventListener('[data-toggle-node]', 'click', function(e) {
      const node = this.dataset.toggleNode;
      stateManager.toggleNodeExpansion(node);
    });

    this.addDelegatedEventListener('.party-item', 'click', function(e) {
      const partyIndex = parseInt(this.dataset.partyIndex);
      const currentSelected = stateManager.getState('selectedParty');
      stateManager.updateSelectedParty(currentSelected === partyIndex ? null : partyIndex);
    });
  }
}