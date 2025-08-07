// vCon Info - Crypto Module
// Handles cryptographic operations, security status, and certificate management

/**
 * Update Security panel with crypto information
 */
function updateSecurityPanel(crypto) {
    // Update format indicator
    const formatElement = document.getElementById('security-format');
    const formatIndicator = document.getElementById('security-format-indicator');
    
    // Update signature status
    const signatureStatus = document.getElementById('security-signature-status');
    const signatureIndicator = document.getElementById('security-signature-indicator');
    const signatureDetails = document.getElementById('signature-details');
    
    // Update encryption status
    const encryptionStatus = document.getElementById('security-encryption-status');
    const encryptionIndicator = document.getElementById('security-encryption-indicator');
    const encryptionDetails = document.getElementById('encryption-details');
    
    // Check if elements exist (they might not be present in all test environments)
    if (!formatElement || !formatIndicator || !signatureStatus || !signatureIndicator || 
        !encryptionStatus || !encryptionIndicator) {
        console.warn('Security panel elements not found, skipping update');
        return;
    }
    
    if (!crypto) {
        formatElement.textContent = 'Unsigned';
        formatIndicator.innerHTML = '<img src="icons/20/solid/document.svg" alt="Document" width="20" height="20" class="icon-document">';
        signatureStatus.textContent = 'Not Signed';
        signatureIndicator.innerHTML = '<img src="icons/20/solid/x-circle.svg" alt="Not Signed" width="20" height="20" class="icon-error">';
        encryptionStatus.textContent = 'Not Encrypted';
        encryptionIndicator.innerHTML = '<img src="icons/20/solid/lock-open.svg" alt="Not Encrypted" width="20" height="20" class="icon-unlocked">';
        signatureDetails.style.display = 'none';
        encryptionDetails.style.display = 'none';
        return;
    }
    
    // Update format
    if (crypto.isEncrypted) {
        formatElement.textContent = crypto.format === 'jwe-json' ? 'JWE (JSON Serialization)' : 
                                   crypto.format === 'jwe-compact' ? 'JWE (Compact)' : 'Encrypted';
        formatIndicator.innerHTML = '<img src="icons/20/solid/lock-closed.svg" alt="Encrypted" width="20" height="20" class="icon-locked">';
        
        // Update encryption status
        encryptionStatus.textContent = crypto.compliance?.isGeneralJSONSerialization ? 
                                      'Encrypted (vCon Compliant)' : 
                                      crypto.compliance?.errors?.length > 0 ? 
                                      'Encrypted (Non-Compliant)' : 'Encrypted';
        encryptionIndicator.innerHTML = crypto.compliance?.isVConCompliant ? '<img src="icons/20/solid/check-circle.svg" alt="Valid" width="20" height="20" class="icon-validation-good">' : '<img src="icons/20/solid/exclamation-triangle.svg" alt="Warning" width="20" height="20" class="icon-validation-warning">';
        
        // Show encryption details
        if (encryptionDetails) {
            encryptionDetails.style.display = 'block';
            
            // Update basic encryption info
            if (crypto.jweHeader) {
                const algElement = document.getElementById('encryption-algorithm');
                const encElement = document.getElementById('encryption-encoding');
                const recipientsElement = document.getElementById('encryption-recipients');
                const uuidElement = document.getElementById('encryption-uuid');
                
                if (algElement) algElement.textContent = crypto.jweProtectedHeader?.alg || 'RSA-OAEP';
                if (encElement) encElement.textContent = crypto.jweHeader.enc || '-';
                if (uuidElement) uuidElement.textContent = crypto.jweHeader.uuid || '-';
                
                // Recipients info from jweData
                if (recipientsElement) {
                    if (crypto.jweData?.recipientCount) {
                        recipientsElement.textContent = `${crypto.jweData.recipientCount} recipient(s)`;
                    } else {
                        recipientsElement.textContent = '1 recipient';
                    }
                }
            }
            
            // Show decryption status if attempted
            const decryptionStatusElement = document.getElementById('decryption-status');
            if (decryptionStatusElement) {
                if (crypto.decrypted) {
                    decryptionStatusElement.innerHTML = '<img src="icons/16/solid/check-circle.svg" alt="Success" width="16" height="16" class="icon-inline icon-validation-good"> Decrypted Successfully';
                    decryptionStatusElement.className = 'decryption-status success';
                } else if (crypto.decryptionError) {
                    decryptionStatusElement.innerHTML = `<img src="icons/16/solid/x-circle.svg" alt="Error" width="16" height="16" class="icon-inline icon-validation-fail"> Decryption Failed: ${crypto.decryptionError}`;
                    decryptionStatusElement.className = 'decryption-status error';
                } else {
                    decryptionStatusElement.innerHTML = '<img src="icons/16/solid/lock-closed.svg" alt="Locked" width="16" height="16" class="icon-inline icon-locked"> Private key required for decryption';
                    decryptionStatusElement.className = 'decryption-status pending';
                }
            }
            
            // Show compliance info
            const complianceElement = document.getElementById('encryption-compliance');
            if (complianceElement && crypto.compliance) {
                const errors = crypto.compliance.errors || [];
                const warnings = crypto.compliance.warnings || [];
                
                if (errors.length === 0 && warnings.length === 0) {
                    complianceElement.innerHTML = '<img src="icons/16/solid/check-circle.svg" alt="Valid" width="16" height="16" class="icon-inline icon-validation-good"> vCon Compliant';
                    complianceElement.className = 'compliance-status success';
                } else if (errors.length > 0) {
                    complianceElement.innerHTML = `<img src="icons/16/solid/x-circle.svg" alt="Error" width="16" height="16" class="icon-inline icon-validation-fail"> ${errors.length} error(s), ${warnings.length} warning(s)`;
                    complianceElement.className = 'compliance-status error';
                    complianceElement.title = errors.concat(warnings).join('; ');
                } else {
                    complianceElement.innerHTML = `<img src="icons/16/solid/exclamation-triangle.svg" alt="Warning" width="16" height="16" class="icon-inline icon-validation-warning"> ${warnings.length} warning(s)`;
                    complianceElement.className = 'compliance-status warning';
                    complianceElement.title = warnings.join('; ');
                }
            }
        }
        
    } else if (crypto.isSigned) {
        formatElement.textContent = crypto.format === 'jws-json' ? 'JWS (JSON Serialization)' : 
                                   crypto.format === 'jws-compact' ? 'JWS (Compact)' : 'Signed';
        formatIndicator.innerHTML = '<img src="icons/20/solid/pencil-square.svg" alt="Signed" width="20" height="20" class="icon-signed">';
        
        // Update signature status
        const isCompliant = crypto.compliance?.isVConCompliant;
        const hasErrors = crypto.compliance?.errors?.length > 0;
        
        signatureStatus.textContent = isCompliant ? 'Signed (vCon Compliant)' :
                                     hasErrors ? 'Signed (Non-Compliant)' : 'Signed';
        signatureIndicator.innerHTML = isCompliant ? '<img src="icons/20/solid/check-circle.svg" alt="Valid" width="20" height="20" class="icon-validation-good">' : hasErrors ? '<img src="icons/20/solid/exclamation-triangle.svg" alt="Warning" width="20" height="20" class="icon-validation-warning">' : '<img src="icons/20/solid/shield-check.svg" alt="Signed" width="20" height="20" class="icon-shield">';
        
        // Show signature details
        signatureDetails.style.display = 'block';
        if (crypto.jwsHeader) {
            document.getElementById('signature-algorithm').textContent = crypto.jwsHeader.alg || '-';
            document.getElementById('signature-kid').textContent = crypto.jwsHeader.kid || '-';
            document.getElementById('signature-uuid').textContent = crypto.jwsHeader.uuid || 
                                                                   crypto.signatures?.[0]?.header?.uuid || '-';
            
            // Handle x5c (certificate chain)
            const x5c = crypto.signatures?.[0]?.header?.x5c || crypto.jwsHeader?.x5c;
            if (x5c && Array.isArray(x5c)) {
                document.getElementById('signature-x5c').textContent = `${x5c.length} certificate(s)`;
            } else {
                document.getElementById('signature-x5c').textContent = '-';
            }
            
            // Handle x5u (certificate URL)
            const x5u = crypto.signatures?.[0]?.header?.x5u || crypto.jwsHeader?.x5u;
            document.getElementById('signature-x5u').textContent = x5u || '-';
        }
        
        encryptionStatus.textContent = 'Not Encrypted';
        encryptionIndicator.innerHTML = '<img src="icons/20/solid/lock-open.svg" alt="Not Encrypted" width="20" height="20" class="icon-unlocked">';
        encryptionDetails.style.display = 'none';
        
    } else {
        formatElement.textContent = 'Unsigned';
        formatIndicator.innerHTML = '<img src="icons/20/solid/document.svg" alt="Document" width="20" height="20" class="icon-document">';
        signatureStatus.textContent = 'Not Signed';
        signatureIndicator.innerHTML = '<img src="icons/20/solid/x-circle.svg" alt="Not Signed" width="20" height="20" class="icon-error">';
        encryptionStatus.textContent = 'Not Encrypted';
        encryptionIndicator.innerHTML = '<img src="icons/20/solid/lock-open.svg" alt="Not Encrypted" width="20" height="20" class="icon-unlocked">';
        signatureDetails.style.display = 'none';
        encryptionDetails.style.display = 'none';
    }

    // Update certificate chain visualization
    updateCertificateChain(crypto);

    // Update integrity verification results
    updateIntegrityResults(crypto);

    // Update key validation status
    updateKeyValidationStatus(crypto);
}

/**
 * Update certificate chain visualization
 * @param {Object} crypto - Crypto information
 */
function updateCertificateChain(crypto) {
    const certificateChain = document.getElementById('certificate-chain');
    const certificateList = document.getElementById('certificate-list');
    
    if (!certificateChain || !certificateList) return;

    const x5c = crypto?.signatures?.[0]?.header?.x5c || crypto?.jwsHeader?.x5c;
    
    if (x5c && Array.isArray(x5c) && x5c.length > 0) {
        certificateChain.style.display = 'block';
        
        let html = '';
        x5c.forEach((cert, index) => {
            const certPreview = cert.substring(0, 40) + '...';
            html += `
                <div class="certificate-item">
                    <div class="certificate-header">
                        <span class="certificate-index">${index}</span>
                        <span class="certificate-type">${index === 0 ? 'End Entity' : 'CA'}</span>
                        <span class="certificate-status"><img src="icons/16/solid/magnifying-glass.svg" alt="Not Parsed" width="16" height="16" class="icon-inline"> Not Parsed</span>
                    </div>
                    <div class="certificate-preview">
                        <code>${certPreview}</code>
                    </div>
                </div>
            `;
        });
        
        certificateList.innerHTML = html;
        
        // Update signature verification status
        const verificationElement = document.getElementById('signature-verification-status');
        if (verificationElement) {
            verificationElement.textContent = 'Certificate chain available';
        }
    } else {
        certificateChain.style.display = 'none';
        const verificationElement = document.getElementById('signature-verification-status');
        if (verificationElement) {
            verificationElement.textContent = 'No certificate chain';
        }
    }
}

/**
 * Update integrity verification results 
 * @param {Object} crypto - Crypto information
 */
function updateIntegrityResults(crypto) {
    const integrityDetails = document.getElementById('integrity-details');
    const hashVerificationStatus = document.getElementById('hash-verification-status');
    const externalFilesCount = document.getElementById('external-files-count');
    const hashMismatches = document.getElementById('hash-mismatches');
    const hashDetails = document.getElementById('hash-details');
    
    if (!integrityDetails) return;

    // Check if we have content hash information in the vCon data
    // This would come from parsing dialog, attachments, analysis, etc.
    const hasExternalFiles = crypto?.externalFiles?.length > 0;
    const hashResults = crypto?.hashVerification || {};
    
    if (hasExternalFiles || Object.keys(hashResults).length > 0) {
        integrityDetails.style.display = 'block';
        
        // Update hash verification status
        if (hashVerificationStatus) {
            const totalFiles = crypto?.externalFiles?.length || 0;
            const verifiedFiles = Object.values(hashResults).filter(r => r.valid).length;
            const failedFiles = Object.values(hashResults).filter(r => r.error || !r.valid).length;
            
            if (totalFiles === 0) {
                hashVerificationStatus.textContent = 'No external files';
            } else if (failedFiles === 0) {
                hashVerificationStatus.innerHTML = `<img src="icons/16/solid/check-circle.svg" alt="Valid" width="16" height="16" class="icon-inline icon-validation-good"> ${verifiedFiles}/${totalFiles} verified`;
            } else {
                hashVerificationStatus.innerHTML = `<img src="icons/16/solid/exclamation-triangle.svg" alt="Warning" width="16" height="16" class="icon-inline icon-validation-warning"> ${failedFiles}/${totalFiles} failed`;
            }
        }
        
        // Update external files count
        if (externalFilesCount) {
            const totalFiles = crypto?.externalFiles?.length || 0;
            externalFilesCount.textContent = totalFiles === 0 ? 'None' : `${totalFiles} file(s)`;
        }
        
        // Update hash mismatches
        if (hashMismatches) {
            const failedFiles = Object.values(hashResults).filter(r => r.error || !r.valid).length;
            hashMismatches.textContent = failedFiles === 0 ? 'None' : `${failedFiles} mismatch(es)`;
        }
        
        // Update detailed hash results
        if (hashDetails && Object.keys(hashResults).length > 0) {
            let detailsHtml = '<h5>Hash Verification Details</h5>';
            Object.entries(hashResults).forEach(([url, result]) => {
                const status = result.valid ? '<img src="icons/16/solid/check-circle.svg" alt="Valid" width="16" height="16" class="icon-inline icon-validation-good"> Verified' : `<img src="icons/16/solid/x-circle.svg" alt="Error" width="16" height="16" class="icon-inline icon-validation-fail"> Failed: ${result.error || 'Hash mismatch'}`;
                detailsHtml += `
                    <div class="hash-result-item">
                        <div class="hash-url">${url}</div>
                        <div class="hash-status">${status}</div>
                        ${result.algorithm ? `<div class="hash-algorithm">Algorithm: ${result.algorithm}</div>` : ''}
                    </div>
                `;
            });
            hashDetails.innerHTML = detailsHtml;
        }
    } else {
        integrityDetails.style.display = 'none';
    }
}

/**
 * Update key validation status
 * @param {Object} crypto - Crypto information  
 */
function updateKeyValidationStatus(crypto) {
    const keyValidation = document.getElementById('key-validation');
    const publicKeyStatus = document.getElementById('public-key-status');
    const privateKeyStatus = document.getElementById('private-key-status');
    const keyFormat = document.getElementById('key-format');
    
    if (!keyValidation) return;

    // Get key status from DOM (from key panel)
    const publicKeyInput = document.getElementById('public-key');
    const privateKeyInput = document.getElementById('private-key');
    
    const hasPublicKey = publicKeyInput?.value.trim().length > 0;
    const hasPrivateKey = privateKeyInput?.value.trim().length > 0;
    
    if (hasPublicKey || hasPrivateKey || crypto?.needsKeys) {
        keyValidation.style.display = 'block';
        
        // Update public key status
        if (publicKeyStatus) {
            if (hasPublicKey) {
                // Try to determine key format
                const keyValue = publicKeyInput.value.trim();
                let format = 'Unknown';
                let status = '<img src="icons/16/solid/check-circle.svg" alt="Valid" width="16" height="16" class="icon-inline icon-validation-good"> Provided';
                
                if (keyValue.includes('-----BEGIN')) {
                    format = 'PEM';
                } else if (keyValue.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(keyValue);
                        if (parsed.kty) format = 'JWK';
                    } catch (e) {
                        status = '<img src="icons/16/solid/exclamation-triangle.svg" alt="Warning" width="16" height="16" class="icon-inline icon-validation-warning"> Invalid Format';
                    }
                }
                
                publicKeyStatus.innerHTML = status;
                if (keyFormat) keyFormat.textContent = format;
            } else {
                publicKeyStatus.innerHTML = crypto?.isSigned ? '<img src="icons/16/solid/exclamation-triangle.svg" alt="Warning" width="16" height="16" class="icon-inline icon-validation-warning"> Required for verification' : 'Not Required';
            }
        }
        
        // Update private key status  
        if (privateKeyStatus) {
            if (hasPrivateKey) {
                const keyValue = privateKeyInput.value.trim();
                let status = '<img src="icons/16/solid/check-circle.svg" alt="Valid" width="16" height="16" class="icon-inline icon-validation-good"> Provided';
                
                if (keyValue.includes('-----BEGIN')) {
                    // PEM format
                } else if (keyValue.startsWith('{')) {
                    try {
                        JSON.parse(keyValue);
                    } catch (e) {
                        status = '<img src="icons/16/solid/exclamation-triangle.svg" alt="Warning" width="16" height="16" class="icon-inline icon-validation-warning"> Invalid Format';
                    }
                }
                
                privateKeyStatus.innerHTML = status;
            } else {
                privateKeyStatus.innerHTML = crypto?.isEncrypted ? '<img src="icons/16/solid/exclamation-triangle.svg" alt="Warning" width="16" height="16" class="icon-inline icon-validation-warning"> Required for decryption' : 'Not Required';
            }
        }
    } else {
        keyValidation.style.display = 'none';
    }
}

/**
 * Determine security status from result
 */
function determineSecurityStatus(result) {
    // Check for JWS signatures
    if (result.metadata.signatures) {
        return { status: 'warning', message: 'Signatures present but not verified' };
    }
    // Check for encryption
    if (result.metadata.encrypted) {
        return { status: 'warning', message: 'Encrypted content detected' };
    }
    // Check for content hashes
    const hasContentHash = result.dialog.some(d => d.content && d.content.contentHash) ||
                          result.attachments.some(a => a.content && a.content.contentHash);
    if (hasContentHash) {
        return { status: 'good', message: 'Content hashes present for verification' };
    }
    return { status: 'good', message: 'No security features detected' };
}

// Export functions for use by other modules
window.Crypto = {
    updateSecurityPanel,
    updateCertificateChain,
    updateIntegrityResults,
    updateKeyValidationStatus,
    determineSecurityStatus
};