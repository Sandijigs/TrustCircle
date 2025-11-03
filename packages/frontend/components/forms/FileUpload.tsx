/**
 * FileUpload Component
 * 
 * File upload input with drag-and-drop, preview, and validation
 * Used for document uploads (KYC, verification, etc.)
 * 
 * Design Decisions:
 * - Drag-and-drop for better UX
 * - File type validation
 * - Size validation with clear limits
 * - Image preview when applicable
 * - Clear file information display
 * - Remove file button
 * - Accessible keyboard navigation
 * 
 * @example
 * ```tsx
 * <FileUpload
 *   label="Upload ID Document"
 *   accept="image/*,.pdf"
 *   maxSize={5}
 *   onFileSelect={(file) => setFile(file)}
 *   preview
 *   helperText="PNG, JPG, or PDF up to 5MB"
 * />
 * ```
 */

'use client';

import { useState, useRef, DragEvent } from 'react';
import { FileUploadProps } from '@/types/components';

export function FileUpload({
  label,
  accept,
  maxSize = 5,
  error,
  helperText,
  onFileSelect,
  preview = false,
  className = '',
  ...props
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID for accessibility
  const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const validateFile = (file: File): string | null => {
    // Size validation
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Type validation
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const fileType = file.type;
      const fileExt = `.${file.name.split('.').pop()}`;

      const isValidType = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return fileExt.toLowerCase() === type.toLowerCase();
        }
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(`${category}/`);
        }
        return fileType === type;
      });

      if (!isValidType) {
        return `Please upload a valid file type`;
      }
    }

    return null;
  };

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      setUploadError(null);
      onFileSelect(null);
      return;
    }

    // Validate file
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setUploadError(validationError);
      setFile(null);
      setPreviewUrl(null);
      onFileSelect(null);
      return;
    }

    setUploadError(null);
    setFile(selectedFile);
    onFileSelect(selectedFile);

    // Generate preview for images
    if (preview && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    handleFile(selectedFile);
  };

  const handleRemove = () => {
    handleFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const displayError = error || uploadError;

  return (
    <div className={`${className}`} {...props}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </label>
      )}

      {/* Upload Area */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative
            border-2 border-dashed rounded-lg
            p-6
            transition-all
            cursor-pointer
            ${isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : displayError
              ? 'border-red-300 hover:border-red-400 bg-red-50/50 dark:bg-red-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
            }
          `.trim().replace(/\s+/g, ' ')}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload file"
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="sr-only"
            aria-describedby={`${displayError ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
          />

          <div className="text-center">
            {/* Upload Icon */}
            <svg
              className={`mx-auto h-12 w-12 mb-3 ${
                displayError ? 'text-red-400' : 'text-gray-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            {/* Instructions */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                Click to upload
              </span>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {accept ? `Accepted: ${accept}` : 'Any file type'}
              {maxSize && ` • Max ${maxSize}MB`}
            </p>
          </div>
        </div>
      ) : (
        /* File Preview */
        <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4">
          {/* Image Preview */}
          {previewUrl && (
            <div className="mb-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg"
              />
            </div>
          )}

          {/* File Info */}
          <div className="flex items-center gap-4">
            {/* File Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {/* File Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={handleRemove}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Remove file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <p
          id={errorId}
          className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {displayError}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !displayError && (
        <p
          id={helperId}
          className="mt-1.5 text-sm text-gray-600 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
