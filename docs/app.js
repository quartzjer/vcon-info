// vCon Info - App Module
// Main application controller and event coordination

// Initialize vCon processor
let vconProcessor = null;

// State Manager for test compatibility
const stateManager = {
    state: {
        input: '',
        isValid: true,
        vcon: null
    },
    updateInput: function(value) {
        this.state.input = value;
        if (UI.vconInput) {
            UI.vconInput.value = value;
        }
        // Trigger input event for validation
        UI.vconInput.dispatchEvent(new Event('input'));
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
            
            if (UI.vconInput) {
                UI.vconInput.value = content;
                UI.vconInput.dispatchEvent(new Event('input'));
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
            
            if (UI.vconInput) {
                UI.vconInput.value = JSON.stringify(fallbackData, null, 2);
                UI.vconInput.dispatchEvent(new Event('input'));
            }
            
            return JSON.stringify(fallbackData, null, 2);
        }
    }
};

// Input Change Handler with vCon processing
function setupInputHandler() {
    if (!UI.vconInput) return;
    
    UI.vconInput.addEventListener('input', async () => {
        const input = UI.vconInput.value.trim();
        if (!input) {
            UI.updateValidationStatus('unknown');
            UI.clearInspectorPanels();
            UI.clearTimeline();
            return;
        }
        
        if (!vconProcessor) {
            UI.updateValidationStatus('fail', 'Processor not available', {
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
                security: Crypto.determineSecurityStatus(result)
            };
            
            const overallStatus = result.isValid ? 
                (result.warnings.length > 0 ? 'warning' : 'good') : 'fail';
            const message = result.isValid ? 
                'vCon data is valid' : 'vCon validation failed';
            
            UI.updateValidationStatus(overallStatus, message, validationDetails);
            
            // Update inspector panels
            UI.updateInspectorPanels(result);
            
            // Update timeline
            UI.updateTimeline(result.timeline);
            
            // Update security panel
            Crypto.updateSecurityPanel(result.crypto);
            
            // Store processed result for debugging
            window.lastVConResult = result;
            
        } catch (e) {
            UI.updateValidationStatus('fail', 'Invalid JSON format', {
                schema: { status: 'fail', message: `JSON parsing error: ${e.message}` },
                required: { status: 'pending', message: 'Cannot validate - invalid JSON' },
                integrity: { status: 'pending', message: 'Cannot validate - invalid JSON' },
                security: { status: 'pending', message: 'Cannot validate - invalid JSON' }
            });
            UI.clearInspectorPanels();
            UI.clearTimeline();
        }
    });
}

// Encrypted input handler
function setupEncryptedInputHandler() {
    const encryptedInput = document.getElementById('encrypted-textarea');
    if (!encryptedInput) return;
    
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
            UI.updateValidationStatus(result.validation.overall.status, result.validation.overall.message);
            updateMetadata(result.metadata);
            UI.updateTimeline(result);
        } catch (error) {
            console.error('Error processing encrypted vCon:', error);
            UI.updateValidationStatus('error', `Failed to process encrypted vCon: ${error.message}`);
            clearInspectorSections();
        }
    });
}

// Clear inspector sections (for encrypted tab compatibility)
function clearInspectorSections() {
    UI.clearInspectorPanels();
}

// Update inspector wrapper function (for compatibility)
function updateInspector(result) {
    UI.updateInspectorPanels(result);
}

// Update metadata wrapper function (for compatibility)
function updateMetadata(metadata) {
    UI.updateMetadataPanel(metadata);
}

// Initialize application
function initializeApp() {
    console.log('vCon Info initialized');
    
    // Initialize vCon processor
    vconProcessor = new VConProcessor();
    
    // Make app objects global for testing
    window.vconApp = vconApp;
    window.stateManager = stateManager;
    
    // Setup input event handlers
    setupInputHandler();
    setupEncryptedInputHandler();
    
    // Initialize UI components
    UI.initializeUI();
    
    // Set initial validation status
    UI.updateValidationStatus('unknown');
    
    // Initialize validation status with current textarea content
    if (UI.vconInput && UI.vconInput.value.trim()) {
        // Small delay to ensure processor is ready
        setTimeout(() => {
            UI.vconInput.dispatchEvent(new Event('input'));
        }, 10);
    } else {
        UI.updateValidationStatus('unknown');
    }
}

// Export legacy functions for backward compatibility
function parseVcon(input) {
    return Validator.parseVcon(input);
}

function updateValidationStatus(status, message, details) {
    return UI.updateValidationStatus(status, message, details);
}

function updateTimeline(timeline) {
    return UI.updateTimeline(timeline);
}

// Export functions that may be used by tests or other modules
window.parseVcon = parseVcon;
window.updateValidationStatus = updateValidationStatus;
window.updateTimeline = updateTimeline;
window.updateInspector = updateInspector;
window.updateMetadata = updateMetadata;

// Export validation helper functions for testing
window.isValidUUID = Utils.isValidUUID;
window.isValidRFC3339Date = Utils.isValidRFC3339Date;
window.validatePartyObject = Validator.validatePartyObject;
window.validateDialogObject = Validator.validateDialogObject;
window.validateAnalysisObject = Validator.validateAnalysisObject;
window.validateAttachmentObject = Validator.validateAttachmentObject;
window.isValidTelURL = Utils.isValidTelURL;
window.isValidEmail = Utils.isValidEmail;
window.isValidGMLPos = Utils.isValidGMLPos;
window.isValidMediaType = Validator.isValidMediaType;
window.isStandardMediaType = Validator.isStandardMediaType;
window.checkVersionSpecificFields = Validator.checkVersionSpecificFields;
window.performDetailedValidation = Validator.performDetailedValidation;

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeApp);

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseVcon,
        updateInspector,
        updateValidationStatus,
        updateTimeline
    };
}