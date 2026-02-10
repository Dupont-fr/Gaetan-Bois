const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

// ===============================
// Middleware : vérifier un admin
// ===============================
exports.verifyAdmin = async (req, res, next) => {
  try {
    // 🔍 DEBUG - Voir tous les cookies reçus
    console.log('🔍 ME - Tous les cookies:', req.cookies)
    console.log('🔍 ME - Token présent?', req.cookies.token ? 'OUI' : 'NON')
    
    // 🔐 Récupérer le token depuis le COOKIE (et non plus le header)
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token manquant.',
      })
    }

    // 🔎 Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 🔐 Vérifier le rôle
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Droits administrateur requis.',
      })
    }

    // 👤 Vérifier que l'admin existe toujours
    const admin = await Admin.findById(decoded.id).select('-password')

    if (!admin || !admin.actif) {
      return res.status(401).json({
        success: false,
        message: 'Compte administrateur introuvable ou désactivé.',
      })
    }

    // ✅ Injecter l'admin dans la requête
    req.admin = {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    }

    next()
  } catch (error) {
    console.error('Erreur vérification token:', error)

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide.',
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification.',
    })
  }
}

// ===============================
// Génération du token JWT admin
// ===============================
exports.generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' },
  )
}