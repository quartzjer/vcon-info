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
vconInput.addEventListener('input', async () => {
    const input = vconInput.value.trim();
    if (!input) {
        updateValidationStatus('unknown');
        clearInspectorPanels();
        clearTimeline();
        return;
    }
    
    if (!vconProcessor) {
        updateValidationStatus('fail', 'Processor not available', {
            schema: { status: 'fail', message: 'VConProcessor not initialized' },
            required: { status: 'pending', message: 'Cannot validate - processor error' },
            integrity: { status: 'pending', message: 'Cannot validate - processor error' },
            security: { status: 'pending', message: 'Cannot validate - processor error' }
        });
        return;
    }
    
    try {
        // Process vCon data
        const result = await vconProcessor.process(input);
        
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
    encryptedInput.addEventListener('input', async () => {
        const input = encryptedInput.value.trim();
        if (!input) {
            clearInspectorSections();
            return;
        }
        
        try {
            // Process the encrypted vCon
            const result = await vconProcessor.processVCon(input);
            updateInspector(result);
            updateValidationStatus(result.validation.overall.status, result.validation.overall.message);
            updateMetadata(result.metadata);
            updateTimeline(result);
        } catch (error) {
            console.error('Error processing encrypted vCon:', error);
            updateValidationStatus('error', `Failed to process encrypted vCon: ${error.message}`);
            clearInspectorSections();
        }
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
    // Update Metadata section
    updateMetadataPanel(result.metadata);
    
    // Update Relationships section
    updateRelationshipsPanel(result.metadata);
    
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
    
    // Update Security tab (separate from inspector panels)
    updateSecurityPanel(result.crypto);
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
    
    // Determine relationship type and display appropriate content
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
 * Update Security panel with crypto information
 */
function updateSecurityPanel(crypto) {
    // Update format indicator
    const formatElement = document.getElementById('security-format');
    const formatIndicator = document.getElementById('security-format-indicator');
    
    // Update signature status
    const signatureStatus = document.getElementById('security-signature-status');
    const signatureIndicator = document.getElementById('security-signature-indicator');
    const signatureDetails = document.getElementById('signature-details');
    
    // Update encryption status
    const encryptionStatus = document.getElementById('security-encryption-status');
    const encryptionIndicator = document.getElementById('security-encryption-indicator');
    const encryptionDetails = document.getElementById('encryption-details');
    
    // Check if elements exist (they might not be present in all test environments)
    if (!formatElement || !formatIndicator || !signatureStatus || !signatureIndicator || 
        !encryptionStatus || !encryptionIndicator) {
        console.warn('Security panel elements not found, skipping update');
        return;
    }
    
    if (!crypto) {
        formatElement.textContent = 'Unsigned';
        formatIndicator.textContent = '📄';
        signatureStatus.textContent = 'Not Signed';
        signatureIndicator.textContent = '❌';
        encryptionStatus.textContent = 'Not Encrypted';
        encryptionIndicator.textContent = '🔓';
        signatureDetails.style.display = 'none';
        encryptionDetails.style.display = 'none';
        return;
    }
    
    // Update format
    if (crypto.isEncrypted) {
        formatElement.textContent = crypto.format === 'jwe-json' ? 'JWE (JSON Serialization)' : 
                                   crypto.format === 'jwe-compact' ? 'JWE (Compact)' : 'Encrypted';
        formatIndicator.textContent = '🔒';
        
        // Update encryption status
        encryptionStatus.textContent = crypto.compliance?.isGeneralJSONSerialization ? 
                                      'Encrypted (vCon Compliant)' : 
                                      crypto.compliance?.errors?.length > 0 ? 
                                      'Encrypted (Non-Compliant)' : 'Encrypted';
        encryptionIndicator.textContent = crypto.compliance?.isVConCompliant ? '✅' : '⚠️';
        
        // Show encryption details
        if (encryptionDetails) {
            encryptionDetails.style.display = 'block';
            
            // Update basic encryption info
            if (crypto.jweHeader) {
                const algElement = document.getElementById('encryption-algorithm');
                const encElement = document.getElementById('encryption-encoding');
                const recipientsElement = document.getElementById('encryption-recipients');
                const uuidElement = document.getElementById('encryption-uuid');
                
                if (algElement) algElement.textContent = crypto.jweProtectedHeader?.alg || 'RSA-OAEP';
                if (encElement) encElement.textContent = crypto.jweHeader.enc || '-';
                if (uuidElement) uuidElement.textContent = crypto.jweHeader.uuid || '-';
                
                // Recipients info from jweData
                if (recipientsElement) {
                    if (crypto.jweData?.recipientCount) {
                        recipientsElement.textContent = `${crypto.jweData.recipientCount} recipient(s)`;
                    } else {
                        recipientsElement.textContent = '1 recipient';
                    }
                }
            }
            
            // Show decryption status if attempted
            const decryptionStatusElement = document.getElementById('decryption-status');
            if (decryptionStatusElement) {
                if (crypto.decrypted) {
                    decryptionStatusElement.textContent = '✅ Decrypted Successfully';
                    decryptionStatusElement.className = 'decryption-status success';
                } else if (crypto.decryptionError) {
                    decryptionStatusElement.textContent = `❌ Decryption Failed: ${crypto.decryptionError}`;
                    decryptionStatusElement.className = 'decryption-status error';
                } else {
                    decryptionStatusElement.textContent = '🔒 Private key required for decryption';
                    decryptionStatusElement.className = 'decryption-status pending';
                }
            }
            
            // Show compliance info
            const complianceElement = document.getElementById('encryption-compliance');
            if (complianceElement && crypto.compliance) {
                const errors = crypto.compliance.errors || [];
                const warnings = crypto.compliance.warnings || [];
                
                if (errors.length === 0 && warnings.length === 0) {
                    complianceElement.textContent = '✅ vCon Compliant';
                    complianceElement.className = 'compliance-status success';
                } else if (errors.length > 0) {
                    complianceElement.textContent = `❌ ${errors.length} error(s), ${warnings.length} warning(s)`;
                    complianceElement.className = 'compliance-status error';
                    complianceElement.title = errors.concat(warnings).join('; ');
                } else {
                    complianceElement.textContent = `⚠️ ${warnings.length} warning(s)`;
                    complianceElement.className = 'compliance-status warning';
                    complianceElement.title = warnings.join('; ');
                }
            }
        }
        
    } else if (crypto.isSigned) {
        formatElement.textContent = crypto.format === 'jws-json' ? 'JWS (JSON Serialization)' : 
                                   crypto.format === 'jws-compact' ? 'JWS (Compact)' : 'Signed';
        formatIndicator.textContent = '✍️';
        
        // Update signature status
        const isCompliant = crypto.compliance?.isVConCompliant;
        const hasErrors = crypto.compliance?.errors?.length > 0;
        
        signatureStatus.textContent = isCompliant ? 'Signed (vCon Compliant)' :
                                     hasErrors ? 'Signed (Non-Compliant)' : 'Signed';
        signatureIndicator.textContent = isCompliant ? '✅' : hasErrors ? '⚠️' : '🔏';
        
        // Show signature details
        signatureDetails.style.display = 'block';
        if (crypto.jwsHeader) {
            document.getElementById('signature-algorithm').textContent = crypto.jwsHeader.alg || '-';
            document.getElementById('signature-kid').textContent = crypto.jwsHeader.kid || '-';
            document.getElementById('signature-uuid').textContent = crypto.jwsHeader.uuid || 
                                                                   crypto.signatures?.[0]?.header?.uuid || '-';
            
            // Handle x5c (certificate chain)
            const x5c = crypto.signatures?.[0]?.header?.x5c || crypto.jwsHeader?.x5c;
            if (x5c && Array.isArray(x5c)) {
                document.getElementById('signature-x5c').textContent = `${x5c.length} certificate(s)`;
            } else {
                document.getElementById('signature-x5c').textContent = '-';
            }
            
            // Handle x5u (certificate URL)
            const x5u = crypto.signatures?.[0]?.header?.x5u || crypto.jwsHeader?.x5u;
            document.getElementById('signature-x5u').textContent = x5u || '-';
        }
        
        encryptionStatus.textContent = 'Not Encrypted';
        encryptionIndicator.textContent = '🔓';
        encryptionDetails.style.display = 'none';
        
    } else {
        formatElement.textContent = 'Unsigned';
        formatIndicator.textContent = '📄';
        signatureStatus.textContent = 'Not Signed';
        signatureIndicator.textContent = '❌';
        encryptionStatus.textContent = 'Not Encrypted';
        encryptionIndicator.textContent = '🔓';
        signatureDetails.style.display = 'none';
        encryptionDetails.style.display = 'none';
    }

    // Update certificate chain visualization
    updateCertificateChain(crypto);

    // Update integrity verification results
    updateIntegrityResults(crypto);

    // Update key validation status
    updateKeyValidationStatus(crypto);
}

/**
 * Update certificate chain visualization
 * @param {Object} crypto - Crypto information
 */
function updateCertificateChain(crypto) {
    const certificateChain = document.getElementById('certificate-chain');
    const certificateList = document.getElementById('certificate-list');
    
    if (!certificateChain || !certificateList) return;

    const x5c = crypto?.signatures?.[0]?.header?.x5c || crypto?.jwsHeader?.x5c;
    
    if (x5c && Array.isArray(x5c) && x5c.length > 0) {
        certificateChain.style.display = 'block';
        
        let html = '';
        x5c.forEach((cert, index) => {
            const certPreview = cert.substring(0, 40) + '...';
            html += `
                <div class="certificate-item">
                    <div class="certificate-header">
                        <span class="certificate-index">${index}</span>
                        <span class="certificate-type">${index === 0 ? 'End Entity' : 'CA'}</span>
                        <span class="certificate-status">🔍 Not Parsed</span>
                    </div>
                    <div class="certificate-preview">
                        <code>${certPreview}</code>
                    </div>
                </div>
            `;
        });
        
        certificateList.innerHTML = html;
        
        // Update signature verification status
        const verificationElement = document.getElementById('signature-verification-status');
        if (verificationElement) {
            verificationElement.textContent = 'Certificate chain available';
        }
    } else {
        certificateChain.style.display = 'none';
        const verificationElement = document.getElementById('signature-verification-status');
        if (verificationElement) {
            verificationElement.textContent = 'No certificate chain';
        }
    }
}

/**
 * Update integrity verification results 
 * @param {Object} crypto - Crypto information
 */
function updateIntegrityResults(crypto) {
    const integrityDetails = document.getElementById('integrity-details');
    const hashVerificationStatus = document.getElementById('hash-verification-status');
    const externalFilesCount = document.getElementById('external-files-count');
    const hashMismatches = document.getElementById('hash-mismatches');
    const hashDetails = document.getElementById('hash-details');
    
    if (!integrityDetails) return;

    // Check if we have content hash information in the vCon data
    // This would come from parsing dialog, attachments, analysis, etc.
    const hasExternalFiles = crypto?.externalFiles?.length > 0;
    const hashResults = crypto?.hashVerification || {};
    
    if (hasExternalFiles || Object.keys(hashResults).length > 0) {
        integrityDetails.style.display = 'block';
        
        // Update hash verification status
        if (hashVerificationStatus) {
            const totalFiles = crypto?.externalFiles?.length || 0;
            const verifiedFiles = Object.values(hashResults).filter(r => r.valid).length;
            const failedFiles = Object.values(hashResults).filter(r => r.error || !r.valid).length;
            
            if (totalFiles === 0) {
                hashVerificationStatus.textContent = 'No external files';
            } else if (failedFiles === 0) {
                hashVerificationStatus.textContent = `✅ ${verifiedFiles}/${totalFiles} verified`;
            } else {
                hashVerificationStatus.textContent = `⚠️ ${failedFiles}/${totalFiles} failed`;
            }
        }
        
        // Update external files count
        if (externalFilesCount) {
            const totalFiles = crypto?.externalFiles?.length || 0;
            externalFilesCount.textContent = totalFiles === 0 ? 'None' : `${totalFiles} file(s)`;
        }
        
        // Update hash mismatches
        if (hashMismatches) {
            const failedFiles = Object.values(hashResults).filter(r => r.error || !r.valid).length;
            hashMismatches.textContent = failedFiles === 0 ? 'None' : `${failedFiles} mismatch(es)`;
        }
        
        // Update detailed hash results
        if (hashDetails && Object.keys(hashResults).length > 0) {
            let detailsHtml = '<h5>Hash Verification Details</h5>';
            Object.entries(hashResults).forEach(([url, result]) => {
                const status = result.valid ? '✅ Verified' : `❌ Failed: ${result.error || 'Hash mismatch'}`;
                detailsHtml += `
                    <div class="hash-result-item">
                        <div class="hash-url">${url}</div>
                        <div class="hash-status">${status}</div>
                        ${result.algorithm ? `<div class="hash-algorithm">Algorithm: ${result.algorithm}</div>` : ''}
                    </div>
                `;
            });
            hashDetails.innerHTML = detailsHtml;
        }
    } else {
        integrityDetails.style.display = 'none';
    }
}

/**
 * Update key validation status
 * @param {Object} crypto - Crypto information  
 */
function updateKeyValidationStatus(crypto) {
    const keyValidation = document.getElementById('key-validation');
    const publicKeyStatus = document.getElementById('public-key-status');
    const privateKeyStatus = document.getElementById('private-key-status');
    const keyFormat = document.getElementById('key-format');
    
    if (!keyValidation) return;

    // Get key status from DOM (from key panel)
    const publicKeyInput = document.getElementById('public-key');
    const privateKeyInput = document.getElementById('private-key');
    
    const hasPublicKey = publicKeyInput?.value.trim().length > 0;
    const hasPrivateKey = privateKeyInput?.value.trim().length > 0;
    
    if (hasPublicKey || hasPrivateKey || crypto?.needsKeys) {
        keyValidation.style.display = 'block';
        
        // Update public key status
        if (publicKeyStatus) {
            if (hasPublicKey) {
                // Try to determine key format
                const keyValue = publicKeyInput.value.trim();
                let format = 'Unknown';
                let status = '✅ Provided';
                
                if (keyValue.includes('-----BEGIN')) {
                    format = 'PEM';
                } else if (keyValue.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(keyValue);
                        if (parsed.kty) format = 'JWK';
                    } catch (e) {
                        status = '⚠️ Invalid Format';
                    }
                }
                
                publicKeyStatus.textContent = status;
                if (keyFormat) keyFormat.textContent = format;
            } else {
                publicKeyStatus.textContent = crypto?.isSigned ? '⚠️ Required for verification' : 'Not Required';
            }
        }
        
        // Update private key status  
        if (privateKeyStatus) {
            if (hasPrivateKey) {
                const keyValue = privateKeyInput.value.trim();
                let status = '✅ Provided';
                
                if (keyValue.includes('-----BEGIN')) {
                    // PEM format
                } else if (keyValue.startsWith('{')) {
                    try {
                        JSON.parse(keyValue);
                    } catch (e) {
                        status = '⚠️ Invalid Format';
                    }
                }
                
                privateKeyStatus.textContent = status;
            } else {
                privateKeyStatus.textContent = crypto?.isEncrypted ? '⚠️ Required for decryption' : 'Not Required';
            }
        }
    } else {
        keyValidation.style.display = 'none';
    }
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
 * Update inspector with result data (wrapper function for consistency)
 * @param {Object} result - Processed vCon result from VConProcessor
 */
function updateInspector(result) {
    updateInspectorPanels(result);
}

/**
 * Update metadata panels (wrapper function for encrypted tab)
 * @param {Object} metadata - Metadata object
 */
function updateMetadata(metadata) {
    updateMetadataPanel(metadata);
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
    } else {
        const supportedVersions = ['0.0.1', '0.0.2', '0.3.0'];
        const currentVersion = '0.3.0';
        
        if (supportedVersions.includes(vcon.vcon)) {
            if (vcon.vcon === currentVersion) {
                results.schema = { status: 'good', message: 'Valid vCon v0.3.0 format (current version)' };
            } else {
                warnings.push(`vCon version ${vcon.vcon} is valid but not current (latest: ${currentVersion})`);
                results.schema = { status: 'good', message: `Valid vCon v${vcon.vcon} format (older version, current: ${currentVersion})` };
            }
        } else {
            // Check if it's a plausible version format (e.g., 0.2.0, 1.0.0)
            const versionRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;
            if (versionRegex.test(vcon.vcon)) {
                warnings.push(`vCon version ${vcon.vcon} may not be fully supported (expected ${currentVersion})`);
                results.schema = { status: 'warning', message: `vCon version ${vcon.vcon} detected (expected ${currentVersion})` };
            } else {
                errors.push(`Invalid vCon version format: ${vcon.vcon}`);
                results.schema = { status: 'fail', message: `Invalid vCon version format: ${vcon.vcon} (expected format: x.y.z)` };
            }
        }
    }
    
    // 1.5. Version-specific field compatibility checks
    if (vcon.vcon) {
        const versionCompatibilityIssues = checkVersionSpecificFields(vcon, vcon.vcon);
        warnings.push(...versionCompatibilityIssues.warnings);
        errors.push(...versionCompatibilityIssues.errors);
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
    const exclusiveFields = [
        { name: 'redacted', value: vcon.redacted },
        { name: 'appended', value: vcon.appended },
        { name: 'group', value: vcon.group }
    ];
    
    const fieldsWithContent = exclusiveFields.filter(field => 
        field.value !== undefined && hasValidContent(field.value)
    );
    const fieldsWithEmptyContent = exclusiveFields.filter(field => 
        field.value !== undefined && !hasValidContent(field.value)
    );
    
    if (fieldsWithContent.length > 1) {
        const fieldNames = fieldsWithContent.map(f => f.name).join(', ');
        integrityIssues.push(`Mutually exclusive fields with values: ${fieldNames}`);
        errors.push(`${fieldNames} parameters are mutually exclusive and cannot all have values`);
    } else if (fieldsWithEmptyContent.length > 1) {
        const fieldNames = fieldsWithEmptyContent.map(f => f.name).join(', ');
        integrityIssues.push(`Multiple empty mutually exclusive fields: ${fieldNames}`);
        warnings.push(`${fieldNames} parameters are present but empty - these are mutually exclusive fields`);
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
    loadSample: async function(type = 'unsigned') {
        try {
            const filename = type === 'unsigned' ? 'basic-call.vcon' : `${type}.vcon`;
            const response = await fetch(`examples/${filename}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load sample: ${filename}`);
            }
            
            const content = await response.text();
            
            if (vconInput) {
                vconInput.value = content;
                vconInput.dispatchEvent(new Event('input'));
            }
            
            return content;
        } catch (error) {
            console.error('Error loading sample:', error);
            
            // Fallback to minimal inline sample if fetch fails
            const fallbackData = {
                vcon: "0.3.0",
                uuid: "01987d9a-3db5-7186-b6f7-396adcaf35e2",
                created_at: "2023-12-14T18:59:45.911Z",
                parties: [
                    {
                        tel: "+1-555-123-4567",
                        name: "Alice Johnson"
                    },
                    {
                        tel: "+1-555-987-6543", 
                        name: "Bob Smith"
                    }
                ]
            };
            
            if (vconInput) {
                vconInput.value = JSON.stringify(fallbackData, null, 2);
                vconInput.dispatchEvent(new Event('input'));
            }
            
            return JSON.stringify(fallbackData, null, 2);
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
        // Small delay to ensure processor is ready
        setTimeout(() => {
            vconInput.dispatchEvent(new Event('input'));
        }, 10);
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
 * Validate UUID format according to vCon spec (Version 8 UUID from draft-peabody-dispatch-new-uuid-format)
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID
 */
function isValidUUID(uuid) {
    // Basic format check: 8-4-4-4-12 hex characters with hyphens
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
        return false;
    }
    
    // vCon spec requires Version 8 UUID (position 12 should be '8')
    // But we'll be more permissive and accept RFC 4122 versions 1-8 for compatibility
    const versionChar = uuid.charAt(14);
    const version = parseInt(versionChar, 16);
    if (version < 1 || version > 8) {
        return false;
    }
    
    // Check variant bits (position 16 should be 8, 9, A, or B for RFC 4122)
    const variantChar = uuid.charAt(19);
    const variantBits = parseInt(variantChar, 16);
    if (variantBits < 8 || variantBits > 11) { // 8-11 in hex = 8-B
        return false;
    }
    
    return true;
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
 * Check if a value has meaningful content (not empty)
 * @param {any} value - Value to check
 * @returns {boolean} True if value has meaningful content
 */
function hasValidContent(value) {
    if (value === null || value === undefined) {
        return false;
    }
    
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.length > 0;
        } else {
            return Object.keys(value).length > 0;
        }
    }
    
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    
    return true; // For other types (numbers, booleans), consider them as having content
}

/**
 * Check version-specific field compatibility issues
 * @param {object} vcon - vCon object to check
 * @param {string} version - vCon version
 * @returns {object} Object with errors and warnings arrays
 */
function checkVersionSpecificFields(vcon, version) {
    const errors = [];
    const warnings = [];
    
    // Check for deprecated fields based on version changes
    function checkObjectForVersionFields(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;
        
        // Check for v0.0.1 -> v0.0.2 field changes
        if (version >= '0.0.2') {
            if (obj.mimetype) {
                warnings.push(`${path}mimetype deprecated in v0.0.2, use mediatype instead`);
            }
            if (obj.alg && obj.signature && !obj.content_hash) {
                warnings.push(`${path}alg/signature deprecated in v0.0.2, use content_hash instead`);
            }
        }
        
        // Check for v0.0.2 -> v0.3.0 field changes  
        if (version >= '0.3.0') {
            if (obj['transfer-target']) {
                warnings.push(`${path}transfer-target deprecated in v0.3.0, use transfer_target instead`);
            }
            if (obj['target-dialog']) {
                warnings.push(`${path}target-dialog deprecated in v0.3.0, use target_dialog instead`);
            }
        }
        
        // Check for fields that shouldn't exist in older versions
        if (version < '0.0.2') {
            if (obj.mediatype) {
                warnings.push(`${path}mediatype not available in v${version}, use mimetype instead`);
            }
            if (obj.content_hash) {
                warnings.push(`${path}content_hash not available in v${version}, use alg/signature instead`);
            }
        }
        
        if (version < '0.3.0') {
            if (obj.transfer_target) {
                warnings.push(`${path}transfer_target not available in v${version}, use transfer-target instead`);
            }
            if (obj.target_dialog) {
                warnings.push(`${path}target_dialog not available in v${version}, use target-dialog instead`);
            }
        }
        
        // Recursively check arrays and nested objects
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    checkObjectForVersionFields(item, `${path}${key}[${index}].`);
                });
            } else if (typeof value === 'object' && value !== null) {
                checkObjectForVersionFields(value, `${path}${key}.`);
            }
        });
    }
    
    // Check the entire vCon object
    checkObjectForVersionFields(vcon);
    
    return { errors, warnings };
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
    window.checkVersionSpecificFields = checkVersionSpecificFields;
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