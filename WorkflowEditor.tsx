import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  addEdge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  Controls,
  Background,
  ReactFlowProvider
} from 'react-flow-renderer';
import { Workflow } from './workflow-types';

interface WorkflowEditorProps {
  workflowId: string;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/workflows/${workflowId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load workflow');
      }
      
      const workflow: Workflow = await response.json();
      
      // Convert workflow nodes to React Flow nodes
      const reactFlowNodes: Node[] = workflow.nodes.map(node => ({
        id: node.id,
        type: 'default',
        position: node.position,
        data: { 
          label: `${node.type}\n${node.parameters.message || ''}`,
          nodeType: node.type,
          parameters: node.parameters
        }
      }));
      
      // Convert workflow edges to React Flow edges
      const reactFlowEdges: Edge[] = workflow.edges.map(edge => ({
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId
      }));
      
      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addLogNode = useCallback(() => {
    const newNodeId = `log-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: 'core.log\nNeue Log-Nachricht',
        nodeType: 'core.log',
        parameters: { message: 'Neue Log-Nachricht' }
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  if (loading) {
    return <div className="workflow-editor loading">Loading workflow...</div>;
  }

  if (error) {
    return <div className="workflow-editor error">Error: {error}</div>;
  }

  const reactFlowStyle = useMemo(() => ({ flex: 1 }), []);
  
  const sidebarStyle = useMemo(() => ({ 
    width: '250px', 
    padding: '20px', 
    backgroundColor: '#f5f5f5',
    borderRight: '1px solid #ddd'
  }), []);

  const buttonStyle = useMemo(() => ({
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }), []);

  return (
    <ReactFlowProvider>
      <div className="workflow-editor" style={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar */}
        <div className="sidebar" style={sidebarStyle}>
          <h3>Workflow Tools</h3>
          <button onClick={addLogNode} style={buttonStyle}>
            Log-Knoten hinzufügen
          </button>
        </div>

        {/* React Flow Canvas */}
        <div className="flow-container" style={reactFlowStyle}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            maxZoom={1.5}
            minZoom={0.5}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default WorkflowEditor;