const router = require('express').Router();
const { autenticarToken, esAdmin } = require('../middlewares/auth.middleware');
const { getAll, createProduct, updateProduct, removeProduct } = require('../controllers/products.controller');

router.get('/', autenticarToken, getAll);
router.post('/', autenticarToken, esAdmin, createProduct);
router.put('/:id', autenticarToken, esAdmin, updateProduct);
router.delete('/:id', autenticarToken, esAdmin, removeProduct);

module.exports = router;