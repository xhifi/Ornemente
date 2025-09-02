import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendMail = async ({ to, cc, text = "", html = "", subject = "" }) => {
  return await transporter.sendMail({
    from: process.env.SMTP_FROM,
    replyTo: process.env.SMTP_FROM,
    to: to,
    cc: cc,
    subject: subject,
    text: text,
    html: html,
  });
};

export { sendMail, transporter };
