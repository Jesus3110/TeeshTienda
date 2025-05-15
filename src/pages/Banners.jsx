import React, { useState, useEffect } from "react";
import { obtenerBanners, eliminarBanner } from "../services/bannersService";
import ModalBanner from "../components/ModalBanner";
import "../styles/modal.css";
import { escucharProductos } from "../services/productosService";

function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [bannerEditando, setBannerEditando] = useState(null);
  const [productos, setProductos] = useState([]);
  const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
 



  // Cargar banners al iniciar
  useEffect(() => {
    cargarBanners();
    const unsubscribeProductos = escucharProductos(setProductos);
  return () => unsubscribeProductos();
    
  }, []);

  const cargarBanners = async () => {
    setCargando(true);
    try {
      const lista = await obtenerBanners();
      setBanners(lista);
    } catch (error) {
      console.error("Error cargando banners:", error);
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

return (
  <div className="container" style={{ padding: "2rem" }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <h2>Administrar Banners</h2>
      <button
        onClick={handleNuevoBanner}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#D62828",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        + Nuevo Banner
      </button>
    </div>

    {/* Lista de banners */}
    <div className="banners-list">
      {cargando && banners.length === 0 ? (
        <p>Cargando banners...</p>
      ) : banners.length === 0 ? (
        <p>No hay banners registrados</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>Imagen</th>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>Título</th>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>Descuento</th>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>Productos</th>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>Estado</th>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => {
              const productosAsociados = productos.filter(
                (p) => p.descuentoAplicado === banner.descuentoId
              );
              return (
                <tr
                  key={banner.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: banner.activo ? "#fff" : "#f9f9f9",
                  }}
                >
                  <td style={{ padding: "0.5rem" }}>
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
                  <td style={{ padding: "0.5rem" }}>
                    <strong>{banner.titulo || "Sin título"}</strong>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {banner.porcentaje ? `${banner.porcentaje}%` : "N/A"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <button
                      onClick={() => {
                        setProductosFiltrados(productosAsociados);
                        setMostrarModalProductos(true);
                      }}
                      style={{
                        padding: "0.3rem 0.6rem",
                        backgroundColor: "#6c5ce7",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Ver ({productosAsociados.length})
                    </button>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {banner.activo !== false ? "Activo" : "Inactivo"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleEditar(banner)}
                        style={{
                          padding: "0.3rem 0.6rem",
                          backgroundColor: "#3498db",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          handleEliminar(banner.id, banner.imagenURL)
                        }
                        style={{
                          padding: "0.3rem 0.6rem",
                          backgroundColor: "#ff4444",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
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
