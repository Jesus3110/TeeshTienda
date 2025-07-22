import React from "react";
import "../styles/home.css";

function ProductosDestacados({
  productos,
  descuentos,
  verDetalles,
  obtenerDescuentoProducto,
  productosVendidos = {}, // ← Recibes este prop desde Firebase
}) {
  // Normaliza nombres para evitar errores por espacios o mayúsculas
  const normalizar = (str) => str?.trim().toLowerCase() || "";

  // Filtra solo productos que están en el ranking de vendidos
  const productosFiltrados = productos.filter(
    (producto) =>
      producto?.nombre &&
      Object.keys(productosVendidos).some(
        (nombre) => nombre && normalizar(nombre) === normalizar(producto.nombre)
      )
  );

  // Ordena por cantidad vendida
  const productosOrdenados = productosFiltrados.sort((a, b) => {
    if (!a?.nombre || !b?.nombre) return 0;

    const ventasA =
      productosVendidos[
        Object.keys(productosVendidos).find(
          (nombre) => nombre && normalizar(nombre) === normalizar(a.nombre)
        )
      ] || 0;

    const ventasB =
      productosVendidos[
        Object.keys(productosVendidos).find(
          (nombre) => nombre && normalizar(nombre) === normalizar(b.nombre)
        )
      ] || 0;

    return ventasB - ventasA;
  });

  const calcularPrecioConComision = (precioNeto) => {
  const porcentajeStripe = 0.036;
  const fijoStripe = 3.0;
  const iva = 0.16;

  const base = (precioNeto + fijoStripe) / (1 - porcentajeStripe);
  const ivaTotal = (base - precioNeto) * iva;

  return parseFloat((base + ivaTotal).toFixed(2));
};

let productosAMostrar = [];

if (productosOrdenados.length > 0) {
  const nombresVendidos = new Set(
    productosOrdenados.map((p) => normalizar(p.nombre))
  );

  const productosAleatorios = productos
    .filter((p) => !nombresVendidos.has(normalizar(p.nombre)))
    .sort(() => 0.5 - Math.random())
    .slice(0, 6); // o los que quieras añadir

  productosAMostrar = [...productosOrdenados, ...productosAleatorios];
} else {
  productosAMostrar = [...productos].sort(() => 0.5 - Math.random()).slice(0, 6);
}



const titulo = productosOrdenados.length > 0
  ? "Productos Más Vendidos"
  : "Recomendaciones para Ti";


  return (
    <div className="seccion-productos">
      <h2 className="titulo-seccion">{titulo}</h2>


      <div className="grid-productos-destacados">
       {productosAMostrar.map((producto) => {
          const descuento = obtenerDescuentoProducto(producto);
          const precioOriginal = producto.precioOriginal;
          const precioFinal = parseFloat(producto.precio); // ya con descuento y comisión

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
                {productosOrdenados.some(p => p.idFirebase === producto.idFirebase) ? (
  <div className="producto-rating">🔥 Más vendido</div>
) : (
  <div className="producto-rating">⭐ Recomendado</div>
)}


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
