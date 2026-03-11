import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ErrorModal: React.FC = () => {
  const { errorModal, clearErrorModal } = useAppStore();

  return (
    <Dialog.Root open={!!errorModal} onOpenChange={(open) => { if (!open) clearErrorModal(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl border border-stone-200 p-6 w-[420px] max-w-[90vw] focus:outline-none">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-sm font-semibold text-stone-800 mb-1">
                Operation Failed
              </Dialog.Title>
              <Dialog.Description className="text-sm text-stone-500 break-words">
                {errorModal?.message}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="flex-shrink-0 text-stone-400 hover:text-stone-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-5 flex justify-end">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm font-medium text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors">
                OK
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
