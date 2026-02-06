---
name: vcon-protocol
description: Provides authoritative guidance for working with the vCon conversation JSON container defined in IETF drafts, including top-level schema, parties, dialog, analysis, attachments, inline and external content rules, content_hash formats, extension and critical handling, and unsigned, signed, and encrypted security forms. Helps an agent validate vCon structures, explain version drift, compare CC, MIMI, Consent, and Lifecycle specifications, and cite source drafts for implementation and interoperability decisions.
---

# vCon Protocol Knowledge

## What is vCon

vCon (Virtual Conversation) is a JSON container format standardized by the IETF vCon working group.
It captures conversation data in one portable structure: parties, dialog recordings or transcripts,
analysis results, and attachments.
vCons can be unsigned, signed (JWS), or encrypted (JWE), depending on integrity and confidentiality needs.
The current primary specification is `draft-ietf-vcon-vcon-core-02`.

## Core Structure

The top-level object carries core metadata and the four major content arrays.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vcon` | string | Practical* | Version identifier. Core-02 specifies `"0.0.1"`. In the wild: `"0.0.1"`, `"0.0.2"`, `"0.3.0"`. Spec direction is `"0.4.0"`. |
| `uuid` | string (UUID) | Yes | Unique identifier for this vCon, MUST be a UUID. |
| `created_at` | string (RFC3339) | Yes | When the vCon was created. MUST be RFC3339 date-time. |
| `updated_at` | string (RFC3339) | No | When last modified. |
| `subject` | string | No | Human-readable subject or topic. |
| `redacted` | object | No | References a less-redacted version of this vCon (`uuid` + `vcon` version). |
| `appended` | object | No | References a prior version before appending (`uuid` + `vcon` version). |
| `group` | array of objects | No | References to related vCons in a group. |
| `parties` | array of objects | Yes | Parties in the conversation. See Parties section. |
| `dialog` | array of objects | No | Conversation content (recordings, transcripts, messages). |
| `analysis` | array of objects | No | Derived data (transcripts, summaries, sentiment). |
| `attachments` | array of objects | No | Supporting documents and attachment content. |
| `extensions` | object | No | Extension parameters keyed by extension token. |

*The `vcon` field is not listed as required in the core-02 JSON schema appendix,
but implementations universally expect it.
Include it.

Core structure notes:

- Keep top-level keys stable once references are issued across systems.
- Treat `uuid` as immutable for lifecycle traceability.
- Use `updated_at` for versioned mutation workflows.
- Keep optional arrays explicit (`[]`) when downstream tooling expects fixed shapes.
- Preserve top-level extension metadata even if a local processor ignores some fields.

## Parties

The `parties` array defines who is involved in the conversation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tel` | string (tel URI) | No* | Telephone number. |
| `stir` | string (PASSporT) | No | STIR PASSporT for caller verification. |
| `mailto` | string (email) | No | Email address. |
| `name` | string | No | Display name. |
| `validation` | string | No | Validation status (`TN-Validation-Passed`, etc.). |
| `gmlpos` | string | No | Geographic position (GML). |
| `timezone` | string | No | IANA timezone. |
| `role` | string | No | Party role (CC extension: `agent`, `customer`, `supervisor`). |
| `contact_list` | string | No | Contact list identifier (CC extension). |

*At least one identifier (`tel`, `mailto`, or other identifier) SHOULD be present.

Parties are referenced by zero-based index from dialog and analysis objects.
That makes array order part of the data contract.

Party modeling notes:

- Keep indexing stable; avoid party reordering after data is linked.
- Use canonical identity formats where possible (`tel:` or full email forms).
- Preserve unknown parties as sparse objects instead of deleting index slots.
- If a role is unknown, omit `role` rather than using ad hoc placeholders.
- Use `validation` only for verifiable outcomes, not inferred confidence labels.

## Dialog

The `dialog` array contains conversation segments.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string (MIME) | Yes | Media type of the content (`audio/x-wav`, `text/plain`, `message/external-body`, etc.). |
| `start` | string (RFC3339) | Yes | When this dialog segment started. |
| `duration` | number | No | Duration in seconds (for audio or video). |
| `parties` | int or array | Yes | Zero-based index into top-level parties array. Integer for two-party, array of ints for multi-party. |
| `originator` | integer | No | Index of the party who initiated this dialog segment. |
| `mimetype` | string | No | MIME type when `type` is `message/external-body`. |
| `filename` | string | No | Original filename. |
| `disposition` | string | No | Content disposition (`inline`, `render`, `session`, `aib`). |

Content is either inline (`body` + `encoding`) or external (`url` + `content_hash`).
See Content Handling section.

Dialog modeling notes:

- For two-party voice records, a single integer `parties` field is common.
- For group contexts, prefer explicit arrays to avoid ambiguity.
- Keep `start` values normalized to RFC3339 with explicit timezone.
- Use `originator` when first-party position is not sufficient.
- Keep `filename` descriptive but do not treat it as authoritative metadata.

## Analysis

The `analysis` array contains derived artifacts tied to one or more dialog segments.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string (MIME) | Yes | Media type of analysis content. |
| `dialog` | integer or array | Yes | Zero-based index(es) into dialog array that this analysis covers. |
| `vendor` | string | No | Vendor or tool that produced this analysis. |
| `product` | string | No | Product name. |
| `schema` | string (URI) | No | URI of the schema describing the analysis body. |

Analysis content follows the same inline or external pattern used by dialog and attachments.

Analysis modeling notes:

- Tie every analysis entry to its source dialog index or index list.
- Keep `vendor`, `product`, and `schema` together when possible for reproducibility.
- Use stable schema URIs whenever analysis payload contracts evolve.
- Keep analysis payloads separate from original dialog content to preserve provenance.

## Attachments

The `attachments` array stores supporting documents and media.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string (MIME) | Yes | Media type. |
| `party` | integer | No | Zero-based party index this attachment relates to. |
| `start` | string (RFC3339) | No | Timestamp for the attachment. |

Attachment content follows the same inline or external pattern.
Special attachment type `consent` is defined by the consent specification.

Attachment modeling notes:

- Use attachments for supporting artifacts that are not primary dialog payload.
- Keep `party` references explicit when an attachment belongs to a specific party.
- If an attachment applies globally, omit `party` rather than using synthetic indices.
- Use external content for large binary artifacts when possible.

## Content Handling

### Inline Content

Inline content uses `body` and `encoding`.

- `base64url`: binary payload encoded using base64url (RFC 4648 section 5)
- `json`: structured data serialized as a JSON string payload
- `none`: plain text stored directly in `body`

Inline fields:

- `body`: string payload
- `encoding`: one of `base64url`, `json`, `none`

### External Content

External content uses `url` and `content_hash`.

- `url` MUST use HTTPS
- `content_hash` format is `algorithm-base64url_digest`
- Supported algorithm tokens are lowercase: `sha256`, `sha384`, `sha512`
- Example: `sha256-K7gNU3sdo-OL0wNhqoVWhr3g6s1xYv72ol_pe_Unols`

Verification flow:

1. Fetch bytes from `url`
2. Hash content with declared algorithm
3. Base64url-encode digest
4. Compare to the digest in `content_hash`

Common content-handling mistakes to avoid:

- Using standard base64 padding rules instead of base64url conventions.
- Treating `encoding: \"json\"` body as already-parsed object in transport.
- Storing external HTTP URLs instead of HTTPS URLs.
- Comparing hash digests in hex against base64url digests.
- Accepting mismatched algorithm tokens (for example `SHA-256`) in `content_hash`.

Decision table:

| Scenario | Use | Fields |
|----------|-----|--------|
| Small text or JSON | Inline | `body` + `encoding` |
| Binary (audio, images) | Inline base64url or External | `body` + `encoding:"base64url"` OR `url` + `content_hash` |
| Large attachment content | External | `url` + `content_hash` |
| Sensitive content | External + encrypted vCon | `url` + `content_hash`, wrap in JWE |

## Security Forms

vCon supports three security forms.

| Form | Format | Use When |
|------|--------|----------|
| Unsigned | Plain JSON object | Internal processing, mutable workflows, development or testing |
| Signed | JWS JSON Serialization (RFC 7515) | Cross-domain transfer, provenance, integrity verification |
| Encrypted | JWE JSON Serialization (RFC 7516) | Confidentiality required; MUST sign-then-encrypt (JWS wrapped in JWE) |

Detection rules:

- Unsigned: JSON object with `vcon` field at top level
- Signed: JSON object with `payload`, `signatures` (JWS)
- Encrypted: JSON object with `ciphertext`, `recipients` (JWE)

Recommended processing sequence:

1. Detect security form from top-level keys.
2. For encrypted content, decrypt authorized recipient payload.
3. For signed content, verify signature and certificate data.
4. Validate underlying unsigned vCon schema and references.
5. Verify external content hashes before consuming linked artifacts.

See `references/security.md` for JWS and JWE header requirements and algorithm details.

## Extensions

Extension mechanism summary:

- Top-level `extensions` object maps extension tokens to parameter objects
- Extension tokens are registered in the IANA vCon Extension Names registry
- `critical` array lists extensions a consumer MUST understand
- Extension parameter names use snake_case convention

Known extensions:

| Extension | Token | Scope | Key Fields Added |
|-----------|-------|-------|-----------------|
| Contact Center | `CC` | Party + Dialog | `role`, `contact_list`, `campaign`, `interaction_type`, `skill` |
| MIMI Messages | (TBD) | Top-level + Party + Dialog | `room` (top-level), `im_uri`, `thumbprint`, `message_id` |
| Consent | — | Attachment type | `type:"consent"` attachment with `expiration`, `consents` |
| Lifecycle | — | Governance model | Not a JSON extension; defines lifecycle phases via SCITT |

See `references/extensions.md` for detailed extension schema notes.

Extension-handling workflow:

1. Parse `extensions` and collect declared tokens.
2. Check `critical` for unsupported tokens.
3. Reject immediately if any unsupported critical token is present.
4. Process supported extension fields with snake_case naming.
5. Preserve unknown non-critical extension payloads when re-serializing.

## Implementation Gotchas

- **Party indexing is zero-based**: Dialog and analysis `parties` and `dialog` fields reference by array position, not by ID. Inserting or removing parties can break references.
- **`content_hash` format**: MUST be `algorithm-base64url_digest` with lowercase algorithm token. It is not colon-separated and not hex-encoded.
- **RFC3339 timestamps**: `created_at`, `updated_at`, `start` fields MUST be RFC3339 date-time values with timezone offset or `Z`.
- **Version field drift**: Core-02 says `"0.0.1"` but signals direction toward `"0.4.0"`. Implementations in the wild use `"0.0.1"`, `"0.0.2"`, `"0.3.0"`. Accept all and generate `"0.0.1"` for maximum compatibility.
- **Extension naming**: Use snake_case for extension-defined field names.
- **Inline encoding values**: Only `base64url`, `json`, `none` are valid. Do not substitute `base64`.
- **Sign-then-encrypt order**: For encrypted vCons, sign first as JWS, then encrypt as JWE. Do not encrypt-then-sign.
- **Dialog `parties` overloading**: Support both single integer and array of integers.
- **Empty arrays vs absent**: Optional arrays (`dialog`, `analysis`, `attachments`) may be absent and should be treated as empty.
- **Unknown extensions**: Unknown non-critical extensions should not cause hard failure, but should be preserved if possible.
- **Reference mutation**: Editing party or dialog array ordering after creation invalidates index-based references.
- **Content source trust**: `url` location does not imply integrity; only `content_hash` verification does.

## Minimal Example

```json
{
  "vcon": "0.0.1",
  "uuid": "018f4b6c-5e02-7000-8000-abcdef123456",
  "created_at": "2024-06-15T14:30:00.000Z",
  "parties": [
    {
      "tel": "+1-555-100-1000",
      "name": "Alice"
    },
    {
      "tel": "+1-555-100-2000",
      "name": "Bob"
    }
  ],
  "dialog": [],
  "analysis": [],
  "attachments": []
}
```

This shows the minimum practical structure.
See `docs/examples/` for complete forms:
`ab.vcon` (basic), `ab_call_ext_rec.vcon` (external recording),
`ab_call_ext_rec_analysis.vcon` (with analysis),
`ab_call_ext_rec_signed.vcon` (signed form).

When extending this minimal structure:

- Add `dialog` entries first to capture primary conversation payload.
- Add `analysis` entries after dialog references are stable.
- Add `attachments` for supplemental artifacts and consent records.
- Add security wrapping (JWS/JWE) only after unsigned form validation succeeds.

## Authoritative Sources

- [Core Spec](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt) - Primary JSON format specification
- [Overview](https://www.ietf.org/archive/id/draft-ietf-vcon-overview-00.txt) - Use cases and architecture
- [CC Extension](https://www.ietf.org/archive/id/draft-ietf-vcon-cc-extension-01.txt) - Contact center extension
- [Privacy Primer](https://www.ietf.org/archive/id/draft-ietf-vcon-privacy-primer-00.txt) - Privacy framework
- [Consent](https://www.ietf.org/archive/id/draft-howe-vcon-consent-00.txt) - Consent attachment
- [Lifecycle](https://www.ietf.org/archive/id/draft-howe-vcon-lifecycle-00.txt) - Lifecycle management
- [MIMI Messages](https://www.ietf.org/archive/id/draft-mahy-vcon-mimi-messages-02.txt) - Instant messaging extension

Source usage guidance:

- Prefer core spec first for schema and security decisions.
- Use extension drafts only for extension-defined fields and semantics.
- Use privacy and lifecycle drafts for governance and operational controls.

## Reference Files

- `references/core-objects.md` - Detailed field-by-field schemas for all vCon objects
- `references/security.md` - JWS and JWE requirements, content_hash verification, algorithms
- `references/extensions.md` - CC, MIMI, Consent, and Lifecycle extension details
- `references/privacy.md` - Privacy framework, PII categories, regulatory mapping

Reference loading guidance:

- Start with `core-objects.md` for object-level implementation work.
- Load `security.md` when handling signed or encrypted payloads.
- Load `extensions.md` when extension tokens or critical handling is involved.
- Load `privacy.md` when workflow design involves PII, consent, or retention controls.
