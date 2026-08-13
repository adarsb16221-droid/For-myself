import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, text, html }) {
  // If SMTP details are available in env, use them
  const useRealSMTP = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER;
  
  let transporter;

  if (useRealSMTP) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  const info = await transporter.sendMail({
    from: `"Deep Work Space" <${process.env.SMTP_USER || 'no-reply@example.com'}>`, // sender address
    to, // list of receivers
    subject, // Subject line
    text, // plain text body
    html, // html body
  });

  if (!useRealSMTP) {
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
  
  return info;
}
