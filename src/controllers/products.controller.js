const db = require('../middlewares/db');
const getAll = (req, res) => {
    db.execute('SELECT * FROM products ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};
const createProduct = (req, res) => {
    const { name, description, price, stock, imagen_url } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }

    db.execute(
        'INSERT INTO products (name, description, price, stock, imagen_url) VALUES (?, ?, ?, ?, ?)',
        [name, description, price, stock, imagen_url],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Error al guardar el producto" });
            res.status(201).json({ mensaje: "Producto añadido", id: result.insertId });
        }
    );
};
const updateProduct = (req, res) => {
    let { name, description, price, stock, imagen_url } = req.body;

    db.execute(
        'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, imagen_url = ? WHERE id = ?',
        [name, description, price, stock, imagen_url, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: "Error al actualizar" });
            res.json({ mensaje: "Producto actualizado con éxito" });
        }
    );
};
const removeProduct = (req, res) => {
    db.execute('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: "Producto eliminado" });
    });
};

module.exports = { getAll, createProduct, updateProduct, removeProduct };