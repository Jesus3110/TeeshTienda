import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update, remove } from "firebase/database";
import ModalFormularioProducto from "../components/ModalFormularioProducto";
import ModalEditarProducto from "../components/ModalEditarProducto";
import { generarReporteStockBajo } from "../utils/generarReporteStockBajo";
import "../styles/modal.css";
import "../styles/categorias.css";

const toggleActivo = async (id, estadoActual) => {
  const db = getDatabase();
  const refProducto = ref(db, `productos/${id}`);
  await update(refProducto, { activo: !estadoActual });
};

const eliminarProducto = async (id) => {
  const confirmar = window.confirm(
    "¿Estás seguro de que quieres eliminar este producto?"
  );
  if (!confirmar) return;

  const db = getDatabase();
  const refProducto = ref(db, `productos/${id}`);
  await remove(refProducto);
};

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  const [verActivos, setVerActivos] = useState(true);
  const [verDeshabilitados, setVerDeshabilitados] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const db = getDatabase();

    const descuentosRef = ref(db, "descuentos");
    const unsubscribeDescuentos = onValue(descuentosRef, (snapshot) => {
      const data = snapshot.val() || {};
      const listaDescuentos = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
        validoHasta: value.validoHasta ? new Date(value.validoHasta) : null,
      }));
      setDescuentos(listaDescuentos);

      const productosRef = ref(db, "productos");
      const unsubscribeProductos = onValue(productosRef, async (snapshot) => {
        const data = snapshot.val() || {};
        const lista = [];

        for (const [idFirebase, value] of Object.entries(data)) {
          const producto = { idFirebase, ...value };
          const descuentoId = producto.descuentoAplicado;

          if (descuentoId) {
            const descuento = listaDescuentos.find((d) => d.id === descuentoId);
            if (!descuento || !descuento.validoHasta || !(descuento.validoHasta instanceof Date) || descuento.validoHasta.getTime() <= Date.now()) {
              const refProducto = ref(db, `productos/${idFirebase}`);
              await update(refProducto, {
                descuentoAplicado: null,
                precio: producto.precioOriginal || producto.precio,
                precioOriginal: null,
              });
              producto.descuentoAplicado = null;
              producto.precio = producto.precioOriginal || producto.precio;
              producto.precioOriginal = null;
            }
          }

          lista.push(producto);
        }

        setProductos(lista);
        setCargando(false);
      });

      const categoriasRef = ref(db, "categorias");
      onValue(categoriasRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const lista = Object.values(data)
            .filter((cat) => cat.activa)
            .map((cat) => cat.nombre);
          setCategoriasDisponibles(lista);
        } else {
          setCategoriasDisponibles([]);
        }
      });

      return () => {
        unsubscribeProductos();
      };
    });

    return () => {
      unsubscribeDescuentos();
    };
  }, []);

  const obtenerDescuentoProducto = (producto) => {
    if (!producto.descuentoAplicado) return null;
    return descuentos.find(
      (d) => d.id.trim() === producto.descuentoAplicado.trim()
    );
  };

  const calcularPrecioConDescuento = (precio, descuento, precioOriginal = null) => {
    if (typeof precio !== "number" || isNaN(precio)) return precio;
    if (!descuento || typeof descuento.porcentaje !== "number") return precio;

    const baseParaDescuento =
      precioOriginal && typeof precioOriginal === "number"
        ? precioOriginal
        : precio;

    const descuentoAplicado = baseParaDescuento * (descuento.porcentaje / 100);
    const precioFinal = precio - descuentoAplicado;

    return Math.round(precioFinal * 100) / 100;
  };

  const productosFiltrados = productos
    .filter((prod) => prod && prod.nombre)
    .filter((prod) => {
      const coincideBusqueda = (prod.nombre || "")
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      const coincideCategoria =
        categoriaFiltro === "todos" || prod.categoria === categoriaFiltro;
      const mostrarActivo = verActivos && prod.activo;
      const mostrarDeshabilitado = verDeshabilitados && !prod.activo;

      return coincideBusqueda && coincideCategoria && (mostrarActivo || mostrarDeshabilitado);
    });

  if (cargando) {
    return <div className="cargando">Cargando productos...</div>;
  }

  return (
    <div className="productos-admin">
      <h2>Gestión de Productos</h2>

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select onChange={(e) => setCategoriaFiltro(e.target.value)} value={categoriaFiltro}>
          <option value="todos">Todas las categorías</option>
          {categoriasDisponibles.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label>
          <input type="checkbox" checked={verActivos} onChange={(e) => setVerActivos(e.target.checked)} />
          Ver activos
        </label>

        <label>
          <input type="checkbox" checked={verDeshabilitados} onChange={(e) => setVerDeshabilitados(e.target.checked)} />
          Ver deshabilitados
        </label>

        <button style={{ marginTop: "1rem" }} onClick={() => setMostrarModal(true)}>➕ Agregar producto</button>
        <button onClick={generarReporteStockBajo}>📄 Reporte de Stock Bajo</button>
      </div>
      

      <table>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Descuento</th>
            <th>Stock</th>
            <th>Marca</th>
            <th>Categoría</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((prod) => {
            const descuento = obtenerDescuentoProducto(prod);
            const esDescuentoValido = descuento && descuento.validoHasta instanceof Date && descuento.validoHasta.getTime() > Date.now();
            const precioConDescuento = descuento && prod.precioOriginal
  ? prod.precioOriginal * (1 - descuento.porcentaje / 100)
  : prod.precio;


            return (
              <tr key={prod.idFirebase}>
                <td><img src={prod.imagen} alt={prod.nombre} width="50" /></td>
                <td>{prod.nombre}</td>
                <td>
                  {esDescuentoValido && prod.precioOriginal ? (
                    <>
                      <span style={{ textDecoration: "line-through", color: "#999" }}>
                        ${prod.precioOriginal.toFixed(2)}
                      </span>
                      <span style={{ color: "#d62828", marginLeft: "0.5rem" }}>
                        ${precioConDescuento.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    `$${prod.precio.toFixed(2)}`
                  )}
                </td>
                <td>
                  {esDescuentoValido ? (
                    <span className="descuento-tag">
                      {descuento.porcentaje}%
                    </span>
                  ) : (
                    "Ninguno"
                  )}
                </td>
                <td>
                  {prod.stock}
                  {prod.activo && prod.stock <= 5 && (
                    <span style={{ color: "red", marginLeft: "0.5rem" }}>⚠️ Bajo stock</span>
                  )}
                </td>
                <td>{prod.marca}</td>
                <td>{prod.categoria}</td>
                <td>{prod.activo ? "Sí" : "No"}</td>
                <td>
                  <button onClick={() => { setProductoEditar(prod); setMostrarEditar(true); }}>Modificar</button>
                  <button onClick={() => toggleActivo(prod.idFirebase, prod.activo)}>
                    {prod.activo ? "Deshabilitar" : "Habilitar"}
                  </button>
                  <button onClick={() => eliminarProducto(prod.idFirebase)}>Eliminar</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {mostrarModal && (
        <ModalFormularioProducto onClose={() => setMostrarModal(false)} />
      )}

      {mostrarEditar && productoEditar && (
        <ModalEditarProducto
          producto={productoEditar}
          descuentos={descuentos}
          onClose={() => {
            setMostrarEditar(false);
            setProductoEditar(null);
          }}
        />
      )}
    </div>
  );
};

export default Productos;
