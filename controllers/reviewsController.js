const express = require('express')
const router = express.Router()
const Review = require('../models/Review')

// ============================================
// ROUTES PUBLIQUES
// ============================================

// @route   GET /api/reviews
// @desc    Récupérer tous les avis approuvés
// @access  Public
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    })
  } catch (error) {
    console.error('Erreur récupération avis:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
    })
  }
})

// @route   POST /api/reviews
// @desc    Créer un nouvel avis
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { visitorId, nom, prenom, photo, message } = req.body

    // Validation
    if (!visitorId || !nom || !prenom || !message) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis',
      })
    }

    // Vérifier si le visiteur a déjà posté un avis récemment (anti-spam)
    const recentReview = await Review.findOne({
      visitorId,
      createdAt: { $gte: new Date(Date.now() - 60000) }, // 1 minute
    })

    if (recentReview) {
      return res.status(429).json({
        success: false,
        message: 'Veuillez attendre avant de poster un nouvel avis',
      })
    }

    const review = await Review.create({
      visitorId,
      nom,
      prenom,
      photo,
      message,
      status: 'approved',
      likes: 0,
      likedBy: [],
    })

    res.status(201).json({
      success: true,
      message: 'Avis créé avec succès',
      review,
    })
  } catch (error) {
    console.error('Erreur création avis:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'avis",
      error: error.message,
    })
  }
})

// @route   PUT /api/reviews/:id
// @desc    Modifier un avis
// @access  Public (avec vérification visitorId)
router.put('/:id', async (req, res) => {
  try {
    const { visitorId, message, photo } = req.body
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis introuvable',
      })
    }

    // Vérifier que c'est bien le propriétaire
    if (review.visitorId !== visitorId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier cet avis",
      })
    }

    // Mise à jour
    if (message) review.message = message
    if (photo) review.photo = photo

    await review.save()

    res.json({
      success: true,
      message: 'Avis modifié avec succès',
      review,
    })
  } catch (error) {
    console.error('Erreur modification avis:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la modification de l'avis",
      error: error.message,
    })
  }
})

// @route   DELETE /api/reviews/:id
// @desc    Supprimer un avis
// @access  Public (avec vérification visitorId)
router.delete('/:id', async (req, res) => {
  try {
    const { visitorId } = req.body
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis introuvable',
      })
    }

    // Vérifier que c'est bien le propriétaire
    if (review.visitorId !== visitorId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à supprimer cet avis",
      })
    }

    await Review.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'Avis supprimé avec succès',
    })
  } catch (error) {
    console.error('Erreur suppression avis:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'avis",
      error: error.message,
    })
  }
})

// @route   POST /api/reviews/:id/like
// @desc    Liker/déliker un avis
// @access  Public
router.post('/:id/like', async (req, res) => {
  try {
    const { visitorId } = req.body
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis introuvable',
      })
    }

    // Vérifier si déjà liké
    const hasLiked = review.likedBy.includes(visitorId)

    if (hasLiked) {
      // Déliker
      review.likedBy = review.likedBy.filter((id) => id !== visitorId)
      review.likes = Math.max(0, review.likes - 1)
    } else {
      // Liker
      review.likedBy.push(visitorId)
      review.likes += 1
    }

    await review.save()

    res.json({
      success: true,
      message: hasLiked ? 'Like retiré' : 'Avis liké',
      liked: !hasLiked,
      review,
    })
  } catch (error) {
    console.error('Erreur like avis:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors du like',
      error: error.message,
    })
  }
})

module.exports = router
