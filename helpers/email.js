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

const sendWelcomeEmail = (to, name) => {
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

const sendPasswordResetEmail = (to, name, resetToken) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Password Reset for ${process.env.APP_NAME}`,
    text: `Hi ${name},\n\nWe received a request to reset your password for ${process.env.APP_NAME}.\n\nPlease use the following link to reset your password:\n\n${process.env.APP_URL}/reset-password?token=${resetToken} & resendToken=${resendToken} please change as soon as possible\n\nIf you didn't request this change, you can ignore this email.\n\nBest regards,\nThe Team`,
  };

  return transporter.sendMail(mailOptions)
    .then(info => console.log('Password reset email sent:', info))
    .catch(error => {
      console.error('Error sending password reset email:', error);
      throw error;
    });
}


export { sendWelcomeEmail ,sendPasswordResetEmail};
