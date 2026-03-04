import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = path.resolve(__dirname, 'src/seeds');
const LOG_FILE = path.resolve(__dirname, 'pending_research.log');

function scanSeeds() {
  if (!fs.existsSync(SEEDS_DIR)) return;
  
  const files = fs.readdirSync(SEEDS_DIR).filter(f => f.endsWith('.json'));
  const pending = [];

  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8'));
      if (Array.isArray(content)) {
        content.forEach(seed => {
          if (!seed.instructions || seed.instructions.trim() === '') {
            pending.push({ file, name: seed.name });
          }
        });
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  if (pending.length > 0) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] PENDING: ${JSON.stringify(pending)}
`;
    fs.appendFileSync(LOG_FILE, logMessage);
    // Also print to console for visibility
    console.log(logMessage);
  }
}

console.log('--- SEED WATCHER STARTED ---');
// Initial scan
scanSeeds();

// Scan every 30 seconds
setInterval(scanSeeds, 30000);
