# vCon Core Object Schemas

## Overview

This reference provides field-level schema guidance for vCon objects.
It is optimized for implementation and validation tasks.
It focuses on core object structure from `draft-ietf-vcon-vcon-core-02`
plus CC extension fields where relevant.

Read this file when you need exact field names, types,
indexing behavior, and required or optional decisions.

## Top-Level Object

The top-level object holds metadata and the main conversation arrays.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vcon` | string | Practical | Version identifier. Include for compatibility. |
| `uuid` | string (UUID) | Yes | Unique identifier for this vCon instance. |
| `created_at` | string (RFC3339) | Yes | Creation timestamp. |
| `updated_at` | string (RFC3339) | No | Last update timestamp. |
| `subject` | string | No | Human-readable topic. |
| `redacted` | object | No | Pointer to less-redacted vCon. |
| `appended` | object | No | Pointer to prior version before append. |
| `group` | array<object> | No | Related vCons grouped together. |
| `parties` | array<object> | Yes | All parties for index-based references. |
| `dialog` | array<object> | No | Conversation segments. |
| `analysis` | array<object> | No | Derived artifacts. |
| `attachments` | array<object> | No | Supporting content. |
| `extensions` | object | No | Extension token map. |
| `critical` | array<string> | No | Extensions that MUST be understood. |

### `redacted` object

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `uuid` | string (UUID) | Yes | Referenced vCon UUID. |
| `vcon` | string | Yes | Referenced vCon version string. |

### `appended` object

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `uuid` | string (UUID) | Yes | Referenced prior vCon UUID. |
| `vcon` | string | Yes | Referenced prior vCon version string. |

### `group` object entries

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `uuid` | string (UUID) | Yes | Related vCon UUID. |
| `vcon` | string | Yes | Related vCon version string. |

## Party Object

A party object describes one party in the conversation.
Party objects may be empty (`{}`) to preserve index positions
when data is unavailable.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `tel` | string (tel URI) | No | Telephone identifier. |
| `stir` | string | No | STIR PASSporT token. |
| `mailto` | string | No | Email identifier. |
| `name` | string | No | Display name. |
| `validation` | string | No | Identity or number validation status. |
| `gmlpos` | string | No | Geographic point data. |
| `timezone` | string | No | IANA timezone token. |
| `civic_address` | string or object | No | Civic location information. |
| `uuid` | string (UUID) | No | Party UUID if provided. |
| `role` | string | No | CC extension role label. |
| `contact_list` | string | No | CC extension contact list identifier. |

Notes:

- At least one identifier (`tel`, `mailto`, or equivalent) SHOULD be present.
- Consumers should tolerate sparse party objects while preserving index integrity.

## Dialog Object

A dialog object represents a conversation segment.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string (MIME) | Yes | Content media type or dialog type token. |
| `start` | string (RFC3339) | Yes | Segment start time. |
| `duration` | number | No | Duration in seconds. |
| `parties` | integer or array<integer> | Yes | Zero-based party references. |
| `originator` | integer | No | Originating party index. |
| `mimetype` | string | No | MIME type with some legacy forms. |
| `filename` | string | No | Original file name. |
| `disposition` | string | No | Content disposition metadata. |
| `party_history` | array<object> | No | Join, drop, hold, mute events. |
| `campaign` | string | No | CC extension campaign tag. |
| `interaction_type` | string | No | CC extension interaction class. |
| `interaction_id` | string | No | CC extension interaction ID. |
| `skill` | string | No | CC extension routing skill label. |
| `body` | string | Conditional | Inline content field. |
| `encoding` | string | Conditional | Inline encoding field. |
| `url` | string (HTTPS) | Conditional | External content URL. |
| `content_hash` | string | Conditional | External content integrity hash. |

`parties` interpretation:

- Integer: common two-party representation.
- Array of integers: multi-party representation.
- Values are always zero-based indices into top-level `parties`.

## party_history Object

The `party_history` array captures changes in party state during dialog.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `party` | integer | Yes | Zero-based party index. |
| `event` | string | Yes | One of `join`, `drop`, `hold`, `unhold`, `mute`, `unmute`. |
| `time` | string (RFC3339) | Yes | Event timestamp. |

## Analysis Object

An analysis object captures derived data tied to dialog entries.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string (MIME) | Yes | Analysis media type. |
| `dialog` | integer or array<integer> | Yes | Referenced dialog indices. |
| `vendor` | string | No | Producer vendor. |
| `product` | string | No | Producer product. |
| `schema` | string (URI) | No | Schema identifier for analysis payload. |
| `body` | string | Conditional | Inline analysis payload. |
| `encoding` | string | Conditional | Inline payload encoding. |
| `url` | string (HTTPS) | Conditional | External analysis URL. |
| `content_hash` | string | Conditional | External payload hash. |

## Attachment Object

An attachment object stores supporting content.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string (MIME) | Yes | Attachment media type. |
| `start` | string (RFC3339) | No | Attachment timestamp. |
| `party` | integer | No | Related party index. |
| `dialog` | integer or array<integer> | No | Related dialog index(es). |
| `body` | string | Conditional | Inline attachment payload. |
| `encoding` | string | Conditional | Inline payload encoding. |
| `url` | string (HTTPS) | Conditional | External attachment URL. |
| `content_hash` | string | Conditional | External payload hash. |

## Inline and External Content Fields

Dialog, analysis, and attachments share the same content model.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `body` | string | Inline only | Inline payload. |
| `encoding` | string | Inline only | `base64url`, `json`, `none`. |
| `url` | string | External only | HTTPS URL to content. |
| `content_hash` | string | External only | `algorithm-base64url_digest` format. |

Mutual exclusivity rule:

- Inline form uses `body` + `encoding`.
- External form uses `url` + `content_hash`.
- Mixing both forms for the same content object should be avoided.

## Indexing Rules

vCon object references are index-based and zero-based.

- `dialog.parties` references entries in top-level `parties`.
- `analysis.dialog` references entries in top-level `dialog`.
- `attachments.party` references entries in top-level `parties`.
- `attachments.dialog` references entries in top-level `dialog`.
- `party_history.party` references entries in top-level `parties`.

Index stability guidance:

1. Do not reorder `parties` after creating references.
2. Do not remove referenced entries without rewriting all references.
3. If identity data must be removed, prefer redaction while preserving index positions.

## Source Basis

Core schema details summarized from:

- `draft-ietf-vcon-vcon-core-02` (top-level, party, dialog, analysis, attachments)
- `draft-ietf-vcon-cc-extension-01` (CC extension field additions)
