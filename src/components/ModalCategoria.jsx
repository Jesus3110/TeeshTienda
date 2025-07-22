import React from "react";
import "../styles/modalCategoria.css";

function ModalCategoria({
  verDetalles,
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
      <div
        className="modal-categoria"
        onClick={(e) => e.stopPropagation()}
        tabIndex={0}
        autoFocus
      >
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
                const base = parseFloat(producto.precio); // El precio real que paga el cliente
                const precioConComision =
                  calcularPrecioConComision(base).toFixed(2);

                function calcularPrecioConComision(precioNeto) {
                  const porcentajeStripe = 0.036;
                  const fijoStripe = 3.0;
                  const iva = 0.16;

                  const base =
                    (precioNeto + fijoStripe) / (1 - porcentajeStripe);
                  const ivaTotal = (base - precioNeto) * iva;

                  return parseFloat((base + ivaTotal).toFixed(2));
                }

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
        ${precioConComision}
      </span>
      <span className="precio-final descuento">
        ${base.toFixed(2)}
      </span>
    </>
  ) : (
    <span className="precio-final">${base.toFixed(2)}</span>
  )}
</div>


                      <div className="btns-producto">
                        <button
                          className="btn-agregar-carrito"
                          onClick={() => onAddToCart(producto)}
                        >
                          Agregar al carrito
                        </button>

                        <button
                          className="btn-ver-detalles"
                          onClick={() => verDetalles(producto)}
                        >
                          Ver detalles
                        </button>
                      </div>
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
