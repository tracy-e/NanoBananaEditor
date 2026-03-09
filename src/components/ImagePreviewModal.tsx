import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
  description?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  open,
  onOpenChange,
  imageUrl,
  title,
  description
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-stone-200 rounded-2xl shadow-xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-stone-800 font-sans">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-3">
            {description && <p className="text-sm text-stone-500">{description}</p>}
            <div className="bg-stone-50 rounded-lg p-3">
              <img src={imageUrl} alt={title} className="w-full h-auto rounded-lg" />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
