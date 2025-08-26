import express from "express";
// import nodemailer from "nodemailer";
import { createContact } from "../controllers/contactcontroller.js";


const router = express.Router();

// POST /api/contact
router.post("/", createContact);

export default router;  // ✅ important
