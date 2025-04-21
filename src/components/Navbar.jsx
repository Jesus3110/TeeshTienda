import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import "../styles/navbar.css";
import ModalCategoria from "./ModalCategoria";

function Navbar() {
  const { usuario, rol } = useContext(AuthContext);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [mostrarModalTodasCategorias, setMostrarModalTodasCategorias] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const db = getDatabase();
    
    // Obtener categorías
    const refCat = ref(db, "categorias");
    onValue(refCat, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data)
        .map(([idFirebase, value]) => ({
          idFirebase,
          ...value
        }))
        .filter(cat => cat.activa)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setCategorias(lista);
    });

    // Obtener productos
    const refProd = ref(db, "productos");
    onValue(refProd, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data).map(([idFirebase, value]) => ({
        idFirebase,
        ...value
      }));
      setProductos(lista);
    });
  }, []);

  const cerrarSesion = () => {
    signOut(auth);
  };

  const handleCategoriaClick = (categoria) => {
    setCategoriaSeleccionada(categoria);
  };

  const handleAddToCart = (producto) => {
    if (!usuario || rol !== "cliente") {
      navigate("/login");
      return;
    }
    
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.push({ ...producto, cantidad: 1 });
    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert(`✅ "${producto.nombre}" añadido al carrito.`);
  };

  // Mostrar solo las primeras 7 categorías
  const categoriasPrincipales = categorias.slice(0, 7);
  const categoriasRestantes = categorias.slice(7);

  return (
    <nav className="navbar-cliente">
      {/* Logo y menú principal */}
      <div className="logo-y-menu">
        <div className="logo-navbar">
          <Link to="/" className="logo-link">
            <span>M&J</span>
          </Link>
        </div>
        
        <div className="menu-principal">
          {categoriasPrincipales.map((categoria) => (
            <button
              key={categoria.idFirebase}
              className="categoria-btn"
              onClick={() => handleCategoriaClick(categoria)}
            >
              {categoria.nombre}
            </button>
          ))}
          
          {categoriasRestantes.length > 0 && (
            <button 
              className="ver-mas-btn"
              onClick={() => setMostrarModalTodasCategorias(true)}
            >
              Ver más ({categoriasRestantes.length})
            </button>
          )}
        </div>
      </div>

      {/* Menú de usuario */}
      <div className="menu-usuario">
        {rol === "cliente" && <Link to="/carrito">🛒</Link>}
        <div className="hamburguesa" onClick={() => setMenuAbierto(!menuAbierto)}>
          ☰
        </div>
      </div>

      {/* Menú desplegable */}
      {menuAbierto && (
        <ul className={`menu-cliente ${menuAbierto ? "activo" : ""}`}>
          {rol === "cliente" ? (
            <>
              <li><Link to="/perfil">👤 Perfil</Link></li>
              <li><Link to="/carrito">🛒 Carrito</Link></li>
              <li><Link to="/pedidos">📦 Pedidos</Link></li>
              <li><button onClick={cerrarSesion}>🚪 Cerrar sesión</button></li>
            </>
          ) : (
            <li>
              <Link to="/login">🔐 Iniciar sesión</Link>
            </li>
          )}
        </ul>
      )}

      {/* Modal para todas las categorías (Ver más) */}
      {mostrarModalTodasCategorias && (
        <div className="modal-categorias-overlay">
          <div className="modal-categorias">
            <button 
              className="cerrar-modal"
              onClick={() => setMostrarModalTodasCategorias(false)}
            >
              ×
            </button>
            
            <h3>Todas las categorías</h3>
            
            <div className="categorias-modal-grid">
              {categorias.map((categoria) => (
                <button
                  key={categoria.idFirebase}
                  className="categoria-modal-btn"
                  onClick={() => {
                    handleCategoriaClick(categoria);
                    setMostrarModalTodasCategorias(false);
                  }}
                >
                  {categoria.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal para productos de categoría específica */}
      {categoriaSeleccionada && (
        <ModalCategoria
          categoria={categoriaSeleccionada}
          productos={productos.filter(p => 
            p.categoriaId === categoriaSeleccionada.idFirebase || 
            p.categoria?.toLowerCase() === categoriaSeleccionada.nombre.toLowerCase()
          )}
          onClose={() => setCategoriaSeleccionada(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </nav>
  );
}

export default Navbar;