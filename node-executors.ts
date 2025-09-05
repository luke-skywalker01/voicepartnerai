import { Node } from './workflow-types';

export interface INodeExecutor {
  run(node: Node): Promise<any>;
}

export class StartNodeExecutor implements INodeExecutor {
  async run(node: Node): Promise<any> {
    console.log('Start-Knoten ausgeführt');
    return node.id;
  }
}

export class LogNodeExecutor implements INodeExecutor {
  async run(node: Node): Promise<any> {
    const message = node.parameters.message || 'No message provided';
    console.log(message);
    return message;
  }
}