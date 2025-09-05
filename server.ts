import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { Workflow } from './workflow-types';

const app = express();
const PORT = 8080;
const WORKFLOW_FILE = path.join(__dirname, 'workflow.json');

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// Redirect root to index.html
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.post('/api/workflows', async (req, res) => {
  try {
    const workflow: Workflow = req.body;
    
    await fs.writeFile(WORKFLOW_FILE, JSON.stringify(workflow, null, 2));
    
    res.json({ 
      success: true, 
      id: workflow.id 
    });
  } catch (error) {
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
    
    const fileContent = await fs.readFile(WORKFLOW_FILE, 'utf-8');
    const workflow: Workflow = JSON.parse(fileContent);
    
    if (workflow.id !== workflowId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Workflow not found' 
      });
    }
    
    res.json(workflow);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
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