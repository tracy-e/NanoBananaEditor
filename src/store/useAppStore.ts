import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Project, Generation, Edit, SegmentationMask, BrushStroke } from '../types';
import { CacheService } from '../services/cacheService';

interface AppState {
  // Error modal
  errorModal: { message: string } | null;
  showErrorModal: (message: string) => void;
  clearErrorModal: () => void;

  // Current project
  currentProject: Project | null;
  
  // Canvas state
  canvasImage: string | null;
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  
  // Upload state
  uploadedImages: string[];
  editReferenceImages: string[];
  
  // Brush strokes for painting masks
  brushStrokes: BrushStroke[];
  brushSize: number;
  showMasks: boolean;
  
  // Generation state
  isGenerating: boolean;
  currentPrompt: string;
  temperature: number;
  seed: number | null;
  imageSize: string;
  
  // History and variants
  selectedGenerationId: string | null;
  selectedEditId: string | null;
  showHistory: boolean;
  
  // Panel visibility
  showPromptPanel: boolean;
  
  // UI state
  selectedTool: 'generate' | 'edit' | 'mask';
  
  // Actions
  loadProject: (project: Project) => void;
  setCurrentProject: (project: Project | null) => void;
  setCanvasImage: (url: string | null) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number; y: number }) => void;
  
  addUploadedImage: (url: string) => void;
  removeUploadedImage: (index: number) => void;
  reorderUploadedImages: (from: number, to: number) => void;
  clearUploadedImages: () => void;

  addEditReferenceImage: (url: string) => void;
  removeEditReferenceImage: (index: number) => void;
  reorderEditReferenceImages: (from: number, to: number) => void;
  clearEditReferenceImages: () => void;
  
  addBrushStroke: (stroke: BrushStroke) => void;
  clearBrushStrokes: () => void;
  setBrushSize: (size: number) => void;
  setShowMasks: (show: boolean) => void;
  
  setIsGenerating: (generating: boolean) => void;
  setCurrentPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
  setSeed: (seed: number | null) => void;
  setImageSize: (size: string) => void;
  
  addGeneration: (generation: Generation) => void;
  removeGeneration: (id: string) => void;
  addEdit: (edit: Edit) => void;
  removeEdit: (id: string) => void;
  selectGeneration: (id: string | null) => void;
  selectEdit: (id: string | null) => void;
  setShowHistory: (show: boolean) => void;
  
  setShowPromptPanel: (show: boolean) => void;
  
  setSelectedTool: (tool: 'generate' | 'edit' | 'mask') => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Error modal
      errorModal: null,
      showErrorModal: (message) => set({ errorModal: { message } }),
      clearErrorModal: () => set({ errorModal: null }),

      // Initial state
      currentProject: null,
      canvasImage: null,
      canvasZoom: 1,
      canvasPan: { x: 0, y: 0 },
      
      uploadedImages: [],
      editReferenceImages: [],
      
      brushStrokes: [],
      brushSize: 20,
      showMasks: true,
      
      isGenerating: false,
      currentPrompt: '',
      temperature: 0.7,
      seed: null,
      imageSize: '1K',
      
      selectedGenerationId: null,
      selectedEditId: null,
      showHistory: true,
      
      showPromptPanel: true,
      
      selectedTool: 'generate',
      
      // Actions
      loadProject: (project) => set({ currentProject: project }),
      setCurrentProject: (project) => {
        set({ currentProject: project });
        if (project) CacheService.saveProject(project);
      },
      setCanvasImage: (url) => set({ canvasImage: url }),
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      setCanvasPan: (pan) => set({ canvasPan: pan }),
      
      addUploadedImage: (url) => set((state) => ({ 
        uploadedImages: [...state.uploadedImages, url] 
      })),
      removeUploadedImage: (index) => set((state) => ({
        uploadedImages: state.uploadedImages.filter((_, i) => i !== index)
      })),
      reorderUploadedImages: (from, to) => set((state) => {
        const arr = [...state.uploadedImages];
        const [item] = arr.splice(from, 1);
        arr.splice(to, 0, item);
        return { uploadedImages: arr };
      }),
      clearUploadedImages: () => set({ uploadedImages: [] }),

      addEditReferenceImage: (url) => set((state) => ({
        editReferenceImages: [...state.editReferenceImages, url]
      })),
      removeEditReferenceImage: (index) => set((state) => ({
        editReferenceImages: state.editReferenceImages.filter((_, i) => i !== index)
      })),
      reorderEditReferenceImages: (from, to) => set((state) => {
        const arr = [...state.editReferenceImages];
        const [item] = arr.splice(from, 1);
        arr.splice(to, 0, item);
        return { editReferenceImages: arr };
      }),
      clearEditReferenceImages: () => set({ editReferenceImages: [] }),
      
      addBrushStroke: (stroke) => set((state) => ({ 
        brushStrokes: [...state.brushStrokes, stroke] 
      })),
      clearBrushStrokes: () => set({ brushStrokes: [] }),
      setBrushSize: (size) => set({ brushSize: size }),
      setShowMasks: (show) => set({ showMasks: show }),
      
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
      setTemperature: (temp) => set({ temperature: temp }),
      setSeed: (seed) => set({ seed: seed }),
      setImageSize: (size) => set({ imageSize: size }),
      
      addGeneration: (generation) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            generations: [...state.currentProject.generations, generation],
            updatedAt: Date.now()
          } : null
        }));
        const project = get().currentProject;
        if (project) CacheService.saveProject(project);
      },

      removeGeneration: (id) => {
        set((state) => {
          if (!state.currentProject) return {};
          const updates: Partial<AppState> = {
            currentProject: {
              ...state.currentProject,
              generations: state.currentProject.generations.filter(g => g.id !== id),
              updatedAt: Date.now()
            }
          };
          if (state.selectedGenerationId === id) {
            updates.selectedGenerationId = null;
            updates.canvasImage = null;
          }
          return updates;
        });
        const project = get().currentProject;
        if (project) CacheService.saveProject(project);
      },

      addEdit: (edit) => {
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            edits: [...state.currentProject.edits, edit],
            updatedAt: Date.now()
          } : null
        }));
        const project = get().currentProject;
        if (project) CacheService.saveProject(project);
      },

      removeEdit: (id) => {
        set((state) => {
          if (!state.currentProject) return {};
          const updates: Partial<AppState> = {
            currentProject: {
              ...state.currentProject,
              edits: state.currentProject.edits.filter(e => e.id !== id),
              updatedAt: Date.now()
            }
          };
          if (state.selectedEditId === id) {
            updates.selectedEditId = null;
            updates.canvasImage = null;
          }
          return updates;
        });
        const project = get().currentProject;
        if (project) CacheService.saveProject(project);
      },
      
      selectGeneration: (id) => set({ selectedGenerationId: id }),
      selectEdit: (id) => set({ selectedEditId: id }),
      setShowHistory: (show) => set({ showHistory: show }),
      
      setShowPromptPanel: (show) => set({ showPromptPanel: show }),
      
      setSelectedTool: (tool) => set({ selectedTool: tool }),
    }),
    { name: 'nano-banana-store' }
  )
);