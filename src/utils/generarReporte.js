import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import { getDatabase, ref, get } from "firebase/database";

export const generarReporteAnual = async (anio = new Date().getFullYear()) => {
  const db = getDatabase();
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const ingresosSnap = await get(ref(db, `dashboard/ingresosPorMes/${anio}`));
  const reinversionSnap = await get(ref(db, `dashboard/reinversion/${anio}`));
  const productosSnap = await get(ref(db, "dashboard/productosVendidos"));
  const categoriasSnap = await get(ref(db, "dashboard/categoriasVendidas"));
  const totalSnap = await get(ref(db, "dashboard/ingresosTotales"));
  const historialSnap = await get(ref(db, "historialPedidosAdmin"));

  const ingresos = ingresosSnap.val() || {};
  const reinversion = reinversionSnap.val() || {};
  const productos = productosSnap.val() || {};
  const categorias = categoriasSnap.val() || {};
  const total = totalSnap.val() || 0;
  const pedidos = historialSnap.exists()
    ? Object.values(historialSnap.val()).flatMap(usuario => Object.values(usuario))
    : [];

  const fecha = new Date();
  const mesActualIndex = fecha.getMonth();
  const mesActualNombre = meses[mesActualIndex];
  const fechaTexto = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;

  // Pagos por mes
  const pagosPorMes = meses.map((mesNombre, index) => {
    let tarjeta = 0;
    let efectivo = 0;

    pedidos.forEach((pedido) => {
      if (!pedido.creadoEn) return;
      const fechaPedido = new Date(pedido.creadoEn);
      const mesPedido = fechaPedido.getMonth();
      const anioPedido = fechaPedido.getFullYear();

      if (mesPedido === index && anioPedido === anio) {
        const total = Number(pedido.total || 0);
        const metodo = pedido.metodoPago?.toLowerCase() || "";
        if (metodo.includes("stripe")) {
          tarjeta += total;
        } else {
          efectivo += total;
        }
      }
    });

    return {
      mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
      tarjeta,
      efectivo,
    };
  });


  const totalReinversion = Object.values(reinversion).reduce(
    (acc, item) => acc + (item?.monto || 0), 0
  );

  const doc = new jsPDF();

  // Logo y encabezado
  const img = new Image();
  img.src = logo;
  doc.addImage(img, "PNG", 10, 10, 33, 20);
  doc.setFontSize(16);
  doc.text("M&J SHOP", 105, 20, null, null, "center");
  doc.setFontSize(12);
  doc.text(`Reporte anual de ingresos - ${anio}`, 105, 28, null, null, "center");
  doc.setFontSize(10);
  doc.text(`Generado el ${fechaTexto}`, 200, 10, null, null, "right");

  // Tabla: ingresos y reinversión por mes
  const tablaMeses = meses.map((mes) => [
    mes.charAt(0).toUpperCase() + mes.slice(1),
    `$${(ingresos[mes] || 0).toLocaleString()}`,
    `$${(reinversion[mes]?.monto || 0).toLocaleString()}`,
  ]);
  autoTable(doc, {
    startY: 40,
    head: [["Mes", "Ingreso", "Inversión"]],
    body: tablaMeses,
    headStyles: { fillColor: [30, 90, 150], textColor: 255, fontStyle: "bold" },
    bodyStyles: { fillColor: [245, 245, 245], fontStyle: "bold" },
  });

  // Tabla: resumen financiero
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Concepto", "Monto"]],
    body: [
      ["Ingreso total del año", `$${total.toLocaleString()}`],
      ["Total reinvertido", `$${totalReinversion.toLocaleString()}`],

    ],
    headStyles: { fillColor: [0, 0, 0], textColor: 255, fontStyle: "bold" },
    bodyStyles: { fillColor: [245, 245, 245], fontStyle: "bold" },
  });

  // Tabla: pagos por mes con porcentaje
const pagosConPorcentaje = pagosPorMes.map((row) => {
  const totalMes = row.tarjeta + row.efectivo || 1;
  return [
    row.mes,
    `$${row.tarjeta.toLocaleString()}`,
    `$${row.efectivo.toLocaleString()}`,
    `${((row.tarjeta / totalMes) * 100).toFixed(1)}%`,
    `${((row.efectivo / totalMes) * 100).toFixed(1)}%`,
  ];
});

// ➕ Agrega fila TOTAL
const totalTarjetaAnual = pagosPorMes.reduce((acc, p) => acc + p.tarjeta, 0);
const totalEfectivoAnual = pagosPorMes.reduce((acc, p) => acc + p.efectivo, 0);
const totalGeneral = totalTarjetaAnual + totalEfectivoAnual || 1;

pagosConPorcentaje.push([
  "TOTAL",
  `$${totalTarjetaAnual.toLocaleString()}`,
  `$${totalEfectivoAnual.toLocaleString()}`,
  `${((totalTarjetaAnual / totalGeneral) * 100).toFixed(1)}%`,
  `${((totalEfectivoAnual / totalGeneral) * 100).toFixed(1)}%`,
]);


autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 15,
  head: [["Mes", "Pago con tarjeta", "Pago en efectivo", "% Tarjeta", "% Efectivo"]],
  body: pagosConPorcentaje,
  headStyles: {
    fillColor: [30, 90, 150],
    textColor: 255,
    fontStyle: "bold",
  },
  bodyStyles: {
    fillColor: [245, 245, 245],
    fontStyle: "bold",
  },
  didParseCell: function (data) {
    const isLastRow = data.row.index === pagosConPorcentaje.length - 1;
    if (isLastRow && data.section === 'body') {
      data.cell.styles.fillColor = [50, 50, 50]; // Gris oscuro
      data.cell.styles.textColor = 255; // Blanco
      data.cell.styles.fontStyle = 'bold';
    }
  }
});


  // Tabla: productos vendidos
 const totalProductos = Object.values(productos).reduce((acc, val) => acc + val, 0);
const productosPorcentaje = Object.entries(productos)
  .sort(([, a], [, b]) => b - a)
  .map(([prod, cantidad]) => [
    prod,
    `${((cantidad / totalProductos) * 100).toFixed(1)}%`
  ]);
autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 15,
  head: [["Producto", "% de ventas"]],
  body: productosPorcentaje,
  headStyles: {
    fillColor: [30, 90, 150],
    textColor: 255,
    fontStyle: "bold",
    halign: 'center'
  },
  bodyStyles: { fillColor: [255, 255, 255] },
  columnStyles: {
    0: { halign: 'left' },
    1: { halign: 'right' }
  },
  didParseCell: function (data) {
    if (data.section === 'body' && data.row.index === 0) {
      data.cell.styles.fillColor = [255, 215, 0]; // 🎖️ Dorado
      data.cell.styles.textColor = [0, 0, 0];
      data.cell.styles.fontStyle = 'bold';
    }
  }
});




  // Tabla: categorías vendidas
  const totalCategorias = Object.values(categorias).reduce((acc, val) => acc + val, 0);
const categoriasPorcentaje = Object.entries(categorias)
  .sort(([, a], [, b]) => b - a)
  .map(([cat, cantidad]) => [
    cat,
    `${((cantidad / totalCategorias) * 100).toFixed(1)}%`
  ]);

autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 15,
  head: [["Categoría", "% de ventas"]],
  body: categoriasPorcentaje,
  headStyles: {
    fillColor: [30, 90, 150],
    textColor: 255,
    fontStyle: "bold",
    halign: 'center'
  },
  bodyStyles: { fillColor: [255, 255, 255] },
  columnStyles: {
    0: { halign: 'left' },
    1: { halign: 'right' }
  },
  didParseCell: function (data) {
    if (data.section === 'body' && data.row.index === 0) {
      data.cell.styles.fillColor = [255, 215, 0]; // 🎖️ Dorado
      data.cell.styles.textColor = [0, 0, 0];
      data.cell.styles.fontStyle = 'bold';
    }
  }
});

  // === NUEVA TABLA: Entregados y Cancelados (Desglose) ===
  // Filtrar pedidos por año
  const pedidosAnio = pedidos.filter(p => {
    if (!p.creadoEn) return false;
    const fecha = new Date(p.creadoEn);
    return fecha.getFullYear() === anio;
  });
  const totalPedidos = pedidosAnio.length;
  const entregados = pedidosAnio.filter(p => (p.estado || '').toLowerCase() === 'entregado');
  const cancelados = pedidosAnio.filter(p => (p.estado || '').toLowerCase() === 'cancelado');
  const canceladosTarjeta = cancelados.filter(p => (p.metodoPago || '').toLowerCase().includes('stripe'));
  const canceladosEfectivo = cancelados.filter(p => (p.metodoPago || '').toLowerCase() === 'efectivo');
  const totalEntregados = entregados.length;
  const totalCanceladosTarjeta = canceladosTarjeta.length;
  const totalCanceladosEfectivo = canceladosEfectivo.length;
  const sumaComisionTarjeta = canceladosTarjeta.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  const sumaReembolsadoTarjeta = canceladosTarjeta.reduce((acc, p) => acc + (Number(p.montoDevolucion) || 0), 0);
  const porcentajeEntregados = totalPedidos > 0 ? (totalEntregados / totalPedidos) * 100 : 0;
  const porcentajeCanceladosTarjeta = totalPedidos > 0 ? (totalCanceladosTarjeta / totalPedidos) * 100 : 0;
  const porcentajeCanceladosEfectivo = totalPedidos > 0 ? (totalCanceladosEfectivo / totalPedidos) * 100 : 0;
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [["Tipo", "Cantidad", "% del total", "Comisión ($)", "Total reembolsado ($)"]],
    body: [
      [
        "Entregados",
        totalEntregados,
        `${porcentajeEntregados.toFixed(1)}%`,
        "-",
        "-"
      ],
      [
        "Cancelados (tarjeta)",
        totalCanceladosTarjeta,
        `${porcentajeCanceladosTarjeta.toFixed(1)}%`,
        `$${sumaComisionTarjeta.toLocaleString(undefined, {maximumFractionDigits:2})}`,
        `$${sumaReembolsadoTarjeta.toLocaleString(undefined, {maximumFractionDigits:2})}`
      ],
      [
        "Cancelados (efectivo)",
        totalCanceladosEfectivo,
        `${porcentajeCanceladosEfectivo.toFixed(1)}%`,
        "$0.00",
        "$0.00"
      ]
    ],
    headStyles: { fillColor: [200, 50, 50], textColor: 255, fontStyle: "bold" },
    bodyStyles: { fillColor: [255, 245, 245], fontStyle: "bold" },
  });

  // Pie de página con número de página y año
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.text(`Página ${i} de ${pageCount}`, 14, pageHeight - 10);
    doc.text(`@M&JShop${anio}`, pageWidth - 14, pageHeight - 10, { align: "right" });
  }

  // Guardar PDF
  const fechaHoy = new Date();
const fechaArchivo = `${fechaHoy.getFullYear()}-${String(fechaHoy.getMonth() + 1).padStart(2, '0')}-${String(fechaHoy.getDate()).padStart(2, '0')}`;
doc.save(`Reporte_MJShop_${anio}_${fechaArchivo}.pdf`);

};
