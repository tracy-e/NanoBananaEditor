import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/Button';
import { getAllSettings, saveAllSettings, type AllSettings, type ProviderType } from '../services/geminiService';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const [settings, setSettings] = useState<AllSettings>(getAllSettings());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const provider = settings.activeProvider;
  const config = settings.providers[provider];

  useEffect(() => {
    if (open) {
      setSettings(getAllSettings());
      setSaved(false);
      setShowKey(false);
    }
  }, [open]);

  const handleProviderChange = (p: ProviderType) => {
    setSettings(prev => ({ ...prev, activeProvider: p }));
    setSaved(false);
  };

  const updateField = (field: 'apiKey' | 'baseUrl' | 'model', value: string) => {
    setSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: { ...prev.providers[provider], [field]: value },
      },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    saveAllSettings(settings);
    setSaved(true);
    setTimeout(() => onOpenChange(false), 600);
  };

  const providers = [
    { id: 'gemini' as const, label: 'Google Gemini' },
    { id: 'openrouter' as const, label: 'OpenRouter' },
    { id: 'custom' as const, label: 'Custom' },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border border-stone-200 p-6 w-[440px] max-w-[90vw] z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-stone-900 font-sans">
              Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-stone-400 hover:text-stone-600 rounded-lg p-1">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            {/* Provider */}
            <div>
              <label className="text-sm font-medium text-stone-600 mb-2 block">Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {providers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      provider === p.id
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="text-sm font-medium text-stone-600 mb-2 block">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={e => updateField('apiKey', e.target.value)}
                  placeholder={provider === 'openrouter' ? 'sk-or-v1-...' : provider === 'gemini' ? 'AIza...' : 'Enter API key'}
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Base URL */}
            <div>
              <label className="text-sm font-medium text-stone-600 mb-2 block">Base URL</label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={e => updateField('baseUrl', e.target.value)}
                placeholder="https://..."
                className="w-full h-10 px-3 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Model */}
            <div>
              <label className="text-sm font-medium text-stone-600 mb-2 block">Model</label>
              <input
                type="text"
                value={config.model}
                onChange={e => updateField('model', e.target.value)}
                placeholder="model name"
                className="w-full h-10 px-3 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!config.apiKey.trim()}>
              {saved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
