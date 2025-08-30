'use client';

import { CardData, SizeType } from '@/types';
import { cn } from '@/lib/utils';
import { RotateCcw, Download } from 'lucide-react';

interface ImagePreviewProps {
  cardData: CardData;
  size?: SizeType;
  onSizeChange?: (size: SizeType) => void;
  onRegenerate?: () => void;
  onDownload?: () => void;
  loading?: boolean;
  showControls?: boolean;
}

export default function ImagePreview({
  cardData,
  size = 'A5',
  onSizeChange,
  onRegenerate,
  onDownload,
  loading = false,
  showControls = true
}: ImagePreviewProps) {
  const aspectRatio = size === 'A4' ? '595/842' : '420/595'; // A4: 595x842, A5: 420x595 points
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Failed to load card image');
    // Could show a placeholder or error message
  };

  const getImageSrc = () => {
    if (cardData.imagePngBase64) {
      // Handle both data URL and plain base64
      if (cardData.imagePngBase64.startsWith('data:')) {
        return cardData.imagePngBase64;
      } else {
        return `data:image/png;base64,${cardData.imagePngBase64}`;
      }
    }
    return null;
  };

  const imageSrc = getImageSrc();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Card Preview</h3>
          <p className="text-sm text-gray-600 mt-1">
            Your personalized greeting card
          </p>
        </div>
        
        {showControls && onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="button-secondary"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Regenerate
          </button>
        )}
      </div>

      {/* Preview Container */}
      <div className="relative">
        <div
          className={cn(
            'relative mx-auto bg-white shadow-2xl rounded-lg overflow-hidden',
            size === 'A4' ? 'max-w-md' : 'max-w-sm'
          )}
          style={{
            aspectRatio
          }}
        >
          {loading ? (
            /* Loading State */
            <div className="flex h-full items-center justify-center bg-gray-50">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 loading-spinner mx-auto"></div>
                <p className="text-sm text-gray-600">Generating your card...</p>
              </div>
            </div>
          ) : imageSrc ? (
            /* Card with Image */
            <div className="relative h-full">
              <img
                src={imageSrc}
                alt={`${cardData.occasion} card for ${cardData.recipientName}`}
                className="h-full w-full object-cover"
                onError={handleImageError}
              />
              
              {/* Text Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4">
                <div className="text-center space-y-1">
                  <h2 className={cn(
                    'font-bold text-gray-900',
                    size === 'A4' ? 'text-xl' : 'text-lg'
                  )}>
                    {cardData.headline}
                  </h2>
                  <p className={cn(
                    'text-gray-700',
                    size === 'A4' ? 'text-base' : 'text-sm'
                  )}>
                    {cardData.line}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder */
            <div className="flex h-full items-center justify-center bg-gray-100">
              <div className="text-center space-y-2 p-8">
                <div className="h-16 w-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                  <Download className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  Generate your card to see the preview
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Watermark for unpaid cards */}
        {!loading && imageSrc && (
          <div className="absolute top-4 right-4 bg-red-500/80 text-white px-2 py-1 rounded text-xs font-medium">
            PREVIEW
          </div>
        )}
      </div>

      {/* Card Info */}
      {!loading && cardData.headline && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Style:</span>
            <span className="font-medium capitalize">{cardData.style.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Occasion:</span>
            <span className="font-medium">{cardData.occasion}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Recipient:</span>
            <span className="font-medium">{cardData.recipientName}</span>
          </div>
        </div>
      )}

      {/* Size Selection */}
      {showControls && onSizeChange && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Paper Size
          </label>
          <div className="flex space-x-2">
            {(['A5', 'A4'] as SizeType[]).map(sizeOption => (
              <button
                key={sizeOption}
                onClick={() => onSizeChange(sizeOption)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  size === sizeOption
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
                disabled={loading}
              >
                {sizeOption}
                <span className="ml-1 text-xs opacity-75">
                  {sizeOption === 'A4' ? '(210×297mm)' : '(148×210mm)'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Download Button */}
      {showControls && onDownload && !loading && imageSrc && (
        <button
          onClick={onDownload}
          className="w-full button-primary h-12 text-base"
        >
          <Download className="h-5 w-5 mr-2" />
          Unlock & Download PDF (DKK 25)
        </button>
      )}
    </div>
  );
}