const brevo = require('@getbrevo/brevo')

// Config
const config = {
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  EMAIL_USER: process.env.EMAIL_USER || 'dupontdjeague@gmail.com',
}

console.log(
  '🔑 BREVO_API_KEY:',
  process.env.BREVO_API_KEY ? 'Présente' : 'MANQUANTE',
)
console.log('📧 EMAIL_USER:', config.EMAIL_USER)

let apiInstance = null

if (config.BREVO_API_KEY) {
  apiInstance = new brevo.TransactionalEmailsApi()
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    config.BREVO_API_KEY,
  )
  console.log('✅ Brevo API key configured')
} else {
  console.warn('⚠️  WARNING: BREVO_API_KEY not configured')
}

const sendEmail = async (to, subject, html, retries = 3) => {
  if (!config.BREVO_API_KEY) {
    throw new Error('Brevo API key not configured')
  }

  if (!to || !subject || !html) {
    throw new Error('Invalid email parameters')
  }

  const fromEmail = config.EMAIL_USER

  const plainText = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()

  const sendSmtpEmail = new brevo.SendSmtpEmail()

  sendSmtpEmail.sender = {
    name: 'GAETAN BOIS',
    email: fromEmail,
  }

  sendSmtpEmail.to = [{ email: to.trim().toLowerCase() }]
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = html
  sendSmtpEmail.textContent = plainText

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📤 Envoi email à ${to} (tentative ${attempt}/${retries})`)

      const response = await apiInstance.sendTransacEmail(sendSmtpEmail)

      console.log(`✅ Email envoyé avec succès à ${to}`)
      console.log(`📧 Message ID: ${response.messageId}`)

      return {
        success: true,
        messageId: response.messageId,
      }
    } catch (error) {
      console.error(
        `❌ Erreur Brevo (tentative ${attempt}/${retries}):`,
        error.message,
      )

      if (error.response) {
        console.error('Détails:', error.response.text || error.response.body)
      }

      if (attempt === retries) {
        throw new Error(`Échec envoi email: ${error.message}`)
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}

module.exports = { sendEmail }
