'use client';

import { useState } from 'react';
import { StyleType, ToneType } from '@/types';
import { cn } from '@/lib/utils';

interface CardFormData {
  occasion: string;
  recipientName: string;
  tone: ToneType;
  style: StyleType;
  extraContext: string;
  hasUserConsent: boolean;
}

interface CardFormProps {
  onSubmit: (data: CardFormData) => void;
  loading?: boolean;
}

const OCCASIONS = [
  'Birthday',
  'Anniversary', 
  'Wedding',
  'Graduation',
  'Get Well Soon',
  'Congratulations',
  'Thank You',
  'Valentine\'s Day',
  'Mother\'s Day',
  'Father\'s Day',
  'Christmas',
  'New Year',
  'Custom'
];

const TONES: { value: ToneType; label: string; description: string }[] = [
  { value: 'warm', label: 'Warm', description: 'Heartfelt and caring' },
  { value: 'playful', label: 'Playful', description: 'Fun and lighthearted' },
  { value: 'formal', label: 'Formal', description: 'Professional and polished' },
  { value: 'romantic', label: 'Romantic', description: 'Sweet and loving' },
  { value: 'friendly', label: 'Friendly', description: 'Casual and cheerful' },
];

export default function CardForm({ onSubmit, loading = false }: CardFormProps) {
  const [formData, setFormData] = useState<CardFormData>({
    occasion: '',
    recipientName: '',
    tone: 'warm',
    style: 'cartoonish',
    extraContext: '',
    hasUserConsent: false,
  });

  const [customOccasion, setCustomOccasion] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate occasion
    const occasion = formData.occasion === 'Custom' ? customOccasion : formData.occasion;
    if (!occasion.trim()) {
      newErrors.occasion = 'Please select or enter an occasion';
    } else if (occasion.length > 50) {
      newErrors.occasion = 'Occasion must be 50 characters or less';
    }

    // Validate recipient name
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Please enter the recipient\'s name';
    } else if (formData.recipientName.length > 30) {
      newErrors.recipientName = 'Name must be 30 characters or less';
    }

    // Validate extra context if provided
    if (formData.extraContext.length > 200) {
      newErrors.extraContext = 'Additional notes must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const finalData = {
      ...formData,
      occasion: formData.occasion === 'Custom' ? customOccasion : formData.occasion,
    };

    onSubmit(finalData);
  };

  const updateField = <K extends keyof CardFormData>(field: K, value: CardFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Occasion */}
      <div>
        <label className="form-label">
          Occasion <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.occasion}
          onChange={(e) => updateField('occasion', e.target.value)}
          className={cn(
            'form-input',
            errors.occasion && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          disabled={loading}
        >
          <option value="">Select an occasion</option>
          {OCCASIONS.map(occasion => (
            <option key={occasion} value={occasion}>{occasion}</option>
          ))}
        </select>
        
        {formData.occasion === 'Custom' && (
          <input
            type="text"
            placeholder="Enter custom occasion"
            value={customOccasion}
            onChange={(e) => setCustomOccasion(e.target.value)}
            className={cn(
              'form-input mt-2',
              errors.occasion && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
            maxLength={50}
            disabled={loading}
          />
        )}
        
        {errors.occasion && (
          <p className="mt-1 text-sm text-red-600">{errors.occasion}</p>
        )}
      </div>

      {/* Recipient Name */}
      <div>
        <label className="form-label">
          Recipient's Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.recipientName}
          onChange={(e) => updateField('recipientName', e.target.value)}
          placeholder="e.g., Sarah, Mom, John & Lisa"
          className={cn(
            'form-input',
            errors.recipientName && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          maxLength={30}
          disabled={loading}
        />
        {errors.recipientName && (
          <p className="mt-1 text-sm text-red-600">{errors.recipientName}</p>
        )}
      </div>

      {/* Tone */}
      <div>
        <label className="form-label">Tone</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TONES.map(tone => (
            <label
              key={tone.value}
              className={cn(
                'flex items-center p-3 rounded-lg border cursor-pointer transition-colors',
                formData.tone === tone.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-gray-300',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="radio"
                name="tone"
                value={tone.value}
                checked={formData.tone === tone.value}
                onChange={(e) => updateField('tone', e.target.value as ToneType)}
                className="sr-only"
                disabled={loading}
              />
              <div className="flex-1">
                <div className="font-medium">{tone.label}</div>
                <div className="text-sm text-gray-500">{tone.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Extra Context */}
      <div>
        <label className="form-label">
          Additional Notes <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          value={formData.extraContext}
          onChange={(e) => updateField('extraContext', e.target.value)}
          placeholder="Any special details or preferences for the greeting?"
          rows={3}
          className={cn(
            'form-input resize-none',
            errors.extraContext && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          maxLength={200}
          disabled={loading}
        />
        <div className="flex justify-between mt-1">
          {errors.extraContext && (
            <p className="text-sm text-red-600">{errors.extraContext}</p>
          )}
          <p className="text-sm text-gray-500 ml-auto">
            {formData.extraContext.length}/200
          </p>
        </div>
      </div>

      {/* Photo Consent */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.hasUserConsent}
            onChange={(e) => updateField('hasUserConsent', e.target.checked)}
            className="mt-0.5 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            disabled={loading}
          />
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              Allow photo processing (Optional)
            </div>
            <div className="text-gray-600">
              If you upload a photo, allow sending it to our AI service for stylization. 
              Unchecked photos will only be composed locally with generated backgrounds.
            </div>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full button-primary h-12',
          loading && 'cursor-not-allowed'
        )}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 loading-spinner"></div>
            <span>Generating Card...</span>
          </div>
        ) : (
          'Generate Card'
        )}
      </button>
    </form>
  );
}