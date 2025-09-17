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

// Nodemailer transporter setup
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

// Load email template (with fallback)
const emailTemplatePath = path.join(
  __dirname,
  "../emailtemplate/contactemailtemplate.html"
);

let emailTemplate = "";
try {
  emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
  console.log("✅ Email template loaded successfully.");
} catch (err) {
  console.warn("⚠️ Could not load email template, using fallback HTML:", err.message);
  emailTemplate = `
    <html>
      <body style="font-family: Arial, sans-serif; padding:20px; background:#f9f9f9;">
        <div style="background:#fff; padding:20px; border-radius:8px; max-width:600px; margin:auto;">
          <h2>Hello {name},</h2>
          <p>Thank you for contacting us!</p>
          <p><strong>Your Details:</strong></p>
          <p><b>Email:</b> {email}</p>
          <p><b>Subject:</b> {subject}</p>
          <p><b>Message:</b> {message}</p>
          <p>Our team will get back to you soon.</p>
          <br/>
          <p style="font-size:12px; color:#777;">Best regards,<br/>Your Portfolio Team</p>
        </div>
      </body>
    </html>
  `;
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

    // Prepare email body (replace placeholders)
    let userHtml = emailTemplate
      .replace(/{name}/g, name)
      .replace(/{email}/g, email)
      .replace(/{subject}/g, subject)
      .replace(/{message}/g, message);

    let userText = `
Hi ${name},

Thanks for contacting us! We’ve received your message.



Our team will review your message and get back to you soon.
Best regards,
Your Portfolio Team
    `;

    // Send confirmation to user
    await transporter.sendMail({
      from: `"Your Portfolio Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Thanks ${name}, we received your message!`,
      text: userText,
      html: userHtml,
    });

    // Send notification to Admin
    await transporter.sendMail({
      from: `"Portfolio Website" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
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
