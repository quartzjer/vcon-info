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

The vCon ZIP bundle follows a flat directory structure designed for simplicity and extensibility:

```
vcon-bundle.zip
├── vcon.json                 # Original vCon JSON file (with external URLs)
├── dialog/                   # Dialog media files (flat structure)
├── attachments/             # Attachment files by hash
├── analysis/                # Analysis data files by hash
├── metadata/                # Bundle metadata and manifests
│   ├── manifest.json        # File manifest with mappings
│   ├── bundle-info.json     # Bundle creation metadata
│   └── url-patch.json       # JSON patch for URL-to-local conversion (optional)
└── extensions/              # Future vCon extensions
    └── [extension-name]/    # Extension-specific directories
```

## 3. File Naming Conventions

All externally referenced files are stored using their SHA-512 content hash as the filename, ensuring:
- **Uniqueness**: Hash-based names prevent collisions
- **Integrity**: Filename directly corresponds to content verification
- **Deduplication**: Identical content reuses the same file
- **Mapping**: Easy correlation between vCon JSON and bundle files

### 3.1 Hash-Based Filenames

Files are named using the following pattern:
```
[hash-algorithm]-[base64url-hash].[extension]
```

Examples:
- `sha512-GLy6IPaIUM1GqzZqfIPZlWjaDsNgNvZM0iCONNThnH0a75fhUM6cYzLZ5GynSURREvZwmOh54-2lRRieyj82UQ.wav`
- `sha512-Abc123...XYZ.mp4`
- `sha512-Def456...UVW.pdf`

### 3.2 Extension Mapping

File extensions are determined by:
1. **MIME type** from vCon mimetype field (preferred)
2. **Content analysis** of the file header
3. **Original URL extension** as fallback
4. **Generic extension** (.bin) if undetermined

## 4. Core Files

### 4.1 vcon.json

The original vCon JSON file exactly as received, including all external URLs. This preserves:
- **Audit trail**: Verification of the original source
- **Re-publishing**: Restoration of external references if needed
- **Compliance**: Legal requirements for preserving original data
- **Simplicity**: Single source of truth for vCon structure

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

Maps original URLs to bundle-local files and provides file metadata:

```json
{
  "version": "1.0",
  "vcon_uuid": "0195544a-b9b1-8ee4-b9a2-279e0d16bc46",
  "created_at": "2025-08-02T10:30:00Z",
  "bundle_format_version": "1.0",
  "files": {
    "https://example.com/audio.wav": {
      "local_path": "dialog/audio/sha512-GLy6IPa...wav",
      "content_hash": "sha512-GLy6IPa...",
      "size": 1048576,
      "mime_type": "audio/wav",
      "vcon_reference": {
        "type": "dialog",
        "index": 0
      }
    }
  }
}
```

### 6.2 bundle-info.json

Contains bundle creation metadata:

```json
{
  "bundle_format_version": "1.0",
  "created_at": "2025-08-02T10:30:00Z",
  "created_by": "vcon-bundler v1.2.3",
  "source_vcon": {
    "uuid": "0195544a-b9b1-8ee4-b9a2-279e0d16bc46",
    "version": "0.3.0",
    "format": "unsigned|signed|encrypted"
  },
  "bundle_stats": {
    "total_files": 15,
    "total_size": 52428800,
    "file_types": {
      "dialog": 5,
      "attachments": 3,
      "analysis": 7
    }
  }
}
```

### 6.3 url-patch.json (Optional)

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

### 7.1 External File Resolution

1. **Parse vCon JSON** to identify all external references (dialog, attachments, analysis)
2. **Download files** from HTTPS URLs with proper error handling
3. **Verify content hashes** against downloaded content
4. **Generate local paths** based on content hash and media type
5. **Preserve original vCon** exactly as received in `vcon.json`
6. **Generate optional JSON patches** for URL-to-local path conversion

### 7.2 Bundle Assembly

1. **Create directory structure** within ZIP
2. **Add original vCon** as `vcon.json`
3. **Add referenced files** to appropriate directories
4. **Generate metadata files** (manifest.json, bundle-info.json, optional url-patch.json)
5. **Create ZIP archive** with appropriate compression

## 8. Bundle Extraction and Usage

### 8.1 Extraction Process

1. **Extract ZIP** to temporary or permanent directory
2. **Validate bundle structure** and required files
3. **Verify file integrity** using manifest and content hashes
4. **Load original vcon.json** for processing
5. **Optionally apply url-patch.json** to work with local file references

### 8.2 Re-publishing

To restore external references:
1. **Upload files** to accessible HTTPS URLs
2. **Create new vCon** with updated external URLs (original remains unchanged)
3. **Maintain content_hash** values for integrity
4. **Validate** that new URLs return correct content

## 9. Extensibility

### 9.1 Future vCon Extensions

The `extensions/` directory supports future vCon extensions:
- Each extension gets its own subdirectory
- Extension-specific files follow same hash-based naming
- Extension metadata stored in `extensions/[name]/metadata.json`

### 9.2 Bundle Format Versioning

- Bundle format version tracked in all metadata files
- Forward/backward compatibility handled via version negotiation
- New versions may add directories or metadata fields
- Core structure remains stable for compatibility

## 10. Security Considerations

### 10.1 Content Verification

- All files MUST be verified against their content_hash before inclusion
- Bundle creators MUST validate HTTPS certificate chains when downloading
- Hash algorithms SHOULD follow vCon specification requirements (SHA-512)

### 10.2 Privacy Protection

- Bundle creators MUST preserve any privacy controls from original vCon
- Encrypted vCons remain encrypted within bundles
- Access controls SHOULD be preserved in bundle metadata

### 10.3 Compression and Encryption

- ZIP-level encryption MAY be used for additional protection
- Compression SHOULD be applied judiciously to avoid analysis via compressed size
- Individual file encryption within ZIP is RECOMMENDED for sensitive content

## 11. IANA Considerations

This specification defines a new media type for vCon ZIP bundles:

**Media Type:** `application/vcon+zip`
**File Extension:** `.vcon.zip`
**Magic Number:** Standard ZIP signature (PK) with vcon.json as first entry

## 12. Implementation Guidelines

### 12.1 Required Features

Implementations MUST support:
- All four vCon content arrays (parties, dialog, analysis, attachments)
- SHA-512 content hash verification
- Standard ZIP format with directory structure
- Manifest generation and validation

### 12.2 Optional Features

Implementations MAY support:
- Additional hash algorithms beyond SHA-512
- Compression optimization for specific media types
- Incremental bundle updates
- Bundle validation tools

## 13. Examples

### 13.1 Simple Audio Call Bundle

```
simple-call.vcon.zip
├── vcon.json
├── dialog/
│   └── sha512-GLy6IPa...UQ.wav
├── analysis/
│   └── sha512-Transcript...XYZ.json
└── metadata/
    ├── manifest.json
    ├── bundle-info.json
    └── url-patch.json
```

### 13.2 Multi-media Conference Bundle

```
conference.vcon.zip
├── vcon.json
├── dialog/
│   ├── sha512-Audio1...ABC.wav
│   ├── sha512-Audio2...DEF.wav
│   └── sha512-Screen...GHI.mp4
├── attachments/
│   ├── sha512-Slides...JKL.pdf
│   └── sha512-Whiteboard...MNO.png
├── analysis/
│   ├── sha512-Transcript...PQR.json
│   └── sha512-Summary...STU.txt
└── metadata/
    ├── manifest.json
    ├── bundle-info.json
    └── url-patch.json
```

## References

- [draft-ietf-vcon-vcon-core] - The JSON format for vCon
- [draft-ietf-vcon-overview] - vCon Overview
- [RFC 2046] - Multipurpose Internet Mail Extensions (MIME)
- [RFC 3986] - Uniform Resource Identifier (URI): Generic Syntax
- [FIPS 180-4] - Secure Hash Standard (SHS)