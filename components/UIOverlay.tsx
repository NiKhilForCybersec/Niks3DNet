import React from 'react';
import { STEPS, NODES } from '../constants';
import { Play, Pause, SkipBack, SkipForward, RefreshCw, ShieldCheck, Server, Globe, Database, FileText } from 'lucide-react';
import { NodeType } from '../types';

interface UIOverlayProps {
  currentStepIndex: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  onNext: () => void;
  onPrev: () => void;
  onJumpToStep: (index: number) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  currentStepIndex, 
  isPlaying, 
  onPlayPause, 
  onRestart, 
  onNext, 
  onPrev,
  onJumpToStep
}) => {
  const currentStep = STEPS[currentStepIndex];
  const currentNode = NODES.find(n => n.id === currentStep.source);
  
  // Auto-scroll timeline
  React.useEffect(() => {
    const el = document.getElementById(`step-${currentStepIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStepIndex]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Header */}
      <div className="pointer-events-auto flex justify-between items-start">
        <div className="bg-black/80 backdrop-blur-md p-4 rounded-lg border border-slate-800 shadow-2xl max-w-md">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            Enterprise Request Lifecycle
          </h1>
          <div className="flex items-center gap-2 mb-3">
             <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
               STEP {currentStepIndex + 1} / {STEPS.length}
             </span>
             <span className="text-sm font-semibold text-white">{currentStep.title}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>
          
          <div className="mt-4 flex gap-2">
             <div className="flex items-center gap-1 text-xs text-slate-500">
                <Globe size={12} />
                <span>{currentNode?.label}</span>
             </div>
             <span className="text-slate-700">→</span>
             <div className="flex items-center gap-1 text-xs text-slate-500">
                <Server size={12} />
                <span>{NODES.find(n => n.id === currentStep.target)?.label}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Timeline Sidebar (Right) */}
      <div className="absolute right-6 top-6 bottom-20 w-72 pointer-events-auto flex flex-col">
         <div className="bg-black/80 backdrop-blur-md rounded-lg border border-slate-800 shadow-2xl flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 bg-slate-900/50">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sequence</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
               {STEPS.map((step, idx) => {
                 const isActive = idx === currentStepIndex;
                 const isPast = idx < currentStepIndex;
                 return (
                   <button
                     key={step.id}
                     id={`step-${idx}`}
                     onClick={() => onJumpToStep(idx)}
                     className={`w-full text-left p-2 rounded text-xs flex items-center gap-2 transition-colors
                       ${isActive ? 'bg-blue-500/20 border border-blue-500/50 text-white' : 
                         isPast ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-800'
                       }
                     `}
                   >
                     <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 animate-pulse' : isPast ? 'bg-slate-500' : 'bg-slate-700'}`} />
                     <span className="truncate flex-1">{step.title}</span>
                     {step.logsToSIEM && <FileText size={10} className="text-rose-500 opacity-70" />}
                   </button>
                 )
               })}
            </div>
         </div>
      </div>

      {/* Playback Controls (Bottom) */}
      <div className="pointer-events-auto flex justify-center pb-4">
        <div className="bg-black/80 backdrop-blur-md p-2 rounded-full border border-slate-700 shadow-2xl flex items-center gap-2">
           <button onClick={onRestart} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 transition-colors" title="Restart">
              <RefreshCw size={20} />
           </button>
           <div className="w-px h-6 bg-slate-700 mx-1"></div>
           <button onClick={onPrev} className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors" title="Previous Step">
              <SkipBack size={24} fill="currentColor" />
           </button>
           <button 
             onClick={onPlayPause} 
             className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
             title={isPlaying ? "Pause" : "Play"}
           >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5"/>}
           </button>
           <button onClick={onNext} className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors" title="Next Step">
              <SkipForward size={24} fill="currentColor" />
           </button>
        </div>
      </div>

    </div>
  );
};

export default UIOverlay;