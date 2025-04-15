# 🛍️ Tienda Online - React + Firebase

Plataforma de comercio electrónico moderna con autenticación por roles, carrito de compras, gestión de productos, pagos con PayPal y panel administrativo.

## 🚀 Tecnologías utilizadas

- 🔥 Firebase (Auth, Realtime Database, Storage)
- ⚛️ React
- 📦 Vite
- 🛒 LocalStorage (Carrito)
- 💳 PayPal (modo sandbox)
- 🎨 CSS puro

---

## 👤 Roles de usuario

| Rol        | Permisos                                                         |
|------------|------------------------------------------------------------------|
| Cliente    | Registro/Login, ver productos, añadir al carrito, comprar       |
| Administrador | Panel admin, gestión de productos, usuarios, pedidos, categorías |

---

## 🧩 Funcionalidades principales

### 🧑 Clientes
- Registro con imagen (opcional)
- Login y navbar dinámico
- Carrito con persistencia
- Modificación de cantidades
- Checkout con:
  - Dirección guardada o nueva
  - Pago en efectivo o PayPal
- Historial de pedidos (pendiente)

### 🛠️ Admin
- Dashboard con gráficas de pedidos e ingresos
- Gestión de:
  - Productos (CRUD, filtrado, alertas de stock)
  - Categorías (activas, conteo, % ventas)
  - Usuarios administradores
  - Pedidos (en proceso, enviados, etc.)
- Todo en modales elegantes

---

## 💵 Integración de PayPal

Modo sandbox con botón personalizado.  
Recuerda colocar tu `client-id` en el archivo `.env`:

```env
VITE_PAYPAL_CLIENT_ID=TU_CLIENT_ID_SANDBOX

Instalacion local
npm install
npm run dev


🧪 Cuenta de prueba PayPal (sandbox)
Email: sb-xxxxx@personal.example.com

Pass: 12345678

Crea una en https://developer.paypal.com/
