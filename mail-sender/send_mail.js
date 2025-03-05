// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware for CORS handling
app.use(cors());

// Middleware for request body parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setting up transporter for sending emails via Yandex
const transporter = nodemailer.createTransport({
  host: 'smtp.yandex.ru',
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Route to check server operation
app.get('/', (req, res) => {
  res.send('Mail server is working!');
});

// Route for processing form data
app.post('/api/send-mail', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Check if all required fields are present
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill in all form fields (name, email, and message)' 
      });
    }
    
    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: `New message from ${name}`,
      html: `
        <h3>New message from your portfolio website 💼</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
      text: `
        New message from your website
        
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `
    };
    
    // Sending email
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      message: 'Message successfully sent!' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while sending the message. Please try again later.' 
    });
  }
});

// Starting server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});