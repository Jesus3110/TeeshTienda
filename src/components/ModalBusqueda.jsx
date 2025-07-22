import React from "react";
import "../styles/modalBusqueda.css";

function ModalBusqueda({
  visible,
  onClose,
  resultados,
  termino,
  setTermino,
  onSeleccionar,
  obtenerDescuentoProducto, // ✅ se recibe como prop
}) {
  if (!visible) return null;

  const calcularPrecioConComision = (precioNeto) => {
    const porcentajeStripe = 0.036;
    const fijoStripe = 3.0;
    const iva = 0.16;
    const base = (precioNeto + fijoStripe) / (1 - porcentajeStripe);
    const ivaTotal = (base - precioNeto) * iva;
    return parseFloat((base + ivaTotal).toFixed(2));
  };

  return (
    <div className="modal-busqueda-overlay" onClick={onClose}>
      <div className="modal-busqueda" onClick={(e) => e.stopPropagation()}>
        <button className="cerrar-modal-busqueda" onClick={onClose}>×</button>
        <h3>Buscar productos</h3>

        <input
          type="text"
          placeholder="Escribe para buscar..."
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          className="input-busqueda-modal"
        />

        <div className="resultados-container">
          {termino.trim() === "" ? (
            <p className="mensaje-estado">Escribe algo para buscar.</p>
          ) : resultados.length === 0 ? (
            <p className="mensaje-estado">No se encontraron resultados.</p>
          ) : (
            resultados.map((prod) => {
              const descuento = obtenerDescuentoProducto(prod);
              const precioFinal = parseFloat(prod.precio);

              return (
                <div key={prod.idFirebase} className="card-producto-modal">
                  {descuento && (
                    <div className="descuento-badge">
                      -{descuento.porcentaje}%
                    </div>
                  )}

                  <img
                    src={prod.imagen || "/img/no-image.png"}
                    alt={prod.nombre}
                    className="img-producto-modal"
                  />

                  <h4 className="nombre-producto-modal">{prod.nombre}</h4>
                  <div className="estrellas-modal">★★★★★</div>

                  <div className="producto-precios">
                    {descuento ? (
                      <>
                        <span className="precio-original tachado">
                          ${calcularPrecioConComision(precioFinal)}
                        </span>
                        <span className="precio-final descuento">
                          ${precioFinal.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="precio-final">
                        ${precioFinal.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <button
                    className="btn-agregar-modal"
                    onClick={() => onSeleccionar(prod)}
                  >
                    Ver Detalles
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalBusqueda;
