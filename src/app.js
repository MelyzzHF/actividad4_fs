const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const productsRoutes = require('./routes/products.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);

app.use((err, req, res, next) => {
    console.error("DETALLE DEL ERROR:", err.message);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
});

module.exports = app;