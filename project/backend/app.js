const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const billRoutes = require('./routes/billRoutes');
const tableRoutes = require('./routes/tableRoutes');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Smart Food Ordering API is running 🍽️', timestamp: new Date() });
});


app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/tables', tableRoutes);


app.use(notFound);


app.use(errorHandler);

module.exports = app;
