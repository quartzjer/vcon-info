# vCon ZIP Bundle Specification

## Abstract

This document defines the ZIP file format for bundling vCon (Virtual Conversation) data containers with all their associated media files, attachments, and analysis data into a single, self-contained archive. This specification enables offline processing, simplified distribution, and ensures data integrity while maintaining compatibility with the vCon JSON format as defined in [draft-ietf-vcon-vcon-core].

## 1. Introduction

vCons support both inline content (base64-encoded in the JSON) and externally referenced files (via HTTPS URLs with content hashes). While external references enable efficient storage and network transfer, they create dependencies on external resources that may become unavailable over time. The vCon ZIP bundle format addresses this by:

1. **Self-containment**: All referenced files are included within the ZIP archive
2. **Integrity preservation**: Original content hashes are maintained for verification
3. **Platform independence**: Standard ZIP format supported across all platforms
4. **Extensibility**: Directory structure supports future vCon extensions
5. **Offline processing**: No network dependencies after bundle creation

## 2. ZIP File Structure

The vCon ZIP bundle MUST follow a flat directory structure designed for simplicity and extensibility:

```
vcon-bundle.zip
├── vcon.json                 # Original vCon JSON file (unsigned/signed/encrypted)
├── dialog/                   # Dialog media files (flat structure)
├── attachments/             # Attachment files by hash
├── analysis/                # Analysis data files by hash
├── metadata/                # Bundle metadata and manifests
│   ├── manifest.json        # File manifest with mappings and relationships
│   ├── bundle-info.json     # Bundle creation metadata
│   ├── url-patch.json       # JSON patch for URL-to-local conversion (optional)
│   └── relationships.json   # vCon relationship preservation (required)
└── extensions/              # Future vCon extensions
    └── [extension-name]/    # Extension-specific directories
        └── metadata.json    # Extension metadata
```

## 3. File Naming Conventions

All externally referenced files MUST be stored using their content hash as the filename, ensuring:
- **Uniqueness**: Hash-based names prevent collisions
- **Integrity**: Filename directly corresponds to content verification
- **Deduplication**: Identical content reuses the same file
- **Mapping**: Easy correlation between vCon JSON and bundle files

### 3.1 Hash-Based Filenames

Files MUST be named using the following pattern:
```
[hash-algorithm]-[base64url-hash].[extension]
```

Implementations MUST support SHA-512 as defined in the vCon specification. Additional hash algorithms MAY be supported as specified in the vCon `content_hash` field.

Examples:
- `sha512-GLy6IPaIUM1GqzZqfIPZlWjaDsNgNvZM0iCONNThnH0a75fhUM6cYzLZ5GynSURREvZwmOh54-2lRRieyj82UQ.wav`
- `sha256-Abc123DefGhi456JklMno789PqrStu012VwxYz345.mp4` (if content_hash specifies SHA-256)
- `sha512-Def456...UVW.pdf`

### 3.2 Multi-Hash Support

When a vCon references files with multiple content hashes (as per vCon specification: `"ContentHash" | "ContentHash[]"`), implementations MUST:
1. **Primary hash**: Use the first hash algorithm for filename generation
2. **Additional hashes**: Store all hashes in manifest.json for verification
3. **Validation**: Verify ALL provided hashes during bundle creation and extraction

### 3.3 Extension Mapping

File extensions MUST be determined by:
1. **MIME type** from vCon mimetype field (preferred)
2. **Content analysis** of the file header
3. **Original URL extension** as fallback
4. **Generic extension** (.bin) if undetermined

### 3.4 Multi-Channel Media Handling

For multi-channel audio/video recordings where the vCon specifies channel-to-party mappings:
1. **Single file**: Store as single hash-named file if channels are multiplexed
2. **Channel mapping**: Preserve party-to-channel relationships in relationships.json
3. **Separate channels**: If channels are stored separately, each channel MUST have its own content_hash and file entry

## 4. Core Files

### 4.1 vcon.json

The original vCon JSON file exactly as received, including all external URLs. This file MUST be preserved in its original form regardless of vCon security format (unsigned, signed, or encrypted). This preserves:
- **Audit trail**: Verification of the original source
- **Re-publishing**: Restoration of external references if needed
- **Compliance**: Legal requirements for preserving original data
- **Simplicity**: Single source of truth for vCon structure
- **Security integrity**: Original signatures and encryption remain intact

#### 4.1.1 Security Form Handling

**Unsigned vCons**: Stored directly as JSON object in vcon.json

**Signed vCons (JWS)**: The complete JWS structure MUST be preserved, including:
- JWS headers with signature algorithms and keys
- Base64url-encoded payload containing the actual vCon
- Signature verification data

**Encrypted vCons (JWE)**: The complete JWE structure MUST be preserved, including:
- JWE headers with encryption algorithms and key information
- Encrypted payload (which may contain a signed vCon)
- All encryption metadata required for decryption

Bundle creators MUST NOT attempt to decrypt or verify signatures during bundle creation unless explicitly required for file resolution.

## 5. Directory Organization

### 5.1 dialog/ Directory

Contains all dialog media files in a flat structure organized by hash-based filenames. All dialog types (audio, video, text, images, etc.) are stored directly in this directory without subdirectories.

### 5.2 attachments/ Directory

Contains all attachment files referenced in the vCon attachments array. Files are organized by hash without subdirectories since attachments can be any media type.

### 5.3 analysis/ Directory

Contains all analysis data files, including:
- **Transcripts** (.json, .txt, .vtt)
- **Sentiment analysis** (.json)
- **Summaries** (.txt, .json)
- **ML model outputs** (.json, .pkl, .h5)
- **Custom analysis formats**

## 6. Metadata Files

### 6.1 manifest.json

Maps original URLs to bundle-local files and provides comprehensive file metadata including vCon relationships:

```json
{
  "version": "1.0",
  "vcon_uuid": "0195544a-b9b1-8ee4-b9a2-279e0d16bc46",
  "created_at": "2025-08-02T10:30:00Z",
  "bundle_format_version": "1.0",
  "files": {
    "https://example.com/audio.wav": {
      "local_path": "dialog/sha512-GLy6IPa...wav",
      "content_hash": ["sha512-GLy6IPa...", "sha256-AbC123..."],
      "size": 1048576,
      "mime_type": "audio/wav",
      "vcon_reference": {
        "type": "dialog",
        "index": 0,
        "parties": [1, 2],
        "originator": 1,
        "duration": 3600,
        "channel_mapping": {
          "channels": 2,
          "party_to_channel": {"1": 0, "2": 1}
        }
      }
    },
    "https://example.com/transcript.json": {
      "local_path": "analysis/sha512-Transcript...json",
      "content_hash": "sha512-Transcript...",
      "size": 45678,
      "mime_type": "application/json",
      "vcon_reference": {
        "type": "analysis",
        "index": 0,
        "dialog_references": [0],
        "party_references": [1, 2],
        "analysis_type": "transcript",
        "vendor": "speechmatics"
      }
    }
  }
}
```

### 6.2 bundle-info.json

Contains comprehensive bundle creation metadata including security form details:

```json
{
  "bundle_format_version": "1.0",
  "created_at": "2025-08-02T10:30:00Z",
  "created_by": "vcon-bundler v1.2.3",
  "source_vcon": {
    "uuid": "0195544a-b9b1-8ee4-b9a2-279e0d16bc46",
    "version": "0.3.0",
    "format": "unsigned|signed|encrypted",
    "security_info": {
      "is_signed": true,
      "is_encrypted": false,
      "signature_algorithms": ["RS256"],
      "key_ids": ["key-2025-08-02"],
      "encryption_info": null
    }
  },
  "bundle_stats": {
    "total_files": 15,
    "total_size": 52428800,
    "file_types": {
      "dialog": 5,
      "attachments": 3,
      "analysis": 7
    },
    "hash_algorithms_used": ["sha512", "sha256"],
    "content_types": {
      "audio/wav": 3,
      "video/mp4": 2,
      "application/json": 7,
      "application/pdf": 3
    }
  },
  "validation_status": {
    "all_hashes_verified": true,
    "signature_verified": true,
    "external_urls_accessible": true,
    "bundle_created_at": "2025-08-02T10:30:00Z"
  }
}
```

### 6.3 relationships.json (Required)

Preserves all vCon structural relationships and cross-references to maintain semantic integrity:

```json
{
  "format_version": "1.0",
  "vcon_structure": {
    "parties_count": 3,
    "dialog_count": 2,
    "analysis_count": 4,
    "attachments_count": 2
  },
  "party_relationships": {
    "0": {
      "role": "customer",
      "dialog_participation": [0, 1],
      "mentioned_in_analysis": [0, 1, 2]
    },
    "1": {
      "role": "agent",
      "dialog_participation": [0, 1],
      "mentioned_in_analysis": [0, 1, 3]
    },
    "2": {
      "role": "supervisor",
      "dialog_participation": [1],
      "mentioned_in_analysis": [1, 3]
    }
  },
  "dialog_relationships": {
    "0": {
      "type": "recording",
      "parties": [0, 1],
      "originator": 0,
      "analysis_derived": [0, 1],
      "transfer_info": null
    },
    "1": {
      "type": "recording",
      "parties": [0, 1, 2],
      "originator": 1,
      "analysis_derived": [2, 3],
      "transfer_info": {
        "transfer_target": 2,
        "target_dialog": null
      }
    }
  },
  "analysis_relationships": {
    "0": {
      "type": "transcript",
      "dialog_sources": [0],
      "party_references": [0, 1],
      "vendor": "speechmatics"
    },
    "1": {
      "type": "sentiment",
      "dialog_sources": [0],
      "party_references": [0, 1],
      "vendor": "aws-comprehend"
    }
  },
  "attachment_relationships": {
    "0": {
      "dialog_reference": 0,
      "party_reference": 1,
      "attachment_type": "screen_share"
    }
  }
}
```

### 6.4 url-patch.json (Optional)

Provides JSON patch operations to convert external URLs to local ZIP paths for applications that prefer to work with locally-referenced files:

```json
{
  "format_version": "1.0",
  "description": "JSON patch operations to convert external URLs to local ZIP paths",
  "patches": [
    {
      "op": "replace",
      "path": "/dialog/0/url",
      "value": "dialog/sha512-GLy6IPaIUM1GqzZqfIPZlWjaDsNgNvZM0iCONNThnH0a75fhUM6cYzLZ5GynSURREvZwmOh54-2lRRieyj82UQ.wav"
    },
    {
      "op": "replace", 
      "path": "/attachments/0/url",
      "value": "attachments/sha512-Abc123DefGhi456JklMno789PqrStu012VwxYz345.pdf"
    }
  ]
}
```

## 7. Bundle Creation Process

### 7.1 vCon Security Form Handling

Bundle creators MUST handle different vCon security forms appropriately:

**For Unsigned vCons:**
1. Parse JSON directly to identify external references
2. Proceed with standard file resolution

**For Signed vCons (JWS):**
1. MUST preserve complete JWS structure in vcon.json
2. MAY verify signature before processing (RECOMMENDED)
3. Parse base64url-decoded payload to identify external references
4. External file resolution based on payload content

**For Encrypted vCons (JWE):**
1. MUST preserve complete JWE structure in vcon.json
2. Bundle creator MUST have decryption capability or explicit instructions
3. If decryption keys unavailable, bundle creation MUST fail with appropriate error
4. Parse decrypted content (which may be signed) to identify external references

### 7.2 External File Resolution

1. **Parse vCon content** according to security form to identify all external references (dialog, attachments, analysis)
2. **Validate URLs** ensure HTTPS protocol and accessible endpoints
3. **Download files** from HTTPS URLs with proper error handling and retry logic
4. **Verify content hashes** against downloaded content using ALL provided hash algorithms
5. **Generate local paths** based on primary content hash and media type
6. **Extract vCon relationships** including party indices, dialog references, and cross-references
7. **Preserve original vCon** exactly as received in `vcon.json`

### 7.3 Bundle Assembly

1. **Create directory structure** within ZIP according to specification
2. **Add original vCon** as `vcon.json` (preserving security form)
3. **Add referenced files** to appropriate directories using hash-based naming
4. **Generate metadata files**:
   - `manifest.json` with comprehensive file mappings and relationships
   - `bundle-info.json` with security form details and validation status
   - `relationships.json` with complete vCon structural relationships
   - `url-patch.json` (optional) for URL-to-local path conversion
5. **Validate bundle integrity** before finalizing
6. **Create ZIP archive** with appropriate compression settings

### 7.4 Bundle Validation

Bundle creators MUST perform these validation steps:
1. **Hash verification**: All content hashes match downloaded content
2. **Relationship integrity**: All party/dialog/analysis indices are valid
3. **File completeness**: All external references are resolved and bundled
4. **Security form integrity**: Original signatures/encryption remain intact
5. **Metadata consistency**: All metadata files are consistent and valid JSON

## 8. Bundle Extraction and Usage

### 8.1 Extraction Process

Bundle consumers MUST follow this extraction process:

1. **Extract ZIP** to temporary or permanent directory
2. **Validate bundle structure** and presence of required files:
   - `vcon.json` (required)
   - `metadata/manifest.json` (required)
   - `metadata/bundle-info.json` (required)
   - `metadata/relationships.json` (required)
3. **Verify file integrity** using manifest and ALL content hashes
4. **Load and parse vcon.json** according to security form:
   - **Unsigned**: Parse JSON directly
   - **Signed**: Verify JWS signature, then parse payload
   - **Encrypted**: Decrypt JWE, then handle inner content
5. **Validate relationships** using relationships.json
6. **Optionally apply url-patch.json** to work with local file references

### 8.2 Security Form Processing

**For Signed vCons:**
- Bundle consumers SHOULD verify JWS signatures using appropriate keys
- Signature verification failure SHOULD result in processing warnings or errors
- Consumers MAY choose to process unsigned payloads with appropriate warnings

**For Encrypted vCons:**
- Bundle consumers MUST have appropriate decryption keys
- Decryption failure MUST result in processing failure
- Decrypted content may itself be signed and require signature verification

### 8.3 Re-publishing

To restore external references:
1. **Upload files** to accessible HTTPS URLs maintaining directory structure if desired
2. **Create new vCon** with updated external URLs (original vcon.json remains unchanged)
3. **Maintain ALL content_hash** values for integrity
4. **Preserve security form** if recreating signed/encrypted vCons from bundle
5. **Validate** that new URLs return correct content with matching hashes
6. **Update relationships** if party/dialog indices change during re-publishing

## 9. Extensibility

### 9.1 Future vCon Extensions

The `extensions/` directory provides comprehensive support for future vCon extensions:

**Directory Structure:**
```
extensions/
└── [extension-name]/
    ├── metadata.json          # Extension metadata and schema
    ├── files/                 # Extension-specific files
    │   └── [hash-based-names] # Following same naming conventions
    └── relationships.json     # Extension-specific relationships
```

**Extension Guidelines:**
- Each extension MUST have its own subdirectory named after the extension
- Extension-specific files MUST follow same hash-based naming conventions
- Extension metadata MUST be stored in `extensions/[name]/metadata.json`
- Extensions MAY define additional relationship structures
- Extensions SHOULD be backward compatible with core bundle format

**Extension Metadata Schema:**
```json
{
  "extension_name": "mimi-messages",
  "extension_version": "1.0",
  "vcon_version_compatibility": ["0.3.0"],
  "bundle_format_version": "1.0",
  "content_types": ["application/cbor", "application/json"],
  "hash_algorithms": ["sha256", "sha512"],
  "relationships_schema": {
    "message_id_mappings": "object",
    "topic_references": "array"
  }
}
```

### 9.2 Bundle Format Versioning

- Bundle format version MUST be tracked in all metadata files
- Forward/backward compatibility handled via version negotiation
- New versions MAY add directories or metadata fields
- New versions MUST NOT break existing core structure
- Implementations SHOULD support at least one previous major version
- Version changes that affect core structure require new major version

## 10. Security Considerations

### 10.1 Content Verification

- All files MUST be verified against ALL provided content_hash values before inclusion
- Bundle creators MUST validate HTTPS certificate chains when downloading external files
- Hash algorithms MUST include SHA-512 as required by vCon specification
- Additional hash algorithms MAY be supported as specified in vCon content_hash arrays
- Bundle creators MUST fail bundle creation if any content hash verification fails

### 10.2 vCon Security Form Preservation

- **Signed vCons**: Bundle creators MUST preserve complete JWS structure and SHOULD verify signatures
- **Encrypted vCons**: Bundle creators MUST preserve complete JWE structure and MUST have decryption capability
- **Security downgrades**: Bundle creators MUST NOT convert signed/encrypted vCons to unsigned form
- **Key management**: Bundle creators are responsible for having appropriate keys for encrypted vCons

### 10.3 Privacy Protection

- Bundle creators MUST preserve any privacy controls from original vCon
- Redacted or anonymized vCons MUST maintain redaction integrity in bundles
- Access controls from original vCon SHOULD be preserved in bundle metadata
- Party identification information MUST be handled according to applicable privacy regulations

### 10.4 Bundle-Level Security

- **ZIP encryption**: MAY be used for additional protection but MUST NOT replace vCon-level security
- **Compression**: SHOULD be applied judiciously to avoid side-channel analysis via compressed size
- **File permissions**: Bundle extractors SHOULD set appropriate file permissions on extracted content
- **Temporary files**: Bundle creators SHOULD securely delete temporary files containing sensitive content

### 10.5 Threat Model Considerations

- **Tamper detection**: Content hashes provide integrity verification for individual files
- **Bundle integrity**: Complete bundle integrity depends on ZIP file integrity and metadata consistency
- **Key exposure**: Encrypted vCons protect against key exposure better than ZIP-level encryption
- **Metadata leakage**: Bundle metadata may reveal conversation structure even if content is encrypted

## 11. IANA Considerations

### 11.1 Media Type Registration

This specification defines a new media type for vCon ZIP bundles and requests IANA registration:

**Type name:** application
**Subtype name:** vcon+zip
**Required parameters:** None
**Optional parameters:** 
- version: Bundle format version (default "1.0")
- vcon-version: Source vCon specification version

**Encoding considerations:** Binary (ZIP archive)
**Security considerations:** See Section 10
**Interoperability considerations:** Standard ZIP format with specific internal structure
**Published specification:** This document
**Applications that use this media type:** vCon processing tools, conversation analysis systems
**Fragment identifier considerations:** Not applicable
**Additional information:**
- **Magic number:** ZIP signature (0x504B0304) with vcon.json as required first entry
- **File extensions:** .vcon.zip
- **Macintosh file type code:** Not assigned
- **Uniform Type Identifier:** public.vcon-zip-bundle

**Person & email address to contact:** [Contact information]
**Intended usage:** COMMON
**Restrictions on usage:** None
**Author:** [Author information]
**Change controller:** IETF

## 12. Implementation Guidelines

### 12.1 Required Features

Implementations MUST support:
- All four vCon content arrays (parties, dialog, analysis, attachments)
- All three vCon security forms (unsigned, signed, encrypted)
- SHA-512 content hash verification as primary algorithm
- Standard ZIP format with specified directory structure
- Generation and validation of all required metadata files:
  - manifest.json
  - bundle-info.json  
  - relationships.json
- vCon relationship preservation and reconstruction
- Multi-hash content verification when multiple hashes provided

### 12.2 Recommended Features

Implementations SHOULD support:
- JWS signature verification for signed vCons
- JWE decryption for encrypted vCons (with appropriate keys)
- Additional hash algorithms (SHA-256, SHA-1) for broader compatibility
- Bundle validation and integrity checking tools
- Extension directory support for future vCon extensions

### 12.3 Optional Features

Implementations MAY support:
- Compression optimization for specific media types
- Incremental bundle updates
- Bundle format version migration tools
- Custom extension handling beyond core specification
- ZIP-level encryption for additional security
- Automated re-publishing tools for bundle-to-external conversion

### 12.4 Implementation Validation

Implementations SHOULD provide validation for:
- Bundle structure completeness
- Content hash verification (all algorithms)
- vCon relationship integrity
- Security form preservation
- Metadata consistency
- Extension compatibility

## 13. Examples

### 13.1 Simple Audio Call Bundle (Unsigned vCon)

```
simple-call.vcon.zip
├── vcon.json                     # Unsigned vCon with external references
├── dialog/
│   └── sha512-GLy6IPa...UQ.wav   # Single audio recording
├── analysis/
│   └── sha512-Transcript...XYZ.json  # Generated transcript
└── metadata/
    ├── manifest.json             # File mappings with party relationships
    ├── bundle-info.json          # Bundle metadata (format: unsigned)
    ├── relationships.json        # Party/dialog/analysis relationships
    └── url-patch.json           # Optional URL-to-local patches
```

### 13.2 Multi-media Conference Bundle (Signed vCon)

```
conference.vcon.zip
├── vcon.json                     # JWS-signed vCon preserved exactly
├── dialog/
│   ├── sha512-Audio1...ABC.wav   # Multi-channel audio (parties 0,1)
│   ├── sha256-Audio2...DEF.wav   # Secondary audio (SHA-256 hash)
│   └── sha512-Screen...GHI.mp4   # Screen sharing video
├── attachments/
│   ├── sha512-Slides...JKL.pdf   # Presentation slides
│   └── sha512-Whiteboard...MNO.png # Shared whiteboard
├── analysis/
│   ├── sha512-Transcript...PQR.json  # Speech-to-text transcript
│   ├── sha512-Sentiment...STU.json   # Sentiment analysis
│   ├── sha512-Summary...VWX.txt      # Meeting summary
│   └── sha512-ActionItems...YZ.json  # Extracted action items
└── metadata/
    ├── manifest.json             # Enhanced with channel mappings
    ├── bundle-info.json          # Security info (signed, verified)
    ├── relationships.json        # Complex party/dialog relationships
    └── url-patch.json           # URL conversion patches
```

### 13.3 Encrypted vCon Bundle with Extension

```
encrypted-call-with-mimi.vcon.zip
├── vcon.json                     # JWE-encrypted vCon (complete structure)
├── dialog/
│   └── sha512-Messages...ABC.json # MIMI message thread
├── analysis/
│   └── sha512-Translation...DEF.json # Language translation
├── extensions/
│   └── mimi-messages/
│       ├── metadata.json         # MIMI extension metadata
│       ├── files/
│       │   └── sha256-MsgIDs...GHI.cbor # MIMI-specific data
│       └── relationships.json    # MIMI message relationships
└── metadata/
    ├── manifest.json             # Files with extension references
    ├── bundle-info.json          # Encryption info (JWE details)
    ├── relationships.json        # Core vCon relationships
    └── url-patch.json           # URL patches
```

### 13.4 Edge Case: Empty Arrays Bundle

```
minimal.vcon.zip
├── vcon.json                     # vCon with empty dialog/analysis arrays
└── metadata/
    ├── manifest.json             # Empty files object
    ├── bundle-info.json          # Stats showing zero files
    └── relationships.json        # Minimal relationship structure
```

## 14. Error Handling and Edge Cases

### 14.1 Bundle Creation Errors

Implementations MUST handle these error conditions:

**External File Resolution Errors:**
- **Network failures**: Retry with exponential backoff, fail after maximum attempts
- **Hash mismatches**: MUST fail bundle creation with detailed error message
- **Missing files**: MUST fail bundle creation unless explicitly configured to skip
- **Access denied**: MUST fail with security error, do not retry

**vCon Security Form Errors:**
- **Invalid signatures**: Bundle creators SHOULD warn but MAY continue with flag in metadata
- **Decryption failures**: MUST fail bundle creation for encrypted vCons
- **Missing keys**: MUST fail with clear error message about key requirements

**Validation Errors:**
- **Invalid vCon structure**: MUST fail with schema validation errors
- **Broken relationships**: MUST fail with specific relationship integrity errors
- **Metadata inconsistencies**: MUST fail with detailed consistency check results

### 14.2 Bundle Extraction Errors

Implementations MUST handle these extraction scenarios:

**Bundle Integrity Errors:**
- **Corrupted ZIP**: MUST fail with file corruption error
- **Missing required files**: MUST fail with specific missing file list
- **Hash verification failures**: MUST fail unless configured for warnings

**Security Processing Errors:**
- **Signature verification failures**: SHOULD warn, MAY continue based on policy
- **Decryption failures**: MUST fail with key-related error message
- **Downgrade attacks**: MUST detect and prevent security form downgrades

### 14.3 Edge Case Handling

**Empty vCon Arrays:**
- Bundles with empty dialog, analysis, or attachments arrays are valid
- Metadata files MUST still be generated with appropriate empty structures
- Relationships.json MUST reflect actual array contents

**Large File Handling:**
- Implementations SHOULD support streaming for large media files
- Bundle size limits MAY be implemented with clear error messages
- Memory-efficient processing SHOULD be used for multi-gigabyte files

**Unicode and Encoding:**
- All JSON metadata files MUST use UTF-8 encoding
- Filenames MUST handle Unicode characters in base64url encoding
- Content type detection MUST handle various character encodings

## References

### Normative References

- [draft-ietf-vcon-vcon-core] - The JSON format for vCon
- [draft-ietf-vcon-vcon-container] - vCon Container Specification  
- [RFC 7515] - JSON Web Signature (JWS)
- [RFC 7516] - JSON Web Encryption (JWE)
- [RFC 6234] - US Secure Hash Algorithms (SHA and SHA-based HMAC and HKDF)
- [RFC 6901] - JavaScript Object Notation (JSON) Pointer
- [RFC 6902] - JavaScript Object Notation (JSON) Patch

### Informative References

- [draft-ietf-vcon-overview] - vCon Overview
- [RFC 2046] - Multipurpose Internet Mail Extensions (MIME)
- [RFC 3986] - Uniform Resource Identifier (URI): Generic Syntax
- [FIPS 180-4] - Secure Hash Standard (SHS)
- [ZIP-SPEC] - PKWARE ZIP File Format Specification