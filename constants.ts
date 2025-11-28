import { NodeConfig, NodeType, SimulationStep, PacketType } from './types';

export const NODES: NodeConfig[] = [
  { id: NodeType.User, label: 'Remote User', position: [-12, 0, 4], color: '#60a5fa' }, // Blue
  { id: NodeType.Internet, label: 'Internet', position: [-8, 0, 0], color: '#94a3b8' }, // Gray
  { id: NodeType.DNS, label: 'DNS Resolver', position: [-8, 5, -5], color: '#a78bfa' }, // Purple
  { id: NodeType.Firewall, label: 'Perimeter Firewall', position: [-4, 0, 0], color: '#f43f5e' }, // Red
  { id: NodeType.VPN, label: 'VPN / Zero Trust', position: [-1, 0, 0], color: '#fb923c' }, // Orange
  { id: NodeType.LoadBalancer, label: 'Load Balancer', position: [2, 0, 0], color: '#2dd4bf' }, // Teal
  { id: NodeType.WAF, label: 'WAF', position: [5, 0, 0], color: '#e879f9' }, // Pink
  { id: NodeType.AppServer, label: 'App Servers', position: [9, 0, 0], color: '#4ade80' }, // Green
  { id: NodeType.IdP, label: 'IdP / SSO', position: [9, 5, -4], color: '#facc15' }, // Yellow
  { id: NodeType.Policy, label: 'AuthZ / Policy', position: [9, 5, 4], color: '#c084fc' }, // Violet
  { id: NodeType.Database, label: 'Database', position: [13, 0, 0], color: '#38bdf8' }, // Sky
  { id: NodeType.SIEM, label: 'Logging / SIEM', position: [0, -6, 3], color: '#ef4444' }, // Dark Red
];

export const STEPS: SimulationStep[] = [
  {
    id: 0,
    title: 'DNS Resolution',
    description: 'The client device needs to find the IP address of the application. It queries a public or private DNS resolver, which returns the IP (e.g., 203.0.113.10) of the enterprise ingress.',
    source: NodeType.User,
    target: NodeType.DNS,
    duration: 3,
    packetType: PacketType.Request,
    labels: ['DNS Query', 'A Record: 203.0.113.10'],
    isReturn: false
  },
  {
    id: 1,
    title: 'TCP Handshake',
    description: 'Before sending data, a reliable connection is established. The client sends SYN, server replies SYN-ACK, client replies ACK. This ensures both parties are ready.',
    source: NodeType.User,
    target: NodeType.Firewall,
    duration: 5,
    packetType: PacketType.Handshake,
    labels: ['SYN', 'SYN-ACK', 'ACK'],
    isReturn: false
  },
  {
    id: 2,
    title: 'TLS Handshake',
    description: 'Security layer negotiation. The client and server exchange certificates, verify identity, and generate session keys to encrypt all future traffic (HTTPS).',
    source: NodeType.User,
    target: NodeType.Firewall,
    duration: 5,
    packetType: PacketType.Handshake,
    labels: ['ClientHello', 'ServerHello / Cert', 'Key Exchange'],
    isReturn: false
  },
  {
    id: 3,
    title: 'Perimeter Firewall',
    description: 'The first line of defense. The firewall checks Layer 3/4 rules: blocking unauthorized IPs, enforcing port 443 (HTTPS), and checking Geo-IP reputation.',
    source: NodeType.User,
    target: NodeType.Firewall,
    duration: 3,
    packetType: PacketType.Request,
    labels: ['Policy Check: ALLOW'],
    logsToSIEM: true,
    isReturn: false
  },
  {
    id: 4,
    title: 'VPN / Zero Trust',
    description: 'Identity-aware proxy validation. The gateway checks device health (posture), OS version, and ensures the user has a valid certificate before letting them into the private network.',
    source: NodeType.Firewall,
    target: NodeType.VPN,
    duration: 3.5,
    packetType: PacketType.Request,
    labels: ['Device Posture OK', 'Identity Valid'],
    logsToSIEM: true,
    isReturn: false
  },
  {
    id: 5,
    title: 'Load Balancer',
    description: 'Traffic distribution. The Load Balancer terminates the TLS connection (decrypts traffic) and selects the healthiest available application server to handle the request.',
    source: NodeType.VPN,
    target: NodeType.LoadBalancer,
    duration: 2.5,
    packetType: PacketType.Request,
    labels: ['Decrypt & Route'],
    isReturn: false
  },
  {
    id: 6,
    title: 'WAF Inspection',
    description: 'Layer 7 Protection. The Web Application Firewall inspects the decrypted HTTP payload for malicious patterns like SQL Injection (SQLi) or Cross-Site Scripting (XSS).',
    source: NodeType.LoadBalancer,
    target: NodeType.WAF,
    duration: 3.5,
    packetType: PacketType.Request,
    labels: ['Scanning Payload...', 'Clean'],
    logsToSIEM: true,
    isReturn: false
  },
  {
    id: 7,
    title: 'App Processing',
    description: 'The Application Server receives the clean request. It parses the parameters and realizes the user needs to be authenticated to access this resource.',
    source: NodeType.WAF,
    target: NodeType.AppServer,
    duration: 3,
    packetType: PacketType.Request,
    labels: ['Processing Request'],
    logsToSIEM: true,
    isReturn: false
  },
  {
    id: 8,
    title: 'Authentication (IdP)',
    description: 'Federated Identity. The app delegates login to the IdP. The user proves their identity (MFA), and the IdP issues a signed access token (JWT/SAML).',
    source: NodeType.AppServer,
    target: NodeType.IdP,
    duration: 6,
    packetType: PacketType.Token,
    labels: ['Auth Redirect', 'MFA Challenge', 'Issue JWT Token'],
    logsToSIEM: true,
    isReturn: false
  },
  {
    id: 9,
    title: 'Authorization (Policy)',
    description: 'Fine-grained Authorization. The Policy Engine evaluates the token scopes and attributes against RBAC/ABAC rules. "Does User X have permission for Resource Y?"',
    source: NodeType.AppServer,
    target: NodeType.Policy,
    duration: 4,
    packetType: PacketType.Token,
    labels: ['Eval Policy Rules', 'Decision: PERMIT'],
    logsToSIEM: true,
    isReturn: false
  },
  {
    id: 10,
    title: 'Database Access',
    description: 'Data Retrieval. The application executes a secure, parameterized query against the database to fetch the requested customer records.',
    source: NodeType.AppServer,
    target: NodeType.Database,
    duration: 3,
    packetType: PacketType.Request,
    labels: ['SELECT * FROM data', 'Result Set Found'],
    logsToSIEM: true,
    isReturn: false
  },
  {
    id: 11,
    title: 'Response to User',
    description: 'The requested data is packaged into a JSON response, encrypted via TLS, and sent back through the gateway to the user\'s device.',
    source: NodeType.Database,
    target: NodeType.User,
    duration: 6,
    packetType: PacketType.Response,
    labels: ['Encrypt Response', 'HTTP 200 OK'],
    isReturn: true
  }
];