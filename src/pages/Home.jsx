import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { escucharProductos } from "../services/productosService";
import { AuthContext } from "../context/AuthContext";
import { obtenerBannersActivos } from "../services/bannersService";
import { getDatabase, ref, onValue, set } from "firebase/database";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/home.css";
import ModalProducto from "../components/ModalProducto";
import ModalCategoria from "../components/ModalCategoria";
import ProductosDestacados from "../components/ProductosDestacados";
import ClienteLayout from "../components/ClienteLayout";
import ChatBot from "../components/ChatBot";


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
  const [productosVendidos, setProductosVendidos] = useState({});
  const [carrito, setCarrito] = useState([]);


  const obtenerDescuentoProducto = (producto) => {
    if (!producto || !producto.descuentoAplicado || !descuentos?.length) {
      console.log("Faltan datos para aplicar descuento:", {
        producto: producto?.nombre,
        tieneDescuento: !!producto?.descuentoAplicado,
        descuentosDisponibles: descuentos?.length,
      });
      return null;
    }

    // Buscar el descuento que coincida con el ID aplicado al producto
    const descuentoEncontrado = descuentos.find(
      (d) =>
        d.id === producto.descuentoAplicado ||
        d.idFirebase === producto.descuentoAplicado
    );

    if (!descuentoEncontrado) {
      console.log("Descuento no encontrado para producto:", {
        producto: producto.nombre,
        descuentoAplicado: producto.descuentoAplicado,
        descuentosDisponibles: descuentos.map((d) => d.id || d.idFirebase),
      });
      return null;
    }

    // Verificar vigencia del descuento si tiene fecha
    if (descuentoEncontrado.validoHasta) {
      const fechaValidez = new Date(descuentoEncontrado.validoHasta);
      const hoy = new Date();

      if (isNaN(fechaValidez.getTime())) {
        console.log(
          "Fecha inválida en descuento:",
          descuentoEncontrado.validoHasta
        );
        return null;
      }

      if (fechaValidez < hoy) {
        console.log("Descuento vencido para:", producto.nombre);
        return null;
      }
    }

    console.log("Descuento aplicado correctamente a:", producto.nombre);
    return descuentoEncontrado;
  };

  useEffect(() => {
    // Cargar productos
    const unsubscribeProductos = escucharProductos((prods) =>
      setProductos(prods)
    );

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
            ...value,
          }))
          .filter((cat) => cat.activa)
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
        const listaDescuentos = Object.entries(data).map(
          ([idFirebase, value]) => ({
            idFirebase, // Asegurar que tenemos esta propiedad
            id: value.id || idFirebase, // Compatibilidad con ambos formatos
            porcentaje: value.porcentaje,
            nombre: value.nombre,
            validoHasta: value.validoHasta,
            activo: value.activo !== false, // Por defecto true si no está definido
          })
        );

        console.log("Descuentos cargados:", listaDescuentos);
        setDescuentos(listaDescuentos);
      });
    };

    // Ejecutar todas las cargas
    cargarBanners();
    const unsubscribeCategorias = cargarCategorias();
    const unsubscribeDescuentos = cargarDescuentos();
    const db = getDatabase();
    const refVendidos = ref(db, "dashboard/productosVendidos");

    // ✅ Guarda la función de desuscripción
    const unsubscribeVendidos = onValue(refVendidos, (snapshot) => {
      const data = snapshot.val() || {};
      setProductosVendidos(data);
    });

    // Función de limpieza
    return () => {
      unsubscribeProductos();
      unsubscribeCategorias();
      unsubscribeDescuentos();
      unsubscribeVendidos(); // ✅ ya está definida
    };
  }, []);

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


  const añadirAlCarrito = (producto, cantidad = 1) => {
    if (!usuario || rol !== "cliente") {
      navigate("/login");
      return;
    }

    const db = getDatabase();
    const carritoRef = ref(db, `carritos/${usuario.uid}`);

    onValue(
      carritoRef,
      (snapshot) => {
        const carritoActual = snapshot.val() || [];

        const index = carritoActual.findIndex(
          (p) => p.idFirebase === producto.idFirebase
        );

        if (index !== -1) {
          carritoActual[index].cantidad += cantidad;
        } else {
          carritoActual.push({
            idFirebase: producto.idFirebase,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad,
            categoria: producto.categoria || "Sin categoría", // 👈 Nuevo campo agregado
          });
        }

        set(carritoRef, carritoActual);
        alert(`✅ "${producto.nombre}" añadido al carrito.`);
      },
      { onlyOnce: true }
    );
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
    infinite: false ,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
  };

  const renderContenido = () => (
  <div className="home-container">
    {/* Carrusel de Banners */}
    {banners.length > 0 && (
      <div className="banner-carousel">
        <Slider {...carouselSettings}>
          {banners.map((banner) => {
            const ahora = Date.now();
            const descuento = descuentos.find(
              (d) =>
                d.id === banner.descuentoId ||
                d.idFirebase === banner.descuentoId
            );
            const tieneFechaValida =
              descuento?.validoHasta &&
              ahora <= new Date(descuento.validoHasta).getTime();
            const tieneDescuento =
              typeof banner.porcentaje === "number" &&
              descuento &&
              tieneFechaValida;
            const mostrarTitulo =
              banner.titulo &&
              (tieneDescuento || !banner.descuentoId);

            return (
              <div key={banner.id} className="banner-slide">
                <Link to={banner.enlace || "#"}>
                  <img
                    src={banner.imagenURL}
                    alt={banner.titulo || "Banner"}
                    className="banner-img"
                  />
                </Link>
                {tieneDescuento && (
                  <div className="banner-discount">
                    -{banner.porcentaje}%
                  </div>
                )}
                {mostrarTitulo && (
                  <div className="banner-title">{banner.titulo}</div>
                )}
              </div>
            );
          })}
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
          <h4>Aprovecha descuentos</h4>
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

    <ProductosDestacados
      productos={productos.filter((p) => p.activo !== false)}
      descuentos={descuentos}
      verDetalles={verDetalles}
      obtenerDescuentoProducto={obtenerDescuentoProducto}
      productosVendidos={productosVendidos}
    />

    {mostrarModalCategoria && categoriaSeleccionada && (
      <ModalCategoria
        categoria={categoriaSeleccionada}
        productos={productos.filter(
          (p) =>
            p.categoria &&
            p.categoria.toLowerCase() ===
              categoriaSeleccionada.nombre.toLowerCase()
        )}
        onClose={() => setMostrarModalCategoria(false)}
        onAddToCart={añadirAlCarrito}
        descuentos={descuentos}
      />
    )}

    {mostrarModal && productoSeleccionado && (
      <ModalProducto
        producto={productoSeleccionado}
        onClose={() => setMostrarModal(false)}
        onAddToCart={añadirAlCarrito}
        descuentos={descuentos}
        productosRelacionados={productos}
        onProductoClick={handleProductoRelacionadoClick}
        carrito={carrito}
      />
    )}
  </div>
);

return (
  <>
    {usuario && rol === "cliente" ? (
      <ClienteLayout>
        {renderContenido()}
        <ChatBot />
      </ClienteLayout>
    ) : (
      <>
        {renderContenido()}
        <ChatBot />
      </>
    )}
  </>
);
}

export default Home;
