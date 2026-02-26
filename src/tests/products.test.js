const request = require('supertest');
const app = require('../app');

let adminToken;
let userToken;
let productoId;


beforeAll(async () => {
    const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
    adminToken = adminRes.body.token;

    const userRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'user', password: 'user123' });
    userToken = userRes.body.token;
});


describe('POST /api/auth/register', () => {
    it('debería registrar un usuario nuevo', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser_' + Date.now(),
                email: `test_${Date.now()}@test.com`,
                password: '123456',
                role: 'user'
            });
        expect(res.status).toBe(201);
        expect(res.body.mensaje).toBe('Usuario creado exitosamente');
    });

    it('debería fallar si faltan campos', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'incompleto' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Todos los campos son obligatorios');
    });
});

describe('POST /api/auth/login', () => {
    it('debería retornar un token con credenciales válidas', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('debería fallar con credenciales incorrectas', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'incorrecta' });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Credenciales incorrectas');
    });

    it('debería fallar si faltan campos', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username y contraseña son obligatorios');
    });

    it('debería fallar con usuario inexistente', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'noexiste', password: '123456' });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Credenciales incorrectas');
    });
});


describe('GET /api/products - Sin token', () => {
    it('debería retornar 401 sin token', async () => {
        const res = await request(app).get('/api/products');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Acceso Denegado');
    });

    it('debería retornar 403 con token inválido', async () => {
        const res = await request(app)
            .get('/api/products')
            .set('Authorization', 'Bearer tokenfalso123');
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Token inválido');
    });
});


describe('POST /api/products - Crear (Admin)', () => {
    it('debería crear un producto como admin', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Producto Test',
                description: 'Descripción de prueba',
                price: 99.99,
                stock: 10,
                imagen_url: 'https://ejemplo.com/img.jpg'
            });
        expect(res.status).toBe(201);
        expect(res.body.mensaje).toBe('Producto añadido');
        productoId = res.body.id;
    });

    it('debería fallar si falta nombre o precio', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ description: 'Sin nombre ni precio' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Nombre y precio son obligatorios');
    });
});

describe('POST /api/products - Crear (User)', () => {
    it('debería denegar acceso a un user', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Producto Prohibido',
                price: 50
            });
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Acceso denegado: Se requiere rol de Administrador');
    });
});

describe('GET /api/products - Listar', () => {
    it('debería obtener productos como admin', async () => {
        const res = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('debería obtener productos como user', async () => {
        const res = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('PUT /api/products/:id - Actualizar (Admin)', () => {
    it('debería actualizar un producto como admin', async () => {
        const res = await request(app)
            .put(`/api/products/${productoId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Producto Actualizado',
                description: 'Descripción actualizada',
                price: 149.99,
                stock: 5,
                imagen_url: 'https://ejemplo.com/nueva.jpg'
            });
        expect(res.status).toBe(200);
        expect(res.body.mensaje).toBe('Producto actualizado con éxito');
    });
});

describe('PUT /api/products/:id - Actualizar (User)', () => {
    it('debería denegar actualización a un user', async () => {
        const res = await request(app)
            .put(`/api/products/${productoId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Intento de edición',
                price: 10
            });
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Acceso denegado: Se requiere rol de Administrador');
    });
});

describe('DELETE /api/products/:id - Eliminar (User)', () => {
    it('debería denegar eliminación a un user', async () => {
        const res = await request(app)
            .delete(`/api/products/${productoId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Acceso denegado: Se requiere rol de Administrador');
    });
});

describe('DELETE /api/products/:id - Eliminar (Admin)', () => {
    it('debería eliminar un producto como admin', async () => {
        const res = await request(app)
            .delete(`/api/products/${productoId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.mensaje).toBe('Producto eliminado');
    });
});