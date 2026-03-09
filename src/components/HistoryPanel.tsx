import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { History, Download, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import { ImagePreviewModal } from './ImagePreviewModal';

export const HistoryPanel: React.FC = () => {
  const {
    currentProject,
    canvasImage,
    selectedGenerationId,
    selectedEditId,
    selectGeneration,
    selectEdit,
    showHistory,
    setShowHistory,
    setCanvasImage,
    selectedTool
  } = useAppStore();

  const [previewModal, setPreviewModal] = React.useState<{
    open: boolean;
    imageUrl: string;
    title: string;
    description?: string;
  }>({ open: false, imageUrl: '', title: '', description: '' });

  const generations = currentProject?.generations || [];
  const edits = currentProject?.edits || [];

  const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (canvasImage) {
      const img = new Image();
      img.onload = () => setImageDimensions({ width: img.width, height: img.height });
      img.src = canvasImage;
    } else {
      setImageDimensions(null);
    }
  }, [canvasImage]);

  if (!showHistory) {
    return (
      <div className="w-8 bg-white border-l border-stone-200 flex flex-col items-center justify-center">
        <button
          onClick={() => setShowHistory(true)}
          className="w-6 h-16 bg-stone-100 hover:bg-stone-200 rounded-l-lg border border-r-0 border-stone-200 flex items-center justify-center group"
          title="Show History"
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 bg-stone-400 group-hover:bg-stone-500 rounded-full" />
            <div className="w-1 h-1 bg-stone-400 group-hover:bg-stone-500 rounded-full" />
            <div className="w-1 h-1 bg-stone-400 group-hover:bg-stone-500 rounded-full" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-stone-200 p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-stone-400" />
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-sans">History</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="h-6 w-6" title="Hide">
          <span className="text-xs">×</span>
        </Button>
      </div>

      {/* Variants */}
      <div className="mb-5 flex-shrink-0">
        {generations.length === 0 && edits.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <ImageIcon className="h-5 w-5 text-stone-400" />
            </div>
            <p className="text-sm text-stone-400">No generations yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {generations.slice(-2).map((generation, index) => (
              <div
                key={generation.id}
                className={cn(
                  'relative aspect-square rounded-lg border-2 cursor-pointer overflow-hidden',
                  selectedGenerationId === generation.id
                    ? 'border-amber-400 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300'
                )}
                onClick={() => {
                  selectGeneration(generation.id);
                  if (generation.outputAssets[0]) setCanvasImage(generation.outputAssets[0].url);
                }}
              >
                {generation.outputAssets[0] ? (
                  <img src={generation.outputAssets[0].url} alt="Generated" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-stone-200 border-t-amber-500" />
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5 bg-white/90 text-xs px-1.5 py-0.5 rounded shadow-sm text-stone-600">
                  #{index + 1}
                </div>
              </div>
            ))}

            {edits.slice(-2).map((edit, index) => (
              <div
                key={edit.id}
                className={cn(
                  'relative aspect-square rounded-lg border-2 cursor-pointer overflow-hidden',
                  selectedEditId === edit.id
                    ? 'border-amber-400 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300'
                )}
                onClick={() => {
                  if (edit.outputAssets[0]) {
                    setCanvasImage(edit.outputAssets[0].url);
                    selectEdit(edit.id);
                    selectGeneration(null);
                  }
                }}
              >
                {edit.outputAssets[0] ? (
                  <img src={edit.outputAssets[0].url} alt="Edited" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-stone-200 border-t-amber-500" />
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5 bg-purple-100 text-xs px-1.5 py-0.5 rounded text-purple-600">
                  Edit #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Image Info */}
      {(canvasImage || imageDimensions) && (
        <div className="mb-4 p-3 bg-stone-50 rounded-lg border border-stone-100">
          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 font-sans">Current</h4>
          <div className="space-y-1 text-xs text-stone-500">
            {imageDimensions && (
              <div className="flex justify-between">
                <span>Size</span>
                <span className="text-stone-700 tabular-nums">{imageDimensions.width} × {imageDimensions.height}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Mode</span>
              <span className="text-stone-700 capitalize">{selectedTool}</span>
            </div>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="mb-5 p-3 bg-stone-50 rounded-lg border border-stone-100 flex-1 overflow-y-auto min-h-0">
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 font-sans">Details</h4>
        {(() => {
          const gen = generations.find(g => g.id === selectedGenerationId);
          const selectedEdit = edits.find(e => e.id === selectedEditId);

          if (gen) {
            return (
              <div className="space-y-2.5">
                <div className="text-xs text-stone-500">
                  <span className="text-stone-400">Prompt:</span>
                  <p className="text-stone-700 mt-0.5">{gen.prompt}</p>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Model</span>
                  <span className="text-stone-500">{gen.modelVersion}</span>
                </div>
                {gen.parameters.seed && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Seed</span>
                    <span className="text-stone-500">{gen.parameters.seed}</span>
                  </div>
                )}
                {gen.sourceAssets.length > 0 && (
                  <div>
                    <h5 className="text-xs text-stone-400 mb-1.5">References</h5>
                    <div className="grid grid-cols-2 gap-1.5">
                      {gen.sourceAssets.map((asset, i) => (
                        <button
                          key={asset.id}
                          onClick={() => setPreviewModal({ open: true, imageUrl: asset.url, title: `Reference ${i + 1}` })}
                          className="relative aspect-square rounded border border-stone-200 overflow-hidden group"
                        >
                          <img src={asset.url} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center">
                            <ImageIcon className="h-3 w-3 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          } else if (selectedEdit) {
            const parentGen = generations.find(g => g.id === selectedEdit.parentGenerationId);
            return (
              <div className="space-y-2.5">
                <div className="text-xs text-stone-500">
                  <span className="text-stone-400">Instruction:</span>
                  <p className="text-stone-700 mt-0.5">{selectedEdit.instruction}</p>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Created</span>
                  <span className="text-stone-500">{new Date(selectedEdit.timestamp).toLocaleTimeString()}</span>
                </div>
                {selectedEdit.maskAssetId && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Mask</span>
                    <span className="text-purple-500">Applied</span>
                  </div>
                )}
                {parentGen && (
                  <div>
                    <h5 className="text-xs text-stone-400 mb-1.5">Original</h5>
                    <button
                      onClick={() => setPreviewModal({ open: true, imageUrl: parentGen.outputAssets[0]?.url || '', title: 'Original' })}
                      className="relative aspect-square w-14 rounded border border-stone-200 overflow-hidden group"
                    >
                      <img src={parentGen.outputAssets[0]?.url} alt="Original" className="w-full h-full object-cover" />
                    </button>
                  </div>
                )}
                {selectedEdit.maskReferenceAsset && (
                  <div>
                    <h5 className="text-xs text-stone-400 mb-1.5">Mask Ref</h5>
                    <button
                      onClick={() => setPreviewModal({ open: true, imageUrl: selectedEdit.maskReferenceAsset!.url, title: 'Mask Reference' })}
                      className="relative aspect-square w-14 rounded border border-stone-200 overflow-hidden group"
                    >
                      <img src={selectedEdit.maskReferenceAsset.url} alt="Mask" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0.5 left-0.5 bg-purple-100 text-[10px] px-1 py-0.5 rounded text-purple-600">
                        Mask
                      </div>
                    </button>
                  </div>
                )}
              </div>
            );
          } else {
            return <p className="text-xs text-stone-400">Select a generation to view details</p>;
          }
        })()}
      </div>

      {/* Download */}
      <div className="flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            let imageUrl: string | null = null;
            if (selectedGenerationId) {
              const gen = generations.find(g => g.id === selectedGenerationId);
              imageUrl = gen?.outputAssets[0]?.url || null;
            } else {
              imageUrl = useAppStore.getState().canvasImage;
            }
            if (imageUrl?.startsWith('data:')) {
              const link = document.createElement('a');
              link.href = imageUrl;
              link.download = `nano-banana-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
          disabled={!selectedGenerationId && !useAppStore.getState().canvasImage}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      <ImagePreviewModal
        open={previewModal.open}
        onOpenChange={(open) => setPreviewModal(prev => ({ ...prev, open }))}
        imageUrl={previewModal.imageUrl}
        title={previewModal.title}
        description={previewModal.description}
      />
    </div>
  );
};
