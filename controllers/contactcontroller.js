import Contact from "../models/contactmodel.js";


export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    res.status(201).json({
      success: true,
      data: newContact,
      msg: "Message sent successfully ✅",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

