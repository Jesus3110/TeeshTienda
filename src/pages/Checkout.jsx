import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, set, get, runTransaction } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import StripeButton from "../components/StripeButton";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";
import ClienteLayout from "../components/ClienteLayout";
import { FaMoneyBillWave, FaTimesCircle, FaCreditCard } from "react-icons/fa";
import ModalAlerta from "../components/ModalAlerta";




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
  const MODO_PRUEBA = false; // 🧪 Cambiar a false para modo real

  const { usuario } = useContext(AuthContext);
  const [direccion, setDireccion] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const navigate = useNavigate();
  const [direccionGuardada, setDireccionGuardada] = useState(false);
  const [usarNuevaDireccion, setUsarNuevaDireccion] = useState(false);
const [direccionForm, setDireccionForm] = useState({
  calle: "",
  numero: "",
  colonia: "",
  ciudad: "",
  estado: "",
  cp: "",
});
const [alerta, setAlerta] = useState({ visible: false, mensaje: "", tipo: "info" });


  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const refUser = ref(db, `usuarios/${usuario.uid}`);
    get(refUser).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Si es objeto, formatea; si es string, deja tal cual
if (typeof data.direccion === "object") {
  const { calle, numero, colonia, ciudad, estado, cp } = data.direccion;
  setDireccion(`${calle} ${numero}, ${colonia}, ${ciudad}, ${estado}, CP ${cp}`);
} else {
  setDireccion(data.direccion || "");
}

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
    const direccionFinal = usarNuevaDireccion
  ? `${direccionForm.calle} ${direccionForm.numero}, ${direccionForm.colonia}, ${direccionForm.ciudad}, ${direccionForm.estado}, CP ${direccionForm.cp}`
  : direccion;



    if (!direccionFinal) {
      setAlerta({ visible: true, mensaje: "Debe especificar una dirección de envío.", tipo: "error" });
      return;
    }
  
    if (carrito.length === 0) {
      setAlerta({ visible: true, mensaje: "Tu carrito está vacío.", tipo: "error" });
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
      id: p.idFirebase
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
  fechaEntrega,
  usoDireccionTemporal: usarNuevaDireccion, // 🆕 Para saber si hay que limpiar luego
});

  
    await actualizarDashboard(productosProcesados, total);
  
    const refCarrito = ref(db, `carritos/${usuario.uid}`);
    await set(refCarrito, null);
  
    setAlerta({ visible: true, mensaje: "✅ Pedido registrado correctamente. Para ver más detalles, ve a la pestaña de Pedidos.", tipo: "success" });

    for (const prod of carrito) {
  const stockRef = ref(db, `productos/${prod.idFirebase}/stock`);
  await runTransaction(stockRef, (stockActual) => {
    const stockNum = parseInt(stockActual || "0");
    return Math.max(0, stockNum - prod.cantidad);
  });
}

  };

const guardarNuevaDireccion = async () => {
  const { calle, numero, colonia, ciudad, estado, cp } = direccionForm;

  if (!calle || !numero || !colonia || !ciudad || !estado || !cp) {
    setAlerta({ visible: true, mensaje: "Todos los campos de dirección son obligatorios", tipo: "error" });
    return;
  }

  const nueva = { calle, numero, colonia, ciudad, estado, cp };
  const db = getDatabase();
  const userRef = ref(db, `usuarios/${usuario.uid}/direccion`);
  setDireccionForm(nueva);
setDireccionGuardada(true);

};


  
const actualizarDashboard = async (carrito, total) => {
  const db = getDatabase();
  const fechaActual = new Date();
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const mesActual = meses[fechaActual.getMonth()];
  const anioActual = fechaActual.getFullYear();

  // ✅ 1. Ingresos totales
  const ingresosRef = ref(db, "dashboard/ingresosTotales");
  await runTransaction(ingresosRef, (valorActual) => {
    return (valorActual || 0) + total;
  });

  // ✅ 2. Ingresos por año/mes (estructura nueva)
  const ingresosMesAnioRef = ref(db, `dashboard/ingresosPorMes/${anioActual}/${mesActual}`);
  await runTransaction(ingresosMesAnioRef, (valorActual) => {
    return (valorActual || 0) + total;
  });

// 🆕 3. Productos más vendidos (general y por mes/año)
for (const prod of carrito) {
  // General
  const prodRef = ref(db, `dashboard/productosVendidos/${prod.nombre}`);
  await runTransaction(prodRef, (valorActual) => {
    return (valorActual || 0) + prod.cantidad;
  });

  // Por mes/año
  const prodMesRef = ref(db, `dashboard/productosVendidosPorMes/${anioActual}/${mesActual}/${prod.nombre}`);
  await runTransaction(prodMesRef, (valorActual) => {
    return (valorActual || 0) + prod.cantidad;
  });
}

// 🆕 4. Categorías más vendidas (general y por mes/año)
for (const prod of carrito) {
  const cat = prod.categoria || "Sin categoría";

  // General
  const catRef = ref(db, `dashboard/categoriasVendidas/${cat}`);
  await runTransaction(catRef, (valorActual) => {
    return (valorActual || 0) + prod.cantidad;
  });

  // Por mes/año
  const catMesRef = ref(db, `dashboard/categoriasVendidasPorMes/${anioActual}/${mesActual}/${cat}`);
  await runTransaction(catMesRef, (valorActual) => {
    return (valorActual || 0) + prod.cantidad;
  });
}

};

  return (
    <ClienteLayout>
  <div className="checkout-container">
  <h2>Confirmar Compra</h2>

  <div className="checkout-direccion">
    <h4>Dirección de Envío</h4>
    <p>
      <strong>Guardada:</strong>{" "}
      {direccion || "No hay dirección guardada."}
    </p>

    <button
      className="btn-toggle-direccion"
      onClick={() => setUsarNuevaDireccion(!usarNuevaDireccion)}
    >
      {usarNuevaDireccion ? "✖️ Cancelar nueva dirección" : "📍 Usar otra dirección"}
    </button>

    {usarNuevaDireccion && (
      <>
        <div className="address-section">
          <div className="address-row">
            <input
              type="text"
              placeholder="Calle"
              value={direccionForm.calle}
              onChange={(e) => setDireccionForm({ ...direccionForm, calle: e.target.value })}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Número"
              value={direccionForm.numero}
              onChange={(e) => setDireccionForm({ ...direccionForm, numero: e.target.value })}
              className="form-input"
            />
          </div>
          <input
            type="text"
            placeholder="Colonia"
            value={direccionForm.colonia}
            onChange={(e) => setDireccionForm({ ...direccionForm, colonia: e.target.value })}
            className="form-input"
          />
          <div className="address-row">
            <input
              type="text"
              placeholder="Ciudad"
              value={direccionForm.ciudad}
              onChange={(e) => setDireccionForm({ ...direccionForm, ciudad: e.target.value })}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Estado"
              value={direccionForm.estado}
              onChange={(e) => setDireccionForm({ ...direccionForm, estado: e.target.value })}
              className="form-input"
            />
          </div>
          <input
            type="text"
            placeholder="Código Postal"
            value={direccionForm.cp}
            onChange={(e) => setDireccionForm({ ...direccionForm, cp: e.target.value })}
            className="form-input"
          />
        </div>

        <button
          className="btn-guardar-direccion"
          onClick={guardarNuevaDireccion}
        >
          💾 Guardar nueva dirección
        </button>
        <p>
  <strong>Se enviará a:</strong> {usarNuevaDireccion
    ? `${direccionForm.calle} ${direccionForm.numero}, ${direccionForm.colonia}, ${direccionForm.ciudad}, ${direccionForm.estado}, CP ${direccionForm.cp}`
    : direccion}
</p>

      </>
    )}

    {direccionGuardada && (
      <p className="mensaje-exito">✅ Dirección guardada exitosamente</p>
    )}
  </div>

  <p className="checkout-total">Total a pagar: ${total.toFixed(2)}</p>

  <div className="checkout-btns">
    <button
      className="checkout-btn efectivo"
      onClick={() => confirmarCompra("efectivo")}
      disabled={total <= 0}
    >
      <FaMoneyBillWave /> Pagar en efectivo
    </button>

    <h4>O pagar con tarjeta:</h4>

<StripeButton
  total={total}
  carrito={carrito}
  usuario={usuario}
  modoPrueba={MODO_PRUEBA}
  confirmar={() => {
    confirmarCompra(MODO_PRUEBA ? "stripe (prueba)" : "stripe");
  }}
/>



    <button
      className="checkout-btn cancelar"
      onClick={() => navigate("/carrito")}
    >
      <FaTimesCircle /> Cancelar compra
    </button>
  </div>
</div>

{alerta.visible && (
  <ModalAlerta
    mensaje={alerta.mensaje}
    tipo={alerta.tipo}
    onClose={() => {
      if (alerta.tipo === "success") {
        setAlerta({ ...alerta, visible: false });
        navigate("/");
      } else {
        setAlerta({ ...alerta, visible: false });
      }
    }}
  />
)}

</ClienteLayout>
  );
};

export default Checkout;
