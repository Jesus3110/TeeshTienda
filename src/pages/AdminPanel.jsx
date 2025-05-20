import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Calendar from "react-calendar";
import Toast from "../components/Toast";
import "../styles/dashboard.css";
import "react-calendar/dist/Calendar.css";

const AdminPanel = () => {
  const [toastVisible, setToastVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [infoEntrega, setInfoEntrega] = useState([]); // antes era string
  const [entregas, setEntregas] = useState([]);
  const [categoriasData, setCategoriasData] = useState([]);
  const [productosData, setProductosData] = useState([]);
  const [ingresosTotales, setIngresosTotales] = useState(0);
  const [ingresosData, setIngresosData] = useState([]);
  const [estadoPedidosSemana, setEstadoPedidosSemana] = useState([]);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [pedidoActivo, setPedidoActivo] = useState(null);

  const COLORS = [
    "#FF9AA2", // Rosa más fuerte
    "#FFB347", // Naranja pastel bonito
    "#B5EAD7", // Verde menta
    "#C7CEEA", // Lila pastel
    "#FFDAC1", // Durazno claro
    "#E2F0CB", // Verde limón pastel
  ];

  useEffect(() => {
    const db = getDatabase();
    const pedidosRef = ref(db, "pedidos/");

    onValue(pedidosRef, (snapshot) => {
      const data = snapshot.val();
      const nuevasEntregas = [];
      const resumenSemanal = {
        pendiente: 0,
        "en proceso": 0,
        entregado: 0,
      };

      const hoy = new Date();
      const primerDiaSemana = new Date(
        hoy.setDate(hoy.getDate() - hoy.getDay())
      ); // domingo
      primerDiaSemana.setHours(0, 0, 0, 0);

      if (data) {
        Object.values(data).forEach((pedido) => {
          const fechaPedido = new Date(pedido.creadoEn);
          if (pedido.creadoEn && fechaPedido >= primerDiaSemana) {
            const estado = pedido.estado?.toLowerCase();
            if (resumenSemanal.hasOwnProperty(estado)) {
              resumenSemanal[estado]++;
            }
          }

          nuevasEntregas.push({
            fecha: new Date(pedido.fechaEntrega + "T00:00:00"),
            pedido,
          });
        });

        // Transformar a array para el PieChart
        const resumenFormateado = Object.entries(resumenSemanal).map(
          ([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
          })
        );

        setEstadoPedidosSemana(resumenFormateado); // nuevo useState: estadoPedidosSemana
      }

      setEntregas(nuevasEntregas);
    });

    // Productos más vendidos
    const productosRef = ref(db, "dashboard/productosVendidos");
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productos = Object.entries(data).map(([nombre, cantidad]) => ({
          name: nombre,
          value: cantidad,
        }));
        setProductosData(productos);
      }
    });

    // Categorías más vendidas
    const categoriasRef = ref(db, "dashboard/categoriasVendidas");
    onValue(categoriasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categorias = Object.entries(data).map(([nombre, cantidad]) => ({
          name: nombre,
          value: cantidad,
        }));
        setCategoriasData(categorias);
      }
    });

    // Ingresos totales
    const ingresosRef = ref(db, "dashboard/ingresosTotales");
    onValue(ingresosRef, (snapshot) => {
      const total = snapshot.val() || 0;
      setIngresosTotales(total);
    });

    // Ingresos por mes
    const mesesOrdenados = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const ingresosPorMesRef = ref(db, "dashboard/ingresosPorMes");
onValue(ingresosPorMesRef, (snapshot) => {
  const data = snapshot.val() || {};

  // Inicializar acumulador mensual
  const acumulado = {};
  mesesOrdenados.forEach((mes) => {
    acumulado[mes.toLowerCase()] = 0;
  });

  // Sumar ingresos por mes a través de los años
  Object.values(data).forEach((anioData) => {
    Object.entries(anioData).forEach(([mes, valor]) => {
      if (acumulado[mes] !== undefined) {
        acumulado[mes] += valor;
      }
    });
  });

  const listaIngresos = mesesOrdenados.map((mes) => ({
    name: mes,
    ingresos: acumulado[mes.toLowerCase()],
  }));

  setIngresosData(listaIngresos);
});

  }, []);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      if (
        entregas.find(
          (d) =>
            d.fecha.getFullYear() === date.getFullYear() &&
            d.fecha.getMonth() === date.getMonth() &&
            d.fecha.getDate() === date.getDate()
        )
      ) {
        return "fecha-entrega";
      }
    }
    return null;
  };

  const handleDateClick = (selectedDate) => {
    setDate(selectedDate);

    const pedidosEnFecha = entregas
      .filter(
        (d) =>
          d.fecha.getFullYear() === selectedDate.getFullYear() &&
          d.fecha.getMonth() === selectedDate.getMonth() &&
          d.fecha.getDate() === selectedDate.getDate()
      )
      .map((d) => d.pedido);

    if (pedidosEnFecha.length > 0) {
      setInfoEntrega(pedidosEnFecha);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setInfoEntrega("");
  };

  return (
    <div className="dashboard">
      <main className="main-content">
        <h1>Panel de Administración</h1>

        <div className="charts">
          {/* Estado de pedidos */}
          <div className="chart-card">
            <h2>Pedidos de la Semana</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={estadoPedidosSemana}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label
                >
                  {estadoPedidosSemana.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Categorías más vendidas */}
          <div className="chart-card">
            <h2>Categorías más vendidas</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoriasData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40} // 👈 Añadimos esto para que sea anillo
                  label
                >
                  {categoriasData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Productos más vendidos */}
          <div className="chart-card">
            <h2>Productos más vendidos</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={productosData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40} // 👈 Añadimos esto para que sea anillo
                  label
                >
                  {productosData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Ingresos por mes */}
          <div className="chart-card">
            <h2>Ingresos por Mes</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ingresosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#3498db" // Azul moderno
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#fff" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Total debajo */}
            <p
              style={{
                marginTop: "1rem",
                fontWeight: "bold",
                textAlign: "center",
                fontSize: "1.1rem",
              }}
            >
              Total acumulado: ${ingresosTotales.toLocaleString()}
            </p>
          </div>

          {/* Calendario de entregas */}
          <div className="chart-card">
            <h2>Fechas de Entrega</h2>
            <Calendar
              value={date}
              onChange={handleDateClick}
              tileClassName={tileClassName}
              className="custom-calendar"
            />
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>📦 Entregas programadas</h2>

              {infoEntrega.map((p, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#f9f9f9",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <p>
                    <strong>Cliente:</strong> {p.nombre}
                  </p>

                  {p.direccion ? (
                    <button
                      className="btn-ver-maps"
                      onClick={() => {
                        setPedidoActivo(p); // asigna el pedido actual al estado
                        setModalMapaAbierto(true);
                      }}
                    >
                      📍 Ver en Google Maps
                    </button>
                  ) : (
                    <p style={{ color: "gray" }}>Sin dirección disponible</p>
                  )}

                  <p>
                    <strong>Total:</strong> ${p.total}
                  </p>
                  <p>
                    <strong>Estado:</strong> {p.estado}
                  </p>
                </div>
              ))}

              <button
                onClick={closeModal}
                style={{
                  marginTop: "1rem",
                  backgroundColor: "#e74c3c",
                  color: "#fff",
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </main>

      {toastVisible && (
        <Toast
          message="¡Sesión cerrada!"
          onClose={() => setToastVisible(false)}
        />
      )}
      {modalMapaAbierto && pedidoActivo && (
        <div
          className="modal-overlay"
          onClick={() => setModalMapaAbierto(false)}
        >
          <div className="modal-maps" onClick={(e) => e.stopPropagation()}>
            <h3>Ubicación del Pedido</h3>

            {pedidoActivo.direccion ? (
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  pedidoActivo.direccion
                )}&output=embed`}
                width="100%"
                height="400"
                style={{ borderRadius: "12px", border: "none" }}
                loading="lazy"
                allowFullScreen
              ></iframe>
            ) : (
              <p style={{ color: "red" }}>Dirección no disponible.</p>
            )}

            <button
              className="btn-cerrar-maps"
              onClick={() => setModalMapaAbierto(false)}
            >
              Cerrar Mapa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
