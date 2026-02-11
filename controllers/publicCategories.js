const express = require('express')
const router = express.Router()
const Category = require('../models/Category')
const Image = require('../models/image')

// ============================================
// ROUTES PUBLIQUES - POUR LES VISITEURS
// ============================================

// @route   GET /api/categories
// @desc    Obtenir toutes les catégories actives avec leurs images
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ actif: true })
      .sort({ ordre: 1, nom: 1 })
      .select('nom slug ordre')

    // Récupérer les images pour chaque catégorie
    const categoriesWithImages = await Promise.all(
      categories.map(async (cat) => {
        const images = await Image.find({
          categorie: cat._id,
          actif: true,
        })
          .sort({ ordre: 1, createdAt: -1 })
          // ⚠️ IMPORTANT : Sélectionner TOUS les champs nécessaires
          .select(
            'url nom prix devise description enStock quantite dimensions materiau ordre',
          )
          .limit(20) // Limiter à 20 images par catégorie

        return {
          id: cat._id,
          nom: cat.nom,
          slug: cat.slug,
          ordre: cat.ordre,
          images,
          nombreImages: images.length,
        }
      }),
    )

    // Filtrer les catégories qui ont au moins une image
    const categoriesWithContent = categoriesWithImages.filter(
      (cat) => cat.images.length > 0,
    )

    res.json({
      success: true,
      count: categoriesWithContent.length,
      categories: categoriesWithContent,
    })
  } catch (error) {
    console.error('Erreur récupération catégories publiques:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories.',
    })
  }
})

// @route   GET /api/categories/:slug
// @desc    Obtenir une catégorie par slug avec ses images
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      actif: true,
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable.',
      })
    }

    const images = await Image.find({
      categorie: category._id,
      actif: true,
    })
      .sort({ ordre: 1, createdAt: -1 })
      // ⚠️ IMPORTANT : Tous les champs ici aussi
      .select(
        'url nom prix devise description enStock quantite dimensions materiau ordre',
      )

    res.json({
      success: true,
      category: {
        id: category._id,
        nom: category.nom,
        slug: category.slug,
        images,
        nombreImages: images.length,
      },
    })
  } catch (error) {
    console.error('Erreur récupération catégorie publique:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération.',
    })
  }
})

module.exports = router
