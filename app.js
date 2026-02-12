require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')

const app = express()

app.use(cookieParser())

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://gaetan-bois.onrender.com' // Production
        : 'http://localhost:5174', // Dev
    credentials: true,
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch((err) => console.error('❌ Erreur MongoDB:', err))

// Routes API
app.use('/api/admin', require('./controllers/adminController'))
app.use('/api/admin/categories', require('./controllers/adminCategories'))
app.use('/api/admin/categories', require('./controllers/adminImages'))
app.use('/api/admin/promotions', require('./controllers/adminPromotions'))
app.use('/api/reviews', require('./controllers/reviewsController'))

app.use('/api/categories', require('./controllers/publicCategories'))
app.use('/api/promotions', require('./controllers/publicPromotions'))
app.use('/api/contact', require('./controllers/contactRoutes'))
app.use('/api/admin/analytics', require('./controllers/analyticsRoutes'))

// **SERVIR LE FRONTEND EN PRODUCTION**
if (process.env.NODE_ENV === 'production') {
  // Servir les fichiers statiques du dossier dist
  app.use(express.static(path.join(__dirname, 'dist')))
} else {
  // Route de test en développement
  app.get('/', (req, res) => {
    res.json({
      message: 'API Menuiserie GAETAN BOIS - Serveur actif',
      version: '1.0.0',
      endpoints: {
        public: {
          categories: '/api/categories',
          categoryBySlug: '/api/categories/:slug',
          promotionsActive: '/api/promotions/active',
          tombola: '/api/promotions/tombola',
        },
        admin: {
          login: '/api/admin/login',
          categories: '/api/admin/categories',
          images: '/api/admin/categories/:id/images',
          promotions: '/api/admin/promotions',
        },
      },
    })
  })
}

// Middleware 404 pour routes API
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route API introuvable',
    path: req.path,
  })
})

// Middleware d'erreur
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err)
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// Toutes les autres routes renvoient index.html (DOIT ÊTRE EN DERNIER)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'))
  })
}

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`)
  console.log(`📡 Environnement: ${process.env.NODE_ENV || 'development'}`)
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5174'}`,
    )
  }
})
