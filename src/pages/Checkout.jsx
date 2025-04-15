import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, set, get } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import PaypalButton from "../components/PaypalButton";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const { usuario } = useContext(AuthContext);
  const [direccion, setDireccion] = useState("");
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const refUser = ref(db, `usuarios/${usuario.uid}/direccion`);

    get(refUser).then(snapshot => {
      if (snapshot.exists()) setDireccion(snapshot.val());
    });

    const localData = JSON.parse(localStorage.getItem("carrito")) || [];
    setCarrito(localData);
    const totalCalculado = localData.reduce(
      (acc, prod) => acc + prod.precio * prod.cantidad,
      0
    );
    setTotal(totalCalculado);
  }, [usuario]);

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

    await set(pedidoRef, {
      usuario: usuario.uid,
      productos: carrito,
      direccion: direccionFinal,
      metodoPago: tipoPago,
      estado: "pendiente",
      creadoEn: Date.now(),
      total,
    });

    localStorage.removeItem("carrito");
    alert("✅ Pedido registrado correctamente");
    navigate("/"); // Puedes cambiarlo a /gracias si tienes página de agradecimiento
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto" }}>
      <h2>Confirmar Compra</h2>

      <div style={{ marginBottom: "1rem" }}>
        <h4>Dirección de Envío</h4>
        <p><strong>Guardada:</strong> {direccion || "No hay dirección guardada."}</p>
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
          onClick={() => confirmarCompra("efectivo")}
          style={{
            marginRight: "1rem",
            background: "#3498db",
            color: "#fff",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "5px"
          }}
        >
          💵 Pagar en efectivo
        </button>
      </div>

      <h4 style={{ marginTop: "2rem" }}>O pagar con tarjeta:</h4>
      <PaypalButton
        total={total}
        onSuccess={() => confirmarCompra("paypal")}
      />

      <div style={{ marginTop: "2rem" }}>
        <button
          onClick={() => navigate("/carrito")}
          style={{
            backgroundColor: "#e74c3c",
            color: "#fff",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "5px"
          }}
        >
          ❌ Cancelar compra
        </button>
      </div>
    </div>
  );
};

export default Checkout;
