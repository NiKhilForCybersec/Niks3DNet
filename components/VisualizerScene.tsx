import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3, TubeGeometry, Color } from 'three';
import { Html, Text, Trail } from '@react-three/drei';
import { NODES, STEPS } from '../constants';
import BaseNode from './SceneModels';
import { NodeType, SimulationStep, PacketType } from '../types';

interface VisualizerSceneProps {
  currentStepIndex: number;
  isPlaying: boolean;
  onStepComplete: () => void;
}

const ConnectionLine: React.FC<{ start: Vector3; end: Vector3; color: string; active: boolean }> = ({ start, end, color, active }) => {
  const points = useMemo(() => {
    // Elevate the curve slightly to look like a cable
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 0.5; 
    const curve = new CatmullRomCurve3([start, mid, end]);
    return curve.getPoints(20);
  }, [start, end]);

  return (
    <line>
      <bufferGeometry setFromPoints={points} />
      <lineBasicMaterial color={active ? color : '#334155'} linewidth={1} opacity={active ? 1 : 0.2} transparent />
    </line>
  );
};

// The moving data packet
const Packet: React.FC<{ 
  step: SimulationStep; 
  progress: number; 
  isActive: boolean 
}> = ({ step, progress, isActive }) => {
  const packetRef = useRef<any>(null);
  
  const startNode = NODES.find(n => n.id === step.source);
  const endNode = NODES.find(n => n.id === step.target);
  
  if (!startNode || !endNode || !isActive) return null;

  const startPos = new Vector3(...startNode.position);
  const endPos = new Vector3(...endNode.position);

  // Animation Logic
  let currentPos = new Vector3();
  
  if (step.packetType === PacketType.Handshake) {
    // Handshake ping-pong animation
    // Divide progress into 3 phases: 0-0.33, 0.33-0.66, 0.66-1.0
    if (progress < 0.33) {
      // Forward
      const p = progress * 3;
      currentPos.lerpVectors(startPos, endPos, p);
    } else if (progress < 0.66) {
      // Back
      const p = (progress - 0.33) * 3;
      currentPos.lerpVectors(endPos, startPos, p);
    } else {
      // Forward again (ACK)
      const p = (progress - 0.66) * 3;
      currentPos.lerpVectors(startPos, endPos, p);
    }
  } else if (step.id === 11) { // Final return (Response to user) - Multi-hop approximate
      // We cheat a bit for the final return to make it look like it traverses back properly
      // Start (DB) -> User. Simple lerp for now, or the architecture diagram gets messy with multi-hop
      currentPos.lerpVectors(startPos, endPos, progress);
  } else {
    // Standard one-way
    currentPos.lerpVectors(startPos, endPos, progress);
  }

  // Vertical arc
  currentPos.y += Math.sin(progress * Math.PI) * 2;

  // Determine label based on progress
  let label = step.labels?.[0] || '';
  if (step.packetType === PacketType.Handshake && step.labels) {
     if (progress > 0.33) label = step.labels[1];
     if (progress > 0.66) label = step.labels[2];
  }

  const packetColor = step.packetType === PacketType.Token ? '#facc15' : 
                      step.packetType === PacketType.Response ? '#4ade80' : '#0ea5e9';

  return (
    <group position={currentPos}>
        <Trail width={0.6} length={5} color={new Color(packetColor)} attenuation={(t) => t * t}>
            <mesh>
                {/* Increased packet size */}
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial color={packetColor} toneMapped={false} />
            </mesh>
        </Trail>
        
        {/* Floating Label above Packet - Increased Size */}
        <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
           <div className="text-sm font-bold font-mono text-white bg-black/60 px-2 py-1 rounded border border-white/30 whitespace-nowrap shadow-lg backdrop-blur-sm">
             {label}
           </div>
        </Html>
    </group>
  );
};

// Log particles flying to SIEM
const LogParticles: React.FC<{ activeStepIndex: number }> = ({ activeStepIndex }) => {
    const step = STEPS[activeStepIndex];
    const siemNode = NODES.find(n => n.id === NodeType.SIEM);
    const sourceNode = NODES.find(n => n.id === step.source);
    
    // Simple state to trigger animation
    const [particles, setParticles] = useState<{id: number, pos: Vector3}[]>([]);
    
    useEffect(() => {
        if (step.logsToSIEM && siemNode && sourceNode) {
            // Spawn a particle
            setParticles(prev => [...prev, { id: Date.now(), pos: new Vector3(...sourceNode.position) }]);
        }
    }, [activeStepIndex]);

    useFrame((state, delta) => {
        if (particles.length === 0 || !siemNode) return;
        const target = new Vector3(...siemNode.position);
        
        setParticles(prev => prev.map(p => {
            const dir = target.clone().sub(p.pos).normalize();
            p.pos.add(dir.multiplyScalar(10 * delta)); // Move fast
            return p;
        }).filter(p => p.pos.distanceTo(target) > 0.5)); // Remove when close
    });

    if (!siemNode) return null;

    return (
        <group>
            {particles.map(p => (
                 <mesh key={p.id} position={p.pos}>
                    <sphereGeometry args={[0.1]} />
                    <meshBasicMaterial color="#ef4444" />
                 </mesh>
            ))}
        </group>
    )
}

const VisualizerScene: React.FC<VisualizerSceneProps> = ({ currentStepIndex, isPlaying, onStepComplete }) => {
  const [progress, setProgress] = useState(0);
  const currentStep = STEPS[currentStepIndex];

  // Animation Loop
  useFrame((state, delta) => {
    if (isPlaying) {
      const stepDuration = currentStep.duration;
      // Calculate delta progress
      const dp = delta / stepDuration;
      
      setProgress((prev) => {
        const next = prev + dp;
        if (next >= 1) {
            onStepComplete();
            return 0; // Reset for next step
        }
        return next;
      });
    }
  });

  // Calculate connections (Naive: Connect source to target for every step)
  // To make it look like a permanent network, we define permanent links
  const permanentLinks = [
    [NodeType.User, NodeType.Internet],
    [NodeType.Internet, NodeType.DNS],
    [NodeType.Internet, NodeType.Firewall],
    [NodeType.Firewall, NodeType.VPN],
    [NodeType.VPN, NodeType.LoadBalancer],
    [NodeType.LoadBalancer, NodeType.WAF],
    [NodeType.WAF, NodeType.AppServer],
    [NodeType.AppServer, NodeType.IdP],
    [NodeType.AppServer, NodeType.Policy],
    [NodeType.AppServer, NodeType.Database],
  ];

  // Calculate active link based on current step
  const activeLink = [currentStep.source, currentStep.target];

  return (
    <group>
      {/* Lights */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4ade80" />
      
      {/* Nodes */}
      {NODES.map((node) => (
        <BaseNode 
          key={node.id} 
          {...node} 
          type={node.id}
        />
      ))}

      {/* Connections */}
      {permanentLinks.map(([sourceId, targetId], idx) => {
         const s = NODES.find(n => n.id === sourceId);
         const t = NODES.find(n => n.id === targetId);
         if (!s || !t) return null;
         
         const isActive = (currentStep.source === sourceId && currentStep.target === targetId) ||
                          (currentStep.source === targetId && currentStep.target === sourceId);

         return (
             <ConnectionLine 
                key={idx} 
                start={new Vector3(...s.position)} 
                end={new Vector3(...t.position)} 
                color={s.color} 
                active={isActive}
            />
         );
      })}

      {/* Connection to SIEM (faint usually) */}
      {NODES.filter(n => n.id !== NodeType.SIEM && n.id !== NodeType.Internet && n.id !== NodeType.User).map((n, i) => {
          const siem = NODES.find(x => x.id === NodeType.SIEM);
          if(!siem) return null;
          return <ConnectionLine key={`siem-${i}`} start={new Vector3(...n.position)} end={new Vector3(...siem.position)} color="#ef4444" active={false} />
      })}


      {/* Active Packet */}
      <Packet 
        step={currentStep} 
        progress={progress} 
        isActive={isPlaying} 
      />

      {/* SIEM Logs Effect */}
      <LogParticles activeStepIndex={currentStepIndex} />

      {/* Grid Floor */}
      <gridHelper args={[60, 60, 0x1e293b, 0x0f172a]} position={[0, -2, 0]} />
    </group>
  );
};

export default VisualizerScene;