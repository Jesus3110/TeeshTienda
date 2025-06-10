import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update } from "firebase/database";
import ModalAgregarUsuario from "../components/ModalAgregarUsuario";
import "../styles/usuarios.css";
import Modal from "react-modal";

Modal.setAppElement("#root"); // 👈 IMPORTANTE

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState("");
  const [verInactivos, setVerInactivos] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    const refUsuarios = ref(db, "usuarios");

    onValue(refUsuarios, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data).map(([idFirebase, user]) => ({
        idFirebase,
        ...user,
      }));
      setUsuarios(lista);
    });
  }, []);

  const usuariosFiltrados = usuarios.filter((user) => {
    const coincideBusqueda =
      user.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      user.correo?.toLowerCase().includes(busqueda.toLowerCase());

    const coincideRol =
      filtroRol === "todos"
        ? true
        : filtroRol === "inhabilitados"
        ? user.activo === false
        : user.rol === filtroRol && user.activo;

    return coincideBusqueda && coincideRol;
  });

  const cambiarEstadoUsuario = async (id, nuevoEstado) => {
    const db = getDatabase();
    const userRef = ref(db, `usuarios/${id}`);
    await update(userRef, { activo: nuevoEstado });
  };

  return (
    <div className="usuarios-admin">
      <h2>Gestión de Usuarios</h2>

      <div className="filtros-productos-flex filtros-usuarios-compact">
        <input
          type="text"
          className="input-busqueda"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="select-estado"
          onChange={(e) => setFiltroRol(e.target.value)}
          value={filtroRol}
        >
          <option value="todos">Todos los roles</option>
          <option value="cliente">Cliente</option>
          <option value="admin">Administrador</option>
          <option value="inhabilitados">Inhabilitados</option>
        </select>
        <button className="btn-red" onClick={() => setMostrarModalAgregar(true)}>
          ➕ Agregar administrador
        </button>
      </div>

      <div className="table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Privilegio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((user, index) => (
              <tr key={user.idFirebase}>
                <td>{index + 1}</td>
                <td>
                  <img
                    src={user.imagen || "/img/user-default.png"}
                    alt="foto"
                    width="50"
                    style={{ borderRadius: "50%" }}
                  />
                </td>
                <td>{user.nombre}</td>
                <td>{user.correo}</td>
                <td>
                  {user.direccion && (
                    <button
                      style={{ marginLeft: "0.5rem" }}
                      onClick={() => {
                        setDireccionSeleccionada(user.direccion);
                        setModalAbierto(true);
                      }}
                    >
                      📍 Ver
                    </button>
                  )}
                </td>
                <td>{user.telefono}</td>
                <td>{user.rol}</td>
                <td>{user.privilegios}</td>
                <td>
                  {user.activo ? (
                    <button
                      onClick={() => cambiarEstadoUsuario(user.idFirebase, false)}
                    >
                      Inhabilitar
                    </button>
                  ) : (
                    <button
                      onClick={() => cambiarEstadoUsuario(user.idFirebase, true)}
                    >
                      Habilitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModalAgregar && (
        <ModalAgregarUsuario onClose={() => setMostrarModalAgregar(false)} />
      )}

      <Modal
        isOpen={modalAbierto}
        onRequestClose={() => setModalAbierto(false)}
        className="modal-maps"
        overlayClassName="overlay-maps"
      >
        <h2>Ubicación del usuario</h2>
        <iframe
          src={`https://www.google.com/maps?q=${encodeURIComponent(
            `${direccionSeleccionada.calle} ${direccionSeleccionada.numero}, ${direccionSeleccionada.colonia}, ${direccionSeleccionada.cp}, ${direccionSeleccionada.ciudad}, ${direccionSeleccionada.estado}`
          )}&output=embed`}
          width="100%"
          height="400"
          style={{ borderRadius: "12px", border: "none" }}
          loading="lazy"
          allowFullScreen
        ></iframe>

        <button
          onClick={() => setModalAbierto(false)}
          className="btn-cerrar-maps"
        >
          Cerrar
        </button>
      </Modal>
    </div>
  );
};

export default Usuarios;
