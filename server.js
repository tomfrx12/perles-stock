import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || '/data'
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
const PROJETS_FILE = path.join(DATA_DIR, 'projets.json')

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
app.use(express.json())

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

// ---- Projets ----

function readProjets() {
  try {
    return JSON.parse(fs.readFileSync(PROJETS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function writeProjets(projets) {
  const tmp = `${PROJETS_FILE}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(projets, null, 2))
  fs.renameSync(tmp, PROJETS_FILE)
}

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_PIN || req.headers['x-admin-pin'] !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'Non autorisé' })
  }
  next()
}

function deleteUpload(image) {
  if (!image?.startsWith('/uploads/')) return
  const filepath = path.join(UPLOADS_DIR, path.basename(image))
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
}

app.get('/api/projets', (req, res) => {
  res.json(readProjets())
})

app.post('/api/projets', requireAdmin, (req, res) => {
  const { nom, image, categorie, numero, couleurs, statut } = req.body ?? {}
  if (!nom?.trim() || !image) return res.status(400).json({ error: 'Nom et image requis' })
  const projet = {
    id: `projet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    numero: Number.isInteger(numero) ? numero : null,
    nom: nom.trim(),
    image,
    categorie: categorie ?? '',
    couleurs: Array.isArray(couleurs) ? couleurs : [],
    statut: statut ?? null,
  }
  writeProjets([...readProjets(), projet])
  res.status(201).json(projet)
})

app.patch('/api/projets/:id', requireAdmin, (req, res) => {
  const projets = readProjets()
  const idx = projets.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Projet introuvable' })
  const allowed = ['numero', 'nom', 'categorie', 'couleurs', 'statut']
  for (const k of allowed) if (k in (req.body ?? {})) projets[idx][k] = req.body[k]
  writeProjets(projets)
  res.json(projets[idx])
})

app.delete('/api/projets/:id', requireAdmin, (req, res) => {
  const projets = readProjets()
  const projet = projets.find(p => p.id === req.params.id)
  if (!projet) return res.status(404).json({ error: 'Projet introuvable' })
  deleteUpload(projet.image)
  writeProjets(projets.filter(p => p.id !== projet.id))
  res.json({ ok: true })
})

app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT)
