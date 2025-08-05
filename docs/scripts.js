// vCon Info - JavaScript Logic
// Main application logic for the vCon inspector tool

// Initialize vCon processor
let vconProcessor = null;

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
        button.classList.add('border-blue-600'); // Add blue border for active state
        
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

// Input Change Handler with vCon processing
vconInput.addEventListener('input', () => {
    console.log('vCon input changed');
    
    const input = vconInput.value.trim();
    if (!input) {
        updateValidationStatus('unknown');
        clearInspectorPanels();
        clearTimeline();
        return;
    }
    
    try {
        // Process vCon data
        const result = vconProcessor.process(input);
        
        // Update validation status
        const validationDetails = {
            schema: result.validation.errors.length === 0 ? 
                { status: 'good', message: `Valid vCon v${result.metadata.version} format` } :
                { status: 'fail', message: result.validation.errors[0].message },
            required: result.validation.isValid ?
                { status: 'good', message: 'All required fields present' } :
                { status: 'fail', message: `Missing fields: ${result.validation.errors.map(e => e.field).join(', ')}` },
            integrity: result.validation.warnings.length === 0 ?
                { status: 'good', message: 'Data integrity verified' } :
                { status: 'warning', message: result.validation.warnings[0].message },
            security: determineSecurityStatus(result)
        };
        
        const overallStatus = result.isValid ? 
            (result.warnings.length > 0 ? 'warning' : 'good') : 'fail';
        const message = result.isValid ? 
            'vCon data is valid' : 'vCon validation failed';
        
        updateValidationStatus(overallStatus, message, validationDetails);
        
        // Update inspector panels
        updateInspectorPanels(result);
        
        // Update timeline
        updateTimeline(result.timeline);
        
        // Store processed result for debugging
        window.lastVConResult = result;
        
    } catch (e) {
        updateValidationStatus('fail', 'Invalid JSON format', {
            schema: { status: 'fail', message: `JSON parsing error: ${e.message}` },
            required: { status: 'pending', message: 'Cannot validate - invalid JSON' },
            integrity: { status: 'pending', message: 'Cannot validate - invalid JSON' },
            security: { status: 'pending', message: 'Cannot validate - invalid JSON' }
        });
        clearInspectorPanels();
        clearTimeline();
    }
});

// Encrypted input handler
const encryptedInput = document.getElementById('encrypted-textarea');
if (encryptedInput) {
    encryptedInput.addEventListener('input', () => {
        console.log('Encrypted vCon input changed');
        // Future implementation: handle encrypted vCon decryption
    });
}

// Helper Functions (Stubs for future implementation)

/**
 * Parse and validate vCon data
 * @param {string} input - Raw vCon input
 * @returns {object} Parsed vCon object or error
 */
function parseVcon(input) {
    // TODO: Implement vCon parsing logic
    try {
        return JSON.parse(input);
    } catch (e) {
        return { error: e.message };
    }
}

/**
 * Update the inspector panels with processed vCon data
 * @param {object} result - Processed vCon result from VConProcessor
 */
function updateInspectorPanels(result) {
    // Update About section
    updateAboutPanel(result.metadata);
    
    // Update Parties section
    updatePartiesPanel(result.parties);
    
    // Update Dialog section
    updateDialogPanel(result.dialog);
    
    // Update Attachments section
    updateAttachmentsPanel(result.attachments);
    
    // Update Analysis section
    updateAnalysisPanel(result.analysis);
    
    // Update Extensions section
    updateExtensionsPanel(result.extensions);
}

/**
 * Update About panel with metadata
 */
function updateAboutPanel(metadata) {
    const section = document.querySelector('.section-about').parentElement;
    const content = section.querySelector('.section-content');
    
    const html = `
        <div class="vcon-metadata">
            <div class="metadata-item">
                <span class="metadata-label">Version:</span>
                <span class="metadata-value">${escapeHtml(metadata.version)}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">UUID:</span>
                <span class="metadata-value uuid">${escapeHtml(metadata.uuid)}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Created:</span>
                <span class="metadata-value">${metadata.created ? metadata.created.display : 'Not specified'}</span>
            </div>
            ${metadata.updated ? `
            <div class="metadata-item">
                <span class="metadata-label">Updated:</span>
                <span class="metadata-value">${metadata.updated.display}</span>
            </div>` : ''}
            ${metadata.subject ? `
            <div class="metadata-item">
                <span class="metadata-label">Subject:</span>
                <span class="metadata-value">${escapeHtml(metadata.subject)}</span>
            </div>` : ''}
            <div class="metadata-item">
                <span class="metadata-label">Type:</span>
                <span class="metadata-value">${metadata.type}</span>
            </div>
            ${metadata.redacted ? `
            <div class="metadata-item redacted-info">
                <span class="metadata-label">Redacted from:</span>
                <span class="metadata-value">${escapeHtml(metadata.redacted.uuid)}</span>
            </div>` : ''}
            ${metadata.appended ? `
            <div class="metadata-item appended-info">
                <span class="metadata-label">Appended to:</span>
                <span class="metadata-value">${escapeHtml(metadata.appended.uuid)}</span>
            </div>` : ''}
        </div>
    `;
    
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
        return;
    }
    
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
        return;
    }
    
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
        return;
    }
    
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
        return;
    }
    
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
        return;
    }
    
    const html = keys.map(key => `
        <div class="extension-item">
            <span class="extension-key">${escapeHtml(key)}:</span>
            <span class="extension-value">${escapeHtml(JSON.stringify(extensions[key], null, 2))}</span>
        </div>
    `).join('');
    
    content.innerHTML = html;
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
 * Escape HTML for safe display
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Determine security status from result
 */
function determineSecurityStatus(result) {
    // Check for JWS signatures
    if (result.metadata.signatures) {
        return { status: 'warning', message: 'Signatures present but not verified' };
    }
    // Check for encryption
    if (result.metadata.encrypted) {
        return { status: 'warning', message: 'Encrypted content detected' };
    }
    // Check for content hashes
    const hasContentHash = result.dialog.some(d => d.content && d.content.contentHash) ||
                          result.attachments.some(a => a.content && a.content.contentHash);
    if (hasContentHash) {
        return { status: 'good', message: 'Content hashes present for verification' };
    }
    return { status: 'good', message: 'No security features detected' };
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
        summary.textContent = message || getDefaultMessage(status);
    }
    
    // Update detailed validation sections
    updateValidationDetails(status, details);
}

/**
 * Get default message for validation status
 * @param {string} status - Validation status
 * @returns {string} Default message
 */
function getDefaultMessage(status) {
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

/**
 * Perform detailed validation of vCon data
 * @param {object} vcon - Parsed vCon object
 * @returns {object} Detailed validation results
 */
function performDetailedValidation(vcon) {
    const results = {};
    
    // Schema validation
    if (vcon.vcon) {
        results.schema = { status: 'good', message: `Valid vCon v${vcon.vcon} format detected` };
    } else {
        results.schema = { status: 'fail', message: 'Missing required "vcon" version field' };
    }
    
    // Required fields validation
    const requiredFields = ['uuid', 'created_at'];
    const missingFields = requiredFields.filter(field => !vcon[field]);
    
    if (missingFields.length === 0) {
        results.required = { status: 'good', message: 'All required fields present' };
    } else {
        results.required = { status: 'fail', message: `Missing required fields: ${missingFields.join(', ')}` };
    }
    
    // Data integrity validation
    let integrityIssues = [];
    
    if (vcon.parties && vcon.dialog) {
        // Check if dialog references valid party indices
        vcon.dialog.forEach((dialog, index) => {
            if (dialog.parties) {
                const invalidParties = dialog.parties.filter(p => p >= vcon.parties.length);
                if (invalidParties.length > 0) {
                    integrityIssues.push(`Dialog ${index} references invalid party indices: ${invalidParties.join(', ')}`);
                }
            }
        });
    }
    
    if (integrityIssues.length === 0) {
        results.integrity = { status: 'good', message: 'Data integrity checks passed' };
    } else {
        results.integrity = { status: 'warning', message: integrityIssues[0] }; // Show first issue
    }
    
    // Security validation
    if (vcon.signatures) {
        results.security = { status: 'warning', message: 'Signatures present but not verified (provide public key)' };
    } else if (vcon.encrypted) {
        results.security = { status: 'warning', message: 'Encrypted content detected but not decrypted' };
    } else {
        results.security = { status: 'good', message: 'No security features detected' };
    }
    
    return results;
}

// State Manager for test compatibility
const stateManager = {
    state: {
        input: '',
        isValid: true,
        vcon: null
    },
    updateInput: function(value) {
        this.state.input = value;
        if (vconInput) {
            vconInput.value = value;
        }
        // Trigger input event for validation
        vconInput.dispatchEvent(new Event('input'));
    }
};

// Global app object for test compatibility
const vconApp = {
    loadSample: function(type = 'unsigned') {
        const sampleData = {
            vcon: "0.3.0",
            uuid: "018972cc-8ddb-7ccc-baa5-ec2a4e6c7d0d",
            created_at: "2023-12-14T18:59:45.911Z",
            updated_at: "2023-12-14T19:00:12.345Z",
            parties: [
                {
                    tel: "+1-555-123-4567",
                    name: "Alice Johnson",
                    email: "alice@example.com"
                },
                {
                    tel: "+1-555-987-6543",
                    name: "Bob Smith", 
                    email: "bob@example.com"
                }
            ],
            dialog: [
                {
                    type: "recording",
                    start: "2023-12-14T18:59:50.100Z",
                    end: "2023-12-14T19:00:10.856Z",
                    parties: [0, 1],
                    originator: 0,
                    mimetype: "audio/wav",
                    filename: "call-recording.wav",
                    body: "base64-encoded-audio-data..."
                }
            ],
            attachments: [
                {
                    type: "transcript",
                    parties: [0, 1],
                    mimetype: "text/plain",
                    body: "Transcript of the conversation..."
                }
            ]
        };
        
        if (vconInput) {
            vconInput.value = JSON.stringify(sampleData, null, 2);
            vconInput.dispatchEvent(new Event('input'));
        }
    }
};

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('vCon Info initialized');
    
    // Initialize vCon processor
    vconProcessor = new VConProcessor();
    
    // Make app objects global for testing
    window.vconApp = vconApp;
    window.stateManager = stateManager;
    
    // Set initial validation status
    updateValidationStatus('unknown');
    
    // Add blue border to active tab
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        activeTab.classList.add('border-blue-600');
    }
    
    // Initialize validation status with current textarea content
    if (vconInput && vconInput.value.trim()) {
        vconInput.dispatchEvent(new Event('input'));
    } else {
        updateValidationStatus('unknown');
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
    
    // Initialize upload functionality
    initializeUpload();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseVcon,
        updateInspector,
        updateValidationStatus,
        updateTimeline
    };
}