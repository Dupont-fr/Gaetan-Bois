const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
    },
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    prenom: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String, // URL de la photo ou avatar généré
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // Auto-approuvé par défaut
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: String, // visitorId
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index pour optimiser les requêtes
reviewSchema.index({ status: 1, createdAt: -1 })
reviewSchema.index({ visitorId: 1, createdAt: -1 })

module.exports = mongoose.model('Review', reviewSchema)
