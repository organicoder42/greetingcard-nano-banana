'use client';

import { StyleType } from '@/types';
import { cn } from '@/lib/utils';

interface StyleSelectorProps {
  selectedStyle: StyleType;
  onStyleChange: (style: StyleType) => void;
  disabled?: boolean;
}

interface StyleOption {
  value: StyleType;
  label: string;
  description: string;
  preview: React.ReactNode;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    value: 'cartoonish',
    label: 'Cartoonish',
    description: 'Playful and whimsical with soft colors',
    preview: (
      <div className="card-style-preview card-style-cartoonish">
        <div className="flex h-full flex-col justify-between">
          <div className="flex justify-between">
            <div className="h-3 w-3 rounded-full bg-pink-400 opacity-60"></div>
            <div className="h-2 w-2 rounded-full bg-blue-400 opacity-60"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-white/40"></div>
            <div className="h-1 w-3/4 rounded bg-white/30"></div>
          </div>
          <div className="flex justify-end">
            <div className="h-2 w-2 rounded-full bg-green-400 opacity-60"></div>
          </div>
        </div>
      </div>
    )
  },
  {
    value: 'futuristic',
    label: 'Futuristic',
    description: 'Modern and sleek with bold gradients',
    preview: (
      <div className="card-style-preview card-style-futuristic">
        <div className="flex h-full flex-col justify-between">
          <div className="flex justify-between">
            <div className="h-3 w-3 rounded-sm bg-cyan-300 opacity-80"></div>
            <div className="h-4 w-4 border-2 border-white/50 rounded-sm"></div>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded bg-white/60"></div>
            <div className="h-1 w-2/3 rounded bg-white/40"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-1 w-8 rounded bg-cyan-300 opacity-60"></div>
            <div className="h-3 w-3 rounded-full bg-purple-300 opacity-60"></div>
          </div>
        </div>
      </div>
    )
  },
  {
    value: 'old_days',
    label: 'Vintage',
    description: 'Classic and nostalgic with warm tones',
    preview: (
      <div className="card-style-preview card-style-old-days">
        <div className="flex h-full flex-col justify-between">
          <div className="flex justify-between">
            <div className="h-4 w-4 border-2 border-amber-600/30 rounded-full"></div>
            <div className="h-3 w-3 bg-orange-400/40 rounded-sm rotate-45"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-amber-800/20"></div>
            <div className="h-1 w-4/5 rounded bg-amber-700/15"></div>
          </div>
          <div className="flex justify-center">
            <div className="h-2 w-6 rounded bg-yellow-600/30"></div>
          </div>
        </div>
      </div>
    )
  }
];

export default function StyleSelector({ 
  selectedStyle, 
  onStyleChange, 
  disabled = false 
}: StyleSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Choose Your Style</h3>
        <p className="text-sm text-gray-600 mt-1">
          Select the visual style for your greeting card
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STYLE_OPTIONS.map(style => (
          <div
            key={style.value}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer group',
              selectedStyle === style.value
                ? 'border-primary shadow-lg ring-2 ring-primary/20'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !disabled && onStyleChange(style.value)}
          >
            {/* Preview */}
            <div className="p-4">
              {style.preview}
            </div>
            
            {/* Info */}
            <div className="p-4 pt-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{style.label}</h4>
                <div className={cn(
                  'h-4 w-4 rounded-full border-2 transition-all',
                  selectedStyle === style.value
                    ? 'border-primary bg-primary'
                    : 'border-gray-300 group-hover:border-gray-400'
                )}>
                  {selectedStyle === style.value && (
                    <div className="h-full w-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">{style.description}</p>
            </div>
            
            {/* Selected indicator */}
            {selectedStyle === style.value && (
              <div className="absolute top-2 right-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Style description for selected */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-primary"></div>
          <span className="text-sm font-medium text-gray-900">
            {STYLE_OPTIONS.find(s => s.value === selectedStyle)?.label} Style Selected
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {STYLE_OPTIONS.find(s => s.value === selectedStyle)?.description}
        </p>
      </div>
    </div>
  );
}