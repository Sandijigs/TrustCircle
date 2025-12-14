/**
 * Self.xyz Verification Component
 *
 * QR code-based identity verification using Self.xyz
 * Users scan QR code with Self mobile app to verify their identity
 */

'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getSelfXyzClient } from '@/lib/self-xyz';
import {
  VerificationEvent,
  QR_CODE_CONFIG,
  SELF_XYZ_SCORE_BOOSTS,
  type UserVerificationState,
} from '@/lib/self-xyz/config';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  X,
} from 'lucide-react';
import { useAccount } from 'wagmi';

interface SelfXyzVerificationProps {
  onComplete?: (scoreBoost: number) => void;
  onClose?: () => void;
  className?: string;
}

export function SelfXyzVerification({
  onComplete,
  onClose,
  className = '',
}: SelfXyzVerificationProps) {
  const { address } = useAccount();
  const [verificationState, setVerificationState] = useState<UserVerificationState | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const client = getSelfXyzClient();

  /**
   * Load existing verification state
   */
  useEffect(() => {
    const state = client.getVerificationState();
    if (state) {
      setVerificationState(state);
      if (state.qrData) {
        setQrData(state.qrData);
      }
    }
  }, [client]);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    const handleQRGenerated = (data: any) => {
      setQrData(data.qrData);
      setIsGenerating(false);
    };

    const handleScanStarted = () => {
      setVerificationState(prev => prev ? { ...prev, status: 'scanning' } : null);
    };

    const handleSuccess = (result: any) => {
      setVerificationState(prev => prev ? { ...prev, status: 'verified', result } : null);
      const scoreBoost = client.calculateScoreBoost(result);
      onComplete?.(scoreBoost);
    };

    const handleTimeout = () => {
      setError('Verification timeout. Please try again.');
      setVerificationState(prev => prev ? { ...prev, status: 'expired' } : null);
    };

    client.on(VerificationEvent.QR_GENERATED, handleQRGenerated);
    client.on(VerificationEvent.SCAN_STARTED, handleScanStarted);
    client.on(VerificationEvent.VERIFICATION_SUCCESS, handleSuccess);
    client.on(VerificationEvent.TIMEOUT, handleTimeout);

    return () => {
      client.off(VerificationEvent.QR_GENERATED, handleQRGenerated);
      client.off(VerificationEvent.SCAN_STARTED, handleScanStarted);
      client.off(VerificationEvent.VERIFICATION_SUCCESS, handleSuccess);
      client.off(VerificationEvent.TIMEOUT, handleTimeout);
    };
  }, [client, onComplete]);

  /**
   * Generate QR code
   */
  const handleGenerateQR = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const qr = await client.generateQRCode(address);
      setQrData(qr);

      // Start polling for verification
      client.startVerificationPolling(address);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      setIsGenerating(false);
    }
  };

  /**
   * Retry verification
   */
  const handleRetry = () => {
    client.reset();
    setQrData(null);
    setError(null);
    setVerificationState(null);
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      client.stopVerificationPolling();
    };
  }, [client]);

  /**
   * Render verification status
   */
  const renderStatus = () => {
    if (verificationState?.status === 'verified') {
      return (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-success-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-success-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Complete!</h3>
          <p className="text-gray-600 mb-4">
            Your identity has been successfully verified
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-success-50 border border-success-200 rounded-lg">
            <span className="text-success-900 font-semibold">Credit Score Boost:</span>
            <span className="text-2xl font-bold text-success-600">
              +{verificationState.result?.scoreBoost || 0} points
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-success-100 rounded-full flex items-center justify-center mr-4">
            <ShieldCheck className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
            <p className="text-gray-600">Verify with Self.xyz to boost your credit score</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">Verification Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Verified Status */}
      {verificationState?.status === 'verified' && renderStatus()}

      {/* QR Code Display */}
      {!verificationState?.status || ['qr_generated', 'scanning', 'verifying'].includes(verificationState.status) ? (
        <>
          {!qrData ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Verify Your Identity
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Scan a QR code with the Self mobile app to verify your identity using your government-issued ID
                </p>
              </div>

              <button
                onClick={handleGenerateQR}
                disabled={isGenerating || !address}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Generate QR Code
                  </>
                )}
              </button>

              {!address && (
                <p className="text-sm text-gray-500 mt-4">
                  Please connect your wallet first
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              {/* QR Code */}
              <div className="mb-6 inline-block p-6 bg-white border-4 border-primary-200 rounded-xl">
                <QRCodeSVG
                  value={qrData}
                  size={QR_CODE_CONFIG.size}
                  level={QR_CODE_CONFIG.level}
                  includeMargin={QR_CODE_CONFIG.includeMargin}
                  fgColor={QR_CODE_CONFIG.fgColor}
                  bgColor={QR_CODE_CONFIG.bgColor}
                />
              </div>

              {/* Instructions */}
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Scan with Self App
                </h3>
                <p className="text-gray-600 mb-4">
                  Open the Self app on your phone and scan this QR code to complete verification
                </p>

                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  <span className="text-sm font-medium text-gray-700">
                    {verificationState?.status === 'scanning'
                      ? 'Waiting for scan...'
                      : verificationState?.status === 'verifying'
                      ? 'Verifying...'
                      : 'Ready to scan'}
                  </span>
                </div>

                {/* App Download Links */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">Don't have the Self app?</p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href="https://apps.apple.com/app/self-identity"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Download for iOS
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=xyz.self.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Download for Android
                    </a>
                  </div>
                </div>

                {/* Retry Button */}
                <button
                  onClick={handleRetry}
                  className="mt-6 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Generate New QR Code
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Expired/Failed State */}
      {verificationState?.status === 'expired' || verificationState?.status === 'failed' ? (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Verification {verificationState.status === 'expired' ? 'Expired' : 'Failed'}</h3>
          <p className="text-gray-600 mb-6">
            {verificationState.error || 'Please try again'}
          </p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      ) : null}

      {/* Score Boost Information */}
      {!verificationState?.status && (
        <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-success-50 rounded-xl">
          <h4 className="text-lg font-bold text-gray-900 mb-3">Verification Levels</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Humanity Proof</span>
              <span className="text-sm font-bold text-primary-600">+{SELF_XYZ_SCORE_BOOSTS.HUMANITY_VERIFIED} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Full Verification</span>
              <span className="text-sm font-bold text-primary-600">+{SELF_XYZ_SCORE_BOOSTS.FULL_VERIFICATION} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Premium Verification</span>
              <span className="text-sm font-bold text-primary-600">+{SELF_XYZ_SCORE_BOOSTS.PREMIUM_VERIFICATION} pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
