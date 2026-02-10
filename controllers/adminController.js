const express = require('express')
const router = express.Router()
const Admin = require('../models/Admin')
const { verifyAdmin, generateToken } = require('../utils/adminAuth')

// =====================================
// POST /api/admin/login
// Connexion administrateur
// =====================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis.',
      })
    }

    const admin = await Admin.findOne({ email })

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects.',
      })
    }

    const isPasswordValid = await admin.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects.',
      })
    }

    if (!admin.actif) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé.',
      })
    }

    const token = generateToken(admin)

    admin.derniereConnexion = new Date()
    await admin.save()

    // ✅ CRÉER LE COOKIE (configuration pour proxy Vite)
    res.cookie('token', token, {
      httpOnly: true, // Protection XSS
      secure: false, // false en développement HTTP
      sameSite: 'lax', // lax car le proxy fait que tout vient du même domaine
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/', // Disponible sur tous les chemins
    })

    console.log('🍪 LOGIN - Cookie créé:', token.substring(0, 30) + '...')
    console.log('🍪 LOGIN - SameSite: lax')
    console.log('🍪 LOGIN - Secure:', false)

    // ✅ NE PLUS RENVOYER LE TOKEN EN JSON
    res.json({
      success: true,
      message: 'Connexion réussie',
      admin: {
        id: admin._id,
        nom: admin.nom,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Erreur login admin:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion.',
    })
  }
})

// =====================================
// POST /api/admin/logout
// =====================================
router.post('/logout', (req, res) => {
  // ✅ SUPPRIMER LE COOKIE
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  res.json({
    success: true,
    message: 'Déconnexion réussie',
  })
})

// =====================================
// GET /api/admin/me
// =====================================
router.get('/me', verifyAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password')

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur introuvable.',
      })
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        nom: admin.nom,
        email: admin.email,
        role: admin.role,
        derniereConnexion: admin.derniereConnexion,
      },
    })
  } catch (error) {
    console.error('Erreur récupération admin:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur.',
    })
  }
})

// =====================================
// POST /api/admin/create-first
// (PUBLIC – une seule fois)
// =====================================
router.post('/create-first', async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne()

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Un administrateur existe déjà.',
      })
    }

    const { nom, email, password } = req.body

    if (!nom || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis.',
      })
    }

    const admin = await Admin.create({
      nom,
      email,
      password,
      role: 'super_admin',
      actif: true,
    })

    res.status(201).json({
      success: true,
      message: 'Premier administrateur créé avec succès',
      admin: {
        id: admin._id,
        nom: admin.nom,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Erreur création admin:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création.',
      error: error.message,
    })
  }
})

// =====================================
// POST /api/admin/create
// Créer un nouvel administrateur (Protégé - Super Admin uniquement)
// =====================================
router.post('/create', verifyAdmin, async (req, res) => {
  try {
    // Vérifier que l'utilisateur connecté est super_admin
    const currentAdmin = await Admin.findById(req.admin.id)

    if (currentAdmin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les super-administrateurs peuvent créer des comptes.',
      })
    }

    const { nom, email, password, role } = req.body

    if (!nom || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe requis.',
      })
    }

    // Vérifier si l'email existe déjà
    const existingAdmin = await Admin.findOne({ email })
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé.',
      })
    }

    const newAdmin = await Admin.create({
      nom,
      email,
      password,
      role: role || 'admin', // Par défaut: admin simple
      actif: true,
    })

    res.status(201).json({
      success: true,
      message: 'Administrateur créé avec succès',
      admin: {
        id: newAdmin._id,
        nom: newAdmin.nom,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    })
  } catch (error) {
    console.error('Erreur création admin:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création.',
      error: error.message,
    })
  }
})

// =====================================
// GET /api/admin/list
// Lister tous les administrateurs (Protégé - Super Admin uniquement)
// =====================================
router.get('/list', verifyAdmin, async (req, res) => {
  try {
    const currentAdmin = await Admin.findById(req.admin.id)

    if (currentAdmin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé.',
      })
    }

    const admins = await Admin.find()
      .select('-password')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      count: admins.length,
      admins: admins.map((admin) => ({
        id: admin._id,
        nom: admin.nom,
        email: admin.email,
        role: admin.role,
        actif: admin.actif,
        derniereConnexion: admin.derniereConnexion,
        createdAt: admin.createdAt,
      })),
    })
  } catch (error) {
    console.error('Erreur liste admins:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur.',
    })
  }
})

// =====================================
// PUT /api/admin/:id/toggle-status
// Activer/Désactiver un admin (Protégé - Super Admin uniquement)
// =====================================
router.put('/:id/toggle-status', verifyAdmin, async (req, res) => {
  try {
    const currentAdmin = await Admin.findById(req.admin.id)

    if (currentAdmin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé.',
      })
    }

    // Ne pas pouvoir se désactiver soi-même
    if (req.params.id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre statut.',
      })
    }

    const admin = await Admin.findById(req.params.id)

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur introuvable.',
      })
    }

    admin.actif = !admin.actif
    await admin.save()

    res.json({
      success: true,
      message: `Administrateur ${admin.actif ? 'activé' : 'désactivé'}`,
      admin: {
        id: admin._id,
        nom: admin.nom,
        email: admin.email,
        actif: admin.actif,
      },
    })
  } catch (error) {
    console.error('Erreur toggle status:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur.',
    })
  }
})

// =====================================
// DELETE /api/admin/:id
// Supprimer un admin (Protégé - Super Admin uniquement)
// =====================================
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const currentAdmin = await Admin.findById(req.admin.id)

    if (currentAdmin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé.',
      })
    }

    // Ne pas pouvoir se supprimer soi-même
    if (req.params.id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte.',
      })
    }

    const admin = await Admin.findById(req.params.id)

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur introuvable.',
      })
    }

    await admin.deleteOne()

    res.json({
      success: true,
      message: 'Administrateur supprimé avec succès',
    })
  } catch (error) {
    console.error('Erreur suppression admin:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur.',
    })
  }
})

module.exports = router
