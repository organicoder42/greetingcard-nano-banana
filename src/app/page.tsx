'use client';

import { useState } from 'react';
import { CardData, StyleType, SizeType, UploadedFile, TextGenResponse, ImageGenResponse } from '@/types';
import CardForm from '@/components/CardForm';
import StyleSelector from '@/components/StyleSelector';
import UploadDropzone from '@/components/UploadDropzone';
import ImagePreview from '@/components/ImagePreview';
import GreetingEditor from '@/components/GreetingEditor';
import PayButton from '@/components/PayButton';
import { cn } from '@/lib/utils';
import { Sparkles, Heart, Gift } from 'lucide-react';

type Step = 'form' | 'preview' | 'payment';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeType>('A5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCard = async (formData: any) => {
    setLoading(true);
    setError(null);

    try {
      // Generate text first
      const textResponse = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          occasion: formData.occasion,
          recipientName: formData.recipientName,
          style: formData.style,
          tone: formData.tone,
          extraContext: formData.extraContext,
        }),
      });

      if (!textResponse.ok) {
        const errorData = await textResponse.json();
        throw new Error(errorData.error || 'Failed to generate greeting text');
      }

      const textResult: TextGenResponse = await textResponse.json();
      const { headline, line } = textResult.candidates[0];

      // Generate image
      const imageFormData = new FormData();
      imageFormData.append('meta', JSON.stringify({
        style: formData.style,
        occasion: formData.occasion,
        includeTextArea: true,
        outputSize: { w: 1024, h: 768 }
      }));

      if (uploadedFile && formData.hasUserConsent) {
        imageFormData.append('photo', uploadedFile.file);
      }

      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        body: imageFormData,
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.error || 'Failed to generate card image');
      }

      const imageResult: ImageGenResponse = await imageResponse.json();

      // Create complete card data
      const newCardData: CardData = {
        occasion: formData.occasion,
        recipientName: formData.recipientName,
        style: formData.style,
        tone: formData.tone,
        headline,
        line,
        imagePngBase64: imageResult.imagePngBase64,
        userPhoto: uploadedFile ? uploadedFile.preview : undefined,
        hasUserConsent: formData.hasUserConsent,
      };

      setCardData(newCardData);
      setCurrentStep('preview');

    } catch (error) {
      console.error('Generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate card');
    } finally {
      setLoading(false);
    }
  };

  const updateGreeting = (headline: string, line: string) => {
    if (cardData) {
      setCardData({ ...cardData, headline, line });
    }
  };

  const regenerateCard = () => {
    if (cardData) {
      const formData = {
        occasion: cardData.occasion,
        recipientName: cardData.recipientName,
        style: cardData.style,
        tone: cardData.tone,
        extraContext: '',
        hasUserConsent: cardData.hasUserConsent,
      };
      generateCard(formData);
    }
  };

  const proceedToPayment = () => {
    setCurrentStep('payment');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Gift className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">Greetingsmith</h1>
              </div>
              <div className="hidden sm:block text-sm text-gray-600">
                AI-powered greeting cards for every occasion
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Sparkles className="h-4 w-4" />
              <span>Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {(['form', 'preview', 'payment'] as Step[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  currentStep === step
                    ? 'bg-primary text-white'
                    : index < (['form', 'preview', 'payment'] as Step[]).indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {index + 1}
                </div>
                <span className={cn(
                  'ml-2 text-sm font-medium capitalize',
                  currentStep === step ? 'text-primary' : 'text-gray-500'
                )}>
                  {step}
                </span>
                {index < 2 && (
                  <div className="w-16 h-0.5 mx-4 bg-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form Step */}
        {currentStep === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <CardForm onSubmit={generateCard} loading={loading} />
            </div>
            
            <div className="space-y-8">
              <StyleSelector
                selectedStyle="cartoonish"
                onStyleChange={() => {}}
                disabled={loading}
              />
              
              <UploadDropzone
                onFileUpload={setUploadedFile}
                onFileRemove={() => setUploadedFile(null)}
                uploadedFile={uploadedFile}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && cardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <ImagePreview
                cardData={cardData}
                size={selectedSize}
                onSizeChange={setSelectedSize}
                onRegenerate={regenerateCard}
                onDownload={proceedToPayment}
                loading={loading}
              />
            </div>
            
            <div className="space-y-6">
              <GreetingEditor
                headline={cardData.headline}
                line={cardData.line}
                onUpdate={updateGreeting}
                disabled={loading}
              />
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-4">Ready to download?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get your high-resolution, print-ready PDF with no watermarks.
                </p>
                <PayButton cardData={cardData} size={selectedSize} />
              </div>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {currentStep === 'payment' && cardData && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your card is ready!
                </h2>
                <p className="text-gray-600">
                  Complete your purchase to download the high-quality PDF
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <img
                    src={`data:image/png;base64,${cardData.imagePngBase64}`}
                    alt="Card preview"
                    className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Card Details:</h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Occasion:</span> {cardData.occasion}</p>
                      <p><span className="font-medium">Recipient:</span> {cardData.recipientName}</p>
                      <p><span className="font-medium">Style:</span> {cardData.style.replace('_', ' ')}</p>
                      <p><span className="font-medium">Size:</span> {selectedSize}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">What you'll get:</h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      <li>✓ High-resolution PDF (300 DPI)</li>
                      <li>✓ Print-ready with proper margins</li>
                      <li>✓ No watermarks</li>
                      <li>✓ Instant download</li>
                    </ul>
                  </div>
                </div>
              </div>

              <PayButton cardData={cardData} size={selectedSize} />
              
              <div className="text-center mt-6">
                <button
                  onClick={() => setCurrentStep('preview')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to preview
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 Greetingsmith. Made with ❤️ for special occasions.</p>
            <p className="mt-2">Secure payments by Stripe • Privacy-first design</p>
          </div>
        </div>
      </footer>
    </div>
  );
}