
import React, { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import StereogramCanvas from './components/StereogramCanvas';
import { GenerationParams, TextureMode } from './types';

const App: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateTrigger, setGenerateTrigger] = useState(0);
  
  const [params, setParams] = useState<GenerationParams>({
    sourceType: 'TEXT',
    text: 'MAGIC',
    fontSize: 200,
    depth: 20,
    mode: TextureMode.COLOR_NOISE,
    patternScale: 1.0
  });

  const handleGenerate = (newParams: GenerationParams) => {
    setError(null);
    setParams(newParams);
    setGenerateTrigger(prev => prev + 1);
  };

  const handleLoading = (loading: boolean) => {
    setIsGenerating(loading);
  };

  const handleError = (msg: string) => {
    setError(msg);
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] w-full bg-black overflow-hidden">
      
      {/* Sidebar Controls */}
      <div className="flex-shrink-0 lg:h-full lg:w-80 border-r border-zinc-800">
        <ControlPanel isGenerating={isGenerating} onGenerate={handleGenerate} />
      </div>

      {/* Main Canvas Area */}
      <main className="flex-grow relative p-2 lg:p-8 flex flex-col items-center justify-center bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black overflow-hidden">
        
        {/* Error Toast */}
        {error && (
            <div className="absolute top-4 right-4 z-50 bg-red-900/90 border border-red-500 text-white px-4 py-3 rounded shadow-lg max-w-md animate-bounce-in">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 text-red-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className="font-bold text-sm">Error</h3>
                        <p className="text-xs opacity-90">{error}</p>
                        <button onClick={() => setError(null)} className="mt-2 text-xs underline hover:text-red-200">Dismiss</button>
                    </div>
                </div>
            </div>
        )}

        <StereogramCanvas 
            params={params} 
            onLoading={handleLoading} 
            onError={handleError}
            triggerGenerate={generateTrigger}
        />

      </main>
    </div>
  );
};

export default App;
