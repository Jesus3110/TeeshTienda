import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update, remove } from "firebase/database";
import ModalFormularioProducto from "../components/ModalFormularioProducto";
import ModalEditarProducto from "../components/ModalEditarProducto";
import { generarReporteStockBajo } from "../utils/generarReporteStockBajo";
import "../styles/modal.css";
import "../styles/productos.css";
import "../styles/tables.css";
import { FaPlus, FaFileAlt } from "react-icons/fa";

const toggleActivo = async (id, estadoActual) => {
  const db = getDatabase();
  const refProducto = ref(db, `productos/${id}`);
  await update(refProducto, { activo: !estadoActual });
};

const eliminarProducto = async (id) => {
  const confirmar = window.confirm("¿Estás seguro de que quieres eliminar este producto?");
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
  const [productosVendidos, setProductosVendidos] = useState({});
  const [totalVendidos, setTotalVendidos] = useState(0);

  useEffect(() => {
    const db = getDatabase();

    const descuentosRef = ref(db, "descuentos");
    const unsubscribeDescuentos = onValue(descuentosRef, (snapshot) => {
      const data = snapshot.val() || {};
      const listaDescuentos = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
        nombre: value.nombre || "Sin nombre",
        validoHasta: typeof value.validoHasta === "number"
          ? new Date(value.validoHasta)
          : null,
      }));

      setDescuentos(listaDescuentos);

      const productosRef = ref(db, "productos");
      const unsubscribeProductos = onValue(productosRef, async (snapshot) => {
        const data = snapshot.val() || {};
        const lista = [];

        for (const [idFirebase, value] of Object.entries(data)) {
          const prod = { idFirebase, ...value };
          const idDescuento = prod.descuentoAplicado;

          const descuento = listaDescuentos.find(d => d.id === idDescuento);
          console.log("🟨 Producto leído:", prod.nombre);
          console.log("🟩 Descuento encontrado:", descuento);

          let vencido = false;

          if (
            descuento &&
            descuento.validoHasta instanceof Date &&
            !isNaN(descuento.validoHasta.getTime())
          ) {
            vencido = descuento.validoHasta.getTime() <= Date.now();
          }

          console.log("🕒 Fecha del descuento:", descuento?.validoHasta?.toISOString?.());
          console.log("🔴 ¿Está vencido?", vencido);

          if (descuento && vencido) {
            if (prod.precioOriginal && typeof prod.precioOriginal === "number") {
              const refProd = ref(db, `productos/${idFirebase}`);
              await update(refProd, {
                descuentoAplicado: null,
                precio: prod.precioOriginal,
                precioOriginal: null,
              });
              prod.descuentoAplicado = null;
              prod.precio = prod.precioOriginal;
              prod.precioOriginal = null;
              console.warn("‼️ Se eliminó descuento vencido de:", prod.nombre);
            } else {
              console.warn("🛑 PrecioOriginal inválido. No se borra descuento de:", prod.nombre);
            }
          }

          lista.push(prod);
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

      return () => unsubscribeProductos();
    });

    const refVendidos = ref(db, "dashboard/productosVendidos");
    const unsubscribeVendidos = onValue(refVendidos, (snapshot) => {
      const data = snapshot.val() || {};
      setProductosVendidos(data);
      setTotalVendidos(Object.values(data).reduce((a, b) => a + b, 0));
    });

    return () => {
      unsubscribeDescuentos();
      unsubscribeVendidos();
    };
  }, []);

  const obtenerDescuentoProducto = (producto) => {
    if (!producto.descuentoAplicado) return null;
    return descuentos.find((d) => d.id.trim() === producto.descuentoAplicado.trim());
  };

  const calcularPrecioConDescuento = (precio, descuento, precioOriginal = null) => {
    if (typeof precio !== "number" || isNaN(precio)) return precio;
    if (!descuento || typeof descuento.porcentaje !== "number") return precio;

    const base = precioOriginal && typeof precioOriginal === "number" ? precioOriginal : precio;
    const final = base * (1 - descuento.porcentaje / 100);
    return Math.round(final * 100) / 100;
  };

  const productosFiltrados = productos
    .filter((p) => p && p.nombre)
    .filter((p) => {
      const matchNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const matchCategoria = categoriaFiltro === "todos" || p.categoria === categoriaFiltro;
      const matchActivos = verActivos && p.activo;
      const matchInactivos = verDeshabilitados && !p.activo;
      return matchNombre && matchCategoria && (matchActivos || matchInactivos);
    });

  return (
      <div className="productos-admin">
      <h2>Gestión de Productos</h2>

      <div className="filtros-productos-flex">
        <input
          type="text"
          className="input-busqueda"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          className="select-categorias"
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          value={categoriaFiltro}
        >
          <option value="todos">Todas las categorías</option>
          {categoriasDisponibles.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label className="switch-label">
          <input
            type="checkbox"
            className="custom-checkbox custom-checkbox-lg"
            checked={verActivos}
            onChange={(e) => setVerActivos(e.target.checked)}
          />
          Ver activos
        </label>

        <label className="switch-label">
          <input
            type="checkbox"
            className="custom-checkbox custom-checkbox-lg"
            checked={verDeshabilitados}
            onChange={(e) => setVerDeshabilitados(e.target.checked)}
          />
          Ver deshabilitados
        </label>

        <button className="btn-red" onClick={() => setMostrarModal(true)}>
          <FaPlus /> Agregar producto
        </button>

        <button className="btn-red" onClick={generarReporteStockBajo}>
          <FaFileAlt /> Reporte de Stock Bajo
        </button>
      </div>

      <div className="table-container">
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
              <th>% Ventas</th>
              <th>Estado</th>
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
              const vendidos = productosVendidos[prod.nombre] || 0;
              const porcentajeVentas = totalVendidos > 0 ? ((vendidos / totalVendidos) * 100).toFixed(1) : "0.0";

              return (
                <tr key={prod.idFirebase}>
                  <td><img src={prod.imagen} alt={prod.nombre} /></td>
                  <td>{prod.nombre}</td>
                  <td>
                    {esDescuentoValido && prod.precioOriginal ? (
                      <>
                        <span className="price-original">
                        ${Number(prod.precioOriginal || prod.precio).toFixed(2)}
                        </span>
                        <span className="price-discount">
                          ${precioConDescuento.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      `$${(prod.precioOriginal ? prod.precioOriginal : prod.precio).toFixed(2)}`
                    )}
                  </td>
                  <td>
                    {esDescuentoValido ? (
                      <span className="discount-badge">{descuento.porcentaje}% OFF</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={`stock-badge ${prod.stock <= 5 ? 'stock-low' : 'stock-normal'}`}>
                      {prod.stock} unidades
                      {prod.activo && prod.stock <= 5 && " ⚠️"}
                    </span>
                  </td>
                  <td>{prod.marca}</td>
                  <td>{prod.categoria}</td>
                  <td>{porcentajeVentas}%</td>
                  <td>
                    <span className={`status-badge ${prod.activo ? 'status-active' : 'status-inactive'}`}>
                      {prod.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-table btn-edit"
                        onClick={() => {
                          setProductoEditar(prod);
                          setMostrarEditar(true);
                        }}
                      >
                        Modificar
                      </button>
                      <button
                        className={`btn-table ${prod.activo ? 'btn-delete' : 'btn-toggle'}`}
                        onClick={() => toggleActivo(prod.idFirebase, prod.activo)}
                      >
                        {prod.activo ? "Deshabilitar" : "Habilitar"}
                      </button>
                      <button
                        className="btn-table btn-delete"
                        onClick={() => eliminarProducto(prod.idFirebase)}
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
      </div>

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