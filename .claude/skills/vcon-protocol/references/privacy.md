# vCon Privacy Framework

## Overview

vCon data often contains direct and indirect personally identifiable information (PII).
This includes party identity fields, content bodies, and derived analysis signals.
The privacy primer defines a practical framework for responsible handling.

This reference is implementation guidance, not legal advice.

Practical scope:

- How to classify sensitive vCon fields.
- How to reduce unnecessary exposure in processing flows.
- How to map vCon controls to common compliance requirements.

## PII Categories in vCon

| Category | vCon Fields | Sensitivity |
|----------|-------------|-------------|
| Identity | `parties.name`, `parties.tel`, `parties.mailto` | High |
| Location | `parties.gmlpos`, `parties.timezone`, `parties.civic_address` | Medium-High |
| Communication content | `dialog.body`, `analysis.body` | Very High |
| Behavioral | analysis outputs (sentiment, intent, risk signals) | High |
| Metadata | `created_at`, `duration`, `subject` | Medium |

Interpretation notes:

- Sensitivity increases when categories are combined.
- External content links can still carry sensitive data.
- Derived analysis may create new sensitive attributes.
- Metadata can become sensitive when correlated across sessions.

Typical high-risk combinations:

- `parties.tel` + `dialog.body`
- `parties.mailto` + `analysis.body`
- `created_at` + location fields + behavioral outputs

## Privacy Principles

Core privacy principles to apply in vCon handling:

- Data minimization: capture only fields needed for the use case.
- Purpose limitation: document why each data category is collected.
- Consent: record and enforce consent decisions.
- Retention limits: define retention windows and deletion behavior.
- Transparency: disclose handling and processing behavior.
- Security: use signed and encrypted forms where needed.

Operational interpretation:

- Prefer optional-field omission when data is not needed.
- Separate high-sensitivity flows from low-sensitivity flows.
- Apply redaction before external sharing.
- Use short-lived access tokens for external content links.
- Keep decrypted payload handling bounded to trusted runtime paths.
- Review processor logs for accidental sensitive-field leakage.

## Regulatory Mapping

| Requirement | GDPR | CCPA | HIPAA |
|-------------|------|------|-------|
| Consent | Explicit, specific | Opt-out rights | Authorization |
| Access rights | Data subject access | Consumer access | Patient access |
| Deletion | Right to erasure | Right to delete | Retention rules |
| Breach notification | 72 hours | Without unreasonable delay | 60 days |
| Scope | EU data subjects | CA consumers | PHI |

Mapping guidance:

- Treat this table as high-level orientation.
- Validate legal obligations with jurisdiction-specific counsel.
- Use vCon structures to support compliance evidence, not replace legal review.

Implementation mapping hints:

- GDPR-heavy workflows typically require explicit purpose tagging.
- CCPA workflows should emphasize deletion and opt-out handling.
- HIPAA-aligned workflows should isolate PHI-bearing dialog and attachments.

## vCon Privacy Controls

How core vCon features map to privacy requirements:

- Redaction control: `redacted` workflows support least-data sharing.
- Encryption control: JWE protects sensitive payloads in transit and at rest.
- Consent control: `type:"consent"` attachment records permissions.
- Audit control: lifecycle events with SCITT provide traceability.
- Access control: JWE recipients constrain decryption scope.

Implementation patterns:

1. Build redacted derivatives for external consumers.
2. Keep unredacted originals in tightly controlled domains.
3. Anchor consent and lifecycle state transitions for audit.

Control boundaries:

- Redaction boundary: before data crosses trust domains.
- Encryption boundary: at data creation and at external transfer.
- Consent boundary: before analysis or secondary processing.
- Audit boundary: on every share, revoke, and delete transition.

## Implementation Checklist

1. Identify PII across all vCon fields used in the workflow.
2. Apply data minimization to remove non-essential fields.
3. Record consent state using consent attachment structures.
4. Use signed form (JWS) for integrity and provenance.
5. Use encrypted form (JWE) for sensitive content.
6. Define and enforce retention and deletion policy.
7. Implement redaction flow for subject-request handling.
8. Log access and lifecycle operations for auditing.

Validation checks to pair with checklist steps:

- Verify RFC3339 timestamps on consent and lifecycle records.
- Verify index integrity for consent references (`party`, `dialog`).
- Verify `content_hash` for externally referenced sensitive artifacts.
- Verify unsupported critical extensions trigger rejection.

## Source Basis

Privacy guidance summarized from:

- `draft-ietf-vcon-privacy-primer-00`
- `draft-howe-vcon-consent-00`
- `draft-howe-vcon-lifecycle-00`
- `draft-ietf-vcon-vcon-core-02` (security and redaction mechanics)
