import React, { useState, useEffect } from "react";
import "../styles/modalProducto.css";
import ModalAlerta from "./ModalAlerta";

function ModalProducto({
  producto,
  onClose,
  onAddToCart,
  productosRelacionados = [],
  onProductoClick,
  descuentos = [],
  carrito = [],
}) {
  const [imagenSeleccionada, setImagenSeleccionada] = useState(producto.imagen);
  const [colorSeleccionado, setColorSeleccionado] = useState(
    producto.colores?.[0] || null
  );
  const [cantidad, setCantidad] = useState(1);
  const [alerta, setAlerta] = useState({
    visible: false,
    mensaje: "",
    tipo: "error",
  });

  useEffect(() => {
    setImagenSeleccionada(producto.imagen);
    setColorSeleccionado(producto.colores?.[0] || null);
    setCantidad(1);
  }, [producto]);

  const cantidadEnCarrito = carrito
    .filter((p) => p.idFirebase === producto.idFirebase)
    .reduce((acc, p) => acc + (parseInt(p.cantidad) || 0), 0);

  const stockReal = parseInt(producto.stock || 0);
  const stockDisponible = Math.max(0, stockReal - cantidadEnCarrito);

  // Filtrar productos relacionados
  const productosSimilares = productosRelacionados
    .filter(
      (p) =>
        p.categoria === producto.categoria &&
        p.idFirebase !== producto.idFirebase
    )
    .slice(0, 3);

  // Obtener descuento del producto actual
  const hoy = new Date();
  const descuento = producto.descuentoAplicado
    ? descuentos.find((d) => {
        if (d.id !== producto.descuentoAplicado) return false;
        if (!d.validoHasta) return true; // No tiene fecha límite
        const fechaLimite = new Date(d.validoHasta);
        return hoy <= fechaLimite; // Solo aplica si no ha vencido
      })
    : null;

  const precioOriginal = parseFloat(producto.precioOriginal || "0");
  const precioFinal = parseFloat(producto.precio);

  function calcularPrecioConComision(precioNeto) {
    const porcentajeStripe = 0.036;
    const fijoStripe = 3.0;
    const iva = 0.16;

    const base = (precioNeto + fijoStripe) / (1 - porcentajeStripe);
    const ivaTotal = (base - precioNeto) * iva;

    return parseFloat((base + ivaTotal).toFixed(2));
  }

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
              <div className="zoom-lupa">
                <img
                  src={imagenSeleccionada}
                  alt={producto.nombre}
                  className="img-producto-modal"
                />
              </div>

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
                        ${calcularPrecioConComision(precioFinal)}
                      </span>
                      <span className="precio-descuento-modal">
                        ${precioFinal.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="precio-normal-modal">
                      ${precioFinal.toFixed(2)}
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
              {producto.imagenes && producto.imagenes.length > 1 && (
                <div className="miniaturas-modal">
                  {producto.imagenes.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`img-${idx}`}
                      className={`miniatura-img ${
                        img === imagenSeleccionada ? "activa" : ""
                      }`}
                      onClick={() => setImagenSeleccionada(img)}
                    />
                  ))}
                </div>
              )}

              {producto.colores?.length > 0 && (
                <div className="form-group">
                  <label style={{ fontWeight: "bold" }}>Color:</label>
                  <div className="color-picker-modal">
                    {producto.colores.map((hex, idx) => (
                      <button
                        key={idx}
                        className={`color-dot ${
                          colorSeleccionado === hex ? "seleccionado" : ""
                        }`}
                        style={{ backgroundColor: hex }}
                        onClick={() => setColorSeleccionado(hex)}
                      />
                    ))}
                  </div>
                </div>
              )}

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
                    max={stockDisponible}
                    value={cantidad}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (isNaN(value)) {
                        setCantidad(1);
                      } else if (value > stockDisponible) {
                        setCantidad(stockDisponible);
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

                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginTop: "5px",
                    }}
                  >
                    Stock disponible: {stockDisponible}
                  </p>

                  <button
                    className="quantity-btn"
                    onClick={() => {
                      if (cantidad < stockDisponible) {
                        setCantidad(cantidad + 1);
                      }
                    }}
                    disabled={cantidad >= stockDisponible}
                    title={
                      cantidad >= stockDisponible ? "Límite alcanzado" : ""
                    }
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
                    if (cantidad > stockDisponible) {
                      setAlerta({
                        visible: true,
                        mensaje: `❌ Solo quedan ${stockDisponible} disponibles (ya tienes ${cantidadEnCarrito} en tu carrito)`,
                        tipo: "error",
                      });
                      return;
                    }
                    if (producto.colores?.length > 0 && !colorSeleccionado) {
                      setAlerta({
                        visible: true,
                        mensaje:
                          "❌ Debes seleccionar un color antes de continuar.",
                        tipo: "error",
                      });
                      return;
                    }

                    console.log(
                      "Color seleccionado antes de enviar al carrito:",
                      colorSeleccionado
                    );
                    onAddToCart(
                      { ...producto, color: colorSeleccionado },
                      cantidad
                    );

                    onClose();
                  }}
                  disabled={stockDisponible === 0}
                  style={{
                    opacity: stockDisponible === 0 ? 0.5 : 1,
                    cursor: stockDisponible === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {stockDisponible === 0
                    ? "Sin stock disponible"
                    : "Agregar al carrito"}
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
                  const precioFinalRel = parseFloat(productoRel.precio);
                  const precioConComisionRel =
                    calcularPrecioConComision(precioFinalRel);

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
                                ${precioConComisionRel}
                              </span>
                              <span className="precio-descuento-relacionado">
                                ${precioFinalRel.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="precio-descuento-relacionado">
                              ${precioFinalRel.toFixed(2)}
                            </span>
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
      {alerta.visible && (
        <ModalAlerta
          mensaje={alerta.mensaje}
          tipo={alerta.tipo}
          onClose={() => setAlerta({ ...alerta, visible: false })}
        />
      )}
    </div>
  );
}

export default ModalProducto;
