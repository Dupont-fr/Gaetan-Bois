const express = require('express')
const router = express.Router()
const { sendEmail } = require('../utils/emailConfig')

// POST /api/contact/send
router.post('/send', async (req, res) => {
  try {
    const { nom, email, telephone, sujet, message } = req.body

    if (!nom || !email || !sujet || !message) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs requis doivent être remplis',
      })
    }

    // Email à l'entreprise
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5a2b 0%, #6d4522 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">GAETAN BOIS</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Nouveau message de contact</p>
        </div>
        
        <div style="padding: 30px; background: #f7fafc;">
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2d3748; margin: 0 0 20px;">Informations du contact</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Nom:</td>
                <td style="padding: 10px 0; color: #2d3748;">${nom}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Email:</td>
                <td style="padding: 10px 0; color: #2d3748;">${email}</td>
              </tr>
              ${
                telephone
                  ? `
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Téléphone:</td>
                <td style="padding: 10px 0; color: #2d3748;">${telephone}</td>
              </tr>
              `
                  : ''
              }
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Sujet:</td>
                <td style="padding: 10px 0; color: #2d3748;">${sujet}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 8px;">
            <h3 style="color: #2d3748; margin: 0 0 15px;">Message:</h3>
            <p style="color: #4a5568; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #718096; font-size: 14px;">
          <p style="margin: 0;">GAETAN BOIS - Menuiserie Artisanale</p>
          <p style="margin: 5px 0 0;">Douala, Cameroun</p>
        </div>
      </div>
    `

    await sendEmail(
      'gaetanteguezang@gmail.com', // Votre email
      `Nouveau message: ${sujet}`,
      emailHtml,
    )

    // Email de confirmation au client
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5a2b 0%, #6d4522 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">GAETAN BOIS</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Merci pour votre message</p>
        </div>
        
        <div style="padding: 30px; background: #f7fafc;">
          <div style="background: white; padding: 25px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin: 0 0 15px;">Bonjour ${nom},</h2>
            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 15px;">
              Nous avons bien reçu votre message concernant: <strong>${sujet}</strong>
            </p>
            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 15px;">
              Notre équipe va l'étudier et vous répondra dans les plus brefs délais.
            </p>
            <p style="color: #4a5568; line-height: 1.6; margin: 0;">
              Merci de votre confiance !
            </p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #718096; font-size: 14px;">
          <p style="margin: 0;">GAETAN BOIS - Menuiserie Artisanale</p>
          <p style="margin: 5px 0;">Téléphone: +237 675 896 537</p>
          <p style="margin: 5px 0 0;">Yaoundé, Cameroun</p>
        </div>
      </div>
    `

    await sendEmail(
      email,
      'Confirmation de votre message - GAETAN BOIS',
      confirmationHtml,
    )

    res.json({
      success: true,
      message: 'Message envoyé avec succès',
    })
  } catch (error) {
    console.error('Erreur envoi email:', error)
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi du message",
    })
  }
})

module.exports = router
