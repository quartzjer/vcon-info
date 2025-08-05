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
    const errors = [];
    const warnings = [];
    
    // 1. Schema validation - check vcon version
    if (!vcon.vcon) {
        errors.push('Missing required "vcon" version field');
        results.schema = { status: 'fail', message: 'Missing required "vcon" version field' };
    } else if (vcon.vcon !== '0.3.0') {
        warnings.push(`vCon version ${vcon.vcon} may not be fully supported (expected 0.3.0)`);
        results.schema = { status: 'warning', message: `vCon version ${vcon.vcon} detected (expected 0.3.0)` };
    } else {
        results.schema = { status: 'good', message: 'Valid vCon v0.3.0 format' };
    }
    
    // 2. Required fields validation
    const requiredFields = {
        'uuid': 'Unique identifier for the vCon',
        'created_at': 'Creation timestamp',
        'parties': 'Array of conversation participants'
    };
    
    const missingRequired = [];
    Object.entries(requiredFields).forEach(([field, description]) => {
        if (!vcon[field]) {
            missingRequired.push(`${field} (${description})`);
            errors.push(`Missing required field: ${field}`);
        }
    });
    
    if (missingRequired.length === 0) {
        // Additional validation for required fields
        let fieldErrors = [];
        
        // Validate UUID format
        if (vcon.uuid && !isValidUUID(vcon.uuid)) {
            fieldErrors.push('Invalid UUID format');
            warnings.push('UUID should be a valid UUID format');
        }
        
        // Validate created_at is RFC3339 date
        if (vcon.created_at && !isValidRFC3339Date(vcon.created_at)) {
            fieldErrors.push('created_at must be RFC3339 date format');
            errors.push('created_at must be in RFC3339 date format');
        }
        
        // Validate parties is non-empty array
        if (vcon.parties) {
            if (!Array.isArray(vcon.parties)) {
                fieldErrors.push('parties must be an array');
                errors.push('parties must be an array');
            } else if (vcon.parties.length === 0) {
                fieldErrors.push('parties array cannot be empty');
                warnings.push('parties array should not be empty');
            } else {
                // Validate each party object
                vcon.parties.forEach((party, index) => {
                    const partyErrors = validatePartyObject(party, index);
                    fieldErrors = fieldErrors.concat(partyErrors.errors);
                    errors.push(...partyErrors.errors);
                    warnings.push(...partyErrors.warnings);
                });
            }
        }
        
        if (fieldErrors.length === 0) {
            results.required = { status: 'good', message: 'All required fields are valid' };
        } else {
            results.required = { status: 'warning', message: fieldErrors.join('; ') };
        }
    } else {
        results.required = { 
            status: 'fail', 
            message: `Missing: ${missingRequired.map(f => f.split(' (')[0]).join(', ')}` 
        };
    }
    
    // 3. Data integrity validation
    const integrityIssues = [];
    
    // Check mutually exclusive fields
    const mutuallyExclusive = ['redacted', 'appended', 'group'];
    const presentExclusive = mutuallyExclusive.filter(field => vcon[field]);
    if (presentExclusive.length > 1) {
        integrityIssues.push(`Mutually exclusive fields present: ${presentExclusive.join(', ')}`);
        errors.push(`Fields ${presentExclusive.join(', ')} are mutually exclusive`);
    }
    
    // Validate optional date fields
    if (vcon.updated_at && !isValidRFC3339Date(vcon.updated_at)) {
        integrityIssues.push('updated_at must be RFC3339 date format');
        errors.push('updated_at must be in RFC3339 date format');
    }
    
    // Validate extensions and must_support arrays
    if (vcon.extensions && !Array.isArray(vcon.extensions)) {
        integrityIssues.push('extensions must be an array');
        errors.push('extensions must be an array of strings');
    }
    
    if (vcon.must_support && !Array.isArray(vcon.must_support)) {
        integrityIssues.push('must_support must be an array');
        errors.push('must_support must be an array of strings');
    }
    
    // Validate dialog array if present
    if (vcon.dialog) {
        if (!Array.isArray(vcon.dialog)) {
            integrityIssues.push('dialog must be an array');
            errors.push('dialog must be an array');
        } else {
            vcon.dialog.forEach((dialog, index) => {
                const dialogErrors = validateDialogObject(dialog, index, vcon.parties ? vcon.parties.length : 0);
                integrityIssues.push(...dialogErrors.errors);
                errors.push(...dialogErrors.errors);
                warnings.push(...dialogErrors.warnings);
            });
        }
    }
    
    // Validate analysis array if present
    if (vcon.analysis) {
        if (!Array.isArray(vcon.analysis)) {
            integrityIssues.push('analysis must be an array');
            errors.push('analysis must be an array');
        } else {
            vcon.analysis.forEach((analysis, index) => {
                const analysisErrors = validateAnalysisObject(analysis, index);
                integrityIssues.push(...analysisErrors.errors);
                errors.push(...analysisErrors.errors);
                warnings.push(...analysisErrors.warnings);
            });
        }
    }
    
    // Validate attachments array if present
    if (vcon.attachments) {
        if (!Array.isArray(vcon.attachments)) {
            integrityIssues.push('attachments must be an array');
            errors.push('attachments must be an array');
        } else {
            vcon.attachments.forEach((attachment, index) => {
                const attachmentErrors = validateAttachmentObject(attachment, index);
                integrityIssues.push(...attachmentErrors.errors);
                errors.push(...attachmentErrors.errors);
                warnings.push(...attachmentErrors.warnings);
            });
        }
    }
    
    if (integrityIssues.length === 0) {
        results.integrity = { status: 'good', message: 'Data structure integrity validated' };
    } else if (errors.length > integrityIssues.length / 2) {
        results.integrity = { status: 'fail', message: integrityIssues[0] };
    } else {
        results.integrity = { status: 'warning', message: integrityIssues[0] };
    }
    
    // 4. Security validation
    if (vcon.signatures || vcon.payload) {
        results.security = { status: 'pending', message: 'Signed/encrypted vCon validation not yet implemented' };
    } else {
        results.security = { status: 'good', message: 'Unsigned vCon - no security validation required' };
    }
    
    // Determine overall status
    results.overallStatus = errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'good');
    results.errors = errors;
    results.warnings = warnings;
    
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
    
    // Initialize examples functionality
    initializeExamples();
});

/**
 * Validate UUID format
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validate RFC3339 date format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid RFC3339 date
 */
function isValidRFC3339Date(dateStr) {
    // RFC3339 format: YYYY-MM-DDTHH:mm:ss.sssZ or ±HH:MM
    const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    if (!rfc3339Regex.test(dateStr)) {
        return false;
    }
    // Also check if it's a valid date
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

/**
 * Validate Party object according to spec
 * @param {object} party - Party object to validate
 * @param {number} index - Index in parties array
 * @returns {object} Object with errors and warnings arrays
 */
function validatePartyObject(party, index) {
    const errors = [];
    const warnings = [];
    
    // At least one identifier should be present
    const identifiers = ['tel', 'sip', 'mailto', 'name', 'did', 'uuid'];
    const hasIdentifier = identifiers.some(id => party[id]);
    
    if (!hasIdentifier) {
        warnings.push(`Party ${index} has no identifying information`);
    }
    
    // Validate tel URL if present
    if (party.tel && !isValidTelURL(party.tel)) {
        warnings.push(`Party ${index}: Invalid tel URL format`);
    }
    
    // Validate mailto if present
    if (party.mailto && !isValidEmail(party.mailto)) {
        warnings.push(`Party ${index}: Invalid email format`);
    }
    
    // If name is provided, validation should also be provided
    if (party.name && !party.validation) {
        warnings.push(`Party ${index}: validation SHOULD be provided when name is present`);
    }
    
    // Validate UUID if present
    if (party.uuid && !isValidUUID(party.uuid)) {
        errors.push(`Party ${index}: Invalid UUID format`);
    }
    
    // Validate gmlpos format if present
    if (party.gmlpos && !isValidGMLPos(party.gmlpos)) {
        warnings.push(`Party ${index}: Invalid gmlpos format (should be "latitude longitude")`);
    }
    
    return { errors, warnings };
}

/**
 * Validate Dialog object according to spec
 * @param {object} dialog - Dialog object to validate
 * @param {number} index - Index in dialog array
 * @param {number} partiesCount - Number of parties in vCon
 * @returns {object} Object with errors and warnings arrays
 */
function validateDialogObject(dialog, index, partiesCount) {
    const errors = [];
    const warnings = [];
    
    // Type is required
    const validTypes = ['recording', 'text', 'transfer', 'incomplete'];
    if (!dialog.type) {
        errors.push(`Dialog ${index}: Missing required 'type' field`);
    } else if (!validTypes.includes(dialog.type)) {
        errors.push(`Dialog ${index}: Invalid type '${dialog.type}' (must be one of: ${validTypes.join(', ')})`);
    }
    
    // Start date validation
    if (!dialog.start) {
        errors.push(`Dialog ${index}: Missing required 'start' field`);
    } else if (!isValidRFC3339Date(dialog.start)) {
        errors.push(`Dialog ${index}: 'start' must be RFC3339 date format`);
    }
    
    // Parties validation
    if (!dialog.parties) {
        errors.push(`Dialog ${index}: Missing required 'parties' field`);
    } else if (!Array.isArray(dialog.parties)) {
        errors.push(`Dialog ${index}: 'parties' must be an array`);
    } else if (dialog.parties.length === 0) {
        warnings.push(`Dialog ${index}: 'parties' array should not be empty`);
    } else {
        // Validate party indices
        dialog.parties.forEach((partyIndex, i) => {
            if (typeof partyIndex !== 'number' || partyIndex < 0) {
                errors.push(`Dialog ${index}: Invalid party index at position ${i}`);
            } else if (partyIndex >= partiesCount) {
                errors.push(`Dialog ${index}: Party index ${partyIndex} exceeds parties array length`);
            }
        });
    }
    
    // Duration validation if present
    if (dialog.duration !== undefined && (typeof dialog.duration !== 'number' || dialog.duration < 0)) {
        errors.push(`Dialog ${index}: 'duration' must be a positive number`);
    }
    
    // Validate content for non-incomplete/transfer types
    if (dialog.type && !['incomplete', 'transfer'].includes(dialog.type)) {
        const hasContent = (dialog.body && dialog.encoding) || (dialog.url && dialog.content_hash);
        if (!hasContent) {
            warnings.push(`Dialog ${index}: Should contain either inline (body/encoding) or external (url/content_hash) content`);
        }
    }
    
    // Validate disposition for incomplete type
    if (dialog.type === 'incomplete') {
        const validDispositions = ['no-answer', 'congestion', 'failed', 'busy', 'hung-up', 'voicemail-no-message'];
        if (!dialog.disposition) {
            errors.push(`Dialog ${index}: 'disposition' is required for incomplete type`);
        } else if (!validDispositions.includes(dialog.disposition)) {
            errors.push(`Dialog ${index}: Invalid disposition '${dialog.disposition}'`);
        }
    }
    
    // Validate mediatype if present
    if (dialog.mediatype && !isStandardMediaType(dialog.mediatype)) {
        warnings.push(`Dialog ${index}: Non-standard media type '${dialog.mediatype}'`);
    }
    
    return { errors, warnings };
}

/**
 * Validate Analysis object according to spec
 * @param {object} analysis - Analysis object to validate
 * @param {number} index - Index in analysis array
 * @returns {object} Object with errors and warnings arrays  
 */
function validateAnalysisObject(analysis, index) {
    const errors = [];
    const warnings = [];
    
    // Type is required
    if (!analysis.type) {
        errors.push(`Analysis ${index}: Missing required 'type' field`);
    }
    
    // Dialog reference validation
    if (analysis.dialog !== undefined) {
        if (!Array.isArray(analysis.dialog)) {
            errors.push(`Analysis ${index}: 'dialog' must be an array`);
        } else {
            analysis.dialog.forEach((dialogIndex, i) => {
                if (typeof dialogIndex !== 'number' || dialogIndex < 0) {
                    errors.push(`Analysis ${index}: Invalid dialog index at position ${i}`);
                }
            });
        }
    }
    
    // Validate content
    const hasContent = (analysis.body && analysis.encoding) || (analysis.url && analysis.content_hash);
    if (!hasContent) {
        warnings.push(`Analysis ${index}: Should contain either inline (body/encoding) or external (url/content_hash) content`);
    }
    
    // Validate mediatype if present
    if (analysis.mediatype && !isStandardMediaType(analysis.mediatype)) {
        warnings.push(`Analysis ${index}: Non-standard media type '${analysis.mediatype}'`);
    }
    
    return { errors, warnings };
}

/**
 * Validate Attachment object according to spec
 * @param {object} attachment - Attachment object to validate
 * @param {number} index - Index in attachments array
 * @returns {object} Object with errors and warnings arrays
 */
function validateAttachmentObject(attachment, index) {
    const errors = [];
    const warnings = [];
    
    // Type or purpose should be present
    if (!attachment.type && !attachment.purpose) {
        warnings.push(`Attachment ${index}: Should have 'type' or 'purpose' field`);
    }
    
    // Start date validation if present
    if (attachment.start && !isValidRFC3339Date(attachment.start)) {
        errors.push(`Attachment ${index}: 'start' must be RFC3339 date format`);
    }
    
    // Party reference validation
    if (attachment.party !== undefined && (typeof attachment.party !== 'number' || attachment.party < 0)) {
        errors.push(`Attachment ${index}: Invalid party index`);
    }
    
    // Dialog reference validation
    if (attachment.dialog !== undefined && (typeof attachment.dialog !== 'number' || attachment.dialog < 0)) {
        errors.push(`Attachment ${index}: Invalid dialog index`);
    }
    
    // Validate content
    const hasContent = (attachment.body && attachment.encoding) || (attachment.url && attachment.content_hash);
    if (!hasContent) {
        warnings.push(`Attachment ${index}: Should contain either inline (body/encoding) or external (url/content_hash) content`);
    }
    
    // Validate mediatype if present
    if (attachment.mediatype && !isStandardMediaType(attachment.mediatype)) {
        warnings.push(`Attachment ${index}: Non-standard media type '${attachment.mediatype}'`);
    }
    
    return { errors, warnings };
}

/**
 * Validate tel URL format
 * @param {string} tel - Tel URL to validate
 * @returns {boolean} True if valid
 */
function isValidTelURL(tel) {
    // Accept with or without tel: prefix
    const telRegex = /^(tel:)?[+]?[0-9\-().\s]+$/;
    return telRegex.test(tel);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    // Accept with or without mailto: prefix
    const emailRegex = /^(mailto:)?[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate GML position format
 * @param {string} gmlpos - GML position string
 * @returns {boolean} True if valid
 */
function isValidGMLPos(gmlpos) {
    // Format: "latitude longitude" (two space-separated numbers)
    const parts = gmlpos.trim().split(/\s+/);
    if (parts.length !== 2) return false;
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Check if media type is a standard type
 * @param {string} mediaType - Media type to check
 * @returns {boolean} True if standard type
 */
function isStandardMediaType(mediaType) {
    // Common vCon media types from the spec
    const standardTypes = [
        'text/plain',
        'audio/x-wav',
        'audio/x-mp3', 
        'audio/x-mp4',
        'audio/ogg',
        'video/x-mp4',
        'video/ogg',
        'multipart/mixed',
        'application/json',
        'application/pdf'
    ];
    
    return standardTypes.includes(mediaType);
}

/**
 * Validate media type format
 * @param {string} mediaType - Media type to validate
 * @returns {boolean} True if valid format
 */
function isValidMediaType(mediaType) {
    // Check if it has valid format (type/subtype)
    return /^[a-z]+\/[a-z0-9.\-+]+$/i.test(mediaType);
}

// Export for testing in browser environment
if (typeof window !== 'undefined') {
    window.parseVcon = parseVcon;
    window.performDetailedValidation = performDetailedValidation;
    window.vconApp = vconApp;
    window.stateManager = stateManager;
    // Export validation helper functions for testing
    window.isValidUUID = isValidUUID;
    window.isValidRFC3339Date = isValidRFC3339Date;
    window.validatePartyObject = validatePartyObject;
    window.validateDialogObject = validateDialogObject;
    window.validateAnalysisObject = validateAnalysisObject;
    window.validateAttachmentObject = validateAttachmentObject;
    window.isValidTelURL = isValidTelURL;
    window.isValidEmail = isValidEmail;
    window.isValidGMLPos = isValidGMLPos;
    window.isValidMediaType = isValidMediaType;
    window.isStandardMediaType = isStandardMediaType;
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseVcon,
        updateInspector,
        updateValidationStatus,
        updateTimeline
    };
}