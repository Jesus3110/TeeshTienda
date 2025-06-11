import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, remove, update, set } from "firebase/database";
import ModalAgregarCategoria from "../components/ModalAgregarCategoria";
import ModalEditarCategoria from "../components/ModalEditarCategoria";
import ModalAlerta from "../components/ModalAlerta";
import "../styles/modal.css";
import "../styles/categorias.css";


const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarActivas, setMostrarActivas] = useState(true);
  const [mostrarInactivas, setMostrarInactivas] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
const [categoriaEditar, setCategoriaEditar] = useState(null);
const [resumenCategorias, setResumenCategorias] = useState({ conteo: {}, totalVentas: 0 });
const [ventasPorCategoria, setVentasPorCategoria] = useState({});
const [totalVentasCategorias, setTotalVentasCategorias] = useState(0);
const [alerta, setAlerta] = useState({ visible: false, mensaje: "", tipo: "error" });




useEffect(() => {
    const db = getDatabase();
  
    // Escuchar categorías
    const refCat = ref(db, "categorias");
    onValue(refCat, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data).map(([idFirebase, value]) => ({
        idFirebase,
        ...value
      }));
      setCategorias(lista);
    });
  
    // Escuchar productos
    const refProd = ref(db, "productos");
    onValue(refProd, (snapshot) => {
      const data = snapshot.val() || {};
      const conteo = {};
      let totalVentas = 0;
  
      Object.values(data).forEach((prod) => {
        if (!prod.categoria) return;
        if (!conteo[prod.categoria]) conteo[prod.categoria] = { count: 0, ventas: 0 };
        conteo[prod.categoria].count++;
        conteo[prod.categoria].ventas += prod.ventas || 0;
        totalVentas += prod.ventas || 0;
      });
  
      setResumenCategorias({ conteo, totalVentas });
    });
  
    // Escuchar ventas por categoría desde dashboard
    const refVentas = ref(db, "dashboard/categoriasVendidas");
    onValue(refVentas, (snapshot) => {
      const data = snapshot.val() || {};
      setVentasPorCategoria(data);
      const total = Object.values(data).reduce((acc, val) => acc + val, 0);
      setTotalVentasCategorias(total);
    });
  }, []);
  

  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    const db = getDatabase();
    const nuevaRef = ref(db, `categorias/${nuevaCategoria.toLowerCase()}`);
    await set(nuevaRef, {
      nombre: nuevaCategoria,
      activa: true,
      totalProductos: 0,
      porcentajeVentas: 0
    });
    setNuevaCategoria("");
  };

  const toggleActiva = async (id, estadoActual) => {
    const db = getDatabase();
    const refCat = ref(db, `categorias/${id}`);
    await update(refCat, { activa: !estadoActual });
  };

  const eliminarCategoria = async (id) => {
    const db = getDatabase();
    const categoria = categorias.find((c) => c.idFirebase === id);
    if (!categoria) return;
  
    const cantidadProductos = resumenCategorias.conteo[categoria.nombre]?.count || 0;
  
    if (cantidadProductos > 0) {
      setAlerta({ visible: true, mensaje: `No puedes eliminar la categoría "${categoria.nombre}" porque tiene ${cantidadProductos} producto(s) asignado(s).`, tipo: "error" });
      return;
    }
  
    const confirmar = window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`);
    if (!confirmar) return;
  
    const refCat = ref(db, `categorias/${id}`);
    await remove(refCat);
  };
  

  const categoriasFiltradas = categorias.filter((cat) => {
    const coincide = cat.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const activa = mostrarActivas && cat.activa;
    const inactiva = mostrarInactivas && !cat.activa;
    return coincide && (activa || inactiva);
  });

  return (
    <div className="categorias-admin">
      <h2>Gestión de Categorías</h2>

      <div className="filtros-categorias-flex">
        <input
          type="text"
          className="input-busqueda"
          placeholder="Buscar categoría..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <label className="switch-label">
          <input
            type="checkbox"
            className="custom-checkbox custom-checkbox-lg"
            checked={mostrarActivas}
            onChange={(e) => setMostrarActivas(e.target.checked)}
          />
          Ver activas
        </label>
        <label className="switch-label">
          <input
            type="checkbox"
            className="custom-checkbox custom-checkbox-lg"
            checked={mostrarInactivas}
            onChange={(e) => setMostrarInactivas(e.target.checked)}
          />
          Ver inactivas
        </label>
        <button className="btn-red" onClick={() => setMostrarModalAgregar(true)}> Agregar</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Categoría</th>
              <th>Productos</th>
              <th>% Ventas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categoriasFiltradas.map((cat) => {
              const resumen = resumenCategorias.conteo[cat.nombre] || { count: 0, ventas: 0 };
              const ventasCat = ventasPorCategoria[cat.nombre] || 0;
              const porcentajeReal = totalVentasCategorias > 0
                ? ((ventasCat / totalVentasCategorias) * 100).toFixed(1)
                : 0;
              return (
                <tr key={cat.idFirebase}>
                  <td>{cat.idFirebase}</td>
                  <td>{cat.nombre}</td>
                  <td>{resumen.count}</td>
                  <td>{porcentajeReal}%</td>
                  <td>
                    <button onClick={() => toggleActiva(cat.idFirebase, cat.activa)} className="btn-table btn-toggle">
                      {cat.activa ? "Deshabilitar" : "Habilitar"}
                    </button>
                    <button onClick={() => eliminarCategoria(cat.idFirebase)} className="btn-table btn-delete">Eliminar</button>
                    <button onClick={() => {
                      setCategoriaEditar(cat);
                      setMostrarModalEditar(true);
                    }} className="btn-table btn-edit">Modificar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mostrarModalEditar && categoriaEditar && (
  <ModalEditarCategoria
    categoria={categoriaEditar}
    onClose={() => {
      setCategoriaEditar(null);
      setMostrarModalEditar(false);
    }}
  />
)}

      {mostrarModalAgregar && (
        <ModalAgregarCategoria onClose={() => setMostrarModalAgregar(false)} />
      )}

      {alerta.visible && (
        <ModalAlerta
          mensaje={alerta.mensaje}
          tipo={alerta.tipo}
          onClose={() => setAlerta({ ...alerta, visible: false })}
        />
      )}

    </div>
  );
};

export default Categorias;
