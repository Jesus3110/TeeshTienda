import React, { useContext, useEffect, useState } from "react";
import Modal from "react-modal";
import { AuthContext } from "../context/AuthContext";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  get,
  runTransaction,
} from "firebase/database";
import ClienteLayout from "../components/ClienteLayout";
import "../styles/pedidos.css";
import "../styles/tables.css";
import ModalAlerta from "../components/ModalAlerta";

Modal.setAppElement("#root");

const Pedidos = () => {
  const { usuario, rol, loading } = useContext(AuthContext);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState("");
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [alerta, setAlerta] = useState({
    visible: false,
    mensaje: "",
    tipo: "error",
  });

  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const refPedidos = ref(db, "pedidos");

    const unsubscribe = onValue(refPedidos, (snapshot) => {
      const data = snapshot.val() || {};
      const pedidosArray = Object.entries(data).map(([id, pedido]) => ({
        id,
        ...pedido,
      }));

      setPedidos(
        rol === "cliente"
          ? pedidosArray.filter((p) => p.usuario === usuario.uid)
          : pedidosArray
      );
    });

    return () => unsubscribe();
  }, [usuario, rol]);

  useEffect(() => {
    if (!pedidoActivo || !pedidoActivo.fechaEntrega) return;

    const actualizarTiempo = () => {
      const entrega = new Date(pedidoActivo.fechaEntrega + "T23:59:59"); // hasta fin del día
      const ahora = new Date();
      const diffMs = entrega - ahora;

      if (diffMs <= 0) {
        setTiempoRestante("Entregado o vencido");
        return;
      }

      const diffSegs = Math.floor(diffMs / 1000);
      const dias = Math.floor(diffSegs / 86400);
      const horas = Math.floor((diffSegs % 86400) / 3600);
      const minutos = Math.floor((diffSegs % 3600) / 60);
      const segundos = diffSegs % 60;

      setTiempoRestante(`${dias}d ${horas}h ${minutos}m ${segundos}s`);
    };

    const timer = setInterval(actualizarTiempo, 1000);
    actualizarTiempo();

    return () => clearInterval(timer);
  }, [pedidoActivo]);

  const cambiarEstado = async (pedido) => {
    const db = getDatabase();
    const refPedido = ref(db, `pedidos/${pedido.id}`);
    const nuevoEstado =
      pedido.estado === "pendiente" ? "en proceso" : "entregado";

    await update(refPedido, { estado: nuevoEstado });

    if (nuevoEstado === "entregado") {
      const clienteUID = pedido.usuario;

      // Historial del cliente (con estado actualizado)
      const refHistorialCliente = ref(
        db,
        `historialPedidos/${clienteUID}/${pedido.id}`
      );
      await update(refHistorialCliente, {
        ...pedido,
        estado: "entregado",
      });

      // Historial del admin (estado + calificación explícitos)
      const refHistorialAdmin = ref(
        db,
        `historialPedidosAdmin/${clienteUID}/${pedido.id}`
      );
      await update(refHistorialAdmin, {
        productos: pedido.productos,
        metodoPago: pedido.metodoPago,
        total: pedido.total,
        usuario: pedido.usuario,
        nombreCliente: pedido.nombre || "Sin nombre",
        direccion: pedido.direccion || "",
        estado: "entregado",
        calificacion: pedido.calificacion || null, // <--- ESTE calificacion es null en ese momento
        creadoEn: pedido.creadoEn,
      });

      await remove(refPedido);
    }

    setPedidoActivo(null);
  };

  const handleAbrirModal = (pedido) => {
    setPedidoActivo(pedido);
  };

  const formatearFechaLarga = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const opciones = { day: "numeric", month: "long", year: "numeric" };
    return fecha.toLocaleDateString("es-MX", opciones);
  };

  const restaurarStock = async (productos) => {
    console.log("Iniciando restauración de stock:", productos);
    if (!productos || productos.length === 0) {
      console.log("No hay productos para restaurar");
      return;
    }

    const db = getDatabase();
    const productosRef = ref(db, "productos");

    try {
      console.log("Obteniendo datos actuales de productos...");
      const snapshot = await get(productosRef);
      const productosData = snapshot.val() || {};
      console.log("Datos actuales de productos:", productosData);

      const updates = {};

      productos.forEach((item) => {
        console.log("Procesando item:", item);
        if (!item.id || !item.cantidad) {
          console.log("Item inválido - sin ID o cantidad:", item);
          return;
        }

        const productoActual = productosData[item.id];
        console.log("Producto actual en DB:", productoActual);

        if (productoActual) {
          const stockActual = parseInt(productoActual.stock) || 0;
          const cantidadARestaurar = parseInt(item.cantidad) || 0;
          const nuevoStock = stockActual + cantidadARestaurar;
          updates[`${item.id}/stock`] = nuevoStock;
          console.log(
            `Producto ${item.id}: Stock actual ${stockActual} + ${cantidadARestaurar} = Nuevo stock ${nuevoStock}`
          );
        } else {
          console.log(`Producto ${item.id} no encontrado en la base de datos`);
        }
      });

      console.log("Actualizaciones a realizar:", updates);
      if (Object.keys(updates).length > 0) {
        await update(productosRef, updates);
        console.log("Stock restaurado exitosamente");
      } else {
        console.log("No hay actualizaciones para realizar");
      }
    } catch (error) {
      console.error("Error al restaurar el stock:", error);
      throw new Error("No se pudo restaurar el stock de los productos");
    }
  };

  const calcularMontoDevolucion = (total) => {
    const porcentajeCancelacion = 45;
    const montoRetenido = (total * porcentajeCancelacion) / 100;
    return total - montoRetenido;
  };

  const cancelarPedido = async (pedido) => {
    if (!pedido || pedido.estado !== "pendiente") return;

    const db = getDatabase();
    const clienteUID = pedido.usuario;

    // Detectar método de pago
    const metodo = (pedido.metodoPago || "").toLowerCase();
    const esTarjeta = metodo.includes("stripe");
    const totalPedido = Number(pedido.total || 0);
    const porcentajeRetenido = esTarjeta ? 15 : 0;
    const comision = esTarjeta ? +(totalPedido * 0.15).toFixed(2) : 0;
    const montoDevolucion = esTarjeta
      ? +(totalPedido - comision).toFixed(2)
      : totalPedido;

    try {
      // Restaurar stock
      await restaurarStock(pedido.productos);

      // Guardar en historial del cliente
      const refHistorialCliente = ref(
        db,
        `historialPedidos/${clienteUID}/${pedido.id}`
      );
      await update(refHistorialCliente, {
        ...pedido,
        estado: "cancelado",
        fechaCancelacion: new Date().toISOString(),
        total: comision, // Solo la comisión si es tarjeta, 0 si efectivo
        montoDevolucion,
        porcentajeRetenido,
        descuentoAplicado: null,
      });

      // Guardar en historial del admin
      const refHistorialAdmin = ref(
        db,
        `historialPedidosAdmin/${clienteUID}/${pedido.id}`
      );
      await update(refHistorialAdmin, {
        productos: pedido.productos,
        metodoPago: pedido.metodoPago,
        total: comision, // Solo la comisión si es tarjeta, 0 si efectivo
        usuario: pedido.usuario,
        nombreCliente: pedido.nombre || "Sin nombre",
        direccion: pedido.direccion || "",
        estado: "cancelado",
        fechaCancelacion: new Date().toISOString(),
        montoDevolucion,
        porcentajeRetenido,
        descuentoAplicado: null,
        creadoEn: pedido.creadoEn,
      });

      // Actualizar ingresos totales y del mes SOLO si es tarjeta
      if (esTarjeta) {
        const fecha = new Date(pedido.creadoEn);
        const meses = [
          "enero",
          "febrero",
          "marzo",
          "abril",
          "mayo",
          "junio",
          "julio",
          "agosto",
          "septiembre",
          "octubre",
          "noviembre",
          "diciembre",
        ];
        const mesActual = meses[fecha.getMonth()];
        const anioActual = fecha.getFullYear();
        // Ingresos totales
        const ingresosRef = ref(db, "dashboard/ingresosTotales");
        await runTransaction(ingresosRef, (valorActual) => {
          // Restar el total original y sumar la comisión
          return (valorActual || 0) - totalPedido + comision;
        });
        // Ingresos por mes/año
        const ingresosMesAnioRef = ref(
          db,
          `dashboard/ingresosPorMes/${anioActual}/${mesActual}`
        );
        await runTransaction(ingresosMesAnioRef, (valorActual) => {
          return (valorActual || 0) - totalPedido + comision;
        });
      } else {
        // Si es efectivo, restar el total original (si ya estaba sumado)
        const fecha = new Date(pedido.creadoEn);
        const meses = [
          "enero",
          "febrero",
          "marzo",
          "abril",
          "mayo",
          "junio",
          "julio",
          "agosto",
          "septiembre",
          "octubre",
          "noviembre",
          "diciembre",
        ];
        const mesActual = meses[fecha.getMonth()];
        const anioActual = fecha.getFullYear();
        const ingresosRef = ref(db, "dashboard/ingresosTotales");
        await runTransaction(ingresosRef, (valorActual) => {
          return (valorActual || 0) - totalPedido;
        });
        const ingresosMesAnioRef = ref(
          db,
          `dashboard/ingresosPorMes/${anioActual}/${mesActual}`
        );
        await runTransaction(ingresosMesAnioRef, (valorActual) => {
          return (valorActual || 0) - totalPedido;
        });
      }

      // Eliminar el pedido activo
      await remove(ref(db, `pedidos/${pedido.id}`));
      setPedidoActivo(null);
      setConfirmandoCancelacion(false);
    } catch (error) {
      console.error("Error al cancelar el pedido:", error);
      setAlerta({
        visible: true,
        mensaje:
          "Hubo un error al cancelar el pedido. Por favor, intenta de nuevo.",
        tipo: "error",
      });
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  const esAdmin = rol === "admin";

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const matchesBusqueda =
      pedido.id.includes(busqueda) || pedido.nombre.includes(busqueda);
    const matchesEstado =
      estadoFiltro === "todos" || pedido.estado === estadoFiltro;
    return matchesBusqueda && matchesEstado;
  });

  // Función auxiliar para obtener la clase CSS según el estado
  const getEstadoClass = (estado) => {
    switch (estado) {
      case "pendiente":
        return "status-pending";
      case "en_proceso":
        return "status-processing";
      case "enviado":
        return "status-shipped";
      case "entregado":
        return "status-delivered";
      case "cancelado":
        return "status-cancelled";
      default:
        return "";
    }
  };

  // Función auxiliar para formatear el estado
  const formatearEstado = (estado) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "en_proceso":
        return "En proceso";
      case "enviado":
        return "Enviado";
      case "entregado":
        return "Entregado";
      case "cancelado":
        return "Cancelado";
      default:
        return estado;
    }
  };



  const obtenerFechaPedido = (pedido) => {
    if (pedido.creadoEn && !isNaN(new Date(pedido.creadoEn))) {
      return new Date(pedido.creadoEn).toLocaleDateString();
    } else if (pedido.fecha && !isNaN(new Date(pedido.fecha))) {
      return new Date(pedido.fecha).toLocaleDateString();
    } else {
      return "Sin fecha";
    }
  };

  const contenido = (
    <div className="pedidos-container">
      <h2>Gestión de Pedidos</h2>

      <div className="filtros-productos-flex filtros-pedidos-compact">
        <input
          type="text"
          className="input-busqueda"
          placeholder="Buscar por ID o cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="select-estado"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="enviado">Enviado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map((pedido) => (
              <tr key={pedido.id}>
                <td>{pedido.id.slice(0, 6)}</td>
                <td>{pedido.nombre}</td>
                <td>{obtenerFechaPedido(pedido)}</td>
                <td>${pedido.total.toFixed(2)}</td>
                <td>
                  <span
                    className={`status-badge ${getEstadoClass(pedido.estado)}`}
                  >
                    {formatearEstado(pedido.estado)}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn-table btn-edit"
                      onClick={() => handleAbrirModal(pedido)}
                    >
                      Ver detalles
                    </button>
                    {pedido.estado !== "cancelado" &&
                      pedido.estado !== "entregado" &&
                      pedido.estado !== "en proceso" && (
                        <>
                          {rol === "admin" && (
                            <button
                              className="btn-table btn-toggle"
                              onClick={() => cambiarEstado(pedido)}
                            >
                              Actualizar estado
                            </button>
                          )}
                          {rol === "cliente" && (
                            <button
                              className="btn-table btn-delete"
                              onClick={() => {
                                setPedidoActivo(pedido);
                                setConfirmandoCancelacion(true);
                              }}
                            >
                              Cancelar
                            </button>
                          )}
                        </>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pedidoActivo && confirmandoCancelacion && (
        <Modal
          isOpen={true}
          onRequestClose={() => {
            setConfirmandoCancelacion(false);
            setPedidoActivo(null);
          }}
          contentLabel="Confirmar Cancelación"
          className="pedido-modal"
          overlayClassName="modal-overlay"
        >
          <div className="modal-content">
            <h3>⚠️ Aviso de Cancelación</h3>
            {pedidoActivo.metodoPago &&
            pedidoActivo.metodoPago.toLowerCase() === "efectivo" ? (
              <div className="cancelacion-info">
                <p className="aviso-importante">
                  ¿Estás seguro de que deseas cancelar este pedido?
                </p>
                <p>Esta acción no se puede deshacer.</p>
              </div>
            ) : (
              <div className="cancelacion-info">
                <p className="aviso-importante">
                  IMPORTANTE: Al cancelar este pedido se aplicarán los
                  siguientes cargos:
                </p>
                <ul>
                  <li>
                    💰 <strong>Cargo por cancelación:</strong> 15% del valor
                    total del pedido
                  </li>
                  <li>
                    🧾 <strong>Total del pedido:</strong> $
                    {pedidoActivo.total.toFixed(2)}
                  </li>
                  <li>
                    📊 <strong>Cargo a retener:</strong> $
                    {(pedidoActivo.total * 0.15).toFixed(2)}
                  </li>
                  <li>
                    💵 <strong>Monto a devolver:</strong> $
                    {calcularMontoDevolucion(pedidoActivo.total).toFixed(2)}
                  </li>
                </ul>
                <div className="advertencia-box">
                  <p className="advertencia">
                    ⚠️ Este cargo es necesario debido a:
                  </p>
                  <ul>
                    <li>Comisiones bancarias no reembolsables</li>
                    <li>Gastos administrativos y operativos</li>
                    <li>Costos de procesamiento de la devolución</li>
                  </ul>
                  <p className="nota-final">
                    Esta acción no se puede deshacer una vez confirmada.
                  </p>
                </div>
              </div>
            )}
            <div className="button-group">
              <button
                className="btn-confirmar-cancelacion"
                onClick={() => cancelarPedido(pedidoActivo)}
              >
                Sí, cancelar pedido
              </button>
              <button
                className="btn-cancelar"
                onClick={() => {
                  setConfirmandoCancelacion(false);
                  setPedidoActivo(null);
                }}
              >
                No, mantener pedido
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pedidoActivo && !confirmandoCancelacion && (
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
              <p>
                <strong>Estado:</strong> {pedidoActivo.estado}
              </p>
              <p>
                <strong>Pago:</strong> {pedidoActivo.metodoPago}
              </p>
              {/* Si está cancelado y es efectivo, solo muestra cancelado */}
              {pedidoActivo.estado === "cancelado" &&
              pedidoActivo.metodoPago &&
              pedidoActivo.metodoPago.toLowerCase() === "efectivo" ? (
                <div className="estado-cancelado">Pedido Cancelado</div>
              ) : (
                <>
                  {pedidoActivo.fechaEntrega && (
                    <>
                      <p>
                        <strong>Entrega estimada:</strong>{" "}
                        {formatearFechaLarga(pedidoActivo.fechaEntrega)}
                      </p>
                      <p>
                        <strong>Tiempo restante:</strong> {tiempoRestante}
                      </p>
                    </>
                  )}

                  {pedidoActivo.direccion && (
                    <>
                      <p>
                        <strong>Dirección:</strong>
                      </p>
                      <button
                        className="btn-ver-maps"
                        onClick={() => setModalMapaAbierto(true)}
                      >
                        📍 Ver en Google Maps
                      </button>
                    </>
                  )}

                  {rol !== "cliente" && (
                    <p>
                      <strong>Cliente:</strong> {pedidoActivo.nombre}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="productos-section">
              <h4>Productos:</h4>
              <ul>
                {pedidoActivo.productos.map((prod, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {/* Círculo de color */}
                    {prod.color && (
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: prod.color,
                          border: "1px solid #ccc",
                        }}
                        title={prod.color}
                      ></div>
                    )}
                    <span>
                      {prod.nombre} × {prod.cantidad} — $
                      {prod.precio * prod.cantidad}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {pedidoActivo.calificacion && (
              <div className="calificacion-section">
                <p>
                  <strong>Calificación:</strong>{" "}
                  {"★".repeat(pedidoActivo.calificacion.estrellas)}
                </p>
                <p>
                  <strong>Comentario:</strong>{" "}
                  {pedidoActivo.calificacion.comentario || "Sin comentario."}
                </p>
              </div>
            )}

            <div className="modal-actions">
              {rol === "admin" && pedidoActivo.estado !== "entregado" && (
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

      {modalMapaAbierto && (
        <Modal
          isOpen={true}
          onRequestClose={() => setModalMapaAbierto(false)}
          contentLabel="Ubicación del Pedido"
          className="modal-maps"
          overlayClassName="overlay-maps"
        >
          <h3>Ubicación del Pedido</h3>
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              pedidoActivo?.direccion || ""
            )}&output=embed`}
            width="100%"
            height="400"
            style={{ borderRadius: "12px", border: "none" }}
            loading="lazy"
            allowFullScreen
          ></iframe>
          <button
            className="btn-cerrar-maps"
            onClick={() => setModalMapaAbierto(false)}
          >
            Cerrar Mapa
          </button>
        </Modal>
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
    

  console.log("Productos del pedido activo:", pedidoActivo?.productos);


  // 👇 Este es el return final:
  return rol === "cliente" ? (
    <ClienteLayout>{contenido}</ClienteLayout>
  ) : (
    contenido
  );
};

export default Pedidos;
