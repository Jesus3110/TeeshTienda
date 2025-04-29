import React, { useState } from "react"; // <-- Agrega useState
import "../styles/modalProducto.css";

function ModalProducto({
  producto,
  onClose,
  onAddToCart,
  productosRelacionados = [],
  onProductoClick,
  descuentos = [],
}) {
  const [cantidad, setCantidad] = useState(1); // <-- Aquí el estado de cantidad
  // Filtrar productos relacionados
  const productosSimilares = productosRelacionados
    .filter(
      (p) =>
        p.categoria === producto.categoria &&
        p.idFirebase !== producto.idFirebase
    )
    .slice(0, 3);

  // Obtener descuento del producto actual
  const descuento = producto.descuentoAplicado
    ? descuentos.find((d) => d.id === producto.descuentoAplicado)
    : null;

  // Calcular precio con descuento
  const precioConDescuento = descuento
    ? (producto.precio * (1 - descuento.porcentaje / 100)).toFixed(2)
    : producto.precio.toFixed(2);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-producto" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-producto-content">
          {/* Sección principal con imagen y detalles */}
          <div className="modal-main-section">
            {/* Columna de imagen */}
            <div className="modal-producto-imagen">
              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="img-producto-modal"
              />
              {descuento && (
                <div className="descuento-badge-modal">
                  -{descuento.porcentaje}%
                </div>
              )}
            </div>

            {/* Columna de información */}
            <div className="modal-producto-info">
              <div className="producto-header-modal">
                <h2 className="producto-nombre-modal">{producto.nombre}</h2>
                <div className="producto-precio-container-modal">
                  {descuento ? (
                    <>
                      <span className="precio-original-modal">
                        ${producto.precio.toFixed(2)}
                      </span>
                      <span className="precio-descuento-modal">
                        ${precioConDescuento}
                      </span>
                    </>
                  ) : (
                    <span className="precio-normal-modal">
                      ${producto.precio.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="producto-descripcion-modal">
                <p>{producto.descripcion || "Descripción no disponible"}</p>
                <div className="shipping-info">
                  <span className="shipping-badge">
                    Envío rápido disponible
                  </span>
                </div>
              </div>

              <div className="quantity-selector">
                <span>Cantidad</span>
                <div className="quantity-controls">
                  <button
                    className="quantity-btn"
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (isNaN(value)) {
                        setCantidad(1); // Si borra el input, lo regresa a 1
                      } else {
                        setCantidad(Math.max(1, value));
                      }
                    }}
                    className="quantity-input"
                    style={{
                      width: "50px",
                      textAlign: "center",
                      margin: "0 5px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      height: "30px",
                    }}
                  />

                  <button
                    className="quantity-btn"
                    onClick={() => setCantidad(cantidad + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="producto-actions-modal">
                <button
                  className="btn-agregar-carrito-modal"
                  onClick={() => {
                    onAddToCart(producto, cantidad);
                    onClose();
                  }}
                >
                  Agregar al carrito
                </button>
              </div>

              {/* Opción de recojo en tienda
              <div className="store-pickup-option">
                <p>Compra ahora, recoge en tienda</p>
                <button className="find-store-btn">Buscar tienda cercana</button>
              </div> */}

              {/* Especificaciones del producto */}
              <div className="product-specs">
                <h3 className="specs-title">Especificaciones del producto</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Marca</span>
                    <span className="spec-value">
                      {producto.marca || "No especificada"}
                    </span>
                  </div>
                  {/* <div className="spec-item">
                    <span className="spec-label">Tipo</span>
                    <span className="spec-value">{producto.tipo || 'No especificado'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Material</span>
                    <span className="spec-value">{producto.material || 'No especificado'}</span>
                  </div> */}
                </div>
              </div>
            </div>
          </div>

          {/* Productos relacionados */}
          {productosSimilares.length > 0 && (
            <div className="productos-relacionados-modal">
              <h3 className="related-title">Productos relacionados</h3>
              <div className="grid-productos-relacionados">
                {productosSimilares.map((productoRel) => {
                  const descuentoRel = productoRel.descuentoAplicado
                    ? descuentos.find(
                        (d) => d.id === productoRel.descuentoAplicado
                      )
                    : null;
                  const precioRelConDescuento = descuentoRel
                    ? (
                        productoRel.precio *
                        (1 - descuentoRel.porcentaje / 100)
                      ).toFixed(2)
                    : productoRel.precio.toFixed(2);

                  return (
                    <div
                      className="producto-relacionado-card"
                      key={productoRel.idFirebase}
                      onClick={() => onProductoClick(productoRel)}
                    >
                      <div className="producto-relacionado-imagen">
                        <img
                          src={productoRel.imagen}
                          alt={productoRel.nombre}
                          className="img-producto-relacionado"
                        />
                        {descuentoRel && (
                          <div className="descuento-badge-relacionado">
                            -{descuentoRel.porcentaje}%
                          </div>
                        )}
                      </div>
                      <div className="producto-relacionado-info">
                        <div className="producto-relacionado-nombre">
                          {productoRel.nombre}
                        </div>
                        <div className="producto-relacionado-rating">
                          ★★★★★ {productoRel.ratingCount || ""}
                        </div>
                        <div className="producto-relacionado-precio">
                          {descuentoRel ? (
                            <>
                              <span className="precio-original-relacionado">
                                ${productoRel.precio.toFixed(2)}
                              </span>
                              <span className="precio-descuento-relacionado">
                                ${precioRelConDescuento}
                              </span>
                            </>
                          ) : (
                            <span>${productoRel.precio.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalProducto;
