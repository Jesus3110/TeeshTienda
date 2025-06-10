import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import { getDatabase, ref, get } from "firebase/database";

export const generarReporteMensual = async (mes = "mayo", anio = new Date().getFullYear()) => {
  const db = getDatabase();

  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const mesIndex = meses.indexOf(mes.toLowerCase());
  if (mesIndex === -1) {
    alert("❌ Mes inválido. Usa un mes como 'mayo'");
    return;
  }

  const ingresoSnap = await get(ref(db, `dashboard/ingresosPorMes/${anio}/${mes}`));
  const reinversionSnap = await get(ref(db, `dashboard/reinversion/${anio}/${mes}`));
  const productosSnap = await get(ref(db, `dashboard/productosVendidosPorMes/${anio}/${mes}`));
  const categoriasSnap = await get(ref(db, `dashboard/categoriasVendidasPorMes/${anio}/${mes}`));
  const historialSnap = await get(ref(db, "historialPedidosAdmin"));

  const ingresoMes = ingresoSnap.exists() ? ingresoSnap.val() : 0;
  const reinversion = reinversionSnap.exists() ? reinversionSnap.val() : { monto: 0 };
  const productos = productosSnap.val() || {};
  const categorias = categoriasSnap.val() || {};
  const pedidos = historialSnap.exists()
    ? Object.values(historialSnap.val()).flatMap(usuario => Object.values(usuario))
    : [];

  let totalTarjeta = 0;
  let totalEfectivo = 0;

  pedidos.forEach((pedido) => {
    if (!pedido.creadoEn) return;
    const fecha = new Date(pedido.creadoEn);
    const mesPedido = fecha.getMonth();
    const anioPedido = fecha.getFullYear();

    if (mesPedido === mesIndex && anioPedido === anio) {
      const total = Number(pedido.total || 0);
      const metodo = pedido.metodoPago?.toLowerCase() || "";
      if (metodo.includes("stripe")) {
        totalTarjeta += total;
      } else {
        totalEfectivo += total;
      }
    }
  });

  const fechaHoy = new Date();
  const fechaTexto = `${fechaHoy.toLocaleDateString()} ${fechaHoy.toLocaleTimeString()}`;

  const doc = new jsPDF();
  const img = new Image();
  img.src = logo;
  doc.addImage(img, "PNG", 10, 10, 33, 20);

  doc.setFontSize(16);
  doc.text("M&J SHOP", 105, 20, null, null, "center");
  doc.setFontSize(12);
  doc.text(`Reporte mensual de ingresos - ${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}`, 105, 28, null, null, "center");
  doc.setFontSize(10);
  doc.text(`Generado el ${fechaTexto}`, 200, 10, null, null, "right");

  autoTable(doc, {
    startY: 45,
    head: [["Concepto", "Monto"]],
    body: [
      ["Ingreso total del mes", `$${ingresoMes.toLocaleString()}`],
      ["Total reinvertido", `$${(reinversion.monto || 0).toLocaleString()}`],
      ["Pagos con tarjeta", `$${totalTarjeta.toLocaleString()}`],
      ["Pagos en efectivo", `$${totalEfectivo.toLocaleString()}`],
    ],
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fillColor: [245, 245, 245],
      fontStyle: 'bold',
    },
  });

  const totalProductos = Object.values(productos).reduce((acc, val) => acc + val, 0);
  const productosPorcentaje = Object.entries(productos)
    .sort(([, a], [, b]) => b - a)
    .map(([nombre, cantidad]) => [nombre, `${((cantidad / totalProductos) * 100).toFixed(1)}%`]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [["Producto", "% de ventas"]],
    body: productosPorcentaje,
    headStyles: {
      fillColor: [30, 90, 150],
      textColor: 255,
      fontStyle: "bold",
      halign: "center"
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right' }
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.row.index === 0) {
        data.cell.styles.fillColor = [255, 215, 0];
        data.cell.styles.textColor = [0, 0, 0];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  const totalCategorias = Object.values(categorias).reduce((acc, val) => acc + val, 0);
  const categoriasPorcentaje = Object.entries(categorias)
    .sort(([, a], [, b]) => b - a)
    .map(([nombre, cantidad]) => [nombre, `${((cantidad / totalCategorias) * 100).toFixed(1)}%`]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [["Categoría", "% de ventas"]],
    body: categoriasPorcentaje,
    headStyles: {
      fillColor: [30, 90, 150],
      textColor: 255,
      fontStyle: "bold",
      halign: "center"
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right' }
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.row.index === 0) {
        data.cell.styles.fillColor = [255, 215, 0];
        data.cell.styles.textColor = [0, 0, 0];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  const pageCount = doc.getNumberOfPages();
  const anioActual = new Date().getFullYear();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.text(`Página ${i} de ${pageCount}`, 14, pageHeight - 10);
    doc.text(`@M&JShop${anioActual}`, pageWidth - 14, pageHeight - 10, { align: "right" });
  }

  doc.save(`Reporte_MJShop_Mensual_${mes}_${anio}.pdf`);
};
