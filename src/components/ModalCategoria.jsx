import React from "react";
import "../styles/modalCategoria.css";

function ModalCategoria({ categoria, productos, onClose, onAddToCart, descuentos }) {
  // Función para obtener el descuento de un producto (igual que en Home)
  const obtenerDescuentoProducto = (producto) => {
    if (!producto || !producto.descuentoAplicado || !descuentos.length) return null;
    
    const descuentoEncontrado = descuentos.find(d => d.id === producto.descuentoAplicado);
    
    if (descuentoEncontrado && descuentoEncontrado.validoHasta) {
      return new Date(descuentoEncontrado.validoHasta) > new Date() ? descuentoEncontrado : null;
    }
    
    return descuentoEncontrado;
  };

  // Función para calcular precio con descuento (igual que en Home)
  const calcularPrecioConDescuento = (precioActual, descuento, precioOriginal) => {
    if (typeof precioActual !== 'number' || isNaN(precioActual)) return precioActual;
    if (!descuento || typeof descuento.porcentaje !== 'number') return precioActual;
    
    const baseParaDescuento = precioOriginal && typeof precioOriginal === 'number' 
      ? precioOriginal 
      : precioActual;
    
    const precioConDescuento = baseParaDescuento * (1 - descuento.porcentaje / 100);
    return Math.round(precioConDescuento * 100) / 100;
  };

  // Calcular el mayor descuento disponible
  const mayorDescuento = productos.reduce((max, producto) => {
    const descuento = obtenerDescuentoProducto(producto);
    return descuento && descuento.porcentaje > max ? descuento.porcentaje : max;
  }, 0);

  return (
    <div className="modal-backdrop">
      <div className="modal-categoria">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
       
        <h2 className="modal-categoria-titulo">{categoria.nombre}</h2>

        <div className="grid-productos-categoria">
          {productos.length > 0 ? (
            productos.map((producto) => {
              const descuento = obtenerDescuentoProducto(producto);
              const tieneDescuento = descuento !== null;
              const precioFinal = tieneDescuento
                ? calcularPrecioConDescuento(producto.precio, descuento, producto.precioOriginal)
                : producto.precio;

              return (
                <div className="card-producto-categoria" key={producto.idFirebase || producto.id}>
                  <div className="img-wrapper">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="img-producto-categoria"
                    />
                    {tieneDescuento && (
                      <span className="etiqueta-descuento">
                        -{descuento.porcentaje}%
                      </span>
                    )}
                  </div>

                  <div className="producto-info">
                    <h3>{producto.nombre}</h3>
                    <div className="producto-rating">★★★★★</div>

                    <div className="producto-precios">
                      {tieneDescuento ? (
                        <>
                          <span className="precio-original tachado">
                            ${producto.precioOriginal?.toFixed(2) || producto.precio.toFixed(2)}
                          </span>
                          <span className="precio-final">
                            ${precioFinal.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="precio-final">
                          ${producto.precio.toFixed(2)}
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