import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { escucharProductos } from "../services/productosService";
import { AuthContext } from "../context/AuthContext";
import { obtenerBannersActivos } from "../services/bannersService";
import { getDatabase, ref, onValue } from "firebase/database";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/home.css";
import ModalProducto from "../components/ModalProducto";
import ModalCategoria from "../components/ModalCategoria";

function Home() {
  const [productos, setProductos] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const { usuario, rol } = useContext(AuthContext);
  const navigate = useNavigate();
  const [descuentos, setDescuentos] = useState([]);

  // Función para obtener el descuento de un producto
  const obtenerDescuentoProducto = (producto) => {
    if (!producto || !producto.descuentoAplicado || !descuentos.length) return null;
    
    const descuentoEncontrado = descuentos.find(d => d.id === producto.descuentoAplicado);
    
    if (descuentoEncontrado && descuentoEncontrado.validoHasta) {
      return new Date(descuentoEncontrado.validoHasta) > new Date() ? descuentoEncontrado : null;
    }
    
    return descuentoEncontrado;
  };

  // Función para calcular precio con descuento
  const calcularPrecioConDescuento = (precioActual, descuento, precioOriginal) => {
    if (typeof precioActual !== 'number' || isNaN(precioActual)) return precioActual;
    if (!descuento || typeof descuento.porcentaje !== 'number') return precioActual;
    
    const baseParaDescuento = precioOriginal && typeof precioOriginal === 'number' 
      ? precioOriginal 
      : precioActual;
    
    const precioConDescuento = baseParaDescuento * (1 - descuento.porcentaje / 100);
    return Math.round(precioConDescuento * 100) / 100;
  };

  useEffect(() => {
    // Cargar productos
    const unsubscribeProductos = escucharProductos((prods) => setProductos(prods));
    
    // Cargar banners
    const cargarBanners = async () => {
      try {
        const bannersActivos = await obtenerBannersActivos();
        setBanners(bannersActivos);
      } catch (error) {
        console.error("Error cargando banners:", error);
      }
    };
    
    // Cargar categorías
    const cargarCategorias = () => {
      const db = getDatabase();
      const refCat = ref(db, "categorias");
      return onValue(refCat, (snapshot) => {
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
    };
    
    // Cargar descuentos
    const cargarDescuentos = () => {
      const db = getDatabase();
      const descuentosRef = ref(db, "descuentos");
      return onValue(descuentosRef, (snapshot) => {
        const data = snapshot.val() || {};
        const listaDescuentos = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
          validoHasta: value.validoHasta ? new Date(value.validoHasta) : null
        }));
        setDescuentos(listaDescuentos);
      });
    };

    // Ejecutar todas las cargas
    cargarBanners();
    const unsubscribeCategorias = cargarCategorias();
    const unsubscribeDescuentos = cargarDescuentos();

    // Función de limpieza
    return () => {
      unsubscribeProductos();
      unsubscribeCategorias();
      unsubscribeDescuentos();
    };
  }, []);

  const añadirAlCarrito = (producto) => {
    if (!usuario || rol !== "cliente") {
      navigate("/login");
      return;
    }
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.push({ ...producto, cantidad: 1 });
    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert(`✅ "${producto.nombre}" añadido al carrito.`);
  };

  const verDetalles = (producto) => {
    setProductoSeleccionado(producto);
    setMostrarModal(true);
  };

  const handleProductoRelacionadoClick = (productoRel) => {
    setProductoSeleccionado(productoRel);
    // No cerramos el modal, solo actualizamos el producto
  };

  const verProductosCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setMostrarModalCategoria(true);
  };

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true
  };

  return (
    <div className="home-container">
      {/* Carrusel de Banners */}
      {banners.length > 0 && (
        <div className="banner-carousel">
          <Slider {...carouselSettings}>
            {banners.map((banner) => (
              <div key={banner.id}>
                <Link to={banner.enlace || "#"}>
                  <img 
                    src={banner.imagenURL} 
                    alt="Banner promocional" 
                    className="banner-img"
                  />
                </Link>
              </div>
            ))}
          </Slider>
        </div>
      )}

      {/* Beneficios */}
      <div className="beneficios-container">
        <div className="beneficio">
          <div className="beneficio-icono">🚚</div>
          <div className="beneficio-texto">
            <h4>Envío gratis</h4>
            <p>En pedidos de +$150.00</p>
          </div>
        </div>
        
        <div className="beneficio">
          <div className="beneficio-icono">🔄</div>
          <div className="beneficio-texto">
            <h4>Devoluciones gratuitas</h4>
            <p>*las condiciones se aplican</p>
          </div>
        </div>
        
        <div className="beneficio">
          <div className="beneficio-icono">🔥</div>
          <div className="beneficio-texto">
            <h4>-12%</h4>
            <p>Para artículos seleccionados</p>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="seccion-categorias">
        <h3 className="titulo-seccion">Conseguir</h3>
        <div className="grid-categorias">
          {categorias.map((categoria) => (
            <button
              key={categoria.idFirebase}
              className="categoria-btn"
              onClick={() => verProductosCategoria(categoria)}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Productos Destacados */}
      <div className="seccion-productos">
        <h2 className="titulo-seccion">Productos Destacados</h2>
        <div className="grid-productos-destacados">
          {productos.slice(0, 3).map((prod) => {
            if (!prod || !prod.idFirebase || !prod.nombre || typeof prod.precio !== 'number') return null;
            
            const descuento = obtenerDescuentoProducto(prod);
            const precioConDescuento = descuento 
              ? calcularPrecioConDescuento(prod.precio, descuento, prod.precioOriginal)
              : prod.precio;
            
            return (
              <div className="card-producto-destacado" key={prod.idFirebase}>
                {descuento && (
                  <div className="descuento-badge">
                    -{descuento.porcentaje}%
                  </div>
                )}
                
                <img 
                  src={prod.imagen} 
                  alt={prod.nombre} 
                  className="img-producto-destacado"
                  onClick={() => verDetalles(prod)}
                />
                
                <div className="producto-info">
                  <h3 className="producto-nombre">{prod.nombre}</h3>
                  <div className="producto-rating">★★★★★</div>
                  
                  <div className="producto-precio-container">
                    {descuento ? (
                      <>
                        <span className="precio-original">
                          ${prod.precioOriginal?.toFixed(2) || prod.precio.toFixed(2)}
                        </span>
                        <span className="precio-descuento">
                          ${precioConDescuento.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="precio-normal">
                        ${prod.precio.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    className="btn-ver-detalles"
                    onClick={() => verDetalles(prod)}
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de categoría */}
      {mostrarModalCategoria && categoriaSeleccionada && (
        <ModalCategoria
          categoria={categoriaSeleccionada}
          productos={productos.filter(p => 
            p.categoria && 
            p.categoria.toLowerCase() === categoriaSeleccionada.nombre.toLowerCase()
          )}
          onClose={() => setMostrarModalCategoria(false)}
          onAddToCart={añadirAlCarrito}
        />
      )}

      {/* Modal de detalles del producto */}
      {mostrarModal && productoSeleccionado && (
        <ModalProducto 
          producto={productoSeleccionado}
          onClose={() => setMostrarModal(false)}
          onAddToCart={añadirAlCarrito}
          descuentos={descuentos}
          productosRelacionados={productos}
          onProductoClick={handleProductoRelacionadoClick}
        />
      )}
    </div>
  );
}

export default Home;