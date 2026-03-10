import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { ZoomIn, ZoomOut, RotateCcw, Download, Eye, EyeOff, Eraser } from 'lucide-react';
import { cn } from '../utils/cn';
import { getApiSettings } from '../services/geminiService';

export const ImageCanvas: React.FC = () => {
  const {
    canvasImage,
    canvasZoom,
    setCanvasZoom,
    canvasPan,
    setCanvasPan,
    brushStrokes,
    addBrushStroke,
    clearBrushStrokes,
    showMasks,
    setShowMasks,
    selectedTool,
    isGenerating,
    brushSize,
    setBrushSize
  } = useAppStore();

  const stageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);

  useEffect(() => {
    if (canvasImage) {
      const img = new window.Image();
      img.onload = () => {
        setImage(img);
        if (canvasZoom === 1 && canvasPan.x === 0 && canvasPan.y === 0) {
          const isMobile = window.innerWidth < 768;
          const padding = isMobile ? 0.9 : 0.8;
          const scaleX = (stageSize.width * padding) / img.width;
          const scaleY = (stageSize.height * padding) / img.height;
          const maxZoom = isMobile ? 0.3 : 0.8;
          const optimalZoom = Math.min(scaleX, scaleY, maxZoom);
          setCanvasZoom(optimalZoom);
          setCanvasPan({ x: 0, y: 0 });
        }
      };
      img.src = canvasImage;
    } else {
      setImage(null);
    }
  }, [canvasImage, stageSize, setCanvasZoom, setCanvasPan, canvasZoom, canvasPan]);

  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        setStageSize({ width: container.offsetWidth, height: container.offsetHeight });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleMouseDown = (e: any) => {
    if (selectedTool !== 'mask' || !image) return;
    setIsDrawing(true);
    const stage = e.target.getStage();
    const relativePos = stage.getRelativePointerPosition();
    const imageX = (stageSize.width / canvasZoom - image.width) / 2;
    const imageY = (stageSize.height / canvasZoom - image.height) / 2;
    const relativeX = relativePos.x - imageX;
    const relativeY = relativePos.y - imageY;
    if (relativeX >= 0 && relativeX <= image.width && relativeY >= 0 && relativeY <= image.height) {
      setCurrentStroke([relativeX, relativeY]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || selectedTool !== 'mask' || !image) return;
    const stage = e.target.getStage();
    const relativePos = stage.getRelativePointerPosition();
    const imageX = (stageSize.width / canvasZoom - image.width) / 2;
    const imageY = (stageSize.height / canvasZoom - image.height) / 2;
    const relativeX = relativePos.x - imageX;
    const relativeY = relativePos.y - imageY;
    if (relativeX >= 0 && relativeX <= image.width && relativeY >= 0 && relativeY <= image.height) {
      setCurrentStroke([...currentStroke, relativeX, relativeY]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentStroke.length < 4) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }
    setIsDrawing(false);
    addBrushStroke({
      id: `stroke-${Date.now()}`,
      points: currentStroke,
      brushSize,
    });
    setCurrentStroke([]);
  };

  const handleZoom = (delta: number) => {
    setCanvasZoom(Math.max(0.1, Math.min(3, canvasZoom + delta)));
  };

  const handleReset = () => {
    if (image) {
      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? 0.9 : 0.8;
      const scaleX = (stageSize.width * padding) / image.width;
      const scaleY = (stageSize.height * padding) / image.height;
      const maxZoom = isMobile ? 0.3 : 0.8;
      setCanvasZoom(Math.min(scaleX, scaleY, maxZoom));
      setCanvasPan({ x: 0, y: 0 });
    }
  };

  const handleDownload = async () => {
    if (!canvasImage) return;
    const arr = canvasImage.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    const u8 = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
    const filename = `nano-banana-${Date.now()}.png`;

    // Tauri (Pake): save directly to Downloads folder
    if ((window as any).__TAURI__?.core?.invoke) {
      try {
        await (window as any).__TAURI__.core.invoke('download_file_by_binary', {
          params: { filename, binary: Array.from(u8) }
        });
        return;
      } catch {}
    }

    // Browser fallback
    const blob = new Blob([u8], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const [modelName, setModelName] = useState(getApiSettings().model);
  useEffect(() => {
    const update = () => setModelName(getApiSettings().model);
    window.addEventListener('api-settings-changed', update);
    return () => window.removeEventListener('api-settings-changed', update);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-2.5 border-b border-stone-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => handleZoom(-0.1)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-stone-500 min-w-[48px] text-center font-medium tabular-nums">
              {Math.round(canvasZoom * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={() => handleZoom(0.1)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-stone-200 mx-1" />
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            {selectedTool === 'mask' && (
              <>
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-xs text-stone-500">Brush:</span>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-16 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-stone-500 w-5 tabular-nums">{brushSize}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearBrushStrokes}
                  disabled={brushStrokes.length === 0}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMasks(!showMasks)}
              className={cn(showMasks && 'bg-amber-50 text-amber-700')}
            >
              {showMasks ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1.5 text-xs">Masks</span>
            </Button>

            {canvasImage && (
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline text-xs">Download</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        id="canvas-container"
        className="flex-1 relative overflow-hidden bg-stone-100"
        style={{ backgroundImage: 'radial-gradient(circle, #d6d3d1 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
      >
        {!image && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🍌</span>
              </div>
              <h2 className="text-lg font-semibold text-stone-700 mb-1.5 font-sans">
                Ready to create
              </h2>
              <p className="text-stone-400 text-sm max-w-xs">
                {selectedTool === 'generate'
                  ? 'Describe what you want to create in the prompt box'
                  : 'Upload an image to begin editing'
                }
              </p>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-200 border-t-amber-500 mb-4 mx-auto" />
              <p className="text-stone-500 text-sm">Creating your image...</p>
            </div>
          </div>
        )}

        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={canvasZoom}
          scaleY={canvasZoom}
          x={canvasPan.x * canvasZoom}
          y={canvasPan.y * canvasZoom}
          draggable={selectedTool !== 'mask'}
          onDragEnd={(e) => {
            setCanvasPan({
              x: e.target.x() / canvasZoom,
              y: e.target.y() / canvasZoom
            });
          }}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          style={{ cursor: selectedTool === 'mask' ? 'crosshair' : 'default' }}
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                x={(stageSize.width / canvasZoom - image.width) / 2}
                y={(stageSize.height / canvasZoom - image.height) / 2}
              />
            )}

            {showMasks && brushStrokes.map((stroke) => (
              <Line
                key={stroke.id}
                points={stroke.points}
                stroke="#A855F7"
                strokeWidth={stroke.brushSize}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
                opacity={0.6}
                x={(stageSize.width / canvasZoom - (image?.width || 0)) / 2}
                y={(stageSize.height / canvasZoom - (image?.height || 0)) / 2}
              />
            ))}

            {isDrawing && currentStroke.length > 2 && (
              <Line
                points={currentStroke}
                stroke="#A855F7"
                strokeWidth={brushSize}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
                opacity={0.6}
                x={(stageSize.width / canvasZoom - (image?.width || 0)) / 2}
                y={(stageSize.height / canvasZoom - (image?.height || 0)) / 2}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 border-t border-stone-200 bg-white">
        <div className="flex items-center gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-600">Model:</span>
            <span className="text-stone-500">{modelName}</span>
          </div>
          {brushStrokes.length > 0 && (
            <span className="text-purple-500 font-medium">{brushStrokes.length} stroke{brushStrokes.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
};
