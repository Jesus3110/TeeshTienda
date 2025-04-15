import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { escucharProductos } from "../services/productosService";
import { AuthContext } from "../context/AuthContext"; // Asegúrate que esté bien importado
import "../styles/home.css";

function Home() {
  const [productos, setProductos] = useState([]);
  const { usuario, rol } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    escucharProductos((prods) => setProductos(prods));
  }, []);

  const añadirAlCarrito = (producto) => {
    if (!usuario || rol !== "cliente") {
      navigate("/login");
      return;
    }

    // Aquí puedes usar context, localStorage o tu propia lógica para guardar
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.push({ ...producto, cantidad: 1 });
    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert(`✅ "${producto.nombre}" añadido al carrito.`);
  };

  return (
    <div className="home-container">
      <h1 className="titulo-home">Bienvenido a la Tienda Online</h1>

      <div className="grid-productos">
        {productos.map((prod) => (
          <div className="card-producto" key={prod.idFirebase}>
            <img src={prod.imagen} alt={prod.nombre} className="img-producto" />
            <h3>{prod.nombre}</h3>
            <p className="descripcion">{prod.descripcion}</p>
            <p className="precio">${prod.precio}</p>

            <div className="botones">
              <Link to={`/producto/${prod.idFirebase}`}>
                <button className="btn-detalles">Ver detalles</button>
              </Link>
              <button
                className="btn-carrito"
                onClick={() => añadirAlCarrito(prod)}
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
