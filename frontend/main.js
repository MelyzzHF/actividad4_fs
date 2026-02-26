const API = '/api';
let carrito = [];
let userRole = null;


function inicializarDashboard() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    userRole = payload.role;

    if (userRole === 'admin') {
        document.getElementById('formProducto').style.display = 'block';
    }

    if (userRole === 'user') {
        document.getElementById('btnCarrito').style.display = 'flex';
    } else {
        document.getElementById('btnCarrito').style.display = 'none';
    }

    cargarCarrito();
    obtenerProductos();
}


async function login() {
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        })
    });
    const data = await res.json();

    if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = 'productos.html';
    } else {
        const resultado = document.getElementById('resultado');
        resultado.textContent = data.error;
        resultado.style.color = '#c0392b';
    }
}

async function registrar() {
    const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: document.getElementById('regUsername').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            role: document.getElementById('regRole').value
        })
    });
    const data = await res.json();

    const resultado = document.getElementById('resultadoRegistro');
    if (data.mensaje) {
        resultado.textContent = data.mensaje + ' Redirigiendo...';
        resultado.style.color = '#c9a87c';
        setTimeout(() => window.location.href = 'index.html', 1500);
    } else {
        resultado.textContent = data.error;
        resultado.style.color = '#c0392b';
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('carrito');
    window.location.href = 'index.html';
}


async function obtenerProductos() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.error) {
        document.getElementById('listaProductos').textContent = data.error;
        return;
    }

    let html = '';
    data.forEach(producto => {
        html += `
            <div class="producto-card">
                <div class="producto-img-container">
                    ${producto.imagen_url
                ? `<img src="${producto.imagen_url}" alt="${producto.name}">`
                : `<span class="sin-imagen">Sin imagen</span>`
            }
                </div>
                <div class="producto-info">
                    <h3>MyBeauty</h3>
                    <p class="producto-nombre">${producto.name}</p>
                    <p class="producto-descripcion">${producto.description || 'Sin descripción'}</p>
                    <p class="producto-precio">$${producto.price}</p>
                    <p class="producto-stock ${producto.stock <= 0 ? 'no-disponible' : ''}">${producto.stock > 0 ? `Stock: ${producto.stock} disponibles` : 'No disponible'}</p>
                    <div class="producto-botones">
                        ${userRole === 'user' && producto.stock > 0 ? `
                            <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id}, '${producto.name}', ${producto.price})">Agregar al Carrito</button>
                        ` : ''}
                        ${userRole === 'admin' ? `
                            <button class="btn-editar" onclick="editarProducto(${producto.id}, '${producto.name}', '${producto.description || ''}', ${producto.price}, ${producto.stock}, '${producto.imagen_url || ''}')">Editar</button>
                            <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">Eliminar</button>
                        ` : ''}
                    </div>
                </div>
            </div>`;
    });

    document.getElementById('listaProductos').innerHTML = html || '<p>No hay productos aún</p>';
}

async function guardarProducto() {
    const token = localStorage.getItem('token');
    if (!token) return alert('Debes iniciar sesión');

    const id = document.getElementById('productoId').value;
    const producto = {
        name: document.getElementById('prodNombre').value,
        description: document.getElementById('prodDescripcion').value,
        price: document.getElementById('prodPrecio').value,
        stock: document.getElementById('prodStock').value,
        imagen_url: document.getElementById('prodImagen').value
    };

    const url = id ? `${API}/products/${id}` : `${API}/products`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(producto)
    });

    const data = await res.json();
    alert(data.mensaje || data.error);

    if (data.mensaje) {
        limpiarFormulario();
        obtenerProductos();
    }
}

function editarProducto(id, name, description, price, stock, imagen_url) {
    document.getElementById('productoId').value = id;
    document.getElementById('prodNombre').value = name;
    document.getElementById('prodDescripcion').value = description;
    document.getElementById('prodPrecio').value = price;
    document.getElementById('prodStock').value = stock;
    document.getElementById('prodImagen').value = imagen_url;
    document.getElementById('formTitulo').textContent = 'Editar Producto';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    alert(data.mensaje || data.error);

    if (data.mensaje) obtenerProductos();
}

function cancelarEdicion() {
    limpiarFormulario();
}

function limpiarFormulario() {
    document.getElementById('productoId').value = '';
    document.getElementById('prodNombre').value = '';
    document.getElementById('prodDescripcion').value = '';
    document.getElementById('prodPrecio').value = '';
    document.getElementById('prodStock').value = '';
    document.getElementById('prodImagen').value = '';
    document.getElementById('formTitulo').textContent = 'Crear Producto';
}


function agregarAlCarrito(id, name, price) {
    const existe = carrito.find(item => item.id === id);

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ id, name, price, cantidad: 1 });
    }

    guardarCarrito();
    actualizarCarritoUI();
    mostrarNotificacion(`✓ ${name} agregado al carrito`);

}

function quitarDelCarrito(id) {
    const item = carrito.find(item => item.id === id);

    if (item) {
        item.cantidad--;
        if (item.cantidad <= 0) {
            carrito = carrito.filter(item => item.id !== id);
        }
    }

    guardarCarrito();
    actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    actualizarCarritoUI();
}

function vaciarCarrito() {
    if (!confirm('¿Vaciar todo el carrito?')) return;
    carrito = [];
    guardarCarrito();
    actualizarCarritoUI();
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function cargarCarrito() {
    const guardado = localStorage.getItem('carrito');
    if (guardado) {
        carrito = JSON.parse(guardado);
    }
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const countEl = document.getElementById('carritoCount');
    if (countEl) countEl.textContent = totalItems;

    const itemsEl = document.getElementById('carritoItems');
    if (!itemsEl) return;

    if (carrito.length === 0) {
        itemsEl.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío</p>';
        document.getElementById('carritoTotal').textContent = '$0.00';
        return;
    }

    let html = '';
    let total = 0;

    carrito.forEach(item => {
        const subtotal = item.price * item.cantidad;
        total += subtotal;

        html += `
            <div class="carrito-item">
                <div class="carrito-item-info">
                    <p class="carrito-item-nombre">${item.name}</p>
                    <p class="carrito-item-precio">$${item.price} c/u</p>
                </div>
                <div class="carrito-item-acciones">
                    <button class="btn-cantidad" onclick="quitarDelCarrito(${item.id})">−</button>
                    <span class="carrito-item-cantidad">${item.cantidad}</span>
                    <button class="btn-cantidad" onclick="agregarAlCarrito(${item.id}, '${item.name}', ${item.price})">+</button>
                    <button class="btn-quitar" onclick="eliminarDelCarrito(${item.id})">🗑</button>
                </div>
                <p class="carrito-item-subtotal">$${subtotal.toFixed(2)}</p>
            </div>
        `;
    });

    itemsEl.innerHTML = html;
    document.getElementById('carritoTotal').textContent = `$${total.toFixed(2)}`;
}

function toggleCarrito() {
    const panel = document.getElementById('carritoPanel');
    const overlay = document.getElementById('carritoOverlay');
    panel.classList.toggle('abierto');
    overlay.classList.toggle('abierto');
}

function mostrarNotificacion(mensaje) {
    const noti = document.getElementById('notificacion');
    noti.textContent = mensaje;
    noti.classList.add('mostrar');

    setTimeout(() => {
        noti.classList.remove('mostrar');
    }, 2000);
}