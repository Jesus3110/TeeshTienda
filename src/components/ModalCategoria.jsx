import React from "react";
import "../styles/modalCategoria.css";

function ModalCategoria({
  categoria,
  productos,
  onClose,
  onAddToCart,
  descuentos,
}) {
  const obtenerDescuento = (producto) =>
    producto.descuentoAplicado
      ? descuentos.find((d) => d.id === producto.descuentoAplicado)
      : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-categoria" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-categoria-titulo">{categoria.nombre}</h2>

        <div className="grid-productos-categoria">
          {productos.filter((p) => p.activo).length > 0 ? (
            productos
              .filter((p) => p.activo)
              .map((producto) => {
                const descuento = obtenerDescuento(producto);
                const base = producto.precioOriginal || producto.precio;
                const precioConDescuento = descuento
                  ? (base * (1 - descuento.porcentaje / 100)).toFixed(2)
                  : base.toFixed(2);

                return (
                  <div
                    className="card-producto-categoria"
                    key={producto.idFirebase}
                  >
                    <div className="img-wrapper">
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="img-producto-categoria"
                      />
                      {descuento && (
                        <span className="etiqueta-descuento">
                          -{descuento.porcentaje}%
                        </span>
                      )}
                    </div>

                    <div className="producto-info">
                      <h3>{producto.nombre}</h3>
                      <div className="producto-rating">★★★★★</div>

                      <div className="producto-precios">
                        {descuento ? (
                          <>
                            <span className="precio-original tachado">
                              ${base.toFixed(2)}
                            </span>
                            <span className="precio-final descuento">
                              ${precioConDescuento}
                            </span>
                          </>
                        ) : (
                          <span className="precio-final">
                            ${base.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        className="btn-agregar-carrito"
                        onClick={() => {
                          onAddToCart(producto);
                          onClose();
                        }}
                      >
                        Agregar al carrito
                      </button>
                    </div>
                  </div>
                );
              })
          ) : (
            <p className="sin-productos">No hay productos en esta categoría</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalCategoria;
