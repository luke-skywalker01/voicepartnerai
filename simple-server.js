const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // CORS Headers für alle Requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  let filePath = req.url === '/' ? '/workflow-app.html' : req.url;
  filePath = path.join(__dirname, filePath);
  
  // Sicherheitscheck
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Access denied');
    return;
  }
  
  // Bestimme Content-Type
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
  };
  
  const contentType = contentTypes[ext] || 'text/plain';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end(`File not found: ${req.url}`);
      } else {
        res.writeHead(500);
        res.end(`Server error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`🚀 Frontend Server running on http://localhost:${PORT}`);
  console.log(`📁 Open: http://localhost:${PORT}/workflow-app.html`);
  console.log(`🔄 Make sure your API server is running on http://localhost:3002`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Frontend server stopped');
  process.exit(0);
});