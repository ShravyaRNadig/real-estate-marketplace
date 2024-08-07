// email.js
import nodemailer from 'nodemailer'; // Use import statement

// Create a transporter object using your SMTP service configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail', // You can use other services like 'SendGrid', 'Mailgun', etc.
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendLoginEmail = (to, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Welcome to ${process.env.APP_NAME}`,
    text: `Hi ${name},\n\nThank you for joining us on our ${process.env.APP_NAME}!\n\nBest regards,\nThe Team`,
  };

  return transporter.sendMail(mailOptions)
    .then(info => console.log('Email sent:', info))
    .catch(error => {
      console.error('Error sending email:', error);
      throw error; 
    });
};

export { sendLoginEmail };
