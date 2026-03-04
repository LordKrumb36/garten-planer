import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to save seed JSON to filesystem
const saveSeedPlugin = () => ({
  name: 'save-seed-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/save-seed' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const { seed, oldName } = data; // Expecting { seed, oldName? }
            
            // Sanitize filename
            const filename = seed.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
            const filePath = path.resolve(__dirname, 'src/seeds', filename);
            
            // If renaming, delete old file
            if (oldName && oldName !== seed.name) {
              const oldFilename = oldName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
              const oldPath = path.resolve(__dirname, 'src/seeds', oldFilename);
              if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            
            fs.writeFileSync(filePath, JSON.stringify(Array.isArray(seed) ? seed : [seed], null, 2));
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, filename }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else if (req.url === '/api/delete-seed' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { name } = JSON.parse(body);
            const filename = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
            const filePath = path.resolve(__dirname, 'src/seeds', filename);
            
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Seed file not found' }));
            }
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else if (req.url === '/api/trigger-sync' && req.method === 'POST') {
        // Just log it for the agent to see in the console
        console.log('--- SYNC TRIGGERED ---');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true }));
      } else {
        next();
      }
    });
  }
});

export default defineConfig({
  plugins: [react(), saveSeedPlugin()],
})
