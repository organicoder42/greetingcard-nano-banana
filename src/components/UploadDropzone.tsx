'use client';

import { useState, useRef, useCallback } from 'react';
import { UploadedFile } from '@/types';
import { validateImageFile, createImagePreview, formatFileSize, cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface UploadDropzoneProps {
  onFileUpload: (file: UploadedFile) => void;
  onFileRemove: () => void;
  uploadedFile?: UploadedFile | null;
  disabled?: boolean;
}

export default function UploadDropzone({ 
  onFileUpload, 
  onFileRemove, 
  uploadedFile = null, 
  disabled = false 
}: UploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);
    setUploading(true);

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // Create preview and get bytes
      const preview = await createImagePreview(file);
      const bytes = await file.arrayBuffer();

      const uploadedFile: UploadedFile = {
        file,
        preview,
        bytes
      };

      onFileUpload(uploadedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, uploading, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setDragActive(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const handleRemoveFile = () => {
    onFileRemove();
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // If file is uploaded, show preview
  if (uploadedFile) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Photo Upload</h3>
          <p className="text-sm text-gray-600 mt-1">
            Your photo will be incorporated into the card design
          </p>
        </div>
        
        <div className="relative group">
          <div className="relative overflow-hidden rounded-lg bg-gray-50 p-4">
            <img
              src={uploadedFile.preview}
              alt="Uploaded photo"
              className="mx-auto max-h-48 rounded-lg object-contain shadow-md"
            />
            
            {/* Remove button */}
            <button
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity hover:bg-red-600 group-hover:opacity-100"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-sm font-medium text-gray-900">{uploadedFile.file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.file.size)}</p>
          </div>
          
          <button
            onClick={openFileDialog}
            disabled={disabled}
            className="mt-2 w-full text-sm text-primary hover:text-primary/80 disabled:opacity-50"
          >
            Replace photo
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  // Upload interface
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Photo Upload <span className="text-gray-400 font-normal">(Optional)</span>
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Add a photo to personalize your greeting card
        </p>
      </div>
      
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          uploading && 'pointer-events-none'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        {uploading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 loading-spinner"></div>
            <p className="text-sm text-gray-600">Processing photo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              dragActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
            )}>
              {dragActive ? <ImageIcon className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {dragActive ? 'Drop your photo here' : 'Upload a photo'}
              </p>
              <p className="text-xs text-gray-500">
                Drag and drop or click to browse
              </p>
            </div>
            
            <div className="text-xs text-gray-400 space-y-1">
              <p>JPEG, PNG, or WebP</p>
              <p>Max {process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || '10'}MB</p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="bg-yellow-50 p-3 rounded-md">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <div className="h-4 w-4 rounded-full bg-yellow-400 flex items-center justify-center mt-0.5">
              <div className="h-1.5 w-1.5 bg-yellow-800 rounded-full"></div>
            </div>
          </div>
          <div className="text-xs text-yellow-800">
            <p className="font-medium">Privacy Note:</p>
            <p>
              Photos are processed in memory and not stored permanently. Enable "Allow photo processing" 
              in the form above to send photos to our AI for advanced stylization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}