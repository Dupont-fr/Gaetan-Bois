const express = require('express')
const router = express.Router()
const Category = require('../models/Category')
const Image = require('../models/image')
const { verifyAdmin } = require('../utils/adminAuth')

// ============================================
// ROUTES ADMIN - GESTION DES CATÉGORIES
// ============================================

// @route   GET /api/admin/categories
// @desc    Obtenir toutes les catégories
// @access  Private (Admin)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ ordre: 1, createdAt: -1 })

    // Compter les images par catégorie
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const imageCount = await Image.countDocuments({ categorie: cat._id })
        return {
          ...cat.toObject(),
          nombreImages: imageCount,
        }
      }),
    )

    res.json({
      success: true,
      count: categories.length,
      categories: categoriesWithCount,
    })
  } catch (error) {
    console.error('Erreur récupération catégories:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories.',
    })
  }
})

// @route   GET /api/admin/categories/:id
// @desc    Obtenir une catégorie par ID
// @access  Private (Admin)
router.get('/:id', verifyAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable.',
      })
    }

    const imageCount = await Image.countDocuments({ categorie: req.params.id })

    res.json({
      success: true,
      category: {
        ...category.toObject(),
        nombreImages: imageCount,
      },
    })
  } catch (error) {
    console.error('Erreur récupération catégorie:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération.',
      error: error.message,
    })
  }
})

// @route   POST /api/admin/categories
// @desc    Créer une nouvelle catégorie (juste le nom)
// @access  Private (Admin)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { nom, ordre } = req.body

    // Validation
    if (!nom || nom.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie est requis.',
      })
    }

    // Vérifier si la catégorie existe déjà
    const existingCategory = await Category.findOne({
      nom: { $regex: new RegExp(`^${nom.trim()}$`, 'i') },
    })

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Cette catégorie existe déjà.',
      })
    }

    const category = await Category.create({
      nom: nom.trim(),
      ordre: ordre || 0,
    })

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      category,
    })
  } catch (error) {
    console.error('Erreur création catégorie:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie.',
      error: error.message,
    })
  }
})

// @route   PUT /api/admin/categories/:id
// @desc    Modifier une catégorie
// @access  Private (Admin)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { nom, description, ordre, actif } = req.body

    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable.',
      })
    }

    // Mettre à jour les champs
    if (nom && nom.trim()) category.nom = nom.trim()
    if (description !== undefined) category.description = description.trim()
    if (ordre !== undefined) category.ordre = ordre
    if (actif !== undefined) category.actif = actif

    await category.save()

    res.json({
      success: true,
      message: 'Catégorie modifiée avec succès',
      category,
    })
  } catch (error) {
    console.error('Erreur modification catégorie:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification.',
      error: error.message,
    })
  }
})

// @route   DELETE /api/admin/categories/:id
// @desc    Supprimer une catégorie
// @access  Private (Admin)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable.',
      })
    }

    // Vérifier s'il y a des images dans cette catégorie
    const imageCount = await Image.countDocuments({ categorie: req.params.id })

    if (imageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer. Cette catégorie contient ${imageCount} image(s).`,
        imageCount,
      })
    }

    await category.deleteOne()

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès',
    })
  } catch (error) {
    console.error('Erreur suppression catégorie:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression.',
      error: error.message,
    })
  }
})

// ============================================
// ROUTES ADMIN - GESTION DES IMAGES
// ============================================

// @route   PUT /api/admin/images/:imageId
// @desc    Modifier une image
// @access  Private (Admin)
router.put('/images/:imageId', verifyAdmin, async (req, res) => {
  try {
    const { imageId } = req.params
    const updateData = req.body

    const image = await Image.findById(imageId)
    if (!image) {
      return res
        .status(404)
        .json({ success: false, message: 'Image non trouvée' })
    }

    // Mettre à jour les champs
    Object.assign(image, updateData)
    await image.save()

    res.json({ success: true, message: 'Image modifiée avec succès', image })
  } catch (error) {
    console.error('Erreur modification image:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// @route   DELETE /api/admin/images/:imageId
// @desc    Supprimer une image
// @access  Private (Admin)
router.delete('/images/:imageId', verifyAdmin, async (req, res) => {
  try {
    const { imageId } = req.params

    const image = await Image.findById(imageId)
    if (!image) {
      return res
        .status(404)
        .json({ success: false, message: 'Image non trouvée' })
    }

    await image.deleteOne()

    res.json({ success: true, message: 'Image supprimée avec succès' })
  } catch (error) {
    console.error('Erreur suppression image:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
