import React, { useContext, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { getDatabase, ref, onValue } from "firebase/database";
import Home from "./pages/Home";
import Producto from "./pages/Producto";
import Carrito from "./pages/Carrito";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import RutaAdmin from "./router/RutaAdmin";
import RutaAsistente from "./router/RutaAsistente";
import AdminLayout from "./components/AdminLayout";
import AdminPanel from "./pages/AdminPanel";
import Productos from "./pages/Productos";
import Pedidos from "./pages/Pedidos";
import Categorias from "./pages/Categorias";
import Usuarios from "./pages/Usuarios";
import Checkout from "./pages/Checkout";
import Banners from "./pages/Banners";
import Descuentos from "./pages/Descuentos";
import Historial from "./pages/HistorialPedidos";
import Perfil from "./pages/Perfil";
import CompletarPerfil from "./pages/CompletarPerfil";
import RutaProtegidaPorRol from "./router/RutaProtegidaPorRol";
import Ingresos from "./pages/Ingresos";
import RutaProtegidaCliente from "./router/RutaProtegidaCliente";
import VerificarCorreo from "./pages/VerificarCorreo";
import Assistant from "./pages/Assistant";
import "./styles/notifications.css";
import AssistantLayout from "./components/AssistantLayout";

function App() {
  const location = useLocation();
  const { usuario, rol } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const ocultarNavbar =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/asistente") ||
    (usuario && rol === "cliente");

  useEffect(() => {
    if (usuario && rol === "asistente") {
      const db = getDatabase();
      const chatsRef = ref(db, "chats");

      const unsubscribe = onValue(chatsRef, (snapshot) => {
        const chatsData = snapshot.val();
        if (!chatsData) return;

        Object.entries(chatsData).forEach(([chatId, chat]) => {
          if (chat.needsAssistant && !notifications.includes(chatId)) {
            setNotificationMessage("¡Nuevo cliente necesita ayuda!");
            setShowNotification(true);

            const audio = new Audio("/notification-sound.mp3");
            audio
              .play()
              .catch((e) => console.log("Error reproduciendo sonido:", e));

            setNotifications((prev) => [...prev, chatId]);

            setTimeout(() => {
              setShowNotification(false);
            }, 5000);
          }
        });
      });

      return () => unsubscribe();
    }
  }, [usuario, rol]);

  return (
    <>
      {!ocultarNavbar && <Navbar />}

      {showNotification && (
        <div className="notification-popup">
          <div className="notification-content">{notificationMessage}</div>
        </div>
      )}

      <Routes>
        {/* Rutas públicas */}
        <Route path="/completar-perfil/:id" element={<CompletarPerfil />} />
        <Route path="/" element={<Home />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verificar-correo/:uid" element={<VerificarCorreo />} />

        {/* Rutas de cliente */}
        <Route
          path="/carrito"
          element={
            <RutaProtegidaCliente>
              <Carrito />
            </RutaProtegidaCliente>
          }
        />
        <Route
          path="/checkout"
          element={
            <RutaProtegidaCliente>
              <Checkout />
            </RutaProtegidaCliente>
          }
        />
        <Route
          path="/pedidos"
          element={
            <RutaProtegidaCliente>
              <Pedidos />
            </RutaProtegidaCliente>
          }
        />
        <Route
          path="/historial"
          element={
            <RutaProtegidaCliente>
              <Historial />
            </RutaProtegidaCliente>
          }
        />
        <Route
          path="/perfil"
          element={
            <RutaProtegidaCliente>
              <Perfil />
            </RutaProtegidaCliente>
          }
        />
  <Route
  path="/asistente"
  element={
    <RutaAsistente>
      <AssistantLayout />
    </RutaAsistente>
  }
>
  <Route index element={<Assistant />} />
  <Route path="perfil" element={<Perfil />} />
</Route>
        {/* Rutas de admin */}
        <Route
          path="/admin"
          element={
            <RutaAdmin>
              <AdminLayout />
            </RutaAdmin>
          }
        >
          <Route index element={<AdminPanel />} />
          <Route path="productos" element={<Productos />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="banners" element={<Banners />} />
          <Route path="descuentos" element={<Descuentos />} />
          <Route path="historial" element={<Historial />} />
          <Route path="perfil" element={<Perfil />} />

          <Route
            path="usuarios"
            element={
              <RutaProtegidaPorRol rolesPermitidos={["god", "premium"]}>
                <Usuarios />
              </RutaProtegidaPorRol>
            }
          />

          <Route
            path="ingresos"
            element={
              <RutaProtegidaPorRol rolesPermitidos={["god"]}>
                <Ingresos />
              </RutaProtegidaPorRol>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
