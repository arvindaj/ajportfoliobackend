import Contact from "../models/contactmodel.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";


dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Nodemailer transporter setup (Gmail SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 465,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Load confirmation email template
const emailTemplatePath = path.join(
  __dirname,
  "../emailtemplate/contactemailtem.html"
);

let emailTemplate = "";
try {
  emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
} catch (err) {
  console.error("❌ Could not load email template:", err.message);
}

export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Save to MongoDB
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    // ✅ Confirmation email to user
    let userHtml = emailTemplate
      .replace(/{name}/g, name)
      .replace(/{email}/g, email)
      .replace(/{subject}/g, subject)
      .replace(/{message}/g, message);

    let userText = `
Hi ${name},

Thanks for contacting us! We’ve received your message.

--- Your Details ---
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}

Our team will review your message and get back to you soon.
Best regards,
Your Portfolio Team
    `;

    await transporter.sendMail({
      from: `"Your Portfolio Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Thanks ${name}, we received your message!`,
      text: userText,
      html: userHtml,
    });

    // ✅ Notification email to Admin
    await transporter.sendMail({
      from: `"Portfolio Website" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL, // your email
      subject: `📩 New Contact Form Submission from ${name}`,
      text: `
New contact form submission:

Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
      `,
      html: `
        <h2>📩 New Contact Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    res.status(201).json({
      success: true,
      data: newContact,
      msg: "Message sent successfully ✅",
    });
  } catch (error) {
    console.error("❌ Email Error:", error);
    res.status(500).json({ error: error.message });
  }
};
