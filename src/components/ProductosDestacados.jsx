import React from "react";
import "../styles/home.css";

function ProductosDestacados({
  productos,
  descuentos,
  verDetalles,
  obtenerDescuentoProducto,
  productosVendidos = {} // ← Recibes este prop desde Firebase
}) {
  // Normaliza nombres para evitar errores por espacios o mayúsculas
  const normalizar = (str) => str.trim().toLowerCase();

  // Filtra solo productos que están en el ranking de vendidos
  const productosFiltrados = productos.filter((producto) =>
    Object.keys(productosVendidos).some(
      (nombre) => normalizar(nombre) === normalizar(producto.nombre)
    )
  );

  // Ordena por cantidad vendida
  const productosOrdenados = productosFiltrados.sort((a, b) => {
    const ventasA =
      productosVendidos[
        Object.keys(productosVendidos).find(
          (nombre) => normalizar(nombre) === normalizar(a.nombre)
        )
      ] || 0;

    const ventasB =
      productosVendidos[
        Object.keys(productosVendidos).find(
          (nombre) => normalizar(nombre) === normalizar(b.nombre)
        )
      ] || 0;

    return ventasB - ventasA;
  });

  return (
    <div className="seccion-productos">
      <h2 className="titulo-seccion">Productos Más Vendidos</h2>

      <div className="grid-productos-destacados">
        {productosOrdenados.map((producto) => {
          const descuento = obtenerDescuentoProducto(producto);
          const base = producto.precioOriginal || producto.precio;
          const precioConDescuento = descuento
            ? base * (1 - descuento.porcentaje / 100)
            : base;

          return (
            <div className="card-producto-destacado" key={producto.idFirebase}>
              {descuento && (
                <div className="descuento-badge">-{descuento.porcentaje}%</div>
              )}

              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="img-producto-destacado"
              />

              <div className="producto-info">
                <h3 className="producto-nombre">{producto.nombre}</h3>
                <div className="producto-rating">🔥 Más vendido</div>

                <div className="producto-precios">
                  {descuento && (
                    <span className="precio-original tachado">
                      ${base.toFixed(2)}
                    </span>
                  )}
                  <span className={`precio-final ${descuento ? "descuento" : ""}`}>
                    ${precioConDescuento.toFixed(2)}
                  </span>
                </div>

                <button
                  className="btn-ver-detalles"
                  onClick={() => verDetalles(producto)}
                >
                  Ver detalles
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProductosDestacados;
