require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log("Starting email test...");
  
  if (!process.env.SMTP_PASS || process.env.SMTP_PASS === "YOUR_APP_PASSWORD_HERE") {
    console.error("ERROR: Please update SMTP_PASS in your .env file with your Gmail App Password before testing.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 465,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log(`Attempting to send email from ${process.env.SMTP_USER} to adarsh16221@gmail.com...`);

    const info = await transporter.sendMail({
      from: `"Deep Work Space" <${process.env.SMTP_USER}>`,
      to: "adarsh16221@gmail.com",
      subject: "Test Email from Orbit App",
      text: "This is a test email sent from the Orbit app using your Gmail account!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4648D4;">Orbit App Test</h2>
          <p>This is a test email sent from your Orbit app using your Gmail account!</p>
          <p>If you received this, your Nodemailer configuration is working perfectly.</p>
        </div>
      `,
    });

    console.log("Success! Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Failed to send email. Error details:");
    console.error(error);
  }
}

testEmail();
