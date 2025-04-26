// Load environment variables from server/.env
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { spawn } = require('child_process');
const { PassThrough } = require('stream');

const upload = multer({ dest: 'uploads/' });
const app = express();
const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in env');
  process.exit(1);
}

// Enable CORS for all routes
app.use(cors({ origin: '*' }));
app.use(express.json());

// Ensure backups directory exists
const BACKUP_DIR = 'backups';
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Backup endpoint: streams pg_dump output
app.get('/api/backup', (req, res) => {
  const filename = `backup_${Date.now()}.sql`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const filePath = path.join(BACKUP_DIR, filename);
  const writeStream = fs.createWriteStream(filePath);
  const pgDump = spawn('pg_dump', ['--dbname', DATABASE_URL]);
  const pass = new PassThrough();
  pgDump.stdout.pipe(pass);
  pass.pipe(res);
  pass.pipe(writeStream);
  pgDump.stderr.on('data', (data) => console.error(`pg_dump error: ${data}`));
  pgDump.on('close', (code) => {
    if (code !== 0) console.error(`pg_dump exited with code ${code}`);
    res.end();
  });
});

// Restore endpoint: accepts uploaded file and runs psql -f on it
app.post('/api/restore', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const filePath = req.file.path;
  const psql = spawn('psql', ['--dbname', DATABASE_URL, '-f', filePath]);
  psql.stdout.on('data', (data) => console.log(`psql: ${data}`));
  psql.stderr.on('data', (data) => console.error(`psql error: ${data}`));
  psql.on('close', (code) => {
    fs.unlinkSync(filePath);
    if (code !== 0) {
      console.error(`psql exited with code ${code}`);
      return res.status(500).send('Restore failed');
    }
    res.send('Restore completed');
  });
});

// Endpoint to list backup history
app.get('/api/history', (req, res) => {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Unable to read backup directory' });
    const history = files.map((file) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      return {
        id: file,
        filename: file,
        date: stats.mtime,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'completed',
      };
    });
    res.json(history);
  });
});

const server = app.listen(PORT, () => {
  console.log(`DB utils server running on port ${PORT}`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port or set a different PORT in .env.`);
    process.exit(1);
  } else {
    throw err;
  }
});
