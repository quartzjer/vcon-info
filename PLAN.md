# vCon Info Web App Implementation Plan

## Executive Summary
This document outlines the detailed implementation plan to upgrade the vCon Info web app to fully align with the IETF vCon specifications (draft-ietf-vcon-overview-00 and draft-ietf-vcon-vcon-core-00). The plan is organized into five phases, with specific tasks, acceptance criteria, and dependencies clearly defined.

## Current State Assessment
- **Strengths**: Basic inspector panels, input handling, example vCons, validation framework started
- **Gaps**: Missing security features (signing/encryption), incomplete spec compliance, placeholder visualizations
- **Tech Stack**: Pure vanilla JavaScript, zero runtime dependencies, Bun for development

## Phase 1: Core Specification Alignment
**Timeline**: Week 1-2  
**Priority**: Critical  
**Goal**: Ensure the app correctly implements vCon specification terminology and structure

### 1.1 Rename and Restructure Inspector Panels
- [x] Rename "About" section to "Metadata" in HTML and CSS
- [x] Update all references in scripts.js and vcon-processor.js
- [x] Add proper metadata field displays per spec:
  - vcon (version)
  - uuid
  - created_at / updated_at
  - subject
  - must_support extensions
- [x] Update CSS classes from `.section-about` to `.section-metadata`

**Files to modify**: `docs/index.html`, `docs/style.css`, `docs/scripts.js`

### 1.2 Add Relationships Panel
- [x] Create new "Relationships" section in inspector
- [x] Implement UI for displaying:
  - Redacted vCon references (uuid, type, url)
  - Appended vCon chains (uuid, url)
  - Group vCon collections (array of uuids)
- [x] Add visual indicators for relationship types
- [x] Create navigation links between related vCons

**Files to modify**: `docs/index.html`, `docs/style.css`, `docs/scripts.js`, `docs/vcon-processor.js`

### 1.3 Enhanced Field Validation
- [x] Implement complete required field checking:
  - vcon, uuid, created_at, parties (required)
  - Check mutually exclusive: redacted, appended, group
- [x] Add UUID format validation (RFC 4122)
- [x] Validate ISO 8601 timestamps
- [x] Check party index references in dialog/attachments
- [x] Validate must_support extension names

**Files to modify**: `docs/vcon-processor.js`

### 1.4 Complete Party Identifier Support
- [x] Add support for all party identifier types:
  - [x] tel (telephone)
  - [x] mailto (email)
  - [x] sip (Session Initiation Protocol)
  - [x] stir (PASSporT token)
  - [x] did (Decentralized Identifier)
  - [x] jCard (JSON vCard)
- [x] Add location data support:
  - [x] gmlpos (geographic coordinates)
  - [x] civicaddress (civic address)
- [x] Add timezone field support
- [x] Implement validation field parsing

**Files to modify**: `docs/vcon-processor.js`, `docs/scripts.js`

### 1.5 Dialog Enhancements
- [ ] Support all dialog types:
  - [x] recording
  - [x] text
  - [ ] transfer
  - [ ] transfer-refer
- [ ] Implement party_history tracking
- [ ] Add session_id display
- [ ] Support application field
- [ ] Handle message_id for threading
- [ ] Process disposition field properly

**Files to modify**: `docs/vcon-processor.js`, `docs/scripts.js`

## Phase 2: Security Features
**Timeline**: Week 3-4  
**Priority**: Critical  
**Goal**: Implement signing and encryption support per JWS/JWE standards

### 2.1 Signed vCon Support (JWS)
- [ ] Detect JWS structure in input
- [ ] Parse JWS header and payload
- [ ] Add signature verification using public key
- [ ] Display signature status in new Security panel
- [ ] Show signer information (alg, kid, x5c)
- [ ] Handle multiple signatures

**New files**: `docs/jws-handler.js`  
**Files to modify**: `docs/vcon-processor.js`, `docs/scripts.js`, `docs/index.html`

### 2.2 Encrypted vCon Support (JWE)
- [ ] Complete encrypted tab functionality
- [ ] Detect JWE structure
- [ ] Implement decryption with private key
- [ ] Support multiple recipients
- [ ] Display encryption metadata
- [ ] Handle nested signed-then-encrypted vCons

**New files**: `docs/jwe-handler.js`  
**Files to modify**: `docs/vcon-processor.js`, `docs/scripts.js`

### 2.3 Security Panel
- [ ] Create new "Security" inspector section
- [ ] Display signing status and details
- [ ] Show encryption status and algorithm
- [ ] Add certificate chain visualization
- [ ] Implement key validation status
- [ ] Add integrity check results

**Files to modify**: `docs/index.html`, `docs/style.css`, `docs/scripts.js`

### 2.4 Content Hash Verification
- [ ] Implement SHA-256/SHA-512 hash calculation
- [ ] Verify content_hash for external URLs
- [ ] Display verification status in UI
- [ ] Add hash mismatch warnings
- [ ] Support different hash algorithms

**Files to modify**: `docs/vcon-processor.js`

### 2.5 Key Management UI
- [ ] Enhance lock button panel
- [ ] Add key format detection (PEM, JWK)
- [ ] Implement key storage (sessionStorage)
- [ ] Add clear keys button
- [ ] Support multiple key pairs
- [ ] Add key import/export

**Files to modify**: `docs/scripts.js`, `docs/index.html`, `docs/style.css`

## Phase 3: Visualization Features
**Timeline**: Week 5-6  
**Priority**: Medium  
**Goal**: Replace placeholders with interactive visualizations

### 3.1 Timeline View Implementation
- [ ] Create interactive timeline component
- [ ] Display conversation flow chronologically
- [ ] Show party participation bars
- [ ] Mark dialog segments with duration
- [ ] Add attachment/analysis markers
- [ ] Implement zoom and pan controls
- [ ] Add time scale selector

**New files**: `docs/timeline-viewer.js`  
**Files to modify**: `docs/scripts.js`, `docs/style.css`

### 3.2 Dialog Flow Visualization
- [ ] Create flow diagram for conversations
- [ ] Show party interactions
- [ ] Display transfer flows
- [ ] Add message threading lines
- [ ] Implement party_history changes
- [ ] Show originator indicators

**Files to modify**: `docs/timeline-viewer.js`, `docs/style.css`

### 3.3 Redaction Visualization
- [ ] Highlight redacted fields
- [ ] Show redaction metadata
- [ ] Link to original vCon
- [ ] Display redaction type
- [ ] Add redaction legend
- [ ] Implement diff view

**Files to modify**: `docs/vcon-processor.js`, `docs/scripts.js`

### 3.4 vCon Relationship Graph
- [ ] Create graph view for related vCons
- [ ] Show append chains
- [ ] Display group relationships
- [ ] Add redaction links
- [ ] Implement interactive navigation
- [ ] Add relationship filters

**New files**: `docs/relationship-graph.js`  
**Files to modify**: `docs/scripts.js`

## Phase 4: Developer Tools
**Timeline**: Week 7-8  
**Priority**: Medium  
**Goal**: Add tools for creating and analyzing vCons

### 4.1 vCon Builder Interface
- [ ] Replace JSON tab placeholder
- [ ] Create form-based builder
- [ ] Add party input fields
- [ ] Implement dialog builders
- [ ] Add attachment upload
- [ ] Support all vCon fields
- [ ] Add field validation
- [ ] Implement preview mode

**New files**: `docs/vcon-builder.js`  
**Files to modify**: `docs/index.html`, `docs/scripts.js`

### 4.2 Export Functionality
- [ ] Add export button to UI
- [ ] Export as unsigned JSON
- [ ] Export as signed JWS
- [ ] Export as encrypted JWE
- [ ] Add pretty-print option
- [ ] Implement minified export
- [ ] Support batch export

**Files to modify**: `docs/scripts.js`, `docs/index.html`

### 4.3 Search Within vCons
- [ ] Add search interface
- [ ] Search in party data
- [ ] Search in dialog content
- [ ] Search in attachments
- [ ] Search in analysis
- [ ] Highlight search results
- [ ] Add search filters

**New files**: `docs/search-engine.js`  
**Files to modify**: `docs/scripts.js`, `docs/index.html`

### 4.4 vCon Diff Tool
- [ ] Add compare button
- [ ] Load two vCons side-by-side
- [ ] Highlight differences
- [ ] Show added/removed fields
- [ ] Compare redacted versions
- [ ] Export diff report

**New files**: `docs/diff-tool.js`  
**Files to modify**: `docs/scripts.js`, `docs/index.html`

### 4.5 Statistics Dashboard
- [ ] Calculate vCon metrics
- [ ] Show size analysis
- [ ] Display complexity score
- [ ] Count parties/dialogs
- [ ] Calculate total duration
- [ ] Show media type breakdown
- [ ] Add performance metrics

**Files to modify**: `docs/vcon-processor.js`, `docs/scripts.js`

## Phase 5: Enhanced User Experience
**Timeline**: Week 9-10  
**Priority**: Low  
**Goal**: Improve usability and performance

### 5.1 Dark Mode Support
- [ ] Add theme toggle button
- [ ] Create dark color scheme
- [ ] Store theme preference
- [ ] Update all components
- [ ] Test color contrast
- [ ] Add transition animations

**Files to modify**: `docs/style.css`, `docs/scripts.js`, `docs/index.html`

### 5.2 Keyboard Shortcuts
- [ ] Implement shortcut system
- [ ] Add navigation shortcuts
- [ ] Tab switching (1-6)
- [ ] Panel collapse (Ctrl+E)
- [ ] Search (Ctrl+F)
- [ ] Export (Ctrl+S)
- [ ] Add help dialog (?)

**New files**: `docs/keyboard-handler.js`  
**Files to modify**: `docs/scripts.js`

### 5.3 Batch Processing
- [ ] Support multiple file upload
- [ ] Process vCons in parallel
- [ ] Show batch progress
- [ ] Generate summary report
- [ ] Add batch validation
- [ ] Export batch results

**Files to modify**: `docs/scripts.js`, `docs/index.html`

### 5.4 Performance Optimization
- [ ] Implement virtual scrolling
- [ ] Add lazy loading for sections
- [ ] Optimize large vCon parsing
- [ ] Add web workers for processing
- [ ] Implement caching strategy
- [ ] Add loading indicators

**Files to modify**: `docs/vcon-processor.js`, `docs/scripts.js`

### 5.5 Enhanced Error Handling
- [ ] Improve error messages
- [ ] Add error recovery suggestions
- [ ] Implement retry mechanisms
- [ ] Add error reporting
- [ ] Create error catalog
- [ ] Add debug mode

**Files to modify**: `docs/vcon-processor.js`, `docs/scripts.js`

## Testing Strategy

### Unit Tests
- [ ] Test vCon processor validation
- [ ] Test party identifier parsing
- [ ] Test dialog processing
- [ ] Test relationship handling
- [ ] Test hash verification
- [ ] Test date formatting

### Integration Tests
- [ ] Test example vCons loading
- [ ] Test signed vCon verification
- [ ] Test encrypted vCon decryption
- [ ] Test export functionality
- [ ] Test search functionality
- [ ] Test diff tool

### Visual Tests
- [ ] Screenshot timeline view
- [ ] Screenshot inspector panels
- [ ] Screenshot validation states
- [ ] Screenshot dark mode
- [ ] Screenshot mobile view
- [ ] Screenshot error states

### Performance Tests
- [ ] Test with 1MB vCon
- [ ] Test with 100 parties
- [ ] Test with 1000 dialogs
- [ ] Test batch processing
- [ ] Measure memory usage
- [ ] Profile rendering speed

## Success Metrics
1. **Specification Compliance**: 100% support for vCon core spec
2. **Security**: Successful JWS/JWE handling for all test cases
3. **Performance**: < 1s processing for typical vCons (< 100KB)
4. **Usability**: All features accessible via UI (no console required)
5. **Testing**: > 90% code coverage with automated tests
6. **Documentation**: All features documented with examples

## Dependencies and Risks

### Dependencies
- No runtime dependencies (design requirement)
- Bun for development and testing
- Puppeteer for integration testing only

### Risks
1. **Complexity**: JWS/JWE implementation without libraries
2. **Performance**: Large vCon processing in browser
3. **Browser Support**: Crypto API availability
4. **Specification Changes**: Draft spec may evolve

### Mitigation Strategies
1. Use Web Crypto API for cryptographic operations
2. Implement progressive loading and virtual scrolling
3. Add fallbacks for older browsers
4. Track IETF draft updates regularly

## Resource Requirements
- **Development Time**: ~10 weeks for all phases
- **Testing Time**: ~2 weeks integrated throughout
- **Documentation**: ~1 week for user guide and API docs
- **Review and Polish**: ~1 week

## Next Steps
1. Begin Phase 1 implementation immediately
2. Set up automated testing infrastructure
3. Create development branch for each phase
4. Schedule weekly progress reviews
5. Gather user feedback after each phase

## Appendix: File Structure
```
docs/
├── index.html           # Main HTML (modify)
├── style.css           # Styles (modify)
├── scripts.js          # Main logic (modify)
├── vcon-processor.js   # Processing (modify)
├── jws-handler.js      # NEW: JWS support
├── jwe-handler.js      # NEW: JWE support
├── timeline-viewer.js  # NEW: Timeline viz
├── relationship-graph.js # NEW: Graph viz
├── vcon-builder.js     # NEW: Builder UI
├── search-engine.js    # NEW: Search
├── diff-tool.js        # NEW: Diff tool
├── keyboard-handler.js # NEW: Shortcuts
└── examples/           # Example vCons
```

## Version History
- v1.0 - Initial plan based on specification analysis
- Last updated: 2025-08-05