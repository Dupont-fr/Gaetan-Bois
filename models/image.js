const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema(
  {
    // Informations Cloudinary
    url: {
      type: String,
      required: [true, "L'URL de l'image est requise"],
    },
    publicId: {
      type: String,
      required: [true, 'Le publicId Cloudinary est requis'],
    },

    // Informations produit
    nom: {
      type: String,
      default: '',
      trim: true,
    },
    prix: {
      type: Number,
      default: 0,
    },
    devise: {
      type: String,
      default: 'FCFA',
      enum: ['FCFA', 'EUR', 'USD'],
    },
    description: {
      type: String,
      default: '',
    },

    // Stock
    enStock: {
      type: Boolean,
      default: true,
    },
    quantite: {
      type: Number,
      default: 1,
    },

    // Dimensions (en cm)
    dimensions: {
      longueur: { type: Number, default: null },
      largeur: { type: Number, default: null },
      hauteur: { type: Number, default: null },
    },

    // Matériau
    materiau: {
      type: String,
      default: '',
      trim: true,
    },

    // Catégorie parente
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La catégorie est requise'],
    },

    // Ordre d'affichage
    ordre: {
      type: Number,
      default: 0,
    },

    // Visibilité
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index pour optimiser les requêtes
imageSchema.index({ categorie: 1, ordre: 1 })
imageSchema.index({ categorie: 1, actif: 1 })

// Méthode virtuelle pour formater le prix - AVEC GESTION DES UNDEFINED
imageSchema.virtual('prixFormate').get(function () {
  // ⚠️ Vérifier que prix existe et n'est pas undefined
  if (this.prix === undefined || this.prix === null || this.prix === 0) {
    return 'Prix sur demande'
  }
  return `${this.prix.toLocaleString('fr-FR')} ${this.devise || 'FCFA'}`
})

// Méthode virtuelle pour formater les dimensions
imageSchema.virtual('dimensionsFormatees').get(function () {
  // ⚠️ Vérifier que dimensions existe
  if (!this.dimensions) return null

  const { longueur, largeur, hauteur } = this.dimensions
  if (!longueur && !largeur && !hauteur) return null

  const parts = []
  if (longueur) parts.push(`L${longueur}`)
  if (largeur) parts.push(`l${largeur}`)
  if (hauteur) parts.push(`H${hauteur}`)

  return parts.join(' x ') + ' cm'
})

// S'assurer que les virtuels sont inclus lors de la conversion en JSON
imageSchema.set('toJSON', { virtuals: true })
imageSchema.set('toObject', { virtuals: true })

module.exports = mongoose.models.Image || mongoose.model('Image', imageSchema)
