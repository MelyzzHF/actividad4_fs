const db = require('../middlewares/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

const register = async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    const hashed = await bcrypt.hash(password, 10);
    db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashed, role || 'user'],
        (err) => {
            if (err) return res.status(500).json({ error: "Error al registrar usuario" });
            res.status(201).json({ mensaje: "Usuario creado exitosamente" });
        }
    );
};
const login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username y contraseña son obligatorios' });
    }
    db.execute('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }
        const token = jwt.sign(
            { id: results[0].id, role: results[0].role },
            SECRET_KEY,
            { expiresIn: '1h' }
        );
        res.json({ token });
    });
};

module.exports = { register, login };