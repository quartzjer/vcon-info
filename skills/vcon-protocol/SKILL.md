---
name: vcon-protocol
description: >
  Authoritative vCon conversation JSON guidance (IETF drafts). Schema,
  parties, dialog, analysis, attachments, inline/external content,
  content_hash, extensions, unsigned/signed/encrypted forms. TRIGGER:
  vCon, virtual conversation, conversation JSON, IETF vcon.
---

# vCon Protocol Knowledge
## What is vCon

vCon (Virtual Conversation) is a JSON container format standardized by the IETF vCon working group (see [Overview §1](https://www.ietf.org/archive/id/draft-ietf-vcon-overview-00.txt)).
It captures conversation data in one portable structure: parties, dialog recordings or transcripts,
analysis results, and attachments.
vCons can be unsigned, signed (JWS), or encrypted (JWE), depending on integrity and confidentiality needs.
The current primary specification is `draft-ietf-vcon-vcon-core-02`.

## Core Structure

The top-level object carries core metadata and the four major content arrays (see [Core §4.1](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).
Use stable key names and stable array ordering to protect interoperability across systems.

### Top-Level Fields

The top-level field set defines identity, lifecycle metadata, payload arrays, and extension handling (see [Core §4.1](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vcon` | string | Practical | Version identifier. Core-02 specifies `"0.0.1"`. In the wild: `"0.0.1"`, `"0.0.2"`, `"0.3.0"`. Spec direction is `"0.4.0"`. |
| `uuid` | string (UUID) | Yes | Unique identifier for this vCon, MUST be a UUID. |
| `created_at` | string (RFC3339) | Yes | When the vCon was created. MUST be RFC3339 date-time. |
| `updated_at` | string (RFC3339) | No | When last modified. |
| `subject` | string | No | Human-readable subject or topic. |
| `redacted` | object | No | References a less-redacted version of this vCon. |
| `appended` | object | No | References a prior version before appending. |
| `group` | array<object> | No | References to related vCons in a group. |
| `parties` | array<object> | Yes | Parties in the conversation. |
| `dialog` | array<object> | No | Conversation content segments. |
| `analysis` | array<object> | No | Derived data such as transcript or sentiment. |
| `attachments` | array<object> | No | Supporting documents and attachment content. |
| `extensions` | object | No | Extension parameters keyed by extension token. |
| `critical` | array<string> | No | Extension tokens a consumer MUST understand. |

### Relationship Sub-Objects

Relationship sub-objects encode lineage and grouping across related vCons (see [Core §4.1.8/§4.1.9](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

`redacted` object:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `uuid` | string (UUID) | Yes | Referenced less-redacted vCon UUID. |
| `vcon` | string | Yes | Referenced less-redacted vCon version string. |

`appended` object:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `uuid` | string (UUID) | Yes | Referenced prior vCon UUID. |
| `vcon` | string | Yes | Referenced prior vCon version string. |

`group` entries:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `uuid` | string (UUID) | Yes | Related vCon UUID. |
| `vcon` | string | Yes | Related vCon version string. |

## Parties

The `parties` array defines who is involved in the conversation and is referenced by zero-based index across objects (see [Core §4.2](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).
Array ordering is part of the data contract and must remain stable after references are created.

### Party Fields

Party objects describe participant identity and optional contact-center context (see [Core §4.2](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

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

Party modeling notes:

- At least one identifier (`tel`, `mailto`, or equivalent) SHOULD be present.
- Consumers should tolerate sparse party objects while preserving index integrity.
- Preserve unknown parties as sparse objects instead of deleting index slots.
- If a role is unknown, omit `role` rather than using ad hoc placeholders.
- Use `validation` only for verifiable outcomes, not inferred confidence labels.

### party_history Object

The `party_history` array captures changes in party state during dialog processing (see [Core §4.3.11.1](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `party` | integer | Yes | Zero-based party index. |
| `event` | string | Yes | One of `join`, `drop`, `hold`, `unhold`, `mute`, `unmute`. |
| `time` | string (RFC3339) | Yes | Event timestamp. |

## Dialog

The `dialog` array represents conversation segments and carries media, timing, and participant linkage (see [Core §4.3](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string (MIME) | Yes | Content media type or dialog type token. |
| `start` | string (RFC3339) | Yes | Segment start time. |
| `duration` | number | No | Duration in seconds. |
| `parties` | integer or array<integer> | Yes | Zero-based party references. |
| `originator` | integer | No | Originating party index. |
| `mimetype` | string | No | MIME type with some legacy forms. |
| `filename` | string | No | Original filename. |
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

Dialog modeling notes:

- Integer `parties` is common for two-party records.
- Array `parties` is preferred for multi-party context.
- Values are always zero-based indices into top-level `parties`.
- Keep `start` values normalized to RFC3339 with explicit timezone.
- Use `originator` when first-party position is not sufficient.
- Keep `filename` descriptive but do not treat it as authoritative metadata.

## Analysis

The `analysis` array contains derived artifacts tied to one or more dialog segments (see [Core §4.5](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

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

## Attachments

The `attachments` array stores supporting artifacts not modeled as primary dialog content (see [Core §4.4](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

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

## Content Handling

Dialog, analysis, and attachments share a common inline-versus-external content model (see [Core §2.3/§2.4](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

### Inline Content

Inline content stores payload bytes or text directly in the object body (see [Core §2.3](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

Inline content uses `body` and `encoding`.

- `base64url`: binary payload encoded using base64url (RFC 4648 section 5)
- `json`: structured data serialized as a JSON string payload
- `none`: plain text stored directly in `body`

Inline fields:

- `body`: string payload
- `encoding`: one of `base64url`, `json`, `none`

### External Content

External content stores a URL pointer plus integrity proof for the payload (see [Core §2.4.1/§2.4.2](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

External content uses `url` and `content_hash`.

- `url` MUST use HTTPS.
- `content_hash` format is `algorithm-base64url_digest`.
- Supported algorithm tokens are lowercase: `sha256`, `sha384`, `sha512`.
- Example: `sha256-K7gNU3sdo-OL0wNhqoVWhr3g6s1xYv72ol_pe_Unols`.

Verification flow:

1. Fetch bytes from `url`.
2. Hash content with declared algorithm.
3. Base64url-encode digest.
4. Compare to the digest in `content_hash`.

Failure handling:

- Any mismatch means content integrity failure.
- Consumers should reject or quarantine failed external content.

Common mistakes to avoid:

- Using standard base64 padding rules instead of base64url conventions.
- Treating `encoding: "json"` body as already-parsed object in transport.
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

### Inline vs External Rule

Each content-bearing object should use exactly one content form for payload transport (see [Core §2.3/§2.4](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

Mutual exclusivity rule:

- Inline form uses `body` + `encoding`.
- External form uses `url` + `content_hash`.
- Mixing both forms for the same content object should be avoided.

## Security Forms

vCon supports unsigned, signed, and encrypted security forms with different validation requirements (see [Core §5.4](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

| Form | Format | Use When |
|------|--------|----------|
| Unsigned | Plain JSON object | Internal processing, mutable workflows, development or testing |
| Signed | JWS JSON Serialization (RFC 7515) | Cross-domain transfer, provenance, integrity verification |
| Encrypted | JWE JSON Serialization (RFC 7516) | Confidentiality required; MUST sign-then-encrypt (JWS wrapped in JWE) |

Detection rules:

- Unsigned: JSON object with `vcon` field at top level.
- Signed: JSON object with `payload`, `signatures`.
- Encrypted: JSON object with `ciphertext`, `recipients`.

For `content_hash` format and verification, see External Content above.

### Signed Form (JWS)

Signed vCon uses JWS JSON Serialization with one or more signatures over the unsigned payload (see [Core §5.2](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

Core structure:

- `payload`: base64url-encoded unsigned vCon JSON.
- `signatures`: one or more signature entries.

Header requirements and expectations:

- `alg`: signing algorithm.
- `x5c` or `x5u`: certificate chain or certificate URL.
- `uuid`: UUID for object correlation.
- `cty`: content type marker such as `vcon`.

Operational notes:

- Multiple signatures are supported.
- Signature validation should verify certificate chain trust.
- Header `uuid` should match payload vCon `uuid`.

### Encrypted Form (JWE)

Encrypted vCon uses JWE JSON Serialization where plaintext is the signed JWS form (see [Core §5.3](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

Core structure:

- `ciphertext`.
- `recipients`.
- JWE headers and cryptographic parameters.

Required practice:

- MUST sign-then-encrypt.
- Plaintext to JWE is the signed JWS object.

Header requirements and expectations:

- `alg`: key management algorithm.
- `enc`: content encryption algorithm.
- `uuid`: UUID for object correlation.
- `cty`: content type marker such as `vcon`.

Recipient model:

- Multiple recipients are supported.
- Each recipient entry carries keying material for that recipient.

### Algorithm Recommendations

Algorithm selection should favor interoperable modern JOSE and hash options (see [Core §5.2/§5.3](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

JWS recommendations:

- `ES256`
- `ES384`
- `RS256`

JWE recommendations:

- `ECDH-ES+A256KW` with `A256GCM`
- `RSA-OAEP` with `A256GCM`

`content_hash` recommendations:

- Minimum: `sha256`
- Preferred where possible: `sha384` or `sha512`

### Validation Checklist

Security validation should enforce form handling, cryptographic checks, and schema integrity in order (see [Core §5](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

1. Detect form from top-level keys.
2. If encrypted, decrypt with an authorized key.
3. If signed, verify all signatures and certificate material.
4. Validate header `uuid` alignment with payload UUID.
5. Validate underlying unsigned vCon schema and index references.
6. Verify every external content `content_hash` before use.
7. Treat verification failures as hard security failures.

## Extensions

Extensions add interoperable fields while preserving core schema behavior and critical handling requirements (see [Core §2.5](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

Extension mechanism summary:

- Top-level `extensions` object maps extension tokens to parameter objects.
- Extension tokens are registered in the IANA vCon Extension Names registry.
- `critical` lists extension tokens a consumer MUST understand.
- If unsupported `critical` tokens are present, the consumer MUST reject.
- Extension parameter names should use snake_case.

Extension-handling workflow:

1. Parse `extensions` and collect declared tokens.
2. Check `critical` for unsupported tokens.
3. Reject immediately if any unsupported critical token is present.
4. Process supported extension fields with snake_case naming.
5. Preserve unknown non-critical extension payloads when re-serializing.

### Contact Center (CC)

The CC extension adds contact-center semantics on party and dialog objects (see [CC §3.1/§3.2](https://www.ietf.org/archive/id/draft-ietf-vcon-cc-extension-01.txt)).

Token: `CC`

Scope:

- Party object.
- Dialog object.

Party fields:

| Field | Type | Description |
|-------|------|-------------|
| `role` | string | Party role such as `agent`, `customer`, `supervisor`, `bot`. |
| `contact_list` | string | Contact list identifier used by routing or CRM systems. |

Dialog fields:

| Field | Type | Description |
|-------|------|-------------|
| `campaign` | string | Campaign identifier. |
| `interaction_type` | string | Interaction class: `call`, `chat`, `email`, `sms`, `social`. |
| `interaction_id` | string | Interaction correlation ID. |
| `skill` | string | Skill or queue designation. |

### MIMI Messages

The MIMI profile adds messaging-specific fields across top-level, party, and dialog scopes (see [MIMI §3](https://www.ietf.org/archive/id/draft-mahy-vcon-mimi-messages-02.txt)).

Scope:

- Top-level.
- Party object.
- Dialog object.

Top-level addition:

- `room`: array of room objects with `room_id` and `room_uri`.

Party additions:

| Field | Type | Description |
|-------|------|-------------|
| `im_uri` | string | Messaging identity URI. |
| `thumbprint` | string | Key thumbprint for party identity binding. |
| `credential` | string or object | Optional messaging credential metadata. |

Dialog additions:

| Field | Type | Description |
|-------|------|-------------|
| `message_id` | string | Unique message identifier. |
| `salt` | string | Message salt value from messaging protocol. |
| `franking_tag` | string | Franking metadata tag where supported. |
| `tombstone` | object or type marker | Represents deleted or expired content. |

### Consent

Consent is modeled as a specialized attachment type rather than a standalone extension token (see [Consent §5/§19/§20](https://www.ietf.org/archive/id/draft-howe-vcon-consent-00.txt)).

Attachment indicator:

- `type: "consent"`.

Required consent fields:

| Field | Type | Required |
|-------|------|----------|
| `expiration` | RFC3339 string | Yes |
| `party` | integer | Yes |
| `dialog` | integer or array | Yes |
| `consents` | array<object> | Yes |

Consent object model:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Consent category or purpose type. |
| `status` | string | Current state (`granted`, `denied`, `revoked`). |
| `mechanism` | string | Mechanism used to capture consent. |

SCITT integration notes:

- Consent records can be anchored in a ledger for auditability.
- Revocations can be tracked as state transitions.

### Lifecycle

Lifecycle guidance defines governance phases and operational roles for vCon handling (see [Lifecycle §3/§5](https://www.ietf.org/archive/id/draft-howe-vcon-lifecycle-00.txt)).

Representative phases:

1. Created
2. Signed
3. Analyzed
4. Redacted
5. Archived
6. Deleted

Common roles:

- Originator
- Controller
- Processor
- Subject

SCITT role:

- Provides immutable audit trail for lifecycle operations.
- Supports cross-domain accountability.

### Extension Authoring

New extensions should be designed for interoperability, compatibility signaling, and clear registration metadata (see [Core §6.4](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

Authoring checklist:

1. Choose a unique extension token.
2. Define field names and exact object scopes.
3. Document compatibility and `critical` behavior.
4. Use snake_case parameter names.
5. Register extension details for interoperable processing.

## Privacy

Privacy handling in vCon should be implemented as concrete controls on fields, workflows, and access boundaries (see [Privacy §2.2/§3](https://www.ietf.org/archive/id/draft-ietf-vcon-privacy-primer-00.txt)).

### PII Categories

PII in vCon can be categorized directly by field location and sensitivity impact (see [Privacy §2.2](https://www.ietf.org/archive/id/draft-ietf-vcon-privacy-primer-00.txt)).

| Category | vCon Fields | Sensitivity |
|----------|-------------|-------------|
| Identity | `parties.name`, `parties.tel`, `parties.mailto` | High |
| Location | `parties.gmlpos`, `parties.timezone`, `parties.civic_address` | Medium-High |
| Communication content | `dialog.body`, `analysis.body` | Very High |
| Behavioral | analysis outputs (sentiment, intent, risk signals) | High |
| Metadata | `created_at`, `duration`, `subject` | Medium |

### Privacy Controls

vCon privacy controls map specific protocol features to enforceable handling boundaries (see [Privacy §3](https://www.ietf.org/archive/id/draft-ietf-vcon-privacy-primer-00.txt)).

Control mapping:

- Redaction control: `redacted` workflows support least-data sharing.
- Encryption control: JWE protects sensitive payloads in transit and at rest.
- Consent control: `type:"consent"` attachment records permissions.
- Audit control: lifecycle events with SCITT provide traceability.
- Access control: JWE recipients constrain decryption scope.

### Regulatory Mapping

Regulatory mapping should be used as a compact implementation orientation for vCon workflows (see [Privacy §2.2.2](https://www.ietf.org/archive/id/draft-ietf-vcon-privacy-primer-00.txt)).

| Regulation | vCon Requirement Focus |
|------------|------------------------|
| GDPR | Explicit consent capture, purpose-bounded processing, data-subject access/erasure support. |
| CCPA | Consumer access and deletion handling, opt-out aware processing paths. |
| HIPAA | PHI-scoped access control, retention discipline, auditable handling of protected dialog and attachments. |

### Implementation Checklist

Privacy implementation should include field review, consent enforcement, cryptographic protection, and auditing checks (see [Privacy §3](https://www.ietf.org/archive/id/draft-ietf-vcon-privacy-primer-00.txt)).

1. Identify PII across all vCon fields used in the workflow.
2. Apply data minimization to remove non-essential fields.
3. Record consent state using consent attachment structures.
4. Use signed form (JWS) for integrity and provenance.
5. Use encrypted form (JWE) for sensitive content.
6. Define and enforce retention and deletion policy.
7. Implement redaction flow for subject-request handling.
8. Log access and lifecycle operations for auditing.

Validation checks:

- Verify RFC3339 timestamps on consent and lifecycle records.
- Verify index integrity for consent references (`party`, `dialog`).
- Verify `content_hash` for externally referenced sensitive artifacts.
- Verify unsupported critical extensions trigger rejection.

## Implementation Gotchas

Implementation mistakes usually appear at schema boundaries, index handling, and security transitions (see [Core §7](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

- **Party indexing is zero-based**: dialog and analysis references use array position, not ID.
- **RFC3339 timestamps**: `created_at`, `updated_at`, `start`, and consent timestamps must include timezone or `Z`.
- **Version drift exists**: core-02 says `"0.0.1"`, while real-world data can include `"0.0.2"` and `"0.3.0"`.
- **Sign-then-encrypt order**: encrypted vCons should wrap signed payloads, not the reverse.
- **Dialog `parties` overloading**: support both integer and array forms.
- **Empty arrays vs absent**: optional arrays can be absent and should be treated as empty.
- **Unknown non-critical extensions**: preserve when possible; do not hard-fail.
- **Reference mutation risk**: editing party or dialog ordering after creation invalidates index-based links.
- **Content source trust**: URL location does not imply integrity without hash verification.

## Minimal Example

This example shows the minimum practical unsigned structure that validates basic schema expectations (see [Core §4](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt)).

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

When extending this minimal structure:

- Add `dialog` entries first to capture primary conversation payload.
- Add `analysis` entries after dialog references are stable.
- Add `attachments` for supplemental artifacts and consent records.
- Add security wrapping (JWS/JWE) only after unsigned validation succeeds.

## Authoritative Sources

These IETF drafts are the canonical source set for schema, security, extension, and privacy decisions (see [Overview §3](https://www.ietf.org/archive/id/draft-ietf-vcon-overview-00.txt)).

- [Core Spec](https://www.ietf.org/archive/id/draft-ietf-vcon-vcon-core-02.txt) - Primary JSON format specification.
- [Overview](https://www.ietf.org/archive/id/draft-ietf-vcon-overview-00.txt) - Use cases and architecture.
- [CC Extension](https://www.ietf.org/archive/id/draft-ietf-vcon-cc-extension-01.txt) - Contact center extension.
- [Privacy Primer](https://www.ietf.org/archive/id/draft-ietf-vcon-privacy-primer-00.txt) - Privacy framework.
- [Consent](https://www.ietf.org/archive/id/draft-howe-vcon-consent-00.txt) - Consent attachment.
- [Lifecycle](https://www.ietf.org/archive/id/draft-howe-vcon-lifecycle-00.txt) - Lifecycle management.
- [MIMI Messages](https://www.ietf.org/archive/id/draft-mahy-vcon-mimi-messages-02.txt) - Instant messaging extension.

Source usage guidance:

- Use the core spec first for schema and security behavior.
- Use extension drafts for extension-defined fields and semantics.
- Use privacy, consent, and lifecycle drafts for governance and operational controls.
