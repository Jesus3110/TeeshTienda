import React, { useState, useEffect } from "react";
import { obtenerBanners, eliminarBanner } from "../services/bannersService";
import ModalBanner from "../components/ModalBanner";
import "../styles/modal.css";
import { escucharProductos } from "../services/productosService";
import { getDatabase, ref, update } from "firebase/database"; // Asegúrate de tenerlo

function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [bannerEditando, setBannerEditando] = useState(null);
  const [productos, setProductos] = useState([]);
  const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [verDeshabilitados, setVerDeshabilitados] = useState(false);
  

 



  // Cargar banners al iniciar
  useEffect(() => {
  const unsubscribe = escucharProductos(setProductos);
  return () => unsubscribe();
}, []);

useEffect(() => {
  if (productos.length > 0) {
    cargarBanners();
  }
}, [productos]);


const cargarBanners = async () => {
  setCargando(true);
  try {
    const lista = await obtenerBanners(true); // Incluye inactivos

    // Descuentos vigentes (usados por productos)
    const descuentosVigentes = new Set(
      productos.map(p => p.descuentoAplicado).filter(Boolean)
    );

    const db = getDatabase();

    // Limpia banners con descuento obsoleto
    for (const banner of lista) {
      const descuentoObsoleto =
        banner.descuentoId && !descuentosVigentes.has(banner.descuentoId);

      if (descuentoObsoleto) {
        const bannerRef = ref(db, `banners/${banner.id}`);
        await update(bannerRef, {
          porcentaje: null,
          titulo: null,
          descuentoId: null,
        });
        console.log(`🔧 Banner ${banner.id} limpiado`);
      }
    }

    // Solo se necesita esta asignación
    setBanners(lista);
  } catch (error) {
    console.error("Error limpiando banners:", error);
  } finally {
    setCargando(false);
  }
};

  const contarProductosConDescuento = (descuentoId) => {
  return productos.filter(p => p.descuentoAplicado === descuentoId).length;
};

const verProductosConDescuento = (descuentoId) => {
  const filtrados = productos.filter(p => p.descuentoAplicado === descuentoId);
  setProductosFiltrados(filtrados);
  setMostrarModalProductos(true);
};


  const handleEditar = (banner) => {
    setBannerEditando(banner);
    setMostrarModal(true);
  };

  const handleEliminar = async (id, imagenURL) => {
    if (!window.confirm("¿Eliminar este banner permanentemente?")) return;

    try {
      await eliminarBanner(id, imagenURL);
      await cargarBanners();
    } catch (error) {
      console.error("Error eliminando banner:", error);
    }
  };

  const handleNuevoBanner = () => {
    setBannerEditando(null);
    setMostrarModal(true);
  };
const bannersFiltrados = banners.filter((b) => {
  const esActivo = b.activo === undefined || b.activo === true;
  return verDeshabilitados || esActivo;
});

return (
  <div className="container" style={{ padding: "2rem" }}>
    <div className="banners-header-flex">
      <h2>Administrar Banners</h2>
      <div className="banners-header-actions">
        <button className="btn-red" onClick={handleNuevoBanner}>
          + Nuevo Banner
        </button>
        <label className="switch-label">
          <input
            type="checkbox"
            className="custom-checkbox custom-checkbox-lg"
            checked={verDeshabilitados}
            onChange={(e) => setVerDeshabilitados(e.target.checked)}
          />
          Ver deshabilitados
        </label>
      </div>
    </div>

    {/* Lista de banners */}
    <div className="banners-list">
      <div className="table-container">
        <table className="banners-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Título</th>
              <th>Descuento</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && banners.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                  Cargando banners...
                </td>
              </tr>
            ) : bannersFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                  No hay banners registrados
                </td>
              </tr>
            ) : (
              bannersFiltrados.map((banner) => {
                const productosAsociados = productos.filter(
                  (p) => p.descuentoAplicado === banner.descuentoId
                );
                return (
                  <tr
                    key={banner.id}
                    className={banner.activo ? "" : "row-inactive"}
                  >
                    <td>
                      <img
                        src={banner.imagenURL}
                        alt={banner.titulo}
                        style={{
                          width: "120px",
                          height: "60px",
                          objectFit: "cover",
                        }}
                      />
                    </td>
                    <td>
                      <strong>{banner.titulo || "Sin título"}</strong>
                    </td>
                    <td>
                      {banner.porcentaje ? `${banner.porcentaje}%` : "N/A"}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setProductosFiltrados(productosAsociados);
                          setMostrarModalProductos(true);
                        }}
                        className="btn-table btn-edit"
                      >
                        Ver productos
                      </button>
                    </td>
                    <td>
                      <span className={`status-badge ${banner.activo ? "status-active" : "status-inactive"}`}>
                        {banner.activo !== false ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => handleEditar(banner)}
                          className="btn-table btn-edit"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(banner.id, banner.imagenURL)}
                          className="btn-table btn-delete"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Modal de creación/edición */}
    {mostrarModal && (
      <ModalBanner
        banner={bannerEditando}
        onClose={() => {
          setMostrarModal(false);
          setBannerEditando(null);
        }}
        onGuardarExitoso={cargarBanners}
      />
    )}

    {/* Modal de productos con descuento */}
    {mostrarModalProductos && (
      <div className="modal-backdrop">
        <div className="modal-content">
          <h3>Productos con este descuento</h3>
          <ul>
            {productosFiltrados.map((p) => (
              <li key={p.idFirebase}>{p.nombre}</li>
            ))}
          </ul>
          <button onClick={() => setMostrarModalProductos(false)}>Cerrar</button>
        </div>
      </div>
    )}
  </div>
);

}

export default AdminBanners;
