import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, PerspectiveCamera } from '@react-three/drei';
import VisualizerScene from './components/VisualizerScene';
import UIOverlay from './components/UIOverlay';
import { STEPS } from './constants';

const App: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Handlers
  const handleStepComplete = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = prev + 1;
      if (next >= STEPS.length) {
        setIsPlaying(false);
        return prev; // Stay on last step
      }
      return next;
    });
  }, []);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  
  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    // Small timeout to allow render reset before playing potentially
    setTimeout(() => setIsPlaying(true), 100);
  };

  const handleNext = () => {
    setCurrentStepIndex(prev => Math.min(prev + 1, STEPS.length - 1));
    setIsPlaying(false);
  };

  const handlePrev = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    setIsPlaying(false);
  };

  const handleJump = (index: number) => {
    setCurrentStepIndex(index);
    setIsPlaying(false);
  };

  return (
    <div className="w-full h-screen relative bg-slate-950">
      
      {/* 3D Scene */}
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 10, 25]} fov={50} />
        
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 20, 60]} />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <VisualizerScene 
            currentStepIndex={currentStepIndex} 
            isPlaying={isPlaying} 
            onStepComplete={handleStepComplete} 
          />
        </Suspense>

        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
          minDistance={10}
          maxDistance={50}
        />
      </Canvas>

      {/* UI Overlay */}
      <UIOverlay 
        currentStepIndex={currentStepIndex}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onRestart={handleRestart}
        onNext={handleNext}
        onPrev={handlePrev}
        onJumpToStep={handleJump}
      />
      
    </div>
  );
};

export default App;