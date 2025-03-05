// Загружаем переменные окружения из файла .env
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware для обработки CORS
app.use(cors());

// Middleware для парсинга тела запроса
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Настройка транспортера для отправки писем через Yandex
const transporter = nodemailer.createTransport({
  host: 'smtp.yandex.ru',
  port: 465,
  secure: true, // true для 465 порта
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Маршрут для проверки работы сервера
app.get('/', (req, res) => {
  res.send('Сервер для отправки почты работает!');
});

// Маршрут для обработки данных формы
app.post('/send-mail', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Проверка наличия всех необходимых полей
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Пожалуйста, заполните все поля формы (имя, email и сообщение)' 
      });
    }
    
    // Настройка письма
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: `Новое сообщение от ${name}`,
      html: `
        <h3>Новое сообщение с вашего сайта</h3>
        <p><strong>Имя:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Сообщение:</strong></p>
        <p>${message}</p>
      `,
      text: `
        Новое сообщение с вашего сайта
        
        Имя: ${name}
        Email: ${email}
        Сообщение: ${message}
      `
    };
    
    // Отправка письма
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      message: 'Сообщение успешно отправлено!' 
    });
  } catch (error) {
    console.error('Ошибка при отправке письма:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже.' 
    });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});