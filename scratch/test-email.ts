import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// .env.local'dan verileri yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testEmail() {
  console.log('--- E-posta Testi Başladı ---');
  console.log('Kullanıcı:', process.env.SMTP_EMAIL);
  console.log('Şifre Hazır mı?:', process.env.SMTP_PASSWORD ? 'Evet' : 'Hayır');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"LeadNova Test" <${process.env.SMTP_EMAIL}>`,
      to: 'salimhankizilirmak@gmail.com', // Kendinize test gönderin
      subject: 'LeadNova SMTP Testi',
      text: 'E-posta servisi başarıyla çalışıyor!',
      html: '<b>E-posta servisi başarıyla çalışıyor!</b>',
    });
    console.log('BAŞARILI! Mesaj ID:', info.messageId);
  } catch (error) {
    console.error('HATA OLUŞTU:', error);
  }
}

testEmail();
