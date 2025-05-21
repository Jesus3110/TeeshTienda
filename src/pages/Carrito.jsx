import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, onValue, set, remove, get } from "firebase/database";

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

  const cambiarCantidad = async (index, nuevaCantidad) => {
    const copia = [...carrito];

    // ✅ Si el input está vacío, permitimos que lo esté temporalmente
    if (nuevaCantidad === "") {
      copia[index].cantidad = "";
      actualizarCarrito(copia);
      return;
    }

    const cantidadInt = parseInt(nuevaCantidad);
    if (isNaN(cantidadInt) || cantidadInt < 1) {
      copia[index].cantidad = 1;
      actualizarCarrito(copia);
      return;
    }

    const producto = copia[index];

    try {
      const db = getDatabase();
      const stockRef = ref(db, `productos/${producto.idFirebase}/stock`);
      const snapshot = await get(stockRef);
      const stockReal = parseInt(snapshot.val() || "0");

      const totalEnCarrito = carrito
        .filter((p, i) => i !== index && p.idFirebase === producto.idFirebase)
        .reduce((acc, p) => acc + parseInt(p.cantidad || 0), 0);

      const stockDisponible = Math.max(0, stockReal - totalEnCarrito);

      if (cantidadInt > stockDisponible) {
        copia[index].cantidad = stockDisponible;
        alert(`❌ Solo hay ${stockDisponible} unidades disponibles.`);
      } else {
        copia[index].cantidad = cantidadInt;
      }

      actualizarCarrito(copia);
    } catch (error) {
      console.error("Error al validar stock:", error);
      alert("Error al validar stock.");
    }
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

  const total = carrito.reduce(
    (acc, prod) => acc + prod.precio * (parseInt(prod.cantidad) || 0),
    0
  );

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
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
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
                    value={prod.cantidad === "" ? "" : prod.cantidad}
                    onChange={(e) => cambiarCantidad(index, e.target.value)}
                    style={{ width: "60px" }}
                  />
                </td>
                <td>
                  $
                  {!isNaN(prod.precio * prod.cantidad)
                    ? (prod.precio * prod.cantidad).toFixed(2)
                    : "0.00"}
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
              borderRadius: "5px",
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
