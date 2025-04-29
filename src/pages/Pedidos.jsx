
import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { AuthContext } from '../context/AuthContext';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';
import "../styles/pedidos.css";

Modal.setAppElement('#root');

const Pedidos = () => {
  const { usuario, rol, loading } = useContext(AuthContext);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoActivo, setPedidoActivo] = useState(null);

  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const refPedidos = ref(db, 'pedidos');

    const unsubscribe = onValue(refPedidos, (snapshot) => {
      const data = snapshot.val() || {};
      const pedidosArray = Object.entries(data).map(([id, pedido]) => ({
        id,
        ...pedido,
      }));

      setPedidos(rol === 'cliente' 
        ? pedidosArray.filter((p) => p.usuario === usuario.uid) 
        : pedidosArray);
    });

    return () => unsubscribe();
  }, [usuario, rol]);

  const cambiarEstado = async (pedido) => {
    const db = getDatabase();
    const refPedido = ref(db, `pedidos/${pedido.id}`);
    const nuevoEstado = pedido.estado === "pendiente"
      ? "en proceso"
      : "entregado";

    await update(refPedido, { estado: nuevoEstado });

    if (nuevoEstado === "entregado") {
      const clienteUID = pedido.usuario;

      // Historial del cliente (con estado actualizado)
      const refHistorialCliente = ref(db, `historialPedidos/${clienteUID}/${pedido.id}`);
      await update(refHistorialCliente, {
        ...pedido,
        estado: "entregado"
      });

      // Historial del admin (estado + calificación explícitos)
      const refHistorialAdmin = ref(db, `historialPedidosAdmin/${clienteUID}/${pedido.id}`);
      await update(refHistorialAdmin, {
        productos: pedido.productos,
        metodoPago: pedido.metodoPago,
        total: pedido.total,
        usuario: pedido.usuario,
        nombreCliente: pedido.nombre || "Sin nombre",
        direccion: pedido.direccion || "",
        estado: "entregado",
        calificacion: pedido.calificacion || null // <--- ESTE calificacion es null en ese momento
      });
      

      await remove(refPedido);
    }

    setPedidoActivo(null);
  };

  const handleAbrirModal = (pedido) => {
    setPedidoActivo(pedido);
  };

  if (loading) return <div className="loading">Cargando...</div>;

  const esAdmin = rol === "admin";

  return (
    <div className="pedidos-container">
      <h2>{esAdmin ? "Pedidos de Clientes" : "Mis Pedidos"}</h2>
      
      <div className="table-responsive">
        <table className="pedidos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Estado</th>
              <th>Pago</th>
              {esAdmin && <th>Dirección</th>}
              {esAdmin && <th>Cliente</th>}
              <th>Total</th>
              <th>🔍</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td>{p.id.slice(0, 6)}...</td>
                <td>{p.estado}</td>
                <td>{p.metodoPago}</td>
                {esAdmin && <td>{p.direccion}</td>}
                {esAdmin && <td>{p.nombre}</td>}
                <td>${p.total}</td>
                <td>
                  <button 
                    className="ver-detalle-btn"
                    onClick={() => handleAbrirModal(p)}
                  >
                    👁️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            
            <div className="info-section">
              <p><strong>Estado:</strong> {pedidoActivo.estado}</p>
              <p><strong>Pago:</strong> {pedidoActivo.metodoPago}</p>
              {esAdmin && <p><strong>Cliente:</strong> {pedidoActivo.nombre}</p>}
              {esAdmin && <p><strong>Dirección:</strong> {pedidoActivo.direccion}</p>}
            </div>

            <div className="productos-section">
              <h4>Productos:</h4>
              <ul>
                {pedidoActivo.productos.map((prod, i) => (
                  <li key={i}>
                    {prod.nombre} × {prod.cantidad} — ${prod.precio * prod.cantidad}
                  </li>
                ))}
              </ul>
            </div>

            {pedidoActivo.calificacion && (
              <div className="calificacion-section">
                <p><strong>Calificación:</strong> {"★".repeat(pedidoActivo.calificacion.estrellas)}</p>
                <p><strong>Comentario:</strong> {pedidoActivo.calificacion.comentario || "Sin comentario."}</p>
              </div>
            )}

            <div className="modal-actions">
              {esAdmin && pedidoActivo.estado !== "entregado" && (
                <button
                  className="btn btn-success"
                  onClick={() => cambiarEstado(pedidoActivo)}
                >
                  {pedidoActivo.estado === "pendiente" 
                    ? "Marcar como En Proceso" 
                    : "Marcar como Entregado"}
                </button>
              )}

              <button
                className="btn btn-cerrar"
                onClick={() => setPedidoActivo(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Pedidos;
