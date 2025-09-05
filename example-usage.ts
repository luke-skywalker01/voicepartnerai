import { WorkflowEngine } from './workflow-engine';
import { StartNodeExecutor, LogNodeExecutor, INodeExecutor } from './node-executors';
import { Workflow } from './workflow-types';

// Engine instanziieren
const nodeRegistry = new Map<string, INodeExecutor>();
nodeRegistry.set('core.start', new StartNodeExecutor());
nodeRegistry.set('core.log', new LogNodeExecutor());

const engine = new WorkflowEngine(nodeRegistry);

// Beispiel-Workflow
const exampleWorkflow: Workflow = {
  id: 'workflow-1',
  name: 'Test Workflow',
  nodes: [
    {
      id: 'start-1',
      type: 'core.start',
      position: { x: 0, y: 0 },
      parameters: {}
    },
    {
      id: 'log-1',
      type: 'core.log',
      position: { x: 100, y: 0 },
      parameters: { message: 'Hallo Welt!' }
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

// Workflow ausführen
engine.execute(exampleWorkflow);