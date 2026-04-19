import nodemailer from 'nodemailer';

/**
 * LeadNova B2B SaaS Bildirim Servisi (Nodemailer - Gmail SMTP)
 */

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"LeadNova System" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log('E-posta başarıyla gönderildi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('E-posta gönderim hatası:', error);
    return { success: false, error };
  }
}

/**
 * Yeni görev atama e-postası şablonu
 */
export async function sendTaskAssignmentEmail(
  toEmail: string, 
  taskTitle: string, 
  projectName: string, 
  assignerName: string
) {
  const subject = `Yeni Görev Atandı: ${taskTitle}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
      <h2 style="color: #4f46e5;">Merhaba!</h2>
      <p>LeadNova üzerinde size yeni bir görev atandı.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Görev:</strong> ${taskTitle}</p>
        <p><strong>Proje:</strong> ${projectName}</p>
        <p><strong>Atayan:</strong> ${assignerName}</p>
      </div>

      <p>Detayları görmek için lütfen dashboard'u ziyaret edin.</p>
      
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">Bu otomatik bir bildirimdir, lütfen yanıtlamayın.</p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}
