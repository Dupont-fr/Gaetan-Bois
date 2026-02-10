const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    // L'image principale (URL Cloudinary ou autre)
    imageUrl: {
      type: String,
      required: [true, 'L\'URL de l\'image est requise'],
    },
    // Texte alternatif pour l'image
    alt: {
      type: String,
      default: '',
    },
    // Catégorie à laquelle appartient cette image
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La catégorie est requise'],
    },
    // Ordre d'affichage dans le carousel
    ordre: {
      type: Number,
      default: 0,
    },
    // Actif ou non
    actif: {
      type: Boolean,
      default: true,
    },
    // Likes des visiteurs
    likes: {
      type: Number,
      default: 0,
    },
    // Liste des visiteurs qui ont liké (pour éviter les doublons)
    likedBy: [
      {
        type: String, // visitorId
      },
    ],
    // Nombre de vues
    vues: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Index pour recherche
productSchema.index({ categorie: 1, ordre: 1 })

module.exports = mongoose.model('Product', productSchema)