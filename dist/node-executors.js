"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogNodeExecutor = exports.StartNodeExecutor = void 0;
class StartNodeExecutor {
    async run(node) {
        console.log('Start-Knoten ausgeführt');
        return node.id;
    }
}
exports.StartNodeExecutor = StartNodeExecutor;
class LogNodeExecutor {
    async run(node) {
        const message = node.parameters.message || 'No message provided';
        console.log(message);
        return message;
    }
}
exports.LogNodeExecutor = LogNodeExecutor;
