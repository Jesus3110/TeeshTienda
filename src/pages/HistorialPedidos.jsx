import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, onValue, update } from "firebase/database";
import Modal from "react-modal";
import "../styles/historial_pedidos.css";

Modal.setAppElement("#root");

const HistorialPedidos = () => {
  const { usuario, rol } = useContext(AuthContext);
  const [historialAgrupado, setHistorialAgrupado] = useState({});
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [pedidoCalificar, setPedidoCalificar] = useState(null);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({});

  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const path =
      rol === "admin"
        ? "historialPedidosAdmin"
        : `historialPedidos/${usuario.uid}`;
    const refHistorial = ref(db, path);

    const unsubscribe = onValue(refHistorial, (snapshot) => {
      const data = snapshot.val() || {};

      if (rol === "admin") {
        setHistorialAgrupado(data);
      } else {
        setHistorialAgrupado({ [usuario.uid]: data });
      }
    });

    return () => unsubscribe();
  }, [usuario, rol]);

  const toggleSeccion = (uid) => {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [uid]: !prev[uid],
    }));
  };

  const renderEstrellas = (valor, setValor) => {
    const estrellas = [];

    for (let i = 1; i <= 5; i++) {
      estrellas.push(
        <span
          key={i}
          style={{
            cursor: "pointer",
            fontSize: "2rem",
            color: i <= valor ? "gold" : "lightgray",
          }}
          onClick={() => setValor(i)}
        >
          ★
        </span>
      );
    }

    return estrellas;
  };

  const guardarCalificacion = async () => {
    const db = getDatabase();

    let estrellasValidas = Math.min(Math.max(Number(calificacion), 1), 5); // siempre entre 1 y 5

    const calificacionObj = {
      estrellas: estrellasValidas,
      comentario,
      fecha: new Date().toISOString(),
    };

    const clienteUID = usuario.uid;
    const pedidoID = pedidoCalificar.id;

    await update(ref(db, `historialPedidos/${clienteUID}/${pedidoID}`), {
      calificacion: calificacionObj,
    });

    await update(ref(db, `historialPedidosAdmin/${clienteUID}/${pedidoID}`), {
      calificacion: calificacionObj,
    });

    setPedidoCalificar(null);
    setCalificacion(5);
    setComentario("");
  };

  return (
    <div className="historial-container">
      <h2>
        {rol === "admin"
          ? "Historial de Todos los Usuarios"
          : "Mi Historial de Pedidos"}
      </h2>

      {Object.entries(historialAgrupado).map(([uid, pedidos]) => (
        <div key={uid} className="usuario-section">
          {rol === "admin" && (
            <button
              onClick={() => toggleSeccion(uid)}
              className="usuario-toggle"
            >
              📂 {Object.values(pedidos)[0]?.nombreCliente || "Sin nombre"} (
              {Object.keys(pedidos).length} pedidos)
            </button>
          )}

          {(rol !== "admin" || seccionesAbiertas[uid]) && (
            <div className="table-responsive">
              <table className="pedidos-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th>Total</th>
                    <th>Detalles</th>
                    {rol !== "admin" && <th>Calificación</th>}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(pedidos).map(([id, p]) => (
                    <tr key={id}>
                      <td>{id.slice(0, 6)}...</td>
                      <td>{p.estado}</td>
                      <td>{p.metodoPago}</td>
                      <td>${p.total}</td>
                      <td>
                        <button onClick={() => setPedidoActivo({ ...p, id })}>
                          👁
                        </button>
                      </td>
                      {rol !== "admin" && (
                        <td>
                          {p.calificacion ? (
                            <span className="estrellas">
                              {"★".repeat(p.calificacion.estrellas)}
                            </span>
                          ) : (
                            <button
                              onClick={() => setPedidoCalificar({ ...p, id })}
                            >
                              Calificar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {pedidoCalificar && (
        <Modal
          isOpen={true}
          onRequestClose={() => setPedidoCalificar(null)}
          contentLabel="Calificar Pedido"
          className="pedido-modal"
          overlayClassName="modal-overlay"
        >
          <div className="modal-content">
            <h3>Calificar Pedido #{pedidoCalificar.id.slice(0, 6)}</h3>
            <label>Calificación:</label>
            <div className="estrellas-container">
              {renderEstrellas(calificacion, setCalificacion)}
            </div>

            <label>Comentario:</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
            <button className="btn btn-success" onClick={guardarCalificacion}>
              Enviar Calificación
            </button>
            <button
              className="btn btn-cerrar"
              onClick={() => setPedidoCalificar(null)}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {pedidoActivo && (
        <Modal
          isOpen={true}
          onRequestClose={() => setPedidoActivo(null)}
          contentLabel="Detalles del Pedido"
          className="pedido-modal"
          overlayClassName="modal-overlay"
        >
          <div className="modal-content">
            <h3>Pedido #{pedidoActivo.id.slice(0, 6)}</h3>
            <p>
              <strong>Estado:</strong> {pedidoActivo.estado}
            </p>
            <p>
              <strong>Pago:</strong> {pedidoActivo.metodoPago}
            </p>
            <p>
              <strong>Total:</strong> ${pedidoActivo.total}
            </p>

            <h4>Productos:</h4>
            <ul>
              {pedidoActivo.productos.map((prod, i) => (
                <li key={i}>
                  {prod.nombre} × {prod.cantidad} — $
                  {prod.precio * prod.cantidad}
                </li>
              ))}
            </ul>

            {/* Sección de calificación mejorada */}
            {pedidoActivo.calificacion ? (
              <>
                <h4>Calificación del Cliente:</h4>
                <p>
                  <strong>Estrellas:</strong>{" "}
                  {"★".repeat(pedidoActivo.calificacion.estrellas)}
                </p>
                <p>
                  <strong>Comentario:</strong>{" "}
                  {pedidoActivo.calificacion.comentario?.trim() ? (
                    pedidoActivo.calificacion.comentario
                  ) : (
                    <em>Sin comentario.</em>
                  )}
                </p>
                <p>
                  <small>
                    Fecha:{" "}
                    {new Date(pedidoActivo.calificacion.fecha).toLocaleString()}
                  </small>
                </p>
              </>
            ) : rol === "admin" ? (
              <p>
                <em>El cliente aún no ha calificado este pedido.</em>
              </p>
            ) : null}

            <button onClick={() => setPedidoActivo(null)}>Cerrar</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HistorialPedidos;
