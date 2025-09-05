"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = 8080;
const WORKFLOW_FILE = path_1.default.join(__dirname, 'workflow.json');
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express_1.default.json());
// Serve static files from current directory
app.use(express_1.default.static(__dirname));
// Redirect root to index.html
app.get('/', (req, res) => {
    res.redirect('/index.html');
});
app.post('/api/workflows', async (req, res) => {
    try {
        const workflow = req.body;
        await promises_1.default.writeFile(WORKFLOW_FILE, JSON.stringify(workflow, null, 2));
        res.json({
            success: true,
            id: workflow.id
        });
    }
    catch (error) {
        console.error('Error saving workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save workflow'
        });
    }
});
app.get('/api/workflows/:id', async (req, res) => {
    try {
        const workflowId = req.params.id;
        const fileContent = await promises_1.default.readFile(WORKFLOW_FILE, 'utf-8');
        const workflow = JSON.parse(fileContent);
        if (workflow.id !== workflowId) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }
        res.json(workflow);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }
        console.error('Error reading workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read workflow'
        });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
