const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom de la catégorie est requis'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    ordre: {
      type: Number,
      default: 0,
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Générer automatiquement le slug avant sauvegarde
categorySchema.pre('save', async function () {
  if (this.isModified('nom')) {
    this.slug = this.nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
})

// Méthode virtuelle pour compter les images
categorySchema.virtual('nombreImages', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'categorie',
  count: true,
})

// S'assurer que les virtuels sont inclus lors de la conversion en JSON
categorySchema.set('toJSON', { virtuals: true })
categorySchema.set('toObject', { virtuals: true })

module.exports =
  mongoose.models.Category || mongoose.model('Category', categorySchema)
