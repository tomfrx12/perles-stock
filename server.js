import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = '/data/uploads'

fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `tmp-${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Fichier non image'))
  },
})

function slugify(str) {
  return str
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `file-${Date.now()}`
}

const app = express()

app.use('/uploads', express.static(UPLOADS_DIR))

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })

  const ext = path.extname(req.file.originalname)
  const base = slugify(req.body.name || `${Date.now()}`)
  let finalName = `${base}${ext}`
  let dest = path.join(UPLOADS_DIR, finalName)
  let i = 1
  while (fs.existsSync(dest)) {
    finalName = `${base}-${i}${ext}`
    dest = path.join(UPLOADS_DIR, finalName)
    i++
  }

  fs.renameSync(req.file.path, dest)
  res.json({ path: `/uploads/${finalName}` })
})

app.delete('/api/upload/:filename', (req, res) => {
  if (!process.env.ADMIN_PIN || req.headers['x-admin-pin'] !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'Non autorisé' })
  }
  const filename = path.basename(req.params.filename)
  const filepath = path.join(UPLOADS_DIR, filename)
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Fichier introuvable' })
  fs.unlinkSync(filepath)
  res.json({ ok: true })
})

app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT)
