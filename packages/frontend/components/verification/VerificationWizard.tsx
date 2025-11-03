/**
 * VerificationWizard Component
 * 
 * Multi-step wizard for identity verification
 * Supports both Holonym (ZK proof) and Manual verification
 * 
 * Steps:
 * 1. Welcome & Privacy Notice
 * 2. Choose Verification Method
 * 3. Document Upload / ZK Proof Generation
 * 4. Review & Submit
 * 5. Awaiting Verification
 * 6. Success / Error
 * 
 * @example
 * ```tsx
 * <VerificationWizard
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => router.push('/dashboard')}
 * />
 * ```
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Modal, Button, Card } from '@/components/ui';
import { FileUpload } from '@/components/forms';
import { getHolonymClient, HolonymVerificationParams } from '@/lib/holonym';
import { useVerification, VerificationLevel } from '@/hooks/useVerification';

interface VerificationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMethod?: 'holonym' | 'manual';
}

type WizardStep = 
  | 'welcome'
  | 'choose-method'
  | 'holonym-verify'
  | 'manual-upload'
  | 'processing'
  | 'success'
  | 'error';

export function VerificationWizard({
  isOpen,
  onClose,
  onSuccess,
  defaultMethod = 'holonym',
}: VerificationWizardProps) {
  const { address } = useAccount();
  const { refreshStatus } = useVerification();
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [verificationMethod, setVerificationMethod] = useState<'holonym' | 'manual'>(defaultMethod);
  const [documents, setDocuments] = useState<{
    idDocument: File | null;
    addressProof: File | null;
    selfie: File | null;
  }>({
    idDocument: null,
    addressProof: null,
    selfie: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationHash, setVerificationHash] = useState<string>('');

  const holonymClient = getHolonymClient();

  // Handle Holonym verification
  const handleHolonymVerification = useCallback(async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    setError(null);

    try {
      // 1. Start Holonym verification session
      const params: HolonymVerificationParams = {
        userAddress: address,
        requirements: {
          ageOver18: true,
          documentTypes: ['passport', 'drivers-license', 'national-id'],
        },
      };

      const sessionId = await holonymClient.startVerification(params);

      // 2. Generate ZK proof (user uploads documents in Holonym UI)
      const proof = await holonymClient.generateProof(sessionId);

      // 3. Verify proof on-chain
      const result = await holonymClient.verifyProof(proof, address);

      if (result.success && result.verificationHash) {
        setVerificationHash(result.verificationHash);
        setCurrentStep('success');
        
        // Refresh verification status
        await refreshStatus();
        
        // Call success callback after short delay
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Holonym verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, [address, holonymClient, refreshStatus, onSuccess]);

  // Handle manual verification
  const handleManualVerification = useCallback(async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!documents.idDocument || !documents.selfie) {
      setError('Please upload required documents');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    setError(null);

    try {
      // 1. Upload documents to secure storage (backend API)
      const formData = new FormData();
      formData.append('address', address);
      formData.append('idDocument', documents.idDocument);
      if (documents.addressProof) {
        formData.append('addressProof', documents.addressProof);
      }
      formData.append('selfie', documents.selfie);

      const response = await fetch('/api/verification/manual', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit documents');
      }

      const data = await response.json();
      setVerificationHash(data.verificationId);
      setCurrentStep('success');
      
      // Note: Manual verification requires admin review
      // User will receive notification when approved
    } catch (err) {
      console.error('Manual verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit documents');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, [address, documents]);

  // Reset wizard
  const handleReset = useCallback(() => {
    setCurrentStep('welcome');
    setVerificationMethod('holonym');
    setDocuments({ idDocument: null, addressProof: null, selfie: null });
    setError(null);
    setVerificationHash('');
  }, []);

  // Close and reset
  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verify Your Identity
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Complete identity verification to access lending and borrowing features on TrustCircle
              </p>
            </div>

            {/* Privacy Notice */}
            <Card padding="lg" className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Your Privacy is Protected
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Zero-knowledge proofs keep your data private</li>
                    <li>• Documents are never stored on blockchain</li>
                    <li>• Only verification status is recorded on-chain</li>
                    <li>• GDPR compliant - you control your data</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* What's Required */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                What You'll Need:
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Government-issued ID (passport, driver's license, or national ID)
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Clear photo of yourself (selfie)
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Proof of address (optional, for Trusted level)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleClose} fullWidth>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setCurrentStep('choose-method')}
                fullWidth
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 'choose-method':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Choose Verification Method
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select how you'd like to verify your identity
              </p>
            </div>

            {/* Holonym Option */}
            <Card
              padding="lg"
              hover
              onClick={() => {
                setVerificationMethod('holonym');
                setCurrentStep('holonym-verify');
              }}
              className={`cursor-pointer border-2 transition-all ${
                verificationMethod === 'holonym'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Holonym (Recommended)
                    </h4>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-full">
                      Private
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Zero-knowledge proof verification. Your data stays private and is never stored centrally.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>✓ 5-30 minutes</span>
                    <span>✓ ~$2 fee</span>
                    <span>✓ Maximum privacy</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Manual Option */}
            <Card
              padding="lg"
              hover
              onClick={() => {
                setVerificationMethod('manual');
                setCurrentStep('manual-upload');
              }}
              className={`cursor-pointer border-2 transition-all ${
                verificationMethod === 'manual'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Manual Verification
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Upload documents for manual review by our team. Documents encrypted and securely stored.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>✓ 1-24 hours</span>
                    <span>✓ Free</span>
                    <span>✓ All countries</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Back Button */}
            <Button variant="ghost" onClick={() => setCurrentStep('welcome')} fullWidth>
              ← Back
            </Button>
          </div>
        );

      case 'holonym-verify':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Holonym Verification
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete verification using zero-knowledge proofs
              </p>
            </div>

            {/* Instructions */}
            <Card padding="lg" className="bg-gray-50 dark:bg-gray-800/50">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                How it works:
              </h4>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-semibold">
                    1
                  </span>
                  <span>You'll be redirected to Holonym's secure verification portal</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-semibold">
                    2
                  </span>
                  <span>Upload your government ID and take a selfie</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-semibold">
                    3
                  </span>
                  <span>Holonym generates a zero-knowledge proof of your identity</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-semibold">
                    4
                  </span>
                  <span>Proof is verified on-chain and Verification SBT is minted</span>
                </li>
              </ol>
            </Card>

            {/* Cost Notice */}
            <Card padding="md" className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
              <div className="flex gap-2 text-sm">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-yellow-800 dark:text-yellow-200">
                  <strong>Verification fee:</strong> Approximately $2 USD (paid in cUSD). This covers the cost of document verification and ZK proof generation.
                </p>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep('choose-method')}
                fullWidth
              >
                ← Back
              </Button>
              <Button
                variant="primary"
                onClick={handleHolonymVerification}
                loading={isProcessing}
                fullWidth
              >
                Start Verification
              </Button>
            </div>
          </div>
        );

      case 'manual-upload':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Upload Documents
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload your documents for manual verification
              </p>
            </div>

            {/* ID Document */}
            <FileUpload
              label="Government-Issued ID *"
              accept="image/*,.pdf"
              maxSize={5}
              onFileSelect={(file) => setDocuments({ ...documents, idDocument: file })}
              preview
              helperText="Passport, driver's license, or national ID (max 5MB)"
            />

            {/* Selfie */}
            <FileUpload
              label="Selfie *"
              accept="image/*"
              maxSize={5}
              onFileSelect={(file) => setDocuments({ ...documents, selfie: file })}
              preview
              helperText="Clear photo of your face (max 5MB)"
            />

            {/* Address Proof (Optional) */}
            <FileUpload
              label="Proof of Address (Optional)"
              accept="image/*,.pdf"
              maxSize={5}
              onFileSelect={(file) => setDocuments({ ...documents, addressProof: file })}
              preview
              helperText="Utility bill, bank statement, or lease agreement (max 5MB)"
            />

            {/* Privacy Notice */}
            <Card padding="md" className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2 text-sm">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-blue-800 dark:text-blue-200">
                  Your documents are encrypted and securely stored. They will only be viewed by authorized verification staff and deleted after review.
                </p>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep('choose-method')}
                fullWidth
              >
                ← Back
              </Button>
              <Button
                variant="primary"
                onClick={handleManualVerification}
                loading={isProcessing}
                disabled={!documents.idDocument || !documents.selfie}
                fullWidth
              >
                Submit for Review
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Processing Verification...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {verificationMethod === 'holonym'
                ? 'Generating zero-knowledge proof and verifying on-chain...'
                : 'Uploading documents securely...'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              This may take a few moments. Please don't close this window.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {verificationMethod === 'holonym' ? 'Verification Complete!' : 'Documents Submitted!'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {verificationMethod === 'holonym'
                ? 'Your Verification SBT has been minted. You now have full access to TrustCircle features.'
                : 'Your documents have been submitted for review. You\'ll receive a notification within 24 hours.'}
            </p>
            
            {verificationHash && (
              <Card padding="md" className="bg-gray-50 dark:bg-gray-800/50 mb-6">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Verification ID:</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                  {verificationHash}
                </p>
              </Card>
            )}

            <Button variant="primary" onClick={handleClose} fullWidth>
              Done
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'An error occurred during verification. Please try again.'}
            </p>
            
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleClose} fullWidth>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleReset} fullWidth>
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentStep === 'processing' || currentStep === 'success' || currentStep === 'error' ? '' : 'Identity Verification'}
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={!isProcessing}
      showCloseButton={!isProcessing}
    >
      {renderStep()}
    </Modal>
  );
}
