import { Vector3 } from 'three';

export enum NodeType {
  User = 'USER',
  Internet = 'INTERNET',
  DNS = 'DNS',
  Firewall = 'FIREWALL',
  VPN = 'VPN',
  LoadBalancer = 'LB',
  WAF = 'WAF',
  AppServer = 'APP',
  IdP = 'IDP',
  Policy = 'POLICY',
  Database = 'DB',
  SIEM = 'SIEM'
}

export interface NodeConfig {
  id: NodeType;
  label: string;
  position: [number, number, number];
  color: string;
  icon?: string;
  description?: string;
}

export enum PacketType {
  Request = 'REQUEST',
  Response = 'RESPONSE',
  Handshake = 'HANDSHAKE',
  Log = 'LOG',
  Token = 'TOKEN'
}

export interface SimulationStep {
  id: number;
  title: string;
  description: string;
  source: NodeType;
  target: NodeType;
  duration: number; // in seconds
  packetType: PacketType;
  labels?: string[]; // E.g., ["SYN", "ACK"]
  logsToSIEM?: boolean; // If true, spawns a log packet to SIEM
  isReturn?: boolean; // If true, packet moves backwards visually
}

export interface AnimationState {
  currentStepIndex: number;
  isPlaying: boolean;
  progress: number; // 0 to 1 for current step
  logs: string[];
}