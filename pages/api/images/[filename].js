import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  const { filename } = req.query;

  if (!/^[\w\-]+\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filePath = path.join(process.cwd(), '..', 'shared', 'uploads', filename);

  try {
    const fileBuffer = await fs.readFile(filePath);

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.send(fileBuffer);
  } catch (err) {
    console.error('Image read error:', err);
    res.status(404).json({ error: 'Image not found' });
  }
}
