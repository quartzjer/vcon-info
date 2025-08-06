// vCon Info - UI Module
// Handles all user interface interactions, DOM manipulation, and visual state changes

// DOM Elements
const vconInput = document.getElementById('input-textarea');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const panelToggles = document.querySelectorAll('.panel-toggle');
const lockButton = document.getElementById('lock-button');
const keyPanel = document.getElementById('key-panel');
const inputTabButtons = document.querySelectorAll('.input-tab-button');
const inputTabPanels = document.querySelectorAll('.input-tab-panel');

// Tab Switching Functionality
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and panels
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.classList.remove('border-blue-600');
        });
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        // Add active class to clicked button and corresponding panel
        button.classList.add('active');
        button.classList.add('border-blue-600');
        
        // Find the corresponding panel
        const panelId = targetTab + '-view';
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
        }
    });
});

// Input Tab Switching Functionality
inputTabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-input-tab');
        
        // Remove active class from all buttons and panels
        inputTabButtons.forEach(btn => btn.classList.remove('active'));
        inputTabPanels.forEach(panel => panel.classList.remove('active'));
        
        // Add active class to clicked button and corresponding panel
        button.classList.add('active');
        
        // Find the corresponding panel
        const panelId = targetTab + '-view';
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
        }
    });
});

// Panel Toggle Functionality (Eye Icon)
panelToggles.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Find the section and content
        const section = button.closest('.inspector-section');
        const content = section.querySelector('.section-content');
        
        if (content) {
            // Toggle collapsed state
            const isCollapsed = content.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Expand
                content.classList.remove('collapsed');
                button.classList.remove('collapsed');
            } else {
                // Collapse
                content.classList.add('collapsed');
                button.classList.add('collapsed');
            }
        }
    });
});

// Lock Button Toggle Functionality
if (lockButton && keyPanel) {
    lockButton.addEventListener('click', () => {
        const isExpanded = keyPanel.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse the panel
            keyPanel.classList.remove('expanded');
            lockButton.classList.remove('active');
            lockButton.setAttribute('aria-expanded', 'false');
        } else {
            // Expand the panel
            keyPanel.classList.add('expanded');
            lockButton.classList.add('active');
            lockButton.setAttribute('aria-expanded', 'true');
        }
    });
}

// Upload functionality
function initializeUpload() {
    const dropZone = document.querySelector('.upload-drop-zone');
    const fileInput = document.getElementById('file-input');
    
    if (!dropZone || !fileInput) return;
    
    // Click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });
    
    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    });
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        // Switch to paste tab and update textarea
        document.getElementById('tab-paste').click();
        if (vconInput) {
            vconInput.value = content;
            vconInput.dispatchEvent(new Event('input'));
        }
    };
    reader.readAsText(file);
}

// Examples functionality
async function initializeExamples() {
    const examplesList = document.getElementById('examples-list');
    if (!examplesList) return;
    
    // Show loading state
    examplesList.innerHTML = '<div class="examples-loading">Loading examples...</div>';
    
    try {
        // Load the list of examples
        const response = await fetch('examples/list.json');
        if (!response.ok) {
            throw new Error('Failed to load examples list');
        }
        
        const examples = await response.json();
        
        // Clear loading state
        examplesList.innerHTML = '';
        
        // Create example items
        examples.forEach(filename => {
            const item = createExampleItem(filename);
            examplesList.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading examples:', error);
        examplesList.innerHTML = `
            <div class="examples-error">
                Failed to load examples: ${error.message}
            </div>
        `;
    }
}

function createExampleItem(filename) {
    const item = document.createElement('div');
    item.className = 'example-item';
    
    // Parse filename to get a friendly name and type
    const name = filename.replace('.vcon', '').replace(/_/g, ' ');
    const type = getExampleType(filename);
    
    item.innerHTML = `
        <span class="example-icon">📄</span>
        <div class="example-content">
            <div class="example-name">${escapeHtml(name)}</div>
            <div class="example-type">${escapeHtml(filename)}</div>
        </div>
        ${type ? `<span class="example-badge">${escapeHtml(type)}</span>` : ''}
    `;
    
    item.addEventListener('click', () => loadExample(filename, item));
    
    return item;
}

function getExampleType(filename) {
    if (filename.includes('email')) return 'email';
    if (filename.includes('call')) return 'call';
    if (filename.includes('encrypted')) return 'encrypted';
    if (filename.includes('signed')) return 'signed';
    if (filename.includes('redacted')) return 'redacted';
    if (filename.includes('analysis')) return 'analysis';
    if (filename.includes('simple')) return 'basic';
    return null;
}

async function loadExample(filename, itemElement) {
    // Add loading state to the clicked item
    itemElement.classList.add('loading');
    
    try {
        // Fetch the example file
        const response = await fetch(`examples/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load example: ${filename}`);
        }
        
        const content = await response.text();
        
        // Switch to paste tab
        document.getElementById('tab-paste').click();
        
        // Load content into textarea
        if (vconInput) {
            vconInput.value = content;
            vconInput.dispatchEvent(new Event('input'));
        }
        
        // Show success feedback
        itemElement.classList.remove('loading');
        
        // Add temporary success highlight
        itemElement.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
        setTimeout(() => {
            itemElement.style.backgroundColor = '';
        }, 500);
        
    } catch (error) {
        console.error('Error loading example:', error);
        itemElement.classList.remove('loading');
        
        // Show error feedback
        itemElement.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        setTimeout(() => {
            itemElement.style.backgroundColor = '';
        }, 1000);
        
        alert(`Failed to load example: ${error.message}`);
    }
}

/**
 * Update the inspector panels with processed vCon data
 * @param {object} result - Processed vCon result from VConProcessor
 */
function updateInspectorPanels(result) {
    updateMetadataPanel(result.metadata);
    updateRelationshipsPanel(result.metadata);
    updatePartiesPanel(result.parties);
    updateDialogPanel(result.dialog);
    updateAttachmentsPanel(result.attachments);
    updateAnalysisPanel(result.analysis);
    updateExtensionsPanel(result.extensions);
}

/**
 * Update Metadata panel with metadata
 */
function updateMetadataPanel(metadata) {
    const section = document.querySelector('.section-metadata').parentElement;
    const content = section.querySelector('.section-content');
    
    const html = `
        <div class="content-placeholder">
            <div class="detail-row">
                <span class="detail-key">vCon Version:</span>
                <span class="detail-value"><code>${escapeHtml(metadata.version || 'Unknown')}</code></span>
            </div>
            <div class="detail-row">
                <span class="detail-key">UUID:</span>
                <span class="detail-value"><code>${escapeHtml(metadata.uuid || 'Not specified')}</code></span>
            </div>
            <div class="detail-row">
                <span class="detail-key">Created At:</span>
                <span class="detail-value">${metadata.created ? metadata.created.display : 'Not specified'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-key">Updated At:</span>
                <span class="detail-value">${metadata.updated ? metadata.updated.display : 'Not specified'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-key">Subject:</span>
                <span class="detail-value">${metadata.subject ? escapeHtml(metadata.subject) : '<em>Not specified</em>'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-key">Must Support Extensions:</span>
                <span class="detail-value">${metadata.must_support && metadata.must_support.length > 0 
                    ? metadata.must_support.map(ext => `<code>${escapeHtml(ext)}</code>`).join(', ') 
                    : '<em>None</em>'}</span>
            </div>
            ${metadata.redacted ? `
            <div class="detail-row">
                <span class="detail-key">Redacted From:</span>
                <span class="detail-value"><code>${escapeHtml(metadata.redacted.uuid)}</code></span>
            </div>` : ''}
            ${metadata.appended ? `
            <div class="detail-row">
                <span class="detail-key">Appended To:</span>
                <span class="detail-value"><code>${escapeHtml(metadata.appended.uuid)}</code></span>
            </div>` : ''}
        </div>
    `;
    
    content.innerHTML = html;
}

/**
 * Update Relationships panel with vCon relationship information
 */
function updateRelationshipsPanel(metadata) {
    const section = document.querySelector('.section-relationships').parentElement;
    const content = section.querySelector('.section-content');
    
    let html = '<div class="content-placeholder">';
    
    if (metadata.redacted) {
        html += `
            <div class="relationship-info">
                <div class="relationship-type">
                    <span class="relationship-badge badge-redacted">Redacted vCon</span>
                </div>
                <div class="relationship-details">
                    <div class="detail-row">
                        <span class="detail-key">Type:</span>
                        <span class="detail-value">Redacted from original vCon</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-key">Original UUID:</span>
                        <span class="detail-value"><span class="uuid-display">${escapeHtml(metadata.redacted.uuid)}</span></span>
                    </div>
                    ${metadata.redacted.type ? `
                    <div class="detail-row">
                        <span class="detail-key">Redaction Type:</span>
                        <span class="detail-value">${escapeHtml(metadata.redacted.type)}</span>
                    </div>` : ''}
                    ${metadata.redacted.url ? `
                    <div class="detail-row">
                        <span class="detail-key">Original URL:</span>
                        <span class="detail-value">
                            <a href="${escapeHtml(metadata.redacted.url)}" class="relationship-link" target="_blank">
                                View Original
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                                </svg>
                            </a>
                        </span>
                    </div>` : ''}
                </div>
            </div>
        `;
    } else if (metadata.appended) {
        html += `
            <div class="relationship-info">
                <div class="relationship-type">
                    <span class="relationship-badge badge-appended">Appended vCon</span>
                </div>
                <div class="relationship-details">
                    <div class="detail-row">
                        <span class="detail-key">Type:</span>
                        <span class="detail-value">Appended to vCon chain</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-key">Previous UUID:</span>
                        <span class="detail-value"><span class="uuid-display">${escapeHtml(metadata.appended.uuid)}</span></span>
                    </div>
                    ${metadata.appended.url ? `
                    <div class="detail-row">
                        <span class="detail-key">Previous URL:</span>
                        <span class="detail-value">
                            <a href="${escapeHtml(metadata.appended.url)}" class="relationship-link" target="_blank">
                                View Previous
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                                </svg>
                            </a>
                        </span>
                    </div>` : ''}
                </div>
            </div>
        `;
    } else if (metadata.group) {
        html += `
            <div class="relationship-info">
                <div class="relationship-type">
                    <span class="relationship-badge badge-group">Group vCon</span>
                </div>
                <div class="relationship-details">
                    <div class="detail-row">
                        <span class="detail-key">Type:</span>
                        <span class="detail-value">Member of vCon group</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-key">Group Size:</span>
                        <span class="detail-value">${metadata.group.count} vCons</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-key">Group Members:</span>
                        <span class="detail-value">
                            ${metadata.group.uuids.map(uuid => `
                                <div class="uuid-display" style="margin-bottom: 4px;">${escapeHtml(uuid)}</div>
                            `).join('')}
                        </span>
                    </div>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="relationship-info">
                <div class="relationship-type">
                    <span class="relationship-badge badge-standard">Standard vCon</span>
                </div>
                <div class="relationship-details">
                    <div class="detail-row">
                        <span class="detail-key">Type:</span>
                        <span class="detail-value">Standard (no relationships)</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-key">Description:</span>
                        <span class="detail-value">This vCon is not part of any redaction, append, or group relationships</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    content.innerHTML = html;
}

/**
 * Update Parties panel
 */
function updatePartiesPanel(parties) {
    const section = document.querySelector('.section-parties').parentElement;
    const content = section.querySelector('.section-content');
    
    if (parties.length === 0) {
        content.innerHTML = '<div class="empty-message">No parties defined</div>';
        autoCollapsePanel(section);
        return;
    }
    
    autoExpandPanel(section);
    
    const html = parties.map((party, index) => `
        <div class="party-item">
            <div class="party-header">
                <span class="party-index">[${index}]</span>
                ${party.name ? `<span class="party-name">${escapeHtml(party.name)}</span>` : ''}
            </div>
            <div class="party-identifiers">
                ${party.identifiers.map(id => `
                    <div class="identifier">
                        <span class="id-type">${id.type}:</span>
                        <span class="id-value">${escapeHtml(id.display)}</span>
                    </div>
                `).join('')}
            </div>
            ${party.validation ? `
            <div class="party-validation">
                <span class="validation-label">Validation:</span>
                <span class="validation-value">${escapeHtml(party.validation)}</span>
            </div>` : ''}
        </div>
    `).join('');
    
    content.innerHTML = html;
}

/**
 * Update Dialog panel
 */
function updateDialogPanel(dialogs) {
    const section = document.querySelector('.section-dialog').parentElement;
    const content = section.querySelector('.section-content');
    
    if (dialogs.length === 0) {
        content.innerHTML = '<div class="empty-message">No dialog records</div>';
        autoCollapsePanel(section);
        return;
    }
    
    autoExpandPanel(section);
    
    const html = dialogs.map((dialog, index) => `
        <div class="dialog-item">
            <div class="dialog-header">
                <span class="dialog-index">[${index}]</span>
                <span class="dialog-type ${dialog.type}">${dialog.type}</span>
                ${dialog.mediatype ? `<span class="dialog-media">${dialog.mediatype}</span>` : ''}
            </div>
            <div class="dialog-details">
                ${dialog.start ? `
                <div class="detail-item">
                    <span class="detail-label">Start:</span>
                    <span class="detail-value">${dialog.start.display}</span>
                </div>` : ''}
                ${dialog.duration ? `
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${dialog.duration}s</span>
                </div>` : ''}
                ${dialog.parties.length > 0 ? `
                <div class="detail-item">
                    <span class="detail-label">Parties:</span>
                    <span class="detail-value">${dialog.parties.map(p => p.name || `Party ${p.index}`).join(', ')}</span>
                </div>` : ''}
                ${dialog.disposition ? `
                <div class="detail-item">
                    <span class="detail-label">Disposition:</span>
                    <span class="detail-value">${dialog.disposition}</span>
                </div>` : ''}
            </div>
        </div>
    `).join('');
    
    content.innerHTML = html;
}

/**
 * Update Attachments panel
 */
function updateAttachmentsPanel(attachments) {
    const section = document.querySelector('.section-attachments').parentElement;
    const content = section.querySelector('.section-content');
    
    if (attachments.length === 0) {
        content.innerHTML = '<div class="empty-message">No attachments</div>';
        autoCollapsePanel(section);
        return;
    }
    
    autoExpandPanel(section);
    
    const html = attachments.map((attachment, index) => `
        <div class="attachment-item">
            <div class="attachment-header">
                <span class="attachment-index">[${index}]</span>
                <span class="attachment-filename">${escapeHtml(attachment.filename)}</span>
            </div>
            <div class="attachment-details">
                <div class="detail-item">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${attachment.mediatype}</span>
                </div>
                ${attachment.party ? `
                <div class="detail-item">
                    <span class="detail-label">From:</span>
                    <span class="detail-value">${attachment.party.name || `Party ${attachment.party.index}`}</span>
                </div>` : ''}
            </div>
        </div>
    `).join('');
    
    content.innerHTML = html;
}

/**
 * Update Analysis panel
 */
function updateAnalysisPanel(analyses) {
    const section = document.querySelector('.section-analysis').parentElement;
    const content = section.querySelector('.section-content');
    
    if (analyses.length === 0) {
        content.innerHTML = '<div class="empty-message">No analysis data</div>';
        autoCollapsePanel(section);
        return;
    }
    
    autoExpandPanel(section);
    
    const html = analyses.map((analysis, index) => `
        <div class="analysis-item">
            <div class="analysis-header">
                <span class="analysis-index">[${index}]</span>
                <span class="analysis-type">${analysis.type}</span>
            </div>
            <div class="analysis-details">
                ${analysis.vendor ? `
                <div class="detail-item">
                    <span class="detail-label">Vendor:</span>
                    <span class="detail-value">${escapeHtml(analysis.vendor)}</span>
                </div>` : ''}
                ${analysis.product ? `
                <div class="detail-item">
                    <span class="detail-label">Product:</span>
                    <span class="detail-value">${escapeHtml(analysis.product)}</span>
                </div>` : ''}
            </div>
        </div>
    `).join('');
    
    content.innerHTML = html;
}

/**
 * Update Extensions panel
 */
function updateExtensionsPanel(extensions) {
    const section = document.querySelector('.section-extensions').parentElement;
    const content = section.querySelector('.section-content');
    
    const keys = Object.keys(extensions);
    if (keys.length === 0) {
        content.innerHTML = '<div class="empty-message">No extensions</div>';
        autoCollapsePanel(section);
        return;
    }
    
    autoExpandPanel(section);
    
    const html = keys.map(key => `
        <div class="extension-item">
            <span class="extension-key">${escapeHtml(key)}:</span>
            <span class="extension-value">${escapeHtml(JSON.stringify(extensions[key], null, 2))}</span>
        </div>
    `).join('');
    
    content.innerHTML = html;
}

/**
 * Update timeline view
 * @param {array} timeline - Timeline events from vCon processor
 */
function updateTimeline(timeline) {
    const timelineView = document.getElementById('timeline-view');
    if (!timelineView) return;
    
    if (!timeline || timeline.length === 0) {
        timelineView.innerHTML = '<div class="empty-timeline">No timeline events to display</div>';
        return;
    }
    
    const html = `
        <div class="timeline-container">
            ${timeline.map(event => `
                <div class="timeline-event ${event.type}">
                    <div class="event-time">${new Date(event.time).toLocaleString()}</div>
                    <div class="event-description">${escapeHtml(event.description)}</div>
                    ${event.details ? `
                    <div class="event-details">
                        ${Object.entries(event.details).map(([key, value]) => 
                            `<span class="detail">${key}: ${escapeHtml(String(value))}</span>`
                        ).join(', ')}
                    </div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    timelineView.innerHTML = html;
}

/**
 * Clear timeline view
 */
function clearTimeline() {
    const timelineView = document.getElementById('timeline-view');
    if (timelineView) {
        timelineView.innerHTML = '<div class="empty-timeline">No timeline data</div>';
    }
}

/**
 * Clear all inspector panels
 */
function clearInspectorPanels() {
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
        section.innerHTML = '<div class="content-placeholder">No data to display</div>';
    });
}

/**
 * Auto-collapse a panel section when it has no data
 * @param {HTMLElement} section - The inspector section element
 */
function autoCollapsePanel(section) {
    const content = section.querySelector('.section-content');
    const toggleButton = section.querySelector('.panel-toggle');
    
    if (content && toggleButton && !content.classList.contains('collapsed')) {
        content.classList.add('collapsed');
        toggleButton.classList.add('collapsed');
    }
}

/**
 * Auto-expand a panel section when it has data
 * @param {HTMLElement} section - The inspector section element  
 */
function autoExpandPanel(section) {
    const content = section.querySelector('.section-content');
    const toggleButton = section.querySelector('.panel-toggle');
    
    if (content && toggleButton && content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        toggleButton.classList.remove('collapsed');
    }
}

/**
 * Update validation status indicator
 * @param {string} status - Status: "unknown", "good", "warning", "fail"  
 * @param {string} message - Optional validation message
 * @param {object} details - Detailed validation results
 */
function updateValidationStatus(status = "unknown", message = "", details = {}) {
    const tabIcon = document.getElementById('validation-tab-icon');
    const statusIcon = document.getElementById('validation-status-icon');
    const statusText = document.getElementById('validation-status-text');
    const summary = document.getElementById('validation-summary');
    const validationContainer = document.querySelector('.validation-container');
    
    // Update validation container class for styling
    if (validationContainer) {
        validationContainer.classList.remove('validation-unknown', 'validation-good', 'validation-warning', 'validation-fail');
        validationContainer.classList.add(`validation-${status}`);
    }
    
    // Icon and text mapping
    const statusConfig = {
        unknown: { icon: '❓', text: 'Unknown', tabText: 'Validation ❓' },
        good: { icon: '✅', text: 'Valid', tabText: 'Validation ✅' },
        warning: { icon: '⚠️', text: 'Warning', tabText: 'Validation ⚠️' },
        fail: { icon: '❌', text: 'Invalid', tabText: 'Validation ❌' }
    };
    
    const config = statusConfig[status] || statusConfig.unknown;
    
    // Update tab icon
    if (tabIcon) {
        tabIcon.textContent = config.tabText;
    }
    
    // Update status display
    if (statusIcon) {
        statusIcon.textContent = config.icon;
    }
    
    if (statusText) {
        statusText.textContent = `${config.text} Status`;
    }
    
    if (summary) {
        summary.textContent = message || getDefaultValidationMessage(status);
    }
    
    // Update detailed validation sections
    updateValidationDetails(status, details);
}

/**
 * Get default message for validation status
 * @param {string} status - Validation status
 * @returns {string} Default message
 */
function getDefaultValidationMessage(status) {
    const messages = {
        unknown: 'No vCon data to validate',
        good: 'vCon data is valid and conforms to the specification',
        warning: 'vCon data is mostly valid but has some issues',
        fail: 'vCon data contains errors and does not conform to the specification'
    };
    return messages[status] || messages.unknown;
}

/**
 * Update detailed validation sections
 * @param {string} status - Overall validation status
 * @param {object} details - Detailed validation results
 */
function updateValidationDetails(status, details = {}) {
    const sections = {
        'schema-validation': details.schema || { status: 'pending', message: 'Checking JSON schema compliance...' },
        'required-fields': details.required || { status: 'pending', message: 'Validating required fields...' },
        'data-integrity': details.integrity || { status: 'pending', message: 'Checking data consistency...' },
        'security-validation': details.security || { status: 'pending', message: 'Validating signatures and encryption...' }
    };
    
    Object.entries(sections).forEach(([sectionId, sectionData]) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const icon = element.querySelector('.validation-item-icon');
            const text = element.querySelector('.validation-item-text');
            
            if (icon && text) {
                const iconMap = {
                    pending: '⏳',
                    good: '✅',
                    warning: '⚠️',
                    fail: '❌'
                };
                
                icon.textContent = iconMap[sectionData.status] || '⏳';
                text.textContent = sectionData.message || 'Processing...';
            }
        }
    });
}

// Initialize UI components
function initializeUI() {
    // Initialize upload functionality
    initializeUpload();
    
    // Initialize examples functionality
    initializeExamples();
    
    // Add blue border to active tab
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        activeTab.classList.add('border-blue-600');
    }
    
    // Initialize panel toggles (all panels expanded by default)
    const panelToggles = document.querySelectorAll('.panel-toggle');
    panelToggles.forEach(button => {
        const section = button.closest('.inspector-section');
        const content = section.querySelector('.section-content');
        if (content) {
            // Start expanded (remove collapsed class if present)
            content.classList.remove('collapsed');
            button.classList.remove('collapsed');
        }
    });
}

// Export functions for use by other modules
window.UI = {
    updateInspectorPanels,
    updateMetadataPanel,
    updateRelationshipsPanel,
    updatePartiesPanel,
    updateDialogPanel,
    updateAttachmentsPanel,
    updateAnalysisPanel,
    updateExtensionsPanel,
    updateTimeline,
    clearTimeline,
    clearInspectorPanels,
    autoCollapsePanel,
    autoExpandPanel,
    updateValidationStatus,
    initializeUI,
    vconInput
};