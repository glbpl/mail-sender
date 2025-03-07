// Загрузка переменных окружения из файла .env
require('dotenv').config();

const express = require('express');
const https = require('https');
const fs = require('fs');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer'); // Добавляем multer для обработки multipart/form-data

const app = express();
const port = process.env.PORT || 3000;

// Настройка multer для обработки multipart/form-data
const upload = multer();

// Расширенные настройки CORS для работы с Webflow
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-requested-with', 'Authorization']
}));

// Настройка транспорта для отправки писем через Яндекс
const transporter = nodemailer.createTransport({
  host: 'smtp.yandex.ru',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Маршрут для проверки работы сервера
app.get('/', (req, res) => {
  res.send('Почтовый сервер работает!');
});

// Маршрут для обработки данных формы из Webflow с поддержкой только multipart/form-data
app.post('/api/send-mail', upload.none(), async (req, res) => {
  // Логируем заголовки и тело запроса для отладки
  console.log('Заголовки запроса:', req.headers);
  console.log('Тело запроса после обработки multer:', req.body);

  try {
    // Извлекаем поля формы напрямую из req.body (multer уже обработал multipart/form-data)
    const name = req.body.name || req.body.Name || '';
    const email = req.body.email || req.body.Email || '';
    const message = req.body.message || req.body.Message || req.body.comment || req.body.Comment || '';

    console.log('Извлеченные данные формы:', { name, email, message });

    // Проверяем наличие всех обязательных полей
    if (!name || !email || !message) {
      console.error('Отсутствуют обязательные поля');
      return res.sendStatus(400); // Только статус без тела ответа
    }

    console.log(`Отправка письма от ${name} <${email}>`);

    // Конфигурация письма
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: `Новое сообщение от ${name}`,
      html: `
        <h3>Новое сообщение с вашего портфолио 💼</h3>
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
    console.log('Письмо успешно отправлено');

    // Возвращаем только статус 200 без тела ответа
    res.sendStatus(200);

  } catch (error) {
    console.error('Ошибка при отправке письма:', error);
    // Возвращаем только статус 500 без тела ответа
    res.sendStatus(500);
  }
});

// Обработка OPTIONS запросов (для предварительных запросов CORS)
app.options('*', cors());

// Опции для HTTPS сервера - пути к сертификату и ключу из .env файла
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

// Создание HTTPS сервера
https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`HTTPS сервер запущен на порту ${port}`);
});