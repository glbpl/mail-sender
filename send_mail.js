// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const https = require('https'); // Добавляем модуль https
const fs = require('fs'); // Для чтения файлов сертификатов
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

// Опции для HTTPS сервера - пути к сертификату и ключу из .env файла
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),  // Путь к вашему приватному ключу из .env
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)  // Путь к вашему SSL сертификату из .env
};

// Создание HTTPS сервера вместо HTTP
https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`HTTPS Server started on port ${port}`);
});

// Если вы хотите также сохранить HTTP сервер, который будет перенаправлять на HTTPS:
// const http = require('http');
// http.createServer((req, res) => {
//   res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
//   res.end();
// }).listen(80);