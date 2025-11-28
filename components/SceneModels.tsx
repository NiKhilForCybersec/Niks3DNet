import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { Html } from '@react-three/drei';
import { NodeType } from '../types';

interface NodeModelProps {
  type: NodeType;
  color: string;
  label: string;
  position: [number, number, number];
  isHovered?: boolean;
}

const BaseNode: React.FC<NodeModelProps> = ({ type, color, label, position }) => {
  const meshRef = useRef<Mesh>(null);
  
  // Subtle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  const renderGeometry = () => {
    switch (type) {
      case NodeType.User:
        return (
          <group>
            {/* Laptop Base */}
            <mesh position={[0, -0.4, 0]}>
              <boxGeometry args={[1.2, 0.1, 0.8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Laptop Screen */}
            <mesh position={[0, 0.2, -0.35]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[1.2, 0.8, 0.05]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Screen Glow */}
            <mesh position={[0, 0.2, -0.32]} rotation={[-0.2, 0, 0]}>
              <planeGeometry args={[1.1, 0.7]} />
              <meshBasicMaterial color="#0ea5e9" opacity={0.8} transparent />
            </mesh>
          </group>
        );
      
      case NodeType.Database:
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[0.6, 0.6, 1.2, 32]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.2} />
            </mesh>
            {/* Data stripes */}
            {[0.2, 0, -0.2].map((y, i) => (
              <mesh key={i} position={[0, y, 0]} rotation={[0, 0, 0]}>
                 <cylinderGeometry args={[0.61, 0.61, 0.05, 32]} />
                 <meshBasicMaterial color={color} />
              </mesh>
            ))}
          </group>
        );

      case NodeType.Firewall:
        return (
          <group>
             <mesh>
              <boxGeometry args={[1, 1.2, 1]} />
              <meshStandardMaterial color="#7f1d1d" />
            </mesh>
            {/* Brick texture simulated by lines */}
            <mesh position={[0, 0, 0.51]}>
               <planeGeometry args={[0.8, 1]} />
               <meshBasicMaterial color={color} opacity={0.5} transparent />
            </mesh>
             <Html position={[0, 1.2, 0]} center transform sprite>
                <div className="text-3xl filter drop-shadow-lg">🛡️</div>
            </Html>
          </group>
        );

        case NodeType.WAF:
          return (
            <group>
               <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#4c1d95" />
              </mesh>
              <mesh position={[0,0,0]} scale={[1.05, 1.05, 1.05]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial wireframe color={color} opacity={0.3} transparent />
              </mesh>
               <Html position={[0, 1.2, 0]} center transform sprite>
                  <div className="text-3xl filter drop-shadow-lg">🔍</div>
              </Html>
            </group>
          );
      
      case NodeType.AppServer:
        return (
          <group>
            {/* Rack Cabinet */}
            <mesh>
              <boxGeometry args={[1, 1.5, 1]} />
              <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* Server Lights */}
            {[-0.4, -0.2, 0, 0.2, 0.4].map((y, i) => (
              <group key={i} position={[0, y, 0.51]}>
                <mesh position={[-0.3, 0, 0]}>
                  <planeGeometry args={[0.1, 0.05]} />
                  <meshBasicMaterial color={color} toneMapped={false} />
                </mesh>
                 <mesh position={[-0.1, 0, 0]}>
                  <planeGeometry args={[0.1, 0.05]} />
                  <meshBasicMaterial color="#10b981" toneMapped={false} />
                </mesh>
              </group>
            ))}
          </group>
        );
      
      case NodeType.Internet:
        return (
          <group>
            <mesh>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color={color} wireframe />
            </mesh>
             <Html position={[0, 0, 0]} center>
                <div className="text-4xl filter drop-shadow-lg">☁️</div>
            </Html>
          </group>
        );

      case NodeType.SIEM:
        return (
           <group>
            <mesh>
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={color} wireframe />
            </mesh>
             <mesh scale={[0.5,0.5,0.5]}>
              <octahedronGeometry args={[1, 0]} />
              <meshBasicMaterial color={color} opacity={0.5} transparent />
            </mesh>
          </group>
        );

      default:
        // Generic Node (DNS, IdP, etc)
        return (
          <group>
            <mesh>
              <boxGeometry args={[0.8, 0.8, 0.8]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0.41, 0]} rotation={[-Math.PI/2, 0, 0]}>
               <planeGeometry args={[0.6, 0.6]} />
               <meshBasicMaterial color={color} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group ref={meshRef} position={new Vector3(...position)}>
      {renderGeometry()}
      {/* Label - Increased size and font weight */}
      <Html position={[0, -1.2, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-600 px-3 py-1.5 rounded-md text-sm font-bold font-mono whitespace-nowrap text-white shadow-2xl tracking-wide">
          {label}
        </div>
      </Html>
      
      {/* Floor reflection fake */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color={color} opacity={0.15} transparent />
      </mesh>
    </group>
  );
};

export default BaseNode;