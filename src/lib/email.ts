import nodemailer from 'nodemailer';

/**
 * LeadNova Premium SaaS Bildirim Servisi (Nodemailer - SMTP)
 */

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
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

/**
 * Ana Gövde Şablonu (Premium Minimalist Design)
 */
const getPremiumTemplate = (content: string, actionLabel?: string, actionUrl?: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Inter', -apple-system, sans-serif; background-color: #ffffff; color: #111827; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 600px; margin: 40px auto; border: 1px solid #f3f4f6; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .header { background-color: #111827; padding: 40px; text-align: center; }
        .logo { color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
        .content { padding: 48px 40px; line-height: 1.6; }
        .footer { background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #f3f4f6; }
        h1 { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 24px; letter-spacing: -0.5px; }
        p { font-size: 15px; color: #4b5563; margin-bottom: 24px; }
        .btn { display: inline-block; background-color: #111827; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 700; transition: all 0.2s; }
        .card { background-color: #f9fafb; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #f3f4f6; }
        .label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px; margin-bottom: 4px; }
        .value { font-size: 14px; font-weight: 600; color: #111827; }
        .footer-text { font-size: 12px; color: #9ca3af; font-weight: 500; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <div class="logo">LEADNOVA</div>
        </div>
        <div class="content">
            ${content}
            ${actionUrl ? `
            <div style="text-align: center; margin-top: 40px;">
                <a href="${actionUrl}" class="btn">${actionLabel}</a>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            <p class="footer-text">© 2026 LeadNova Kurumsal Yönetim Sistemi<br>Bu e-posta otomatik olarak gönderilmiştir.</p>
        </div>
    </div>
</body>
</html>
`;

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"LeadNova Kurumsal" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('E-posta gönderim hatası:', error);
    return { success: false, error };
  }
}

/**
 * Şablon 1: Yeni Görev Ataması (Sayın [İsim]...)
 */
export async function sendTaskAssignmentEmail(
  toEmail: string, 
  taskTitle: string, 
  projectName: string, 
  assigneeName: string
) {
  const content = `
    <h1>Sayın ${assigneeName},</h1>
    <p>LeadNova Kurumsal Yönetim Sistemi üzerinden tarafınıza ${projectName} kapsamında yeni bir görev atanmıştır. Detaylar aşağıda belirtilmiştir:</p>
    <div class="card">
        <div style="margin-bottom: 16px;">
            <div class="label">GÖREV BAŞLIĞI</div>
            <div class="value">${taskTitle}</div>
        </div>
        <div>
            <div class="label">PROJE</div>
            <div class="value">${projectName}</div>
        </div>
    </div>
    <p>Görevinizi zamanında tamamlamak ve süreç takibi için lütfen sisteme giriş yaparak detayları inceleyiniz.</p>
  `;

  const html = getPremiumTemplate(
    content, 
    "GÖREVİ GÖRÜNTÜLE", 
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  );

  return sendEmail({ 
    to: toEmail, 
    subject: `[LeadNova] Yeni Görev: ${taskTitle}`, 
    html 
  });
}

/**
 * Şablon 2: Dosya Bildirimi (Manager Bildirimi)
 */
export async function sendProjectAttachmentNotificationEmail(
  toEmail: string,
  managerName: string,
  projectName: string,
  fileName: string,
  uploaderName: string
) {
  const content = `
    <h1>Sayın ${managerName},</h1>
    <p>Yöneticisi olduğunuz <strong>${projectName}</strong> projesine yeni bir döküman yüklendi. Bilgilerinize sunulur:</p>
    <div class="card">
        <div style="margin-bottom: 16px;">
            <div class="label">DOSYA ADI</div>
            <div class="value">${fileName}</div>
        </div>
        <div>
            <div class="label">YÜKLEYEN PERSONEL</div>
            <div class="value">${uploaderName}</div>
        </div>
    </div>
    <p>İlgili dökümanı proje detay sayfasındaki "Sohbet & Ekler" sekmesinden inceleyebilirsiniz.</p>
  `;

  const html = getPremiumTemplate(
    content, 
    "PROJEYE GİT", 
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  );

  return sendEmail({ 
    to: toEmail, 
    subject: `[LeadNova] Proje Güncellemesi: Yeni Döküman`, 
    html 
  });
}

