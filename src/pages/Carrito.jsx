import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, onValue, set, remove, get } from "firebase/database";
import ClienteLayout from "../components/ClienteLayout";
import "../styles/carrito.css"; // Asegúrate de tener este archivo CSS
import {
  FaTrash,
  FaShoppingCart,
  FaCheck,
  FaArrowLeft,
  FaTimes,
} from "react-icons/fa";
import ModalAlerta from "../components/ModalAlerta";

function Carrito() {
  const [carrito, setCarrito] = useState([]);
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [alerta, setAlerta] = useState({
    visible: false,
    mensaje: "",
    tipo: "error",
  });

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
        setAlerta({
          visible: true,
          mensaje: `❌ Solo hay ${stockDisponible} unidades disponibles.`,
          tipo: "error",
        });
      } else {
        copia[index].cantidad = cantidadInt;
      }

      actualizarCarrito(copia);
    } catch (error) {
      console.error("Error al validar stock:", error);
      setAlerta({
        visible: true,
        mensaje: "Error al validar stock.",
        tipo: "error",
      });
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
      setAlerta({
        visible: true,
        mensaje: "Debes iniciar sesión para continuar con la compra.",
        tipo: "error",
      });
      navigate("/login");
      return;
    }

    // ✅ Solo redirige, no borres nada aquí
    navigate("/checkout");
  };

  const mostrarColumnaColor = carrito.some((p) => !!p.color);

  return (
    <ClienteLayout>
      <div className="carrito-container">
        <h2>
          <FaShoppingCart style={{ marginRight: "0.5rem" }} /> Carrito de
          Compras
        </h2>
        {carrito.length === 0 ? (
          <p>No hay productos en el carrito.</p>
        ) : (
          <div className="table-container">
            <table className="carrito-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  {mostrarColumnaColor && <th>Color</th>}
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((prod, index) => {
                  console.log("Producto en carrito:", prod); // 👈 Aquí va

                  return (
                    <tr key={index}>
                      <td>{prod.nombre}</td>
                      <td>${prod.precio}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={prod.cantidad === "" ? "" : prod.cantidad}
                          onChange={(e) =>
                            cambiarCantidad(index, e.target.value)
                          }
                          className="carrito-cantidad-input"
                        />
                      </td>

                      {mostrarColumnaColor && (
                        <td>
                          {prod.color && (
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  backgroundColor: prod.color,
                                  border: "1px solid #ccc",
                                  margin: "0 auto",
                                }}
                                title={prod.color}
                              />
                            </div>
                          )}
                        </td>
                      )}

                      <td>
                        $
                        {!isNaN(prod.precio * prod.cantidad)
                          ? (prod.precio * prod.cantidad).toFixed(2)
                          : "0.00"}
                      </td>
                      <td>
                        <button
                          className="carrito-eliminar-btn"
                          onClick={() => eliminarProducto(index)}
                        >
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {carrito.length > 0 && (
          <>
            <h3 className="total-carrito">Total: ${total.toFixed(2)}</h3>
            <div className="carrito-btns">
              <button
                className="btn-vaciar"
                onClick={vaciarCarrito}
                type="button"
              >
                <FaTrash style={{ marginRight: "0.5rem" }} /> Vaciar carrito
              </button>

              <button
                className="btn-confirmar"
                onClick={confirmarCompra}
                type="button"
              >
                <FaCheck style={{ marginRight: "0.5rem" }} /> Confirmar compra
              </button>

              <button
                className="btn-continuar"
                onClick={() => navigate("/")}
                type="button"
              >
                <FaArrowLeft style={{ marginRight: "0.5rem" }} /> Seguir
                comprando
              </button>
            </div>
          </>
        )}
      </div>
      {alerta.visible && (
        <ModalAlerta
          mensaje={alerta.mensaje}
          tipo={alerta.tipo}
          onClose={() => setAlerta({ ...alerta, visible: false })}
        />
      )}
    </ClienteLayout>
  );
}

export default Carrito;
