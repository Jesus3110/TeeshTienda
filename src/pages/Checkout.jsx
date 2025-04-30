import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, set, get, runTransaction } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import StripeButton from "../components/StripeButton";
import { useNavigate } from "react-router-dom";


const calcularFechaEntregaPorPendientes = async () => {
  const db = getDatabase();
  const refPedidos = ref(db, "pedidos");

  const snapshot = await get(refPedidos);
  const pedidos = snapshot.val() || {};
  const pendientes = Object.values(pedidos).filter(
    (pedido) => pedido.estado === "pendiente"
  );

  const dias = pendientes.length < 5 ? 2 : 3;
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);

  return fecha.toISOString().split("T")[0]; // Formato YYYY-MM-DD
};

const Checkout = () => {
  const MODO_PRUEBA = true; // 🧪 Cambiar a false para modo real

  const { usuario } = useContext(AuthContext);
  const [direccion, setDireccion] = useState("");
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const refUser = ref(db, `usuarios/${usuario.uid}`);
    get(refUser).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDireccion(data.direccion || "");
        setNombreUsuario(data.nombre || "");
      }
    });

    
    const refCarrito = ref(db, `carritos/${usuario.uid}`);
    get(refCarrito).then((snapshot) => {
      const datos = snapshot.val();
      setCarrito(Array.isArray(datos) ? datos : []);
    });
  }, [usuario]);

  useEffect(() => {
    if (carrito.length > 0) {
      const totalCalculado = carrito.reduce(
        (acc, prod) => acc + (prod.precio || 0) * (prod.cantidad || 1),
        0
      );
      setTotal(totalCalculado);
    }
  }, [carrito]);

  const confirmarCompra = async (tipoPago) => {
    const direccionFinal = nuevaDireccion || direccion;
    if (!direccionFinal) {
      alert("Debe especificar una dirección de envío.");
      return;
    }
  
    if (carrito.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }
  
    const db = getDatabase();
    const pedidoId = uuidv4();
    const pedidoRef = ref(db, `pedidos/${pedidoId}`);
  
    // 🆕 Fecha dinámica basada en pedidos pendientes
    const fechaEntrega = await calcularFechaEntregaPorPendientes();
  
    const productosProcesados = carrito.map((p) => ({
      nombre: p.nombre,
      precio: p.precio,
      cantidad: p.cantidad,
      categoria: p.categoria || "Sin categoría",
    }));
  
    await set(pedidoRef, {
      usuario: usuario.uid,
      nombre: nombreUsuario,
      productos: productosProcesados,
      direccion: direccionFinal,
      metodoPago: tipoPago,
      estado: "pendiente",
      creadoEn: Date.now(),
      total,
      fechaEntrega, // 👈 se guarda en Firebase
    });
  
    await actualizarDashboard(productosProcesados, total);
  
    const refCarrito = ref(db, `carritos/${usuario.uid}`);
    await set(refCarrito, null);
  
    alert("✅ Pedido registrado correctamente");
    navigate("/");
  };
  

  const actualizarDashboard = async (carrito, total) => {
    const db = getDatabase();
    const fechaActual = new Date();
    const mesActual = fechaActual.toLocaleString('default', { month: 'long' }); // Ej: "abril"
  
    // 1. Actualizar ingresos totales
    const ingresosRef = ref(db, "dashboard/ingresosTotales");
    await runTransaction(ingresosRef, (valorActual) => {
      return (valorActual || 0) + total;
    });
  
    // 2. Actualizar ingresos por mes
    const ingresosMesRef = ref(db, `dashboard/ingresosPorMes/${mesActual}`);
    await runTransaction(ingresosMesRef, (valorActual) => {
      return (valorActual || 0) + total;
    });
  
    // 3. Productos más vendidos
    for (const prod of carrito) {
      const prodRef = ref(db, `dashboard/productosVendidos/${prod.nombre}`);
      await runTransaction(prodRef, (valorActual) => {
        return (valorActual || 0) + prod.cantidad;
      });
    }
  
    // 4. Categorías más vendidas
    for (const prod of carrito) {
      const cat = prod.categoria || "Sin categoría";
      const catRef = ref(db, `dashboard/categoriasVendidas/${cat}`);
      await runTransaction(catRef, (valorActual) => {
        return (valorActual || 0) + prod.cantidad;
      });
    }
  };
  

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto" }}>
      <h2>Confirmar Compra</h2>

      <div style={{ marginBottom: "1rem" }}>
        <h4>Dirección de Envío</h4>
        <p>
          <strong>Guardada:</strong> {direccion || "No hay dirección guardada."}
        </p>
        <textarea
          placeholder="Usar otra dirección (opcional)"
          value={nuevaDireccion}
          onChange={(e) => setNuevaDireccion(e.target.value)}
          rows={3}
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
      </div>

      <h4>Total a pagar: ${total.toFixed(2)}</h4>

      <div style={{ marginTop: "1rem" }}>
        <button
          disabled={total <= 0}
          onClick={() => confirmarCompra("efectivo")}
          style={{
            marginRight: "1rem",
            background: "#3498db",
            color: "#fff",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "5px",
            opacity: total <= 0 ? 0.6 : 1,
            cursor: total <= 0 ? "not-allowed" : "pointer",
          }}
        >
          💵 Pagar en efectivo
        </button>
      </div>

      <h4 style={{ marginTop: "2rem" }}>O pagar con tarjeta:</h4>
      <StripeButton
        total={total}
        carrito={carrito}
        usuario={usuario}
        confirmar={() => {
          if (MODO_PRUEBA) {
            alert("🧪 Modo prueba: simulando pago con tarjeta...");
            confirmarCompra("stripe (prueba)");
          } else {
            confirmarCompra("stripe");
          }
        }}
      />

      <div style={{ marginTop: "2rem" }}>
        <button
          onClick={() => navigate("/carrito")}
          style={{
            backgroundColor: "#e74c3c",
            color: "#fff",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "5px",
          }}
        >
          ❌ Cancelar compra
        </button>
      </div>
    </div>
  );
};

export default Checkout;
