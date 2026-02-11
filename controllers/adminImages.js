const express = require('express')
const router = express.Router()
const Image = require('../models/image')
const Category = require('../models/Category')
const { verifyAdmin } = require('../utils/adminAuth')

// ============================================
// ROUTES ADMIN - GESTION DES IMAGES/PRODUITS
// ============================================

// @route   GET /api/admin/categories/:categoryId/images
// @desc    Obtenir toutes les images d'une catégorie
// @access  Private (Admin)
router.get('/:categoryId/images', verifyAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params

    // Vérifier que la catégorie existe
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable.',
      })
    }

    const images = await Image.find({ categorie: categoryId }).sort({
      ordre: 1,
      createdAt: -1,
    })

    res.json({
      success: true,
      count: images.length,
      images,
      category: {
        id: category._id,
        nom: category.nom,
        slug: category.slug,
        description: category.description,
      },
    })
  } catch (error) {
    console.error('Erreur récupération images:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des images.',
    })
  }
})

// @route   POST /api/admin/categories/:categoryId/images
// @desc    Ajouter une image/produit à une catégorie
// @access  Private (Admin)
router.post('/:categoryId/images', verifyAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params
    const {
      url,
      publicId,
      nom,
      prix,
      devise,
      description,
      enStock,
      quantite,
      dimensions,
      materiau,
      ordre,
    } = req.body

    // Validation
    if (!url || !publicId) {
      return res.status(400).json({
        success: false,
        message: 'URL et publicId sont requis.',
      })
    }

    // Vérifier que la catégorie existe
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable.',
      })
    }

    // Créer l'image/produit
    const image = await Image.create({
      url,
      publicId,
      categorie: categoryId,
      nom: nom || '',
      prix: prix || 0,
      devise: devise || 'FCFA',
      description: description || '',
      enStock: enStock !== undefined ? enStock : true,
      quantite: quantite || 1,
      dimensions: dimensions || {},
      materiau: materiau || '',
      ordre: ordre || 0,
    })

    res.status(201).json({
      success: true,
      message: 'Image ajoutée avec succès',
      image,
    })
  } catch (error) {
    console.error('Erreur ajout image:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de l'image.",
      error: error.message,
    })
  }
})

// @route   PUT /api/admin/images/:imageId
// @desc    Modifier une image/produit
// @access  Private (Admin)
router.put('/images/:imageId', verifyAdmin, async (req, res) => {
  try {
    const { imageId } = req.params
    const {
      nom,
      prix,
      devise,
      description,
      enStock,
      quantite,
      dimensions,
      materiau,
      ordre,
      actif,
    } = req.body

    const image = await Image.findById(imageId)

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image introuvable.',
      })
    }

    // Mettre à jour les champs
    if (nom !== undefined) image.nom = nom
    if (prix !== undefined) image.prix = prix
    if (devise !== undefined) image.devise = devise
    if (description !== undefined) image.description = description
    if (enStock !== undefined) image.enStock = enStock
    if (quantite !== undefined) image.quantite = quantite
    if (dimensions !== undefined) image.dimensions = dimensions
    if (materiau !== undefined) image.materiau = materiau
    if (ordre !== undefined) image.ordre = ordre
    if (actif !== undefined) image.actif = actif

    await image.save()

    res.json({
      success: true,
      message: 'Image modifiée avec succès',
      image,
    })
  } catch (error) {
    console.error('Erreur modification image:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification.',
      error: error.message,
    })
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
      return res.status(404).json({
        success: false,
        message: 'Image introuvable.',
      })
    }

    await image.deleteOne()

    res.json({
      success: true,
      message: 'Image supprimée avec succès',
      publicId: image.publicId,
    })
  } catch (error) {
    console.error('Erreur suppression image:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression.',
      error: error.message,
    })
  }
})

// @route   PUT /api/admin/categories/:categoryId/images/reorder
// @desc    Réorganiser l'ordre des images
// @access  Private (Admin)
router.put('/:categoryId/images/reorder', verifyAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params
    const { imageIds } = req.body

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({
        success: false,
        message: "Format invalide. Un tableau d'IDs est requis.",
      })
    }

    const updatePromises = imageIds.map((imageId, index) =>
      Image.findByIdAndUpdate(imageId, { ordre: index }),
    )

    await Promise.all(updatePromises)

    res.json({
      success: true,
      message: 'Ordre des images mis à jour',
    })
  } catch (error) {
    console.error('Erreur réorganisation images:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réorganisation.',
      error: error.message,
    })
  }
})

module.exports = router
