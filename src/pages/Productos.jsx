import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update, remove } from "firebase/database";
import ModalFormularioProducto from "../components/ModalFormularioProducto";
import ModalEditarProducto from "../components/ModalEditarProducto";
import "../styles/modal.css";
import "../styles/categorias.css";

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

  useEffect(() => {
    const db = getDatabase();

    // Cargar productos
    const productosRef = ref(db, "productos");
    const unsubscribeProductos = onValue(productosRef, (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.entries(data).map(([idFirebase, value]) => ({
        idFirebase,
        ...value,
        descuentoId: value.descuentoId || null // Asegurar que siempre tenga valor
      })) : [];
      setProductos(lista);
      setCargando(false);
    });

    // Cargar descuentos
    const descuentosRef = ref(db, "descuentos");
    const unsubscribeDescuentos = onValue(descuentosRef, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
        validoHasta: value.validoHasta ? new Date(value.validoHasta) : null
      }));
      setDescuentos(lista);
    });

    // Cargar categorías
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
      unsubscribeDescuentos();
    };
  }, []);

  // Obtener el descuento aplicado a un producto (versión mejorada)
  const obtenerDescuentoProducto = (producto) => {
    if (!producto.descuentoAplicado) return null;
    return descuentos.find(d => d.id.trim() === producto.descuentoAplicado.trim());
  };

// Calcular precio con descuento (versión mejorada)
const calcularPrecioConDescuento = (precio, descuento, precioOriginal = null) => {
  // Validaciones básicas
  if (typeof precio !== 'number' || isNaN(precio)) return precio;
  if (!descuento || typeof descuento.porcentaje !== 'number') return precio;
  
  // Si tenemos precioOriginal, usamos ese como base para el descuento
  const baseParaDescuento = precioOriginal && typeof precioOriginal === 'number' 
    ? precioOriginal 
    : precio;
  
  // Calcular descuento solo sobre la base original
  const descuentoAplicado = baseParaDescuento * (descuento.porcentaje / 100);
  
  // Precio final (asegurando no aplicar descuento dos veces)
  const precioFinal = precio - descuentoAplicado;
  
  // Redondear a 2 decimales
  return Math.round(precioFinal * 100) / 100;
};

  const productosFiltrados = productos
    .filter((prod) => prod && prod.nombre)
    .filter((prod) => {
      const coincideBusqueda = (prod.nombre || "").toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoriaFiltro === "todos" || prod.categoria === categoriaFiltro;
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
          <input
            type="checkbox"
            checked={verActivos}
            onChange={(e) => setVerActivos(e.target.checked)}
          />
          Ver activos
        </label>

        <label>
          <input
            type="checkbox"
            checked={verDeshabilitados}
            onChange={(e) => setVerDeshabilitados(e.target.checked)}
          />
          Ver deshabilitados
        </label>
        <button style={{ marginTop: "1rem" }} onClick={() => setMostrarModal(true)}>
          ➕ Agregar producto
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Descuento</th>
            <th>Stock</th>
            <th>Categoría</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
        {productosFiltrados.map((prod) => {
  const descuento = obtenerDescuentoProducto(prod);
  const precioConDescuento = calcularPrecioConDescuento(
    prod.precio, 
    descuento, 
    prod.precioOriginal // Pasamos el precio original si existe
  );
  
  return (
    <tr key={prod.idFirebase}>
      <td><img src={prod.imagen} alt={prod.nombre} width="50" /></td>
      <td>{prod.nombre}</td>
      <td>
        {descuento && prod.precioOriginal ? (
          <>
            <span style={{ textDecoration: 'line-through', color: '#999' }}>
              ${prod.precioOriginal.toFixed(2)}
            </span>
            <span style={{ color: '#d62828', marginLeft: '0.5rem' }}>
              ${precioConDescuento.toFixed(2)}
            </span>
          </>
        ) : (
          `$${prod.precio.toFixed(2)}`
        )}
      </td>
                <td>
                  {descuento ? (
                    <span className="descuento-tag">
                      {descuento.porcentaje}% (ID: {descuento.id.substring(0, 6)}...)
                    </span>
                  ) : (
                    'Ninguno'
                  )}
                </td>
                <td>
                  {prod.stock}
                  {prod.activo && prod.stock <= 5 && (
                    <span style={{ color: "red", marginLeft: "0.5rem" }}>⚠️ Bajo stock</span>
                  )}
                </td>
                <td>{prod.categoria}</td>
                <td>{prod.activo ? "Sí" : "No"}</td>
                <td>
                  <button onClick={() => {
                    setProductoEditar(prod);
                    setMostrarEditar(true);
                  }}>
                    Modificar
                  </button>
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