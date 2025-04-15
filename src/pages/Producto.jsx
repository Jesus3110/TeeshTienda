import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, get } from "firebase/database";

function Producto() {
  const { id } = useParams(); // este es el idFirebase
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);

  useEffect(() => {
    const db = getDatabase();
    const refProd = ref(db, "productos");

    get(refProd).then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.entries(data).map(([idFirebase, value]) => ({
          idFirebase,
          ...value,
        }));

        const encontrado = lista.find((p) => p.idFirebase === id);
        if (encontrado) setProducto(encontrado);
      }
    });
  }, [id]);

  const añadirAlCarrito = () => {
    alert(`🛒 "${producto.nombre}" añadido al carrito (simulado)`);
    // Aquí puedes guardar en localStorage o contexto global
  };

  if (!producto) return <p style={{ padding: "2rem" }}>Cargando producto...</p>;

  return (
    <div style={{
      padding: "2rem",
      maxWidth: "600px",
      margin: "auto",
      border: "1px solid #ccc",
      borderRadius: "10px",
      background: "#fff",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      textAlign: "center"
    }}>
      <h2>{producto.nombre}</h2>
      <img
        src={producto.imagen}
        alt={producto.nombre}
        width={300}
        style={{
          borderRadius: "10px",
          display: "block",
          margin: "1rem auto"
        }}
      />
      <p><strong>Precio:</strong> ${producto.precio}</p>
      <p><strong>Descripción:</strong> {producto.descripcion}</p>
      <p><strong>Categoría:</strong> {producto.categoria}</p>
      <p><strong>Stock:</strong> {producto.stock}</p>

      <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
        <button
          onClick={añadirAlCarrito}
          style={{
            backgroundColor: "#3498db",
            color: "white",
            padding: "0.6rem 1.2rem",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold"
          }}
        >
          🛒 Añadir al carrito
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: "#bdc3c7",
            padding: "0.6rem 1.2rem",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold"
          }}
        >
          ⬅️ Regresar
        </button>
      </div>
    </div>
  );
}

export default Producto;
