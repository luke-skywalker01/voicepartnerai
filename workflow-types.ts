export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: string;
  position: Position;
  parameters: Record<string, any>;
}

export interface Edge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}