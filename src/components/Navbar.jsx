import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { getDatabase, ref, onValue, set } from "firebase/database";
import "../styles/navbar.css";
import ModalCategoria from "./ModalCategoria";

function Navbar() {
  const { usuario, rol } = useContext(AuthContext);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [mostrarModalTodasCategorias, setMostrarModalTodasCategorias] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [productos, setProductos] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const db = getDatabase();
    
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

    const refProd = ref(db, "productos");
    onValue(refProd, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data).map(([idFirebase, value]) => ({
        idFirebase,
        ...value
      }));
      setProductos(lista);
    });

    const refDescuentos = ref(db, "descuentos");
    onValue(refDescuentos, (snapshot) => {
      const data = snapshot.val() || {};
      const listaDescuentos = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
        validoHasta: value.validoHasta ? new Date(value.validoHasta) : null
      }));
      setDescuentos(listaDescuentos);
    });
  }, []);

  const obtenerDescuentoProducto = (producto) => {
    if (!producto || !producto.descuentoAplicado || !descuentos.length) return null;
    const descuentoEncontrado = descuentos.find(d => d.id === producto.descuentoAplicado);
    if (descuentoEncontrado && descuentoEncontrado.validoHasta) {
      return new Date(descuentoEncontrado.validoHasta) > new Date() ? descuentoEncontrado : null;
    }
    return descuentoEncontrado;
  };

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleCategoriaClick = (categoria) => {
    setCategoriaSeleccionada(categoria);
  };

  const handleAddToCart = (producto) => {
    if (!usuario || rol !== "cliente") {
      navigate("/login");
      return;
    }
  
    const productoConCategoria = {
      ...producto,
      cantidad: 1,
      categoria: categoriaSeleccionada?.nombre || producto.categoria || "Sin categoría",
      categoriaId: categoriaSeleccionada?.idFirebase || producto.categoriaId || "",
    };
  
    const db = getDatabase();
    const refCarrito = ref(db, `carritos/${usuario.uid}`);
  
    // Leer carrito actual
    onValue(refCarrito, (snapshot) => {
      const carritoExistente = snapshot.val() || [];
      const nuevoCarrito = [...carritoExistente, productoConCategoria];
      set(refCarrito, nuevoCarrito);
      alert(`✅ "${producto.nombre}" añadido al carrito.`);
    }, { onlyOnce: true });
  };
  

  const categoriasPrincipales = categorias.slice(0, 7);
  const categoriasRestantes = categorias.slice(7);

  return (
    <nav className="navbar-cliente">
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

      <div className="menu-usuario">
        {rol === "cliente" && <Link to="/carrito">🛒</Link>}
        <div className="hamburguesa" onClick={() => setMenuAbierto(!menuAbierto)}>
          ☰
        </div>
      </div>

      {menuAbierto && (
        <ul className={`menu-cliente ${menuAbierto ? "activo" : ""}`}>
          {rol === "cliente" ? (
            <>
              <li><Link to="/perfil">👤 Perfil</Link></li>
              <li><Link to="/carrito">🛒 Carrito</Link></li>
              <li><Link to="/pedidos">📦 Pedidos</Link></li>
              <li><Link to="/historial">📦 Historial</Link></li>
              <li><button onClick={cerrarSesion}>🚪 Cerrar sesión</button></li>
            </>
          ) : (
            <li>
              <Link to="/login">🔐 Iniciar sesión</Link>
            </li>
          )}
        </ul>
      )}

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

{categoriaSeleccionada && (
  <ModalCategoria
    categoria={categoriaSeleccionada}
    productos={productos
      .filter(p => 
        p.categoriaId === categoriaSeleccionada.idFirebase ||
        p.categoria?.toLowerCase() === categoriaSeleccionada.nombre.toLowerCase()
      )
      .map(producto => ({
        idFirebase: producto.idFirebase,
        nombre: producto.nombre,
        imagen: producto.imagen,
        precio: producto.precioOriginal || producto.precio,
        descuentoAplicado: producto.descuentoAplicado || null, // <-- explícito aquí
        categoriaId: producto.categoriaId,
        descripcion: producto.descripcion,
      }))
    }
    descuentos={descuentos}
    onClose={() => setCategoriaSeleccionada(null)}
    onAddToCart={handleAddToCart}
  />
)}






    </nav>
  );
}

export default Navbar;