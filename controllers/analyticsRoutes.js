const express = require('express')
const router = express.Router()
const Analytics = require('../models/Analytics')
const { verifyAdmin } = require('../utils/adminAuth')

// @route   GET /api/admin/analytics/dashboard
// @desc    Obtenir les stats dashboard (30 derniers jours)
// @access  Private (Admin)
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Récupérer les données des 30 derniers jours
    const analytics = await Analytics.find({
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: 1 })
      .lean()

    // Formater les données pour le graphique
    const chartData = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayData = analytics.find(
        (a) => new Date(a.date).toDateString() === date.toDateString(),
      )

      chartData.push({
        date: date.toISOString().split('T')[0],
        visites: dayData?.visites || 0,
        commandes: dayData?.commandes || 0,
      })
    }

    // Calculer les totaux
    const totalVisites = analytics.reduce((sum, a) => sum + a.visites, 0)
    const totalCommandes = analytics.reduce((sum, a) => sum + a.commandes, 0)

    // Trouver le produit le plus commandé
    const produitsMap = new Map()
    analytics.forEach((day) => {
      day.produits?.forEach((p) => {
        const current = produitsMap.get(p.produitId?.toString()) || {
          nom: p.nom,
          total: 0,
        }
        current.total += p.commandes
        produitsMap.set(p.produitId?.toString(), current)
      })
    })

    const topProduit = Array.from(produitsMap.values()).sort(
      (a, b) => b.total - a.total,
    )[0] || { nom: 'Aucun', total: 0 }

    // Trouver la catégorie la plus commandée
    const categoriesMap = new Map()
    analytics.forEach((day) => {
      day.categories?.forEach((c) => {
        const current = categoriesMap.get(c.categorieId?.toString()) || {
          nom: c.nom,
          total: 0,
        }
        current.total += c.commandes
        categoriesMap.set(c.categorieId?.toString(), current)
      })
    })

    const topCategorie = Array.from(categoriesMap.values()).sort(
      (a, b) => b.total - a.total,
    )[0] || { nom: 'Aucune', total: 0 }

    res.json({
      success: true,
      chartData,
      stats: {
        totalVisites,
        totalCommandes,
        topProduit,
        topCategorie,
      },
    })
  } catch (error) {
    console.error('Erreur analytics dashboard:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// @route   POST /api/admin/analytics/visite
// @desc    Enregistrer une visite (appelé depuis le frontend public)
// @access  Public
router.post('/visite', async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await Analytics.findOneAndUpdate(
      { date: today },
      { $inc: { visites: 1 } },
      { upsert: true, new: true },
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Erreur enregistrement visite:', error)
    res.status(500).json({ success: false })
  }
})

// @route   POST /api/admin/analytics/commande
// @desc    Enregistrer une commande
// @access  Public
router.post('/commande', async (req, res) => {
  try {
    const { produitId, produitNom, categorieId, categorieNom } = req.body

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const analytics = await Analytics.findOne({ date: today })

    if (analytics) {
      // Incrémenter commandes totales
      analytics.commandes += 1

      // Incrémenter produit
      const produitIndex = analytics.produits.findIndex(
        (p) => p.produitId?.toString() === produitId,
      )
      if (produitIndex >= 0) {
        analytics.produits[produitIndex].commandes += 1
      } else {
        analytics.produits.push({
          produitId,
          nom: produitNom,
          commandes: 1,
        })
      }

      // Incrémenter catégorie
      const categorieIndex = analytics.categories.findIndex(
        (c) => c.categorieId?.toString() === categorieId,
      )
      if (categorieIndex >= 0) {
        analytics.categories[categorieIndex].commandes += 1
      } else {
        analytics.categories.push({
          categorieId,
          nom: categorieNom,
          commandes: 1,
        })
      }

      await analytics.save()
    } else {
      // Créer nouveau document
      await Analytics.create({
        date: today,
        commandes: 1,
        produits: [{ produitId, nom: produitNom, commandes: 1 }],
        categories: [{ categorieId, nom: categorieNom, commandes: 1 }],
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Erreur enregistrement commande:', error)
    res.status(500).json({ success: false })
  }
})

module.exports = router
