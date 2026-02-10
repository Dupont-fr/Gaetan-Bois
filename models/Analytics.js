const mongoose = require('mongoose')

const AnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  visites: {
    type: Number,
    default: 0,
  },
  commandes: {
    type: Number,
    default: 0,
  },
  produits: [
    {
      produitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
      },
      nom: String,
      commandes: {
        type: Number,
        default: 0,
      },
    },
  ],
  categories: [
    {
      categorieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
      nom: String,
      commandes: {
        type: Number,
        default: 0,
      },
    },
  ],
})

// Index composé pour optimiser les requêtes par date
AnalyticsSchema.index({ date: -1 })

module.exports = mongoose.model('Analytics', AnalyticsSchema)
