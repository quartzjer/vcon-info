# vCon Security Model

## Overview

vCon supports three security forms with increasing protection:

1. Unsigned
2. Signed
3. Encrypted

The encrypted form has a strict operation order:

- First create signed content (JWS)
- Then encrypt that signed content (JWE)

This sign-then-encrypt order preserves long-term integrity while adding confidentiality.

## Detecting the Form

Use top-level shape to detect form:

- Unsigned: object with `vcon` field
- Signed: object with `payload` and `signatures`
- Encrypted: object with `ciphertext` and `recipients`

Detection must happen before validation logic,
since required fields and handling differ by form.

## Unsigned Form

Unsigned vCon is plain JSON.

Use cases:

- Internal trusted processing
- Mutable workflow stages
- Development and testing

Properties:

- Easy to read and transform
- No cryptographic integrity guarantee
- No confidentiality guarantee

## Signed Form (JWS)

Signed vCon uses JWS JSON Serialization (RFC 7515).

Core structure:

- `payload`: base64url-encoded unsigned vCon JSON
- `signatures`: one or more signature entries

Header requirements and expectations:

- `alg`: signing algorithm
- `x5c` or `x5u`: certificate chain or certificate URL
- `uuid`: UUID for object correlation
- `cty`: content type marker such as `vcon`

Operational notes:

- Multiple signatures are supported.
- Signature validation should verify certificate chain trust.
- Header `uuid` should match payload vCon UUID.

Security outcomes:

- Integrity protection
- Provenance traceability
- Tamper detection

## Encrypted Form (JWE)

Encrypted vCon uses JWE JSON Serialization (RFC 7516).

Core structure:

- `ciphertext`
- `recipients`
- JWE headers and cryptographic parameters

Required practice:

- MUST sign-then-encrypt
- Plaintext to JWE is the signed JWS object

Header requirements and expectations:

- `alg`: key management algorithm
- `enc`: content encryption algorithm
- `uuid`: UUID for object correlation
- `cty`: content type marker such as `vcon`

Recipient model:

- Multiple recipients are supported.
- Each recipient entry carries keying material for that recipient.

Security outcomes:

- Confidentiality
- Integrity through authenticated encryption
- Provenance retained through embedded signed payload

## content_hash Verification

External content integrity uses `content_hash`.

Format:

- `algorithm-base64url_digest`

Algorithm tokens:

- `sha256`
- `sha384`
- `sha512`

Verification flow:

1. Resolve `url` over HTTPS
2. Download raw bytes
3. Hash bytes with declared algorithm
4. Base64url-encode digest
5. Compare computed value to digest portion in `content_hash`

Failure handling:

- Any mismatch means content integrity failure.
- Consumers should reject or quarantine failed external content.

## Algorithm Recommendations

### JWS recommendations

- `ES256`
- `ES384`
- `RS256`

### JWE recommendations

- `ECDH-ES+A256KW` with `A256GCM`
- `RSA-OAEP` with `A256GCM`

### content_hash recommendations

- Minimum: `sha256`
- Preferred where possible: `sha384` or `sha512`

## Practical Validation Checklist

1. Detect form from top-level keys.
2. If signed, verify all signatures and certificate material.
3. If encrypted, decrypt with authorized key, then verify nested JWS.
4. Validate header `uuid` alignment with payload UUID.
5. For external content, verify every `content_hash` before use.
6. Treat verification failures as hard security failures.

## Source Basis

Security model summarized from:

- `draft-ietf-vcon-vcon-core-02` security sections (`5.2` to `5.4`)
- Related JOSE standards RFC 7515 (JWS) and RFC 7516 (JWE)
