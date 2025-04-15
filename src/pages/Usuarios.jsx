import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update } from "firebase/database";
import ModalAgregarUsuario from "../components/ModalAgregarUsuario";
// import "../styles/usuarios.css";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    const refUsuarios = ref(db, "usuarios");

    onValue(refUsuarios, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data).map(([idFirebase, user]) => ({
        idFirebase,
        ...user
      }));
      setUsuarios(lista);
    });
  }, []);

  const usuariosFiltrados = usuarios.filter((user) => {
    const coincideBusqueda =
      user.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      user.correo?.toLowerCase().includes(busqueda.toLowerCase());

    const coincideRol = filtroRol === "todos" || user.rol === filtroRol;

    return coincideBusqueda && coincideRol;
  });

  const inhabilitarUsuario = async (id) => {
    const db = getDatabase();
    const userRef = ref(db, `usuarios/${id}`);
    await update(userRef, { activo: false });
  };

  return (
    <div className="usuarios-admin">
      <h2>Gestión de Usuarios</h2>

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select onChange={(e) => setFiltroRol(e.target.value)} value={filtroRol}>
          <option value="todos">Todos los roles</option>
          <option value="cliente">Cliente</option>
          <option value="admin">Administrador</option>
        </select>

        <button onClick={() => setMostrarModalAgregar(true)}>➕ Agregar administrador</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Dirección</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((user, index) => (
            <tr key={user.idFirebase}>
              <td>{index + 1}</td>
              <td>
              <img
  src={user.imagen || "/img/user-default.png"}  // ✅ Aquí está la corrección
  alt="foto"
  width="50"
  style={{ borderRadius: "50%" }}
/>

              </td>
              <td>{user.nombre}</td>
              <td>{user.correo}</td>
              <td>
                {user.direccion && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      user.direccion
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button style={{ marginLeft: "0.5rem" }}>📍 Ver</button>
                  </a>
                )}
              </td>
              <td>{user.telefono}</td>
              <td>{user.rol}</td>
              <td>
                {user.activo ? (
                  <button onClick={() => inhabilitarUsuario(user.idFirebase)}>Inhabilitar</button>
                ) : (
                  <span style={{ color: "gray" }}>Inhabilitado</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {mostrarModalAgregar && (
        <ModalAgregarUsuario onClose={() => setMostrarModalAgregar(false)} />
      )}
    </div>
  );
};

export default Usuarios;
