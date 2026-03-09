import React, { useState, useRef } from 'react';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useImageGeneration, useImageEditing } from '../hooks/useImageGeneration';
import { Upload, Wand2, Edit3, MousePointer, HelpCircle, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { blobToBase64 } from '../utils/imageUtils';
import { PromptHints } from './PromptHints';
import { cn } from '../utils/cn';

export const PromptComposer: React.FC = () => {
  const {
    currentPrompt,
    setCurrentPrompt,
    selectedTool,
    setSelectedTool,
    temperature,
    setTemperature,
    seed,
    setSeed,
    isGenerating,
    uploadedImages,
    addUploadedImage,
    removeUploadedImage,
    clearUploadedImages,
    editReferenceImages,
    addEditReferenceImage,
    removeEditReferenceImage,
    clearEditReferenceImages,
    canvasImage,
    setCanvasImage,
    showPromptPanel,
    setShowPromptPanel,
    clearBrushStrokes,
  } = useAppStore();

  const { generate } = useImageGeneration();
  const { edit } = useImageEditing();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    if (!currentPrompt.trim()) return;

    if (selectedTool === 'generate') {
      const referenceImages = uploadedImages
        .filter(img => img.includes('base64,'))
        .map(img => img.split('base64,')[1]);

      generate({
        prompt: currentPrompt,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        temperature,
        seed: seed || undefined
      });
    } else if (selectedTool === 'edit' || selectedTool === 'mask') {
      edit(currentPrompt);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await blobToBase64(file);
        const dataUrl = `data:${file.type};base64,${base64}`;

        if (selectedTool === 'generate') {
          if (uploadedImages.length < 2) addUploadedImage(dataUrl);
        } else if (selectedTool === 'edit') {
          if (editReferenceImages.length < 2) addEditReferenceImage(dataUrl);
          if (!canvasImage) setCanvasImage(dataUrl);
        } else if (selectedTool === 'mask') {
          clearUploadedImages();
          addUploadedImage(dataUrl);
          setCanvasImage(dataUrl);
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
  };

  const handleClearSession = () => {
    setCurrentPrompt('');
    clearUploadedImages();
    clearEditReferenceImages();
    clearBrushStrokes();
    setCanvasImage(null);
    setSeed(null);
    setTemperature(0.7);
    setShowClearConfirm(false);
  };

  const tools = [
    { id: 'generate', icon: Wand2, label: 'Generate' },
    { id: 'edit', icon: Edit3, label: 'Edit' },
    { id: 'mask', icon: MousePointer, label: 'Select' },
  ] as const;

  if (!showPromptPanel) {
    return (
      <div className="w-8 bg-white border-r border-stone-200 flex flex-col items-center justify-center">
        <button
          onClick={() => setShowPromptPanel(true)}
          className="w-6 h-16 bg-stone-100 hover:bg-stone-200 rounded-r-lg border border-l-0 border-stone-200 flex items-center justify-center group"
          title="Show Prompt Panel"
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
    <>
    <div className="w-80 lg:w-72 xl:w-80 h-full bg-white border-r border-stone-200 p-5 flex flex-col gap-5 overflow-y-auto">
      {/* Mode */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-sans">Mode</h3>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHintsModal(true)}
              className="h-6 w-6"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPromptPanel(false)}
              className="h-6 w-6"
              title="Hide"
            >
              <span className="text-xs">×</span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={cn(
                'flex flex-col items-center py-2.5 px-2 rounded-lg border text-xs font-medium',
                selectedTool === tool.id
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-600'
              )}
            >
              <tool.icon className="h-4 w-4 mb-1" />
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload */}
      <div>
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block font-sans">
          {selectedTool === 'generate' ? 'Reference' : selectedTool === 'edit' ? 'Style Ref' : 'Image'}
        </label>
        <p className="text-xs text-stone-400 mb-2.5">
          {selectedTool === 'generate' && 'Optional, up to 2 images'}
          {selectedTool === 'edit' && (canvasImage ? 'Optional style refs, up to 2' : 'Upload image to edit')}
          {selectedTool === 'mask' && 'Edit an image with masks'}
        </p>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
          disabled={
            (selectedTool === 'generate' && uploadedImages.length >= 2) ||
            (selectedTool === 'edit' && editReferenceImages.length >= 2)
          }
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>

        {((selectedTool === 'generate' && uploadedImages.length > 0) ||
          (selectedTool === 'edit' && editReferenceImages.length > 0)) && (
          <div className="mt-2.5 space-y-2">
            {(selectedTool === 'generate' ? uploadedImages : editReferenceImages).map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-stone-200"
                />
                <button
                  onClick={() => selectedTool === 'generate' ? removeUploadedImage(index) : removeEditReferenceImage(index)}
                  className="absolute top-1 right-1 bg-white/90 text-stone-500 hover:text-stone-700 rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm"
                >
                  ×
                </button>
                <div className="absolute bottom-1 left-1 bg-white/90 text-xs px-1.5 py-0.5 rounded text-stone-600 shadow-sm">
                  Ref {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt */}
      <div>
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 block font-sans">
          Prompt
        </label>
        <Textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder={
            selectedTool === 'generate'
              ? 'A serene mountain landscape at sunset with a lake...'
              : 'Make the sky more dramatic, add storm clouds...'
          }
          className="min-h-[100px] resize-none"
        />

        <button
          onClick={() => setShowHintsModal(true)}
          className="mt-1.5 flex items-center text-xs group"
        >
          {currentPrompt.length < 20 ? (
            <div className="h-1.5 w-1.5 rounded-full mr-1.5 bg-stone-300" />
          ) : (
            <div className={cn(
              'h-1.5 w-1.5 rounded-full mr-1.5',
              currentPrompt.length < 50 ? 'bg-amber-400' : 'bg-emerald-400'
            )} />
          )}
          <span className="text-stone-400 group-hover:text-stone-500">
            {currentPrompt.length < 20 ? 'Add detail for better results' :
             currentPrompt.length < 50 ? 'Good detail' : 'Excellent detail'}
          </span>
        </button>
      </div>

      {/* Generate */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !currentPrompt.trim()}
        className="w-full h-11 text-sm font-semibold"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            {selectedTool === 'generate' ? 'Generate' : 'Apply Edit'}
          </>
        )}
      </Button>

      {/* Advanced */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-xs text-stone-400 hover:text-stone-600"
        >
          {showAdvanced ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
          Advanced
        </button>

        <button
          onClick={() => setShowClearConfirm(!showClearConfirm)}
          className="flex items-center text-xs text-stone-400 hover:text-red-500 mt-2"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Clear Session
        </button>

        {showClearConfirm && (
          <div className="mt-2.5 p-3 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-xs text-stone-500 mb-2.5">Clear all uploads, prompts, and canvas?</p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleClearSession} className="flex-1">
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-stone-500 mb-1.5 block">
                Creativity ({temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1.5 block">Seed</label>
              <input
                type="number"
                value={seed || ''}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Random"
                className="w-full h-8 px-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Shortcuts */}
      <div className="pt-4 border-t border-stone-100">
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 font-sans">Shortcuts</h4>
        <div className="space-y-1 text-xs text-stone-400">
          {[
            ['Generate', '⌘ Enter'],
            ['Edit mode', 'E'],
            ['History', 'H'],
            ['Panel', 'P'],
          ].map(([label, key]) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <kbd className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-500 font-mono text-[10px]">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
    <PromptHints open={showHintsModal} onOpenChange={setShowHintsModal} />
    </>
  );
};
