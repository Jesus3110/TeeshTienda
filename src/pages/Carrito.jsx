import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, onValue, set, remove } from "firebase/database";

function Carrito() {
  const [carrito, setCarrito] = useState([]);
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  // Cargar carrito desde Firebase al iniciar
  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const refCarrito = ref(db, `carritos/${usuario.uid}`);

    const unsubscribe = onValue(refCarrito, (snapshot) => {
      const datos = snapshot.val();
      setCarrito(Array.isArray(datos) ? datos : []);
    });

    return () => unsubscribe();
  }, [usuario]);

  // Actualizar carrito en Firebase
  const actualizarCarrito = (nuevoCarrito) => {
    setCarrito(nuevoCarrito);
    if (usuario) {
      const db = getDatabase();
      const refCarrito = ref(db, `carritos/${usuario.uid}`);
      set(refCarrito, nuevoCarrito);
    }
  };

  const cambiarCantidad = (index, nuevaCantidad) => {
    const copia = [...carrito];
    if (nuevaCantidad === '' || isNaN(nuevaCantidad)) {
      copia[index].cantidad = '';
    } else {
      copia[index].cantidad = Math.max(1, parseInt(nuevaCantidad));
    }
    actualizarCarrito(copia);
  };

  const eliminarProducto = (index) => {
    const copia = carrito.filter((_, i) => i !== index);
    actualizarCarrito(copia);
  };

  const vaciarCarrito = () => {
    if (usuario) {
      const db = getDatabase();
      const refCarrito = ref(db, `carritos/${usuario.uid}`);
      remove(refCarrito);
    }
    setCarrito([]);
  };

  const total = carrito.reduce((acc, prod) => acc + (prod.precio * (parseInt(prod.cantidad) || 0)), 0);

  const confirmarCompra = async () => {
    if (!usuario) {
      alert("Debes iniciar sesión para continuar con la compra.");
      navigate("/login");
      return;
    }
  
    // ✅ Solo redirige, no borres nada aquí
    navigate("/checkout");
  };
  

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🛒 Carrito de Compras</h2>

      {carrito.length === 0 ? (
        <p>No hay productos en el carrito.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((prod, index) => (
              <tr key={index}>
                <td>{prod.nombre}</td>
                <td>${prod.precio}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={prod.cantidad === '' ? '' : prod.cantidad}
                    onChange={(e) => cambiarCantidad(index, e.target.value)}
                    style={{ width: "60px" }}
                  />
                </td>
                <td>
                  ${!isNaN(prod.precio * prod.cantidad) ? (prod.precio * prod.cantidad).toFixed(2) : "0.00"}
                </td>
                <td>
                  <button onClick={() => eliminarProducto(index)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {carrito.length > 0 && (
        <>
          <h3 style={{ marginTop: "1rem" }}>Total: ${total.toFixed(2)}</h3>
          <button onClick={vaciarCarrito} style={{ marginTop: "1rem" }}>
            🗑️ Vaciar carrito
          </button>
          <button
            style={{
              marginTop: "1rem",
              marginLeft: "1rem",
              background: "#2ecc71",
              color: "#fff",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "5px"
            }}
            onClick={confirmarCompra}
          >
            ✅ Confirmar compra
          </button>
        </>
      )}

      <br />
      <button style={{ marginTop: "1rem" }} onClick={() => navigate("/")}>
        ⬅️ Seguir comprando
      </button>
    </div>
  );
}

export default Carrito;
