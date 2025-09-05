import React, { useState, useEffect } from 'react';
import { Workflow } from './workflow-types';

interface SimpleWorkflowTestProps {
  workflowId: string;
}

const SimpleWorkflowTest: React.FC<SimpleWorkflowTestProps> = ({ workflowId }) => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      console.log(`Loading workflow from: http://localhost:3002/api/workflows/${workflowId}`);
      
      const response = await fetch(`http://localhost:3002/api/workflows/${workflowId}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const workflowData: Workflow = await response.json();
      console.log('Loaded workflow:', workflowData);
      
      setWorkflow(workflowData);
      setError(null);
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTestWorkflow = async () => {
    try {
      const testWorkflow: Workflow = {
        id: workflowId,
        name: 'Test Workflow',
        nodes: [
          {
            id: 'start-1',
            type: 'core.start',
            position: { x: 100, y: 100 },
            parameters: {}
          },
          {
            id: 'log-1',
            type: 'core.log',
            position: { x: 300, y: 100 },
            parameters: { message: 'Hallo aus React!' }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'start-1',
            targetNodeId: 'log-1'
          }
        ]
      };

      console.log('Creating workflow:', testWorkflow);
      
      const response = await fetch('http://localhost:3002/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testWorkflow)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Created workflow:', result);
      
      // Reload after creation
      loadWorkflow();
    } catch (err) {
      console.error('Error creating workflow:', err);
      setError(err instanceof Error ? err.message : 'Create error');
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  if (loading) {
    return <div>Loading workflow...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', border: '1px solid red', margin: '20px' }}>
        <h3>Error: {error}</h3>
        <button onClick={createTestWorkflow} style={{ marginTop: '10px', padding: '8px 16px' }}>
          Create Test Workflow
        </button>
        <button onClick={loadWorkflow} style={{ marginTop: '10px', marginLeft: '10px', padding: '8px 16px' }}>
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Workflow API Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadWorkflow} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Reload Workflow
        </button>
        <button onClick={createTestWorkflow} style={{ padding: '8px 16px' }}>
          Create Test Workflow
        </button>
      </div>

      {workflow && (
        <div>
          <h3>Workflow: {workflow.name} (ID: {workflow.id})</h3>
          
          <h4>Nodes ({workflow.nodes.length}):</h4>
          <ul>
            {workflow.nodes.map(node => (
              <li key={node.id}>
                <strong>{node.id}</strong> - Type: {node.type} - 
                Position: ({node.position.x}, {node.position.y}) -
                Parameters: {JSON.stringify(node.parameters)}
              </li>
            ))}
          </ul>

          <h4>Edges ({workflow.edges.length}):</h4>
          <ul>
            {workflow.edges.map(edge => (
              <li key={edge.id}>
                <strong>{edge.id}</strong>: {edge.sourceNodeId} → {edge.targetNodeId}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SimpleWorkflowTest;