import React, { useEffect, useState } from "react";
import { agregarProducto, escucharProductos } from "../services/productosService";

function Home() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    escucharProductos((prods) => setProductos(prods));
  }, []);

  const agregarEjemplo = () => {
    agregarProducto({
      nombre: "Tenis deportivos",
      precio: 999,
      descripcion: "Cómodos para correr",
      imagen: "https://via.placeholder.com/150",
      categoria: "Calzado"
    });
  };

  return (
    <div>
      <h1>Bienvenido a la Tienda Online</h1>

      <div>
        {productos.map((prod) => (
          <div key={prod.id} style={{ border: "1px solid #ccc", margin: "1rem", padding: "1rem" }}>
            <h3>{prod.nombre}</h3>
            <p>{prod.descripcion}</p>
            <p>${prod.precio}</p>
            <img src={prod.imagen} alt={prod.nombre} width={150} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
