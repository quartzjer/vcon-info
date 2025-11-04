#!/usr/bin/env node
// Simple validation script to verify vCon fixes

import fs from 'fs';
import path from 'path';

const REQUIRED_FIELDS = ['vcon', 'uuid', 'created_at', 'parties'];

function validateVCon(filePath) {
  const results = {
    file: path.basename(filePath),
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const vcon = JSON.parse(content);

    // Check if vcon field is a string
    if (typeof vcon.vcon !== 'string') {
      results.errors.push(`vcon field must be a string, got ${typeof vcon.vcon}`);
      results.valid = false;
    }

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!vcon[field]) {
        results.errors.push(`Missing required field: ${field}`);
        results.valid = false;
      }
    }

    // Check for deprecated mimetype field
    const checkForMimetype = (obj, path = '') => {
      if (typeof obj !== 'object' || obj === null) return;

      for (const key in obj) {
        if (key === 'mimetype') {
          results.warnings.push(`Deprecated 'mimetype' field found at ${path}${key} (should use 'mediatype')`);
        }
        if (typeof obj[key] === 'object') {
          checkForMimetype(obj[key], `${path}${key}.`);
        }
      }
    };

    checkForMimetype(vcon);

    // Check for deprecated encoding value "base64"
    const checkForBase64Encoding = (obj, path = '') => {
      if (typeof obj !== 'object' || obj === null) return;

      for (const key in obj) {
        if (key === 'encoding' && obj[key] === 'base64') {
          results.warnings.push(`Deprecated 'base64' encoding at ${path}encoding (should use 'base64url')`);
        }
        if (typeof obj[key] === 'object') {
          checkForBase64Encoding(obj[key], `${path}${key}.`);
        }
      }
    };

    checkForBase64Encoding(vcon);

    // Check UUID format
    if (vcon.uuid) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(vcon.uuid)) {
        results.errors.push(`Invalid UUID format: ${vcon.uuid}`);
        results.valid = false;
      }
    }

    // Check created_at is valid date
    if (vcon.created_at) {
      const date = new Date(vcon.created_at);
      if (isNaN(date.getTime())) {
        results.errors.push(`Invalid created_at date: ${vcon.created_at}`);
        results.valid = false;
      }
    }

  } catch (error) {
    results.errors.push(`Failed to parse JSON: ${error.message}`);
    results.valid = false;
  }

  return results;
}

// Files to validate
const filesToValidate = [
  'docs/examples/ab.vcon',
  'docs/examples/simple-vcon.vcon',
  'docs/examples/basic-call.vcon',
  'docs/examples/fake-2025-04-02-d128f74e.vcon',
  'docs/examples/fake-2025-03-04-18c48041.vcon'
];

console.log('Validating fixed vCon files...\n');

let allValid = true;
const allResults = [];

for (const file of filesToValidate) {
  const fullPath = path.join(process.cwd(), file);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  ${file} - File not found`);
    allValid = false;
    continue;
  }

  const result = validateVCon(fullPath);
  allResults.push(result);

  if (result.valid && result.warnings.length === 0) {
    console.log(`✅ ${result.file} - Valid`);
  } else if (result.valid && result.warnings.length > 0) {
    console.log(`⚠️  ${result.file} - Valid with warnings:`);
    result.warnings.forEach(w => console.log(`   - ${w}`));
  } else {
    console.log(`❌ ${result.file} - Invalid:`);
    result.errors.forEach(e => console.log(`   - ${e}`));
    result.warnings.forEach(w => console.log(`   - ${w}`));
    allValid = false;
  }
}

console.log('\n' + '='.repeat(60));
if (allValid) {
  console.log('✅ All files validated successfully!');
  process.exit(0);
} else {
  console.log('❌ Some files have validation errors');
  process.exit(1);
}
