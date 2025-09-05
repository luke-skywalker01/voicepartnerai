// Core types for VoicePartnerAI platform

export interface Assistant {
  id: string;
  name: string;
  firstMessage: string;
  systemPrompt: string;
  model: string;
  voice: string;
  language: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
  template: string;
}

export interface WorkflowNode {
  id: string;
  type: 'conversation' | 'api' | 'transfer' | 'end' | 'tool';
  title: string;
  preview: string;
  position: { x: number; y: number; };
  data?: Record<string, any>;
}

export interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  fromNode: WorkflowNode;
  toNode: WorkflowNode;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}
