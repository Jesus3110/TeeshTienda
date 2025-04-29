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
  const [infoEntrega, setInfoEntrega] = useState("");
  const [entregas, setEntregas] = useState([]);

  // Datos para gráficas estáticas (por ahora)
  const estadoPedidosData = [
    { name: "Excedente", value: 40 },
    { name: "En Proceso", value: 30 },
    { name: "Pendiente", value: 30 },
  ];

  const categoriasData = [
    { name: "Ropa", value: 45 },
    { name: "Accesorios", value: 30 },
    { name: "Calzado", value: 25 },
  ];

  const productosData = [
    { name: "Camiseta básica", value: 60 },
    { name: "Aretes", value: 25 },
    { name: "Tenis blancos", value: 15 },
  ];

  const ingresosData = [
    { name: "Enero", ingresos: 4000 },
    { name: "Febrero", ingresos: 3000 },
    { name: "Marzo", ingresos: 5000 },
    { name: "Abril", ingresos: 2500 },
    { name: "Mayo", ingresos: 6000 },
    { name: "Junio", ingresos: 3200 },
  ];

  const COLORS = [
    "#FF9AA2", // Rosa más fuerte
    "#FFB347", // Naranja pastel bonito
    "#B5EAD7", // Verde menta
    "#C7CEEA", // Lila pastel
    "#FFDAC1", // Durazno claro
    "#E2F0CB", // Verde limón pastel
  ];

  useEffect(() => {
    const db = getDatabase(); // ✔️ generas 'db' aquí localmente
    const pedidosRef = ref(db, "pedidos/");

    onValue(pedidosRef, (snapshot) => {
      const data = snapshot.val();
      const nuevasEntregas = [];

      if (data) {
        Object.keys(data).forEach((key) => {
          const pedido = data[key];
          const fechaTimestamp = pedido.creadoEn;
          if (fechaTimestamp) {
            const fechaEntrega = new Date(fechaTimestamp);
            nuevasEntregas.push({
              fecha: fechaEntrega,
              descripcion: `Pedido de ${pedido.nombre} - ${pedido.estado}`,
            });
          }
        });
      }

      setEntregas(nuevasEntregas);
    });
  }, []);

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
    const entregaEncontrada = entregas.find(
      (d) =>
        d.fecha.getFullYear() === selectedDate.getFullYear() &&
        d.fecha.getMonth() === selectedDate.getMonth() &&
        d.fecha.getDate() === selectedDate.getDate()
    );

    if (entregaEncontrada) {
      setInfoEntrega(entregaEncontrada.descripcion);
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
            <h2>Estado de Pedidos</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={estadoPedidosData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40} // 👈 Añadimos esto para que sea anillo
                  label
                >
                  {estadoPedidosData.map((entry, index) => (
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
                  stroke="#00FF00"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#fff" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
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
              <h2>📦 Entrega programada</h2>
              <p>{infoEntrega}</p>
              <button onClick={closeModal}>Cerrar</button>
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
    </div>
  );
};

export default AdminPanel;
