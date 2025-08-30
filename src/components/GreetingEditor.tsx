'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Edit3, Check, X } from 'lucide-react';

interface GreetingEditorProps {
  headline: string;
  line: string;
  onUpdate: (headline: string, line: string) => void;
  disabled?: boolean;
}

export default function GreetingEditor({ 
  headline, 
  line, 
  onUpdate, 
  disabled = false 
}: GreetingEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editHeadline, setEditHeadline] = useState(headline);
  const [editLine, setEditLine] = useState(line);
  const [errors, setErrors] = useState<{ headline?: string; line?: string }>({});

  const startEditing = () => {
    if (disabled) return;
    setEditHeadline(headline);
    setEditLine(line);
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditHeadline(headline);
    setEditLine(line);
    setErrors({});
    setIsEditing(false);
  };

  const validateAndSave = () => {
    const newErrors: { headline?: string; line?: string } = {};

    if (!editHeadline.trim()) {
      newErrors.headline = 'Headline cannot be empty';
    } else if (editHeadline.length > 100) {
      newErrors.headline = 'Headline must be 100 characters or less';
    }

    if (!editLine.trim()) {
      newErrors.line = 'Message line cannot be empty';
    } else if (editLine.length > 200) {
      newErrors.line = 'Message must be 200 characters or less';
    }

    // Check total length
    const totalLength = editHeadline.length + editLine.length;
    if (totalLength > 220) {
      newErrors.line = 'Total message too long. Please shorten your text.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onUpdate(editHeadline.trim(), editLine.trim());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Edit Greeting</h4>
          <div className="flex space-x-2">
            <button
              onClick={validateAndSave}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              <Check className="h-3 w-3" />
              <span>Save</span>
            </button>
            <button
              onClick={cancelEditing}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
            >
              <X className="h-3 w-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Headline
            </label>
            <input
              type="text"
              value={editHeadline}
              onChange={(e) => setEditHeadline(e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.headline ? 'border-red-500' : 'border-gray-300'
              )}
              maxLength={100}
              placeholder="Main greeting headline"
            />
            <div className="flex justify-between mt-1">
              {errors.headline && (
                <p className="text-xs text-red-600">{errors.headline}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">{editHeadline.length}/100</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={editLine}
              onChange={(e) => setEditLine(e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
                errors.line ? 'border-red-500' : 'border-gray-300'
              )}
              maxLength={200}
              rows={3}
              placeholder="Your greeting message"
            />
            <div className="flex justify-between mt-1">
              {errors.line && (
                <p className="text-xs text-red-600">{errors.line}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">{editLine.length}/200</p>
            </div>
          </div>

          <div className="text-xs text-gray-600 bg-white p-2 rounded border">
            Total characters: {editHeadline.length + editLine.length}/220
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Generated Greeting</h4>
        <button
          onClick={startEditing}
          disabled={disabled}
          className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          <Edit3 className="h-3 w-3" />
          <span>Edit</span>
        </button>
      </div>

      <div className="space-y-3 p-4 bg-white border border-gray-200 rounded-lg">
        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">Headline:</div>
          <div className="text-lg font-semibold text-gray-900">{headline}</div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">Message:</div>
          <div className="text-gray-700">{line}</div>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {headline.length + line.length} characters total
          </div>
        </div>
      </div>
    </div>
  );
}