// vCon Info - JavaScript Logic Stub
// This file contains placeholder functionality for the vCon inspector tool

// DOM Elements
const vconInput = document.getElementById('input-textarea');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const collapseButtons = document.querySelectorAll('.collapse-button');

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

// Collapse/Expand Functionality
collapseButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Toggle collapsed state
        const isCollapsed = button.textContent === '▶';
        button.textContent = isCollapsed ? '▼' : '▶';
        
        // Find the content to toggle
        const section = button.closest('.inspector-section, .party-item, .dialog-item, .attachment-item');
        const content = section.querySelector('.section-content, .party-details, .dialog-details, .attachment-details');
        
        if (content) {
            content.style.display = isCollapsed ? 'block' : 'none';
        }
    });
});

// Section Header Click to Toggle
document.querySelectorAll('.section-header, .party-header, .dialog-header, .attachment-header').forEach(header => {
    header.addEventListener('click', () => {
        const button = header.querySelector('.collapse-button');
        if (button) {
            button.click();
        }
    });
});

// Input Change Handler (Stub for future validation)
vconInput.addEventListener('input', () => {
    // Future implementation:
    // - Parse and validate vCon JSON
    // - Update inspector view
    // - Update validation status
    // - Update timeline view
    // - Update raw view
    console.log('vCon input changed');
});

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
 * Update the inspector view with parsed vCon data
 * @param {object} vcon - Parsed vCon object
 */
function updateInspector(vcon) {
    // TODO: Implement inspector update logic
    // - Update parties section
    // - Update dialog section
    // - Update attachments section
}

/**
 * Update validation status indicator
 * @param {boolean} isValid - Validation result
 * @param {string} message - Validation message
 */
function updateValidationStatus(isValid, message) {
    // TODO: Implement validation status update
    // - Update status icon
    // - Update status text
    // - Update status color
}

/**
 * Update timeline visualization
 * @param {object} vcon - Parsed vCon object
 */
function updateTimeline(vcon) {
    // TODO: Implement timeline visualization
    // - Parse dialog entries
    // - Create timeline elements
    // - Handle party interactions
}

/**
 * Update raw view
 * @param {object} vcon - Parsed vCon object
 */
function updateRawView(vcon) {
    // TODO: Implement raw view update
    // - Format JSON with syntax highlighting
    // - Handle large data efficiently
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('vCon Info initialized');
    
    // Make app objects global for testing
    window.vconApp = vconApp;
    window.stateManager = stateManager;
    
    // Set initial state text
    const statusText = document.getElementById('status-text');
    if (statusText && statusText.textContent.trim() === '') {
        statusText.textContent = 'Ready';
    }
    
    // Add blue border to active tab
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        activeTab.classList.add('border-blue-600');
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseVcon,
        updateInspector,
        updateValidationStatus,
        updateTimeline,
        updateRawView
    };
}