# vCon Extensions

## Extension Mechanism

vCon extension behavior is controlled through top-level extension metadata.

Core mechanics:

- `extensions` maps extension tokens to extension-defined parameter objects.
- Extension tokens are registered in the IANA vCon Extension Names registry.
- `critical` is an array of extension tokens that consumers MUST understand.
- If a consumer does not support a listed `critical` token, it MUST reject the vCon.
- Extension parameter names should use `snake_case`.

Implementation guidance:

1. Parse top-level `extensions` first.
2. Resolve supported extension handlers by token.
3. Enforce `critical` before semantic processing.
4. Ignore non-critical unknown extension tokens.

## Contact Center Extension (CC)

Token: `CC`

Scope:

- Party object
- Dialog object

Party fields added:

| Field | Type | Description |
|-------|------|-------------|
| `role` | string | Party role such as `agent`, `customer`, `supervisor`, `bot`. |
| `contact_list` | string | Contact list identifier used by routing or CRM systems. |

Dialog fields added:

| Field | Type | Description |
|-------|------|-------------|
| `campaign` | string | Campaign identifier. |
| `interaction_type` | string | Interaction class: `call`, `chat`, `email`, `sms`, `social`. |
| `interaction_id` | string | Interaction correlation ID. |
| `skill` | string | Skill or queue designation. |

Use cases:

- Contact center interoperability
- Routing and performance analysis
- CRM correlation and segmentation

## MIMI Messages Extension

Scope:

- Top-level
- Party object
- Dialog object

Top-level addition:

- `room` top-level array of room objects (`room_id`, `room_uri`)

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

Use cases:

- Interop with instant messaging records
- Room-level thread mapping
- Message lifecycle tracking and retract semantics

## Consent Attachment

Consent is modeled as a specialized attachment type,
not as a standalone extension token.

Attachment indicator:

- `type: "consent"`

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
| `status` | string | Current state (granted, denied, revoked). |
| `mechanism` | string | Mechanism used to capture consent. |

SCITT integration:

- Consent records can be anchored in a ledger for auditability.
- Revocations can be tracked as state transitions.

## Lifecycle Management

Lifecycle guidance is governance-oriented,
not a JSON schema extension.

Representative phases:

1. Created
2. Signed
3. Analyzed
4. Redacted
5. Archived
6. Deleted

SCITT role:

- Provides immutable audit trail for lifecycle operations.
- Supports cross-domain accountability.

Common roles:

- Originator
- Controller
- Processor
- Subject

## IANA Registry

vCon extension names are registered in the IANA vCon Extension Names registry.

When defining new extensions:

1. Choose a unique token.
2. Define fields and object scopes.
3. Document compatibility and `critical` behavior.
4. Use snake_case for parameter names.
5. Provide registration information for interoperability.

## Source Basis

Extension details summarized from:

- `draft-ietf-vcon-vcon-core-02` (extension framework and critical behavior)
- `draft-ietf-vcon-cc-extension-01` (CC fields)
- `draft-mahy-vcon-mimi-messages-02` (MIMI-specific additions)
- `draft-howe-vcon-consent-00` (consent attachment model)
- `draft-howe-vcon-lifecycle-00` (lifecycle governance model)
