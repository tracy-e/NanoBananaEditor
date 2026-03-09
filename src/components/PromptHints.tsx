import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { PromptHint } from '../types';
import { Button } from './ui/Button';

const promptHints: PromptHint[] = [
  { category: 'subject', text: 'Be specific about the main subject', example: '"A vintage red bicycle" vs "bicycle"' },
  { category: 'scene', text: 'Describe the environment and setting', example: '"in a cobblestone alley during golden hour"' },
  { category: 'action', text: 'Include movement or activity', example: '"cyclist pedaling through puddles"' },
  { category: 'style', text: 'Specify artistic style or mood', example: '"cinematic photography, moody lighting"' },
  { category: 'camera', text: 'Add camera perspective details', example: '"shot with 85mm lens, shallow depth of field"' },
];

const categoryColors: Record<string, string> = {
  subject: 'bg-blue-50 border-blue-200 text-blue-600',
  scene: 'bg-emerald-50 border-emerald-200 text-emerald-600',
  action: 'bg-purple-50 border-purple-200 text-purple-600',
  style: 'bg-amber-50 border-amber-200 text-amber-600',
  camera: 'bg-pink-50 border-pink-200 text-pink-600',
};

interface PromptHintsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromptHints: React.FC<PromptHintsProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-stone-200 rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-stone-800 font-sans">
              Prompt Tips
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {promptHints.map((hint, index) => (
              <div key={index} className="space-y-1.5">
                <div className={`inline-block px-2 py-0.5 rounded-md text-xs border font-medium ${categoryColors[hint.category]}`}>
                  {hint.category}
                </div>
                <p className="text-sm text-stone-700">{hint.text}</p>
                <p className="text-sm text-stone-400 italic">{hint.example}</p>
              </div>
            ))}

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 mt-5">
              <p className="text-sm text-stone-600">
                <strong className="text-amber-700">Tip:</strong> Write full sentences that describe the complete scene, not just keywords.
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
