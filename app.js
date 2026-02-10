require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const fs = require('fs')

const app = express()

// ========== CONFIGURATION POUR RAILWAY ==========
const isProduction = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT || 3000

app.use(cookieParser())

// Configuration CORS adaptée
const corsOrigins = isProduction
  ? [process.env.FRONTEND_URL || 'https://votre-projet.up.railway.app']
  : ['http://localhost:5173']

app.use(
  cors({
    origin: function (origin, callback) {
      // En production, accepter toutes les origines pour servir le frontend
      if (isProduction) {
        return callback(null, true)
      }
      // En développement, vérifier l'origine
      if (!origin || corsOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ========== CONNEXION MONGO DB ==========
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch((err) => console.error('❌ Erreur MongoDB:', err))

// ========== ROUTES API ==========
app.use('/api/admin', require('./controllers/adminController'))
app.use('/api/admin/categories', require('./controllers/adminCategories'))
app.use('/api/admin/categories', require('./controllers/adminImages'))
app.use('/api/admin/promotions', require('./controllers/adminPromotions'))
app.use('/api/reviews', require('./controllers/reviewsController'))

app.use('/api/categories', require('./controllers/publicCategories'))
app.use('/api/promotions', require('./controllers/publicPromotions'))
app.use('/api/contact', require('./controllers/contactRoutes'))
app.use('/api/admin/analytics', require('./controllers/analyticsRoutes'))

// ========== SERVIR LE FRONTEND REACT ==========
if (isProduction) {
  // Chemin vers le dossier dist (votre build React)
  const distPath = path.join(__dirname, 'dist')

  // Vérifier que le dossier dist existe
  if (fs.existsSync(distPath)) {
    console.log(`📁 Dossier dist trouvé: ${distPath}`)
    console.log(`📄 Contenu:`, fs.readdirSync(distPath))

    // Servir les fichiers statiques
    app.use(express.static(distPath))

    // Route de santé pour Railway et monitoring
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        service: 'Gaetan Bois API',
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
      })
    })

    // Documentation API
    app.get('/api', (req, res) => {
      res.json({
        message: 'API Menuiserie GAETAN BOIS - Serveur actif',
        version: '1.0.0',
        endpoints: {
          public: {
            categories: '/api/categories',
            promotionsActive: '/api/promotions/active',
            tombola: '/api/promotions/tombola',
          },
          admin: {
            login: '/api/admin/login',
            categories: '/api/admin/categories',
            promotions: '/api/admin/promotions',
          },
        },
      })
    })

    // Toutes les autres routes → index.html (pour React Router)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })

    console.log('🚀 Mode PRODUCTION: Frontend React servi depuis /dist')
  } else {
    console.error('❌ ERREUR: Dossier dist introuvable!')
    app.get('*', (req, res) => {
      res.status(500).send('Frontend non trouvé. Vérifiez le build.')
    })
  }
} else {
  // En développement : pas de fichiers statiques
  app.get('/', (req, res) => {
    res.json({
      message: 'API Menuiserie GAETAN BOIS - Mode Développement',
      note: 'Le frontend tourne séparément sur http://localhost:5173',
      endpoints: '/api',
    })
  })
}

// ========== GESTION DES ERREURS ==========
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route introuvable',
    path: req.path,
  })
})

app.use((err, req, res, next) => {
  console.error('🔥 Erreur serveur:', err)
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// ========== DÉMARRAGE DU SERVEUR ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================`)
  console.log(`🚀 Serveur GAËTAN BOIS démarré`)
  console.log(`📡 Port: ${PORT}`)
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 URL: http://0.0.0.0:${PORT}`)
  console.log(`=======================================`)
})
