"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workflow_engine_1 = require("./workflow-engine");
const node_executors_1 = require("./node-executors");
// Engine instanziieren
const nodeRegistry = new Map();
nodeRegistry.set('core.start', new node_executors_1.StartNodeExecutor());
nodeRegistry.set('core.log', new node_executors_1.LogNodeExecutor());
const engine = new workflow_engine_1.WorkflowEngine(nodeRegistry);
// Beispiel-Workflow
const exampleWorkflow = {
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
