import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { getGeminiApiKey, saveGeminiApiKey, removeGeminiApiKey } from '../services/storageService';

interface ApiKeySettingsProps {
  onClose: () => void;
  onSave?: () => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    const existing = getGeminiApiKey();
    if (existing) {
      setHasExistingKey(true);
      setApiKey('');
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      return;
    }
    
    setIsLoading(true);
    try {
      saveGeminiApiKey(apiKey);
      setHasExistingKey(true);
      onSave?.();
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error: any) {
      alert(error.message || 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove your API key?')) {
      removeGeminiApiKey();
      setHasExistingKey(false);
      setApiKey('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Gemini API Key
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Your API key is stored locally in your browser and only used for Gemini API requests.
        </p>

        {hasExistingKey && !apiKey && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ API key is configured
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {hasExistingKey && !apiKey ? 'Update API Key' : 'Enter API Key'}
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasExistingKey ? "Enter new key to update" : "AIza..."}
                className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Get your API key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isLoading}
              disabled={!apiKey.trim()}
              className="flex-1"
            >
              {hasExistingKey ? 'Update' : 'Save'}
            </Button>
            
            {hasExistingKey && (
              <Button
                variant="outline"
                onClick={handleRemove}
                className="flex-1"
              >
                Remove
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
