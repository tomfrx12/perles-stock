import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import crypto from 'crypto'
import { rateLimit } from 'express-rate-limit'
import { fileTypeFromFile } from 'file-type'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || '/data'
const adminToken = process.env.ADMIN_PIN
  ? crypto.createHash('sha256').update(process.env.ADMIN_PIN).digest('hex')
  : null
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
const PROJETS_FILE = path.join(DATA_DIR, 'projets.json')
const STOCK_FILE = path.join(DATA_DIR, 'stock.json')

fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  // Extension inconnue jusqu'à la vérification du contenu — on stocke en .tmp
  filename: (req, file, cb) => cb(null, `tmp-${Date.now()}.tmp`),
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(ext)) return cb(new Error('Extension non autorisée'))
    cb(null, true)
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

app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
    if (req.file) fs.unlinkSync(req.file.path)
    return res.status(401).json({ error: 'Non autorisé' })
  }
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })

  // Vérification du contenu réel (magic bytes), indépendante du nom/MIME client
  const type = await fileTypeFromFile(req.file.path)
  if (!type || !ALLOWED_MIME.has(type.mime)) {
    fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: 'Contenu non autorisé' })
  }

  // Extension canonique issue du contenu, pas du nom client
  const ext = `.${type.ext}`
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
  if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
    return res.status(401).json({ error: 'Non autorisé' })
  }
  const filename = path.basename(req.params.filename)
  const filepath = path.join(UPLOADS_DIR, filename)
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Fichier introuvable' })
  fs.unlinkSync(filepath)
  res.json({ ok: true })
})

// ---- Auth ----

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

app.post('/api/login', loginLimiter, (req, res) => {
  const { pin } = req.body ?? {}
  if (!adminToken || pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'Code incorrect' })
  }
  res.json({ token: adminToken })
})

app.get('/api/me', (req, res) => {
  const valid = !!adminToken && req.headers['x-admin-token'] === adminToken
  res.json({ admin: valid })
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

function readStock() {
  try { return JSON.parse(fs.readFileSync(STOCK_FILE, 'utf8')) }
  catch { return {} }
}

function writeStock(stock) {
  const tmp = `${STOCK_FILE}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(stock, null, 2))
  fs.renameSync(tmp, STOCK_FILE)
}

function requireAdmin(req, res, next) {
  if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
    return res.status(401).json({ error: 'Non autorisé' })
  }
  next()
}

function deleteUpload(image) {
  if (!image?.startsWith('/uploads/')) return
  const filepath = path.join(UPLOADS_DIR, path.basename(image))
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
}

// ---- Stock ----

app.get('/api/stock', (req, res) => {
  res.json(readStock())
})

app.patch('/api/stock', requireAdmin, (req, res) => {
  const updates = req.body ?? {}
  const stock = readStock()
  for (const [k, v] of Object.entries(updates)) {
    stock[k] = Math.max(0, Math.round(Number(v) || 0))
  }
  writeStock(stock)
  res.json(stock)
})

// ---- Projets ----

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

app.post('/api/projets/:id/valider', requireAdmin, (req, res) => {
  const projets = readProjets()
  const idx = projets.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Projet introuvable' })
  if (projets[idx].statut === 'terminé') return res.status(409).json({ error: 'Déjà validé' })

  const stock = readStock()
  for (const { marque, code, count } of projets[idx].couleurs ?? []) {
    const k = `${marque}-${code}`
    stock[k] = Math.max(0, (stock[k] ?? 0) - count)
  }
  projets[idx].statut = 'terminé'
  writeStock(stock)
  writeProjets(projets)
  res.json({ projet: projets[idx], stock })
})

app.delete('/api/projets/:id', requireAdmin, (req, res) => {
  const projets = readProjets()
  const projet = projets.find(p => p.id === req.params.id)
  if (!projet) return res.status(404).json({ error: 'Projet introuvable' })
  deleteUpload(projet.image)
  writeProjets(projets.filter(p => p.id !== projet.id))
  res.json({ ok: true })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Extension non autorisée') {
    return res.status(400).json({ error: err.message })
  }
  res.status(500).json({ error: 'Erreur serveur' })
})

app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT)
