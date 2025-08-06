import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import puppeteer from 'puppeteer';

describe('vCon Validation Tests', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('Required Fields Validation', () => {
        it('should fail validation when missing vcon version', async () => {
            const vconWithoutVersion = {
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                const parsed = JSON.parse(JSON.stringify(vcon));
                return window.performDetailedValidation(parsed);
            }, vconWithoutVersion);

            expect(result.schema.status).toBe('fail');
            expect(result.schema.message).toContain('Missing required "vcon" version field');
        });

        it('should fail validation when missing uuid', async () => {
            const vconWithoutUuid = {
                vcon: '0.3.0',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithoutUuid);

            expect(result.required.status).toBe('fail');
            expect(result.required.message).toContain('uuid');
        });

        it('should fail validation when missing created_at', async () => {
            const vconWithoutCreatedAt = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithoutCreatedAt);

            expect(result.required.status).toBe('fail');
            expect(result.required.message).toContain('created_at');
        });

        it('should fail validation when missing parties', async () => {
            const vconWithoutParties = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z'
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithoutParties);

            expect(result.required.status).toBe('fail');
            expect(result.required.message).toContain('parties');
        });

        it('should pass validation with all required fields', async () => {
            const validVcon = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice', tel: '+1-555-1234' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, validVcon);

            expect(result.schema.status).toBe('good');
            expect(result.required.status).toBe('good');
        });
    });

    describe('vCon Version Validation', () => {
        it('should warn for non-standard vCon version', async () => {
            const vconWithDifferentVersion = {
                vcon: '0.2.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithDifferentVersion);

            expect(result.schema.status).toBe('warning');
            expect(result.schema.message).toContain('0.2.0');
            expect(result.warnings[0]).toContain('may not be fully supported');
        });

        it('should pass for standard vCon version 0.3.0', async () => {
            const vconWithStandardVersion = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithStandardVersion);

            expect(result.schema.status).toBe('good');
            expect(result.schema.message).toContain('Valid vCon v0.3.0');
        });
    });

    describe('Date Format Validation', () => {
        it('should fail validation with invalid created_at format', async () => {
            const vconWithBadDate = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15 10:00:00', // Missing T separator
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadDate);

            expect(result.errors).toContain('created_at must be in RFC3339 date format');
        });

        it('should fail validation with invalid updated_at format', async () => {
            const vconWithBadUpdatedAt = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: 'not-a-date',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadUpdatedAt);

            expect(result.errors).toContain('updated_at must be in RFC3339 date format');
        });

        it('should pass validation with valid RFC3339 dates', async () => {
            const vconWithGoodDates = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00.123Z',
                updated_at: '2024-01-15T11:00:00+01:00',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithGoodDates);

            expect(result.errors).toHaveLength(0);
        });
    });

    describe('UUID Format Validation', () => {
        it('should warn on invalid UUID format', async () => {
            const vconWithBadUuid = {
                vcon: '0.3.0',
                uuid: 'not-a-valid-uuid',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadUuid);

            expect(result.warnings).toContain('UUID should be a valid UUID format');
        });

        it('should pass with valid UUID format', async () => {
            const vconWithGoodUuid = {
                vcon: '0.3.0',
                uuid: '550e8400-e29b-41d4-a716-446655440000',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithGoodUuid);

            const uuidWarnings = result.warnings.filter(w => w.includes('UUID'));
            expect(uuidWarnings).toHaveLength(0);
        });

        it('should pass with vCon spec Version 8 UUID', async () => {
            const vconWithV8Uuid = {
                vcon: '0.3.0',
                uuid: '01928e10-193e-8231-b9a2-279e0d16bc46', // Version 8 UUID from spec
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithV8Uuid);

            const uuidWarnings = result.warnings.filter(w => w.includes('UUID'));
            expect(uuidWarnings).toHaveLength(0);
        });

        it('should fail with invalid UUID version', async () => {
            const vconWithBadVersionUuid = {
                vcon: '0.3.0',
                uuid: '550e8400-e29b-c1d4-a716-446655440000', // Version C (invalid)
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadVersionUuid);

            const uuidWarnings = result.warnings.filter(w => w.includes('UUID'));
            expect(uuidWarnings.length).toBeGreaterThan(0);
            expect(result.warnings).toContain('UUID should be a valid UUID format');
        });
    });

    describe('Party Validation', () => {
        it('should warn when party has no identifying information', async () => {
            const vconWithEmptyParty = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{}] // No identifying fields
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithEmptyParty);

            expect(result.warnings[0]).toContain('Party 0 has no identifying information');
        });

        it('should warn when parties array is empty', async () => {
            const vconWithEmptyParties = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: []
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithEmptyParties);

            expect(result.warnings[0]).toContain('parties array should not be empty');
        });

        it('should error when parties is not an array', async () => {
            const vconWithBadParties = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: 'not-an-array'
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadParties);

            expect(result.errors).toContain('parties must be an array');
        });

        it('should warn for invalid tel URL format', async () => {
            const vconWithBadTel = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ tel: 'invalid@tel' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadTel);

            expect(result.warnings[0]).toContain('Invalid tel URL format');
        });

        it('should warn for invalid email format', async () => {
            const vconWithBadEmail = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ mailto: 'not-an-email' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadEmail);

            expect(result.warnings[0]).toContain('Invalid email format');
        });

        it('should warn when name is provided without validation', async () => {
            const vconWithNameNoValidation = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithNameNoValidation);

            expect(result.warnings[0]).toContain('validation SHOULD be provided when name is present');
        });

        it('should error for invalid party UUID', async () => {
            const vconWithBadPartyUuid = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ uuid: 'invalid-uuid' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadPartyUuid);

            expect(result.errors).toContain('Party 0: Invalid UUID format');
        });

        it('should warn for invalid gmlpos format', async () => {
            const vconWithBadGmlpos = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice', gmlpos: 'not-coordinates' }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadGmlpos);

            expect(result.warnings[1]).toContain('Invalid gmlpos format');
        });

        it('should pass with valid party fields', async () => {
            const vconWithGoodParty = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{
                    name: 'Alice',
                    validation: 'verified',
                    tel: 'tel:+1-555-1234',
                    mailto: 'alice@example.com',
                    uuid: '550e8400-e29b-41d4-a716-446655440000',
                    gmlpos: '40.7128 -74.0060'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithGoodParty);

            expect(result.required.status).toBe('good');
            const partyWarnings = result.warnings.filter(w => w.includes('Party'));
            expect(partyWarnings).toHaveLength(0);
        });
    });

    describe('Mutually Exclusive Fields', () => {
        it('should fail when both redacted and appended are present', async () => {
            const vconWithConflict = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                redacted: { uuid: 'original-uuid' },
                appended: { uuid: 'another-uuid' }
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithConflict);

            expect(result.errors).toContain('redacted, appended parameters are mutually exclusive and cannot all have values');
        });

        it('should fail when all three exclusive fields are present', async () => {
            const vconWithAllExclusive = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                redacted: { uuid: 'uuid1' },
                appended: { uuid: 'uuid2' },
                group: ['uuid3']
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithAllExclusive);

            expect(result.errors).toContain('redacted, appended, group parameters are mutually exclusive and cannot all have values');
        });

        it('should pass with only one exclusive field', async () => {
            const vconWithRedacted = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                redacted: { uuid: 'original-uuid' }
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithRedacted);

            const exclusiveErrors = result.errors.filter(e => e.includes('mutually exclusive'));
            expect(exclusiveErrors).toHaveLength(0);
        });

        it('should warn when multiple empty exclusive fields are present', async () => {
            const vconWithEmptyFields = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                redacted: {},
                group: []
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithEmptyFields);

            const exclusiveWarnings = result.warnings.filter(w => w.includes('mutually exclusive'));
            expect(exclusiveWarnings).toHaveLength(1);
            expect(result.warnings).toContain('redacted, group parameters are present but empty - these are mutually exclusive fields');
        });

        it('should pass with only empty exclusive fields individually', async () => {
            const vconWithEmptyRedacted = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                redacted: {}
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithEmptyRedacted);

            const exclusiveErrors = result.errors.filter(e => e.includes('mutually exclusive'));
            const exclusiveWarnings = result.warnings.filter(w => w.includes('mutually exclusive'));
            expect(exclusiveErrors).toHaveLength(0);
            expect(exclusiveWarnings).toHaveLength(0);
        });
    });

    describe('Dialog Validation', () => {
        it('should error when dialog is not an array', async () => {
            const vconWithBadDialog = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: 'not-an-array'
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadDialog);

            expect(result.errors).toContain('dialog must be an array');
        });

        it('should validate dialog required fields', async () => {
            const vconWithIncompleteDialog = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }, { name: 'Bob' }],
                dialog: [{
                    // Missing type and start
                    parties: [0, 1]
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithIncompleteDialog);

            expect(result.errors).toContain("Dialog 0: Missing required 'type' field");
            expect(result.errors).toContain("Dialog 0: Missing required 'start' field");
        });

        it('should validate dialog type values', async () => {
            const vconWithBadDialogType = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'invalid-type',
                    start: '2024-01-15T10:00:00Z',
                    parties: [0]
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadDialogType);

            expect(result.errors).toContain("Dialog 0: Invalid type 'invalid-type' (must be one of: recording, text, transfer, incomplete)");
        });

        it('should validate dialog party indices', async () => {
            const vconWithBadPartyIndex = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }], // Only 1 party (index 0)
                dialog: [{
                    type: 'text',
                    start: '2024-01-15T10:00:00Z',
                    parties: [0, 1] // Index 1 doesn't exist
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadPartyIndex);

            expect(result.errors).toContain('Dialog 0: Party index 1 exceeds parties array length');
        });

        it('should validate dialog party array format', async () => {
            const vconWithBadPartyArray = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'text',
                    start: '2024-01-15T10:00:00Z',
                    parties: 'not-an-array'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadPartyArray);

            expect(result.errors).toContain("Dialog 0: 'parties' must be an array");
        });

        it('should warn for empty dialog parties array', async () => {
            const vconWithEmptyDialogParties = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'text',
                    start: '2024-01-15T10:00:00Z',
                    parties: []
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithEmptyDialogParties);

            expect(result.warnings).toContain("Dialog 0: 'parties' array should not be empty");
        });

        it('should validate dialog start date format', async () => {
            const vconWithBadDialogStart = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'text',
                    start: 'not-a-date',
                    parties: [0]
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadDialogStart);

            expect(result.errors).toContain("Dialog 0: 'start' must be RFC3339 date format");
        });

        it('should validate dialog duration is positive number', async () => {
            const vconWithBadDuration = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'text',
                    start: '2024-01-15T10:00:00Z',
                    parties: [0],
                    duration: -10
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadDuration);

            expect(result.errors).toContain("Dialog 0: 'duration' must be a positive number");
        });

        it('should warn when dialog lacks content', async () => {
            const vconWithNoContent = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'text',
                    start: '2024-01-15T10:00:00Z',
                    parties: [0]
                    // No body/encoding or url/content_hash
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithNoContent);

            expect(result.warnings).toContain('Dialog 0: Should contain either inline (body/encoding) or external (url/content_hash) content');
        });

        it('should validate incomplete dialog disposition', async () => {
            const vconWithIncompleteDialog = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'incomplete',
                    start: '2024-01-15T10:00:00Z',
                    parties: [0]
                    // Missing required disposition
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithIncompleteDialog);

            expect(result.errors).toContain("Dialog 0: 'disposition' is required for incomplete type");
        });

        it('should validate incomplete dialog disposition values', async () => {
            const vconWithBadDisposition = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'incomplete',
                    start: '2024-01-15T10:00:00Z',
                    parties: [0],
                    disposition: 'invalid-disposition'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadDisposition);

            expect(result.errors).toContain("Dialog 0: Invalid disposition 'invalid-disposition'");
        });

        it('should warn for non-standard media type', async () => {
            const vconWithOddMediaType = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'text',
                    start: '2024-01-15T10:00:00Z',
                    parties: [0],
                    mediatype: 'custom/type',
                    body: 'content',
                    encoding: 'none'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithOddMediaType);

            expect(result.warnings).toContain("Dialog 0: Non-standard media type 'custom/type'");
        });

        it('should pass with valid dialog', async () => {
            const vconWithGoodDialog = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }, { name: 'Bob' }],
                dialog: [{
                    type: 'text',
                    start: '2024-01-15T10:00:00Z',
                    duration: 300,
                    parties: [0, 1],
                    body: 'Hello Bob',
                    encoding: 'none',
                    mediatype: 'text/plain'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithGoodDialog);

            const dialogErrors = result.errors.filter(e => e.includes('Dialog'));
            expect(dialogErrors).toHaveLength(0);
        });
    });

    describe('Analysis Validation', () => {
        it('should error when analysis is not an array', async () => {
            const vconWithBadAnalysis = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                analysis: 'not-an-array'
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadAnalysis);

            expect(result.errors).toContain('analysis must be an array');
        });

        it('should validate analysis required type field', async () => {
            const vconWithAnalysisNoType = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                analysis: [{
                    // Missing type
                    body: 'analysis content',
                    encoding: 'none'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithAnalysisNoType);

            expect(result.errors).toContain("Analysis 0: Missing required 'type' field");
        });

        it('should validate analysis dialog references', async () => {
            const vconWithBadDialogRef = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                analysis: [{
                    type: 'sentiment',
                    dialog: 'not-an-array'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadDialogRef);

            expect(result.errors).toContain("Analysis 0: 'dialog' must be an array");
        });

        it('should validate analysis dialog indices', async () => {
            const vconWithInvalidDialogIndex = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                analysis: [{
                    type: 'sentiment',
                    dialog: [-1, 'invalid']
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithInvalidDialogIndex);

            expect(result.errors).toContain('Analysis 0: Invalid dialog index at position 0');
        });

        it('should warn when analysis lacks content', async () => {
            const vconWithNoContent = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                analysis: [{
                    type: 'sentiment'
                    // No body/encoding or url/content_hash
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithNoContent);

            expect(result.warnings).toContain('Analysis 0: Should contain either inline (body/encoding) or external (url/content_hash) content');
        });

        it('should warn for non-standard media type', async () => {
            const vconWithOddMediaType = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                analysis: [{
                    type: 'sentiment',
                    mediatype: 'custom/analysis',
                    body: 'analysis',
                    encoding: 'none'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithOddMediaType);

            expect(result.warnings).toContain("Analysis 0: Non-standard media type 'custom/analysis'");
        });

        it('should pass with valid analysis', async () => {
            const vconWithGoodAnalysis = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'text',
                    start: '2024-01-15T10:00:00Z',
                    parties: [0],
                    body: 'Hello',
                    encoding: 'none'
                }],
                analysis: [{
                    type: 'sentiment',
                    dialog: [0],
                    body: JSON.stringify({ sentiment: 'positive' }),
                    encoding: 'none',
                    mediatype: 'application/json'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithGoodAnalysis);

            const analysisErrors = result.errors.filter(e => e.includes('Analysis'));
            expect(analysisErrors).toHaveLength(0);
        });
    });

    describe('Attachment Validation', () => {
        it('should error when attachments is not an array', async () => {
            const vconWithBadAttachments = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                attachments: 'not-an-array'
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadAttachments);

            expect(result.errors).toContain('attachments must be an array');
        });

        it('should warn when attachment lacks type or purpose', async () => {
            const vconWithNoTypeOrPurpose = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                attachments: [{
                    body: 'attachment',
                    encoding: 'none'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithNoTypeOrPurpose);

            expect(result.warnings).toContain("Attachment 0: Should have 'type' or 'purpose' field");
        });

        it('should validate attachment start date format', async () => {
            const vconWithBadStartDate = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                attachments: [{
                    type: 'document',
                    start: 'invalid-date'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadStartDate);

            expect(result.errors).toContain("Attachment 0: 'start' must be RFC3339 date format");
        });

        it('should validate attachment party reference', async () => {
            const vconWithBadPartyRef = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                attachments: [{
                    type: 'document',
                    party: -1
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadPartyRef);

            expect(result.errors).toContain('Attachment 0: Invalid party index');
        });

        it('should validate attachment dialog reference', async () => {
            const vconWithBadDialogRef = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                attachments: [{
                    type: 'document',
                    dialog: 'not-a-number'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadDialogRef);

            expect(result.errors).toContain('Attachment 0: Invalid dialog index');
        });

        it('should warn when attachment lacks content', async () => {
            const vconWithNoContent = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                attachments: [{
                    type: 'document'
                    // No body/encoding or url/content_hash
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithNoContent);

            expect(result.warnings).toContain('Attachment 0: Should contain either inline (body/encoding) or external (url/content_hash) content');
        });

        it('should warn for non-standard media type', async () => {
            const vconWithOddMediaType = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                attachments: [{
                    type: 'document',
                    mediatype: 'custom/document',
                    body: 'document',
                    encoding: 'none'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithOddMediaType);

            expect(result.warnings).toContain("Attachment 0: Non-standard media type 'custom/document'");
        });

        it('should pass with valid attachment', async () => {
            const vconWithGoodAttachment = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                dialog: [{
                    type: 'text',
                    start: '2024-01-15T10:00:00Z',
                    parties: [0],
                    body: 'Hello',
                    encoding: 'none'
                }],
                attachments: [{
                    type: 'document',
                    purpose: 'contract',
                    start: '2024-01-15T10:00:00Z',
                    party: 0,
                    dialog: 0,
                    body: 'Contract text',
                    encoding: 'none',
                    mediatype: 'text/plain'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithGoodAttachment);

            const attachmentErrors = result.errors.filter(e => e.includes('Attachment'));
            expect(attachmentErrors).toHaveLength(0);
        });
    });

    describe('Extensions and Must Support Validation', () => {
        it('should error when extensions is not an array', async () => {
            const vconWithBadExtensions = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                extensions: 'not-an-array'
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadExtensions);

            expect(result.errors).toContain('extensions must be an array of strings');
        });

        it('should error when must_support is not an array', async () => {
            const vconWithBadMustSupport = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                must_support: 'not-an-array'
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithBadMustSupport);

            expect(result.errors).toContain('must_support must be an array of strings');
        });

        it('should pass with valid extensions and must_support', async () => {
            const vconWithExtensions = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }],
                extensions: ['x-custom-field'],
                must_support: ['analysis']
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithExtensions);

            expect(result.overallStatus).not.toBe('fail');
        });
    });

    describe('Overall Validation Status', () => {
        it('should set overall status to fail when errors exist', async () => {
            const vconWithErrors = {
                // Missing required fields
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b'
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithErrors);

            expect(result.overallStatus).toBe('fail');
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should set overall status to warning when only warnings exist', async () => {
            const vconWithWarnings = {
                vcon: '0.2.0', // Non-standard version
                uuid: 'not-a-valid-uuid', // Invalid format
                created_at: '2024-01-15T10:00:00Z',
                parties: [{ name: 'Alice' }] // No validation field
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, vconWithWarnings);

            expect(result.overallStatus).toBe('warning');
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('should set overall status to good when no issues', async () => {
            const perfectVcon = {
                vcon: '0.3.0',
                uuid: '018b5b10-d10a-8fec-8397-32de65a0c48b',
                created_at: '2024-01-15T10:00:00Z',
                parties: [{
                    name: 'Alice',
                    validation: 'verified',
                    tel: 'tel:+1-555-1234'
                }]
            };

            const result = await page.evaluate((vcon) => {
                return window.performDetailedValidation(vcon);
            }, perfectVcon);

            expect(result.overallStatus).toBe('good');
            expect(result.errors).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });
    });
});
