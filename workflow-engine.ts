import { Workflow, Node, Edge } from './workflow-types';
import { INodeExecutor } from './node-executors';

export class WorkflowEngine {
  private nodeRegistry: Map<string, INodeExecutor>;

  constructor(nodeRegistry: Map<string, INodeExecutor>) {
    this.nodeRegistry = nodeRegistry;
  }

  async execute(workflow: Workflow): Promise<void> {
    const startNode = this.findStartNode(workflow);
    
    if (!startNode) {
      console.log('No start node found');
      return;
    }

    let currentNode = startNode;
    
    while (currentNode) {
      const executor = this.nodeRegistry.get(currentNode.type);
      
      if (!executor) {
        console.log(`No executor found for node type: ${currentNode.type}`);
        break;
      }

      await executor.run(currentNode);

      const nextEdge = workflow.edges.find(edge => edge.sourceNodeId === currentNode.id);
      
      if (!nextEdge) {
        break;
      }

      const nextNode = workflow.nodes.find(node => node.id === nextEdge.targetNodeId);
      
      if (!nextNode) {
        break;
      }

      currentNode = nextNode;
    }
  }

  private findStartNode(workflow: Workflow): Node | null {
    const nodesWithIncomingEdges = new Set(workflow.edges.map(edge => edge.targetNodeId));
    
    return workflow.nodes.find(node => !nodesWithIncomingEdges.has(node.id)) || null;
  }
}