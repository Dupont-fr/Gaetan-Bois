const mongoose = require('mongoose')

const promotionSchema = new mongoose.Schema(
  {
    // Type de promotion
    type: {
      type: String,
      required: true,
      enum: ['stock-limite', 'tombola'],
    },

    // ============================================
    // CHAMPS COMMUNS
    // ============================================

    nom: {
      type: String,
      required: [true, 'Le nom de la promotion est requis'],
      trim: true,
    },

    actif: {
      type: Boolean,
      default: true,
    },

    dateDebut: {
      type: Date,
      required: true,
    },

    dateFin: {
      type: Date,
      required: true,
    },

    // ============================================
    // TYPE 1 : STOCK LIMITÉ
    // ============================================

    // Catégorie concernée (seulement pour Stock Limité)
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: function () {
        return this.type === 'stock-limite'
      },
    },

    // ============================================
    // TYPE 2 : TOMBOLA
    // ============================================

    // Liste des gains possibles (seulement pour Tombola)
    gains: [
      {
        type: String,
        trim: true,
      },
    ],

    // Durée d'affichage par catégorie (en secondes, par défaut 10s)
    dureeAffichage: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
    collection: 'promotions',
  },
)

// Index pour optimiser les requêtes
promotionSchema.index({ actif: 1, dateDebut: 1, dateFin: 1 })
promotionSchema.index({ type: 1, actif: 1 })
promotionSchema.index({ categorie: 1, actif: 1 })

// Méthode virtuelle pour vérifier si la promo est active
promotionSchema.virtual('estActive').get(function () {
  const now = new Date()
  return this.actif && this.dateDebut <= now && this.dateFin >= now
})

// Méthode virtuelle pour calculer le temps restant
promotionSchema.virtual('tempsRestant').get(function () {
  const now = new Date()
  const diff = this.dateFin - now

  if (diff <= 0) return null

  const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
  const heures = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secondes = Math.floor((diff % (1000 * 60)) / 1000)

  return { jours, heures, minutes, secondes }
})

// S'assurer que les virtuels sont inclus lors de la conversion en JSON
promotionSchema.set('toJSON', { virtuals: true })
promotionSchema.set('toObject', { virtuals: true })

// Utiliser mongoose.models pour éviter l'erreur de recompilation
module.exports =
  mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema)
