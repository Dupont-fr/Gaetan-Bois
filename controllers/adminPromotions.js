const express = require('express')
const router = express.Router()
const Promotion = require('../models/Promotion')
const Category = require('../models/Category')
const { verifyAdmin } = require('../utils/adminAuth')

// ============================================
// ROUTES ADMIN - GESTION DES PROMOTIONS
// ============================================

// @route   GET /api/admin/promotions
// @desc    Obtenir toutes les promotions
// @access  Private (Admin)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate('categorie', 'nom slug')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      count: promotions.length,
      promotions,
    })
  } catch (error) {
    console.error('Erreur récupération promotions:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des promotions.',
    })
  }
})

// @route   GET /api/admin/promotions/:id
// @desc    Obtenir une promotion par ID
// @access  Private (Admin)
router.get('/:id', verifyAdmin, async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id).populate(
      'categorie',
      'nom slug',
    )

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion introuvable.',
      })
    }

    res.json({
      success: true,
      promotion,
    })
  } catch (error) {
    console.error('Erreur récupération promotion:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération.',
    })
  }
})

// @route   POST /api/admin/promotions
// @desc    Créer une nouvelle promotion
// @access  Private (Admin)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { type, nom, dateDebut, dateFin, categorie, gains, dureeAffichage } =
      req.body

    // Validation
    if (!type || !nom || !dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants.',
      })
    }

    // Validation spécifique selon le type
    if (type === 'stock-limite' && !categorie) {
      return res.status(400).json({
        success: false,
        message: 'La catégorie est requise pour une promo Stock Limité.',
      })
    }

    if (type === 'tombola' && (!gains || gains.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un gain est requis pour une promo Tombola.',
      })
    }

    // Vérifier que la catégorie existe (pour Stock Limité)
    if (type === 'stock-limite') {
      const categoryExists = await Category.findById(categorie)
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie introuvable.',
        })
      }
    }

    // Créer la promotion
    const promotion = await Promotion.create({
      type,
      nom,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      categorie: type === 'stock-limite' ? categorie : undefined,
      gains: type === 'tombola' ? gains : undefined,
      dureeAffichage: dureeAffichage || 10,
    })

    res.status(201).json({
      success: true,
      message: 'Promotion créée avec succès',
      promotion,
    })
  } catch (error) {
    console.error('Erreur création promotion:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création.',
      error: error.message,
    })
  }
})

// @route   PUT /api/admin/promotions/:id
// @desc    Modifier une promotion
// @access  Private (Admin)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { nom, dateDebut, dateFin, actif, gains, dureeAffichage } = req.body

    const promotion = await Promotion.findById(req.params.id)

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion introuvable.',
      })
    }

    // Mettre à jour les champs
    if (nom !== undefined) promotion.nom = nom
    if (dateDebut !== undefined) promotion.dateDebut = new Date(dateDebut)
    if (dateFin !== undefined) promotion.dateFin = new Date(dateFin)
    if (actif !== undefined) promotion.actif = actif
    if (gains !== undefined && promotion.type === 'tombola')
      promotion.gains = gains
    if (dureeAffichage !== undefined) promotion.dureeAffichage = dureeAffichage

    await promotion.save()

    res.json({
      success: true,
      message: 'Promotion modifiée avec succès',
      promotion,
    })
  } catch (error) {
    console.error('Erreur modification promotion:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification.',
      error: error.message,
    })
  }
})

// @route   DELETE /api/admin/promotions/:id
// @desc    Supprimer une promotion
// @access  Private (Admin)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion introuvable.',
      })
    }

    await promotion.deleteOne()

    res.json({
      success: true,
      message: 'Promotion supprimée avec succès',
    })
  } catch (error) {
    console.error('Erreur suppression promotion:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression.',
      error: error.message,
    })
  }
})

// @route   PATCH /api/admin/promotions/:id/toggle
// @desc    Activer/Désactiver une promotion
// @access  Private (Admin)
router.patch('/:id/toggle', verifyAdmin, async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion introuvable.',
      })
    }

    promotion.actif = !promotion.actif
    await promotion.save()

    res.json({
      success: true,
      message: `Promotion ${promotion.actif ? 'activée' : 'désactivée'}`,
      promotion,
    })
  } catch (error) {
    console.error('Erreur toggle promotion:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut.',
      error: error.message,
    })
  }
})

module.exports = router
