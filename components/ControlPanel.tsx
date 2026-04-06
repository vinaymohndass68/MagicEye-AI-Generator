
import React, { useState, useRef } from 'react';
import { TextureMode, GenerationParams, SourceType } from '../types';

interface Preset {
  name: string;
  text: string;
  fontSize: number;
  mode: TextureMode;
  patternScale: number;
  aiPrompt?: string;
}

const PRESETS: Preset[] = [
  {
    name: 'Simple',
    text: 'MAGIC',
    fontSize: 280,
    mode: TextureMode.NOISE,
    patternScale: 1.5,
  },
  {
    name: 'Nature',
    text: 'LEAF',
    fontSize: 220,
    mode: TextureMode.AI_GENERATED,
    patternScale: 0.8,
    aiPrompt: 'Macro photo of lush green forest moss and small autumn leaves'
  },
  {
    name: 'Vibrant',
    text: 'STREAK',
    fontSize: 320,
    mode: TextureMode.COLOR_NOISE,
    patternScale: 0.6,
  },
  {
    name: 'Detail',
    text: 'CRYSTAL',
    fontSize: 180,
    mode: TextureMode.COLOR_NOISE,
    patternScale: 2.2,
  }
];

interface Props {
  isGenerating: boolean;
  onGenerate: (params: GenerationParams) => void;
}

const ControlPanel: React.FC<Props> = ({ isGenerating, onGenerate }) => {
  const [sourceType, setSourceType] = useState<SourceType>('TEXT');
  const [text, setText] = useState('MAGIC');
  const [fontSize, setFontSize] = useState(250);
  const [mode, setMode] = useState<TextureMode>(TextureMode.COLOR_NOISE);
  const [aiPrompt, setAiPrompt] = useState('');
  const [patternScale, setPatternScale] = useState(1.0);
  const [depthImage, setDepthImage] = useState<string | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyPreset = (preset: Preset) => {
    setSourceType('TEXT');
    setText(preset.text);
    setFontSize(preset.fontSize);
    setMode(preset.mode);
    setPatternScale(preset.patternScale);
    if (preset.aiPrompt) setAiPrompt(preset.aiPrompt);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const result = readerEvent.target?.result;
        if (typeof result === 'string') {
          setDepthImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceType === 'IMAGE' && !depthImage) {
        alert("Please upload an image first.");
        return;
    }
    
    onGenerate({
      sourceType,
      text: text.toUpperCase(),
      fontSize,
      depth: 20,
      mode,
      aiPrompt: mode === TextureMode.AI_GENERATED ? (aiPrompt || 'Abstract Pattern') : undefined,
      patternScale,
      depthImage
    });
  };

  return (
    <div className="w-full h-full bg-zinc-900 p-4 lg:p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          DEPTH_GEN
        </h1>
        <p className="text-[10px] text-zinc-500 font-mono tracking-tighter">AUTOSTEREOGRAM CREATOR</p>
      </div>

      {/* Source Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Hidden Source</label>
        <div className="flex gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-md">
            <button
                type="button"
                onClick={() => setSourceType('TEXT')}
                className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                    sourceType === 'TEXT' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'
                }`}
            >
                TEXT
            </button>
            <button
                type="button"
                onClick={() => setSourceType('IMAGE')}
                className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                    sourceType === 'IMAGE' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'
                }`}
            >
                IMAGE
            </button>
        </div>
      </div>

      {/* Presets Section - only for text mode */}
      {sourceType === 'TEXT' && (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Text Presets</label>
            <div className="flex flex-wrap gap-1">
            {PRESETS.map((preset) => (
                <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-0.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 rounded transition-colors"
                >
                {preset.name}
                </button>
            ))}
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:gap-4">
        
        {/* Source Inputs */}
        {sourceType === 'TEXT' ? (
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Hidden Word</label>
                <input
                    type="text"
                    maxLength={12}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-md font-mono text-center tracking-widest text-white focus:ring-1 focus:ring-indigo-500 outline-none uppercase"
                    placeholder="HIDDEN"
                />
            </div>
        ) : (
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Upload Image</label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video bg-zinc-950 border-2 border-dashed border-zinc-800 rounded flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-colors group relative overflow-hidden"
                >
                    {depthImage ? (
                        <>
                            <img src={depthImage} alt="Preview" className="w-full h-full object-cover opacity-40" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[10px] text-white font-bold bg-black/50 px-2 py-1 rounded">CHANGE IMAGE</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6 text-zinc-600 group-hover:text-indigo-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-[10px] text-zinc-500">JPG/PNG/WEBP</span>
                        </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
            </div>
        )}

        {/* Sliders Container */}
        <div className="grid grid-cols-1 gap-3">
          {sourceType === 'TEXT' && (
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-400">Text Size</label>
                    <span className="text-[10px] font-mono text-zinc-500">{fontSize}px</span>
                </div>
                <input 
                    type="range" 
                    min="100" 
                    max="400" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>
          )}

          <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-zinc-400">Pattern Zoom</label>
                  <span className="text-[10px] font-mono text-zinc-500">{patternScale.toFixed(1)}x</span>
              </div>
              <input 
                  type="range" 
                  min="0.5" 
                  max="3.0" 
                  step="0.1"
                  value={patternScale} 
                  onChange={(e) => setPatternScale(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
          </div>
        </div>

        {/* Texture Mode */}
        <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400">Pattern Source</label>
            <div className="grid grid-cols-3 gap-1.5">
                <button
                    type="button"
                    onClick={() => setMode(TextureMode.NOISE)}
                    className={`py-1.5 text-[9px] font-bold rounded border transition-all ${
                        mode === TextureMode.NOISE 
                        ? 'bg-zinc-800 border-zinc-600 text-white' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'
                    }`}
                >
                    B/W
                </button>
                <button
                    type="button"
                    onClick={() => setMode(TextureMode.COLOR_NOISE)}
                    className={`py-1.5 text-[9px] font-bold rounded border transition-all ${
                        mode === TextureMode.COLOR_NOISE
                        ? 'bg-zinc-800 border-indigo-500 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.2)]' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'
                    }`}
                >
                    COLOR
                </button>
                <button
                    type="button"
                    onClick={() => setMode(TextureMode.AI_GENERATED)}
                    className={`py-1.5 text-[9px] font-bold rounded border transition-all ${
                        mode === TextureMode.AI_GENERATED 
                        ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-200' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'
                    }`}
                >
                    AI
                </button>
            </div>
        </div>

        {/* AI Prompt Input */}
        {mode === TextureMode.AI_GENERATED && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
                 <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Pattern description (e.g., blue marbles)"
                    rows={2}
                    className="bg-zinc-950 border border-indigo-900/40 rounded p-2 text-xs text-zinc-300 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                 />
            </div>
        )}

        <button
            type="submit"
            disabled={isGenerating || (sourceType === 'TEXT' && !text) || (sourceType === 'IMAGE' && !depthImage)}
            className={`mt-1 py-3 rounded text-sm font-bold tracking-wider transition-all flex justify-center items-center gap-2
                ${isGenerating 
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg'
                }`}
        >
            {isGenerating ? 'PROCESSING...' : 'GENERATE'}
        </button>

      </form>
      
      <div className="mt-auto pt-4 border-t border-zinc-800 hidden lg:block">
        <div className="text-[10px] text-zinc-600 leading-relaxed">
            <p className="mb-1 font-bold text-zinc-500 uppercase tracking-tighter">Viewing Guide:</p>
            1. Nose against center of image.<br/>
            2. Look "through" the screen.<br/>
            3. Back away slowly.<br/>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
