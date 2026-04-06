
import React, { useEffect, useState, useRef } from 'react';
import { TextureMode, GenerationParams } from '../types';
import { generateDepthMap, generateDepthMapFromImage, renderStereogram } from '../utils/stereogramEngine';
import { generateTexturePattern } from '../services/geminiService';

interface Props {
  params: GenerationParams;
  onLoading: (isLoading: boolean) => void;
  onError: (error: string) => void;
  triggerGenerate: number; // increment to trigger
}

const StereogramCanvas: React.FC<Props> = ({ params, onLoading, onError, triggerGenerate }) => {
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [depthMapPreview, setDepthMapPreview] = useState<string | null>(null);
  const [showDepthMap, setShowDepthMap] = useState(false);
  
  // Canvas dimensions
  const width = 1024;
  const height = 768;

  useEffect(() => {
    if (triggerGenerate === 0) return;

    const process = async () => {
      onLoading(true);
      setResultImage(null);
      try {
        // 1. Generate Depth Map
        let depthUrl: string;
        if (params.sourceType === 'IMAGE' && params.depthImage) {
            depthUrl = await generateDepthMapFromImage(params.depthImage, width, height);
        } else {
            depthUrl = generateDepthMap(params.text, width, height, params.fontSize);
        }
        setDepthMapPreview(depthUrl);

        // 2. Get Texture
        let textureUrl: string | null = null;
        
        if (params.mode === TextureMode.AI_GENERATED && params.aiPrompt) {
          try {
             textureUrl = await generateTexturePattern(params.aiPrompt);
          } catch (e) {
             console.warn("AI generation failed, falling back to noise", e);
             onError("AI Texture generation failed. Using noise fallback. (Check API Key?)");
          }
        }

        // 3. Render
        const finalUrl = await renderStereogram(depthUrl, textureUrl, width, height, {
            contrast: 1,
            patternScale: params.patternScale,
            isColorful: params.mode === TextureMode.COLOR_NOISE
        });

        setResultImage(finalUrl);
      } catch (e: any) {
        onError(e.message || "Generation failed");
      } finally {
        onLoading(false);
      }
    };

    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerGenerate]);

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.download = `magiceye-${params.sourceType === 'TEXT' ? params.text : 'image'}.png`;
    link.href = resultImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center w-full h-full bg-zinc-900 rounded-lg lg:rounded-xl overflow-hidden border border-zinc-800 relative shadow-2xl">
      
      {/* Display Area */}
      <div className="relative w-full flex-grow flex items-center justify-center bg-black overflow-hidden">
        {!resultImage && (
            <div className="text-zinc-600 flex flex-col items-center animate-pulse p-4 text-center">
                <p className="text-sm font-mono tracking-widest">AWAITING_INPUT</p>
                <p className="text-[10px] mt-2 opacity-50">Choose Text or Image source and press Generate</p>
            </div>
        )}
        
        {resultImage && (
          <img 
            src={showDepthMap && depthMapPreview ? depthMapPreview : resultImage} 
            alt="Stereogram" 
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Guide Dots for beginners */}
        {resultImage && !showDepthMap && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-8 pointer-events-none opacity-40">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full blur-[1px]"></div>
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full blur-[1px]"></div>
            </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="w-full p-2 lg:p-4 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
             <button
                onClick={() => setShowDepthMap(!showDepthMap)}
                disabled={!resultImage}
                className={`px-3 py-1.5 text-[10px] font-mono rounded transition-colors ${
                    showDepthMap 
                    ? 'bg-indigo-900 text-indigo-200 border border-indigo-700' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
             >
                {showDepthMap ? 'HIDE DEPTH' : 'SHOW DEPTH'}
             </button>
             <span className="text-[9px] text-zinc-600 hidden md:block uppercase tracking-tighter">
                (Center your vision between the red dots)
             </span>
        </div>

        <button
            onClick={handleDownload}
            disabled={!resultImage}
            className="px-3 lg:px-4 py-1.5 lg:py-2 bg-white text-black font-bold text-[11px] lg:text-sm rounded hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
            <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="hidden sm:inline">DOWNLOAD</span>
            <span className="sm:hidden">SAVE</span>
        </button>
      </div>
    </div>
  );
};

export default StereogramCanvas;
