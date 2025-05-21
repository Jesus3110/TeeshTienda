import React, { useState, useEffect } from "react";
import { getDatabase, ref, get, set } from "firebase/database";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "../styles/ingresos.css";
import { generarReporteAnual } from "../utils/generarReporte";
import { generarReporteMensual } from "../utils/generarReporteMensual";

function Ingresos() {
  const [mesActual, setMesActual] = useState(""); // abril, mayo, etc.
  const [ingresoMes, setIngresoMes] = useState(0);
  const [porcentaje, setPorcentaje] = useState(25);
  const [recomendado, setRecomendado] = useState(0);
  const [disponible, setDisponible] = useState(0);
  const [ingresosMensuales, setIngresosMensuales] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(
    new Date().getFullYear()
  );
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [ingresosTotales, setIngresosTotales] = useState(0);
  const [guardado, setGuardado] = useState(false); // si ya fue guardado
  const [mensajeActualizacion, setMensajeActualizacion] = useState("");
  const [metodosPago, setMetodosPago] = useState([]);

  useEffect(() => {
  const db = getDatabase();
  const totalRef = ref(db, "dashboard/ingresosTotales");

  get(totalRef).then((snap) => {
    if (snap.exists()) {
      setIngresosTotales(snap.val());
    } else {
      setIngresosTotales(0);
    }
  });
}, [anioSeleccionado, mesActual]);


  useEffect(() => {
    const db = getDatabase();
    const fecha = new Date();
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
    const mesStr = meses[fecha.getMonth()];
    setMesActual(mesStr);

    const obtenerMensuales = async () => {
      const snapshot = await get(
        ref(db, `dashboard/ingresosPorMes/${anioSeleccionado}`)
      );
      if (snapshot.exists()) {
        const datos = snapshot.val();
        const arreglo = Object.entries(datos).map(([mes, ingreso]) => ({
          mes,
          ingreso,
        }));
        setIngresosMensuales(arreglo);

        if (datos[mesActual]) {
          setIngresoMes(datos[mesActual]);
        }
      }

      const obtenerAnios = async () => {
        const db = getDatabase();
        const snapshot = await get(ref(db, "dashboard/ingresosPorMes"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const anios = Object.keys(data); // ["2024", "2025", ...]
          setAniosDisponibles(anios);
          // Si no está el año seleccionado actual, selecciona el más reciente
          if (!anios.includes(anioSeleccionado.toString())) {
            setAnioSeleccionado(anios[anios.length - 1]);
          }
        }
      };

      obtenerAnios();
    };

    obtenerMensuales();
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const fecha = new Date();
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
    const mesStr = meses[fecha.getMonth()];
    setMesActual(mesStr);

    const obtenerMensuales = async () => {
      const snapshot = await get(
        ref(db, `dashboard/ingresosPorMes/${anioSeleccionado}`)
      );
      if (snapshot.exists()) {
        const datos = snapshot.val();
        const arreglo = Object.entries(datos).map(([mes, ingreso]) => ({
          mes,
          ingreso,
        }));
        setIngresosMensuales(arreglo);

        if (datos[mesStr]) {
          setIngresoMes(datos[mesStr]);
        }
      }
    };

    const obtenerAnios = async () => {
      const snapshot = await get(ref(db, "dashboard/ingresosPorMes"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const anios = Object.keys(data);
        setAniosDisponibles(anios);

        // Si el año actual no está, selecciona el más reciente
        if (!anios.includes(anioSeleccionado.toString())) {
          setAnioSeleccionado(anios[anios.length - 1]);
        }
      }
    };

    obtenerMensuales();
    obtenerAnios();
  }, []);

  useEffect(() => {
    const inversion = (ingresoMes * porcentaje) / 100;
    setRecomendado(inversion);
    setDisponible(ingresoMes - inversion);
  }, [ingresoMes, porcentaje]);

  useEffect(() => {
    const db = getDatabase();

    const verificarReinversion = async () => {
      const reinversionRef = ref(
        db,
        `dashboard/reinversion/${anioSeleccionado}/${mesActual}`
      );
      const snap = await get(reinversionRef);

      if (snap.exists()) {
        const data = snap.val();

        if (!isNaN(data.porcentaje)) {
          setPorcentaje(data.porcentaje);
          setGuardado(true);

          if (!isNaN(ingresoMes) && ingresoMes > 0) {
            const nuevoMonto = (ingresoMes * data.porcentaje) / 100;

            if (!isNaN(nuevoMonto) && data.monto !== nuevoMonto) {
              await set(
                ref(
                  db,
                  `dashboard/reinversion/${anioSeleccionado}/${mesActual}/monto`
                ),
                nuevoMonto
              );
              setMensajeActualizacion("💰 Monto actualizado automáticamente");
            } else {
              setMensajeActualizacion("");
            }
          }
        }
      } else {
        setGuardado(false);
        setMensajeActualizacion("");
      }
    };

    verificarReinversion();
  }, [anioSeleccionado, mesActual, ingresoMes]);

useEffect(() => {
  if (!mesActual || !anioSeleccionado) return;

  const db = getDatabase();
  const pedidosRef = ref(db, "pedidos");

  get(pedidosRef).then((snap) => {
    if (snap.exists()) {
      const pedidos = Object.values(snap.val());

      // Mapeo de nombres de mes a índice (0 = enero)
      const meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      const mesIndexActual = meses.indexOf(mesActual.toLowerCase());
      const anioActual = parseInt(anioSeleccionado);

      const pedidosDelMes = pedidos.filter((pedido) => {
        if (!pedido.creadoEn) return false;

        const fecha = new Date(pedido.creadoEn);
        const mesPedidoIndex = fecha.getMonth();
        const anioPedido = fecha.getFullYear();

        return mesPedidoIndex === mesIndexActual && anioPedido === anioActual;
      });

      // Debug para asegurar que el filtro funciona
      console.log("Pedidos filtrados para gráfica:", pedidosDelMes.map(p => ({
        total: p.total,
        fecha: new Date(p.creadoEn).toLocaleString(),
        metodo: p.metodoPago,
      })));

      let tarjeta = 0;
      let efectivo = 0;
      let totalTarjeta = 0;
      let totalEfectivo = 0;

      pedidosDelMes.forEach((pedido) => {
        if (
          pedido.metodoPago &&
          pedido.metodoPago.toLowerCase().includes("stripe")
        ) {
          tarjeta++;
          totalTarjeta += Number(pedido.total || 0);
        } else {
          efectivo++;
          totalEfectivo += Number(pedido.total || 0);
        }
      });

      const totalMonto = totalTarjeta + totalEfectivo || 1;

      setMetodosPago([
        {
          name: "Tarjeta",
          monto: totalTarjeta,
          porcentaje: ((totalTarjeta / totalMonto) * 100).toFixed(1),
        },
        {
          name: "Efectivo",
          monto: totalEfectivo,
          porcentaje: ((totalEfectivo / totalMonto) * 100).toFixed(1),
        },
      ]);
    }
  });
}, [mesActual, anioSeleccionado]);





  const guardarReinversion = async () => {
    const db = getDatabase();
    const refReinversion = ref(
      db,
      `dashboard/reinversion/${anioSeleccionado}/${mesActual}`
    );

    await set(refReinversion, {
      porcentaje,
      monto: recomendado,
    });

    setGuardado(true);
    alert("✅ Recomendación guardada");
  };

  const colores = ["#3b82f6", "#10b981"];

  return (
    <div className="panel-ingresos">
      <h2 className="titulo-principal">
        📊 Panel de Ingresos - {mesActual.toUpperCase()}
      </h2>
        <button onClick={() => generarReporteAnual()} className="boton-guardar">
          📄 Generar Reporte Anual PDF
        </button>
        <button onClick={() => generarReporteMensual(mesActual, anioSeleccionado)} className="boton-guardar">
  📆 Reporte del Mes
</button>

      {/* Gráfica de ingresos mensuales (historial para PDF) */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="anio" className="seccion-titulo">
          Seleccionar año:
        </label>
        <select
          id="anio"
          value={anioSeleccionado}
          onChange={(e) => setAnioSeleccionado(e.target.value)}
          className="selector-anio"
        >
          {aniosDisponibles.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
      </div>

      <div className="grafica-container">
        <h3 className="seccion-titulo">📈 Ingresos por mes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={ingresosMensuales}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            barSize={50}
          >
            <defs>
              <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Bar
              dataKey="ingreso"
              fill="url(#colorIngreso)"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="ingreso-total">
        💰 Ingreso total: <strong>${ingresosTotales.toLocaleString()}</strong>
      </p>

      {/* Gráfica tipo donut + slider */}
      <div className="distribucion-container">
        <div className="donut-box">
          <h3 className="seccion-titulo">
            🍩 Distribución de Ganancias ({mesActual})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Recomendación", value: recomendado },
                  { name: "Disponible", value: disponible },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
              >
                <Cell fill={colores[0]} />
                <Cell fill={colores[1]} />
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Slider de inversión mensual */}
        <div className="slider-box">
          <label className="slider-label">
            Ajusta el porcentaje de reinversión: <strong>{porcentaje}%</strong>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={porcentaje}
            onChange={(e) => setPorcentaje(Number(e.target.value))}
            className="slider-bar"
            disabled={guardado}
          />
          {!guardado ? (
            <button onClick={guardarReinversion} className="boton-guardar">
              💾 Guardar Recomendación
            </button>
          ) : (
            <p className="texto-guardado">
              ✅ Recomendación ya guardada este mes
            </p>
          )}
        </div>
        {mensajeActualizacion && (
          <p className="mensaje-actualizacion">{mensajeActualizacion}</p>
        )}
        <p className="monto-recomendado">
          💸 Monto recomendado:{" "}
          <strong>
            $
            {recomendado.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </strong>
        </p>

      


      </div>
      <div className="donut-box">
        <h3 className="seccion-titulo">💳 Distribución por Método de Pago</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={metodosPago}
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              dataKey="monto"
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {metodosPago.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "#6366f1" : "#facc15"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="resumen-metodos">
  {metodosPago.map((item) => (
    <p key={item.name}>
      {item.name}: <strong>${item.monto.toLocaleString()} ({item.porcentaje}%)</strong>
    </p>
  ))}
</div>

      </div>
    </div>
  );
}

export default Ingresos;
