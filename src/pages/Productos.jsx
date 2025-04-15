import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import ModalFormularioProducto from "../components/ModalFormularioProducto"; // ruta según tu proyecto
import ModalEditarProducto from "../components/ModalEditarProducto";
import { update, remove } from "firebase/database"; // si aún no lo importas
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
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  const [verActivos, setVerActivos] = useState(true);
  const [verDeshabilitados, setVerDeshabilitados] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
const [productoEditar, setProductoEditar] = useState(null);
const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);




useEffect(() => {
  const db = getDatabase();

  // Cargar productos (ya lo tienes)
  const productosRef = ref(db, "productos");
  onValue(productosRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const lista = Object.entries(data).map(([idFirebase, value]) => ({
        idFirebase,
        ...value
      }));
      setProductos(lista);
    } else {
      setProductos([]);
    }
  });

  // Cargar categorías desde Firebase
  const categoriasRef = ref(db, "categorias");
  onValue(categoriasRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const lista = Object.values(data)
        .filter((cat) => cat.activa) // solo activas si quieres
        .map((cat) => cat.nombre);
      setCategoriasDisponibles(lista);
    } else {
      setCategoriasDisponibles([]);
    }
  });
}, []);

  

  const productosFiltrados = productos
  .filter((prod) => prod && prod.nombre) // solo productos válidos
  .filter((prod) => {
    const coincideBusqueda = (prod.nombre || "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === "todos" || prod.categoria === categoriaFiltro;
    const mostrarActivo = verActivos && prod.activo;
    const mostrarDeshabilitado = verDeshabilitados && !prod.activo;

    return coincideBusqueda && coincideCategoria && (mostrarActivo || mostrarDeshabilitado);
  });

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
            <th>Stock</th>
            <th>Categoría</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((prod) => (
            <tr key={prod.idFirebase || prod.id}>

              <td><img src={prod.imagen} alt={prod.nombre} width="50" /></td>
              <td>{prod.nombre}</td>
              <td>${prod.precio}</td>
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
}}>Modificar</button>
<button onClick={() => toggleActivo(prod.idFirebase, prod.activo)}>
  {prod.activo ? "Deshabilitar" : "Habilitar"}
</button>
<button onClick={() => eliminarProducto(prod.idFirebase)}>Eliminar</button>


</td>

            </tr>
          ))}
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
