// utils/generarReporte.js
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

  // Obtener datos
  const ingresosSnap = await get(ref(db, `dashboard/ingresosPorMes/${anio}`));
  const reinversionSnap = await get(ref(db, `dashboard/reinversion/${anio}`));
  const productosSnap = await get(ref(db, "dashboard/productosVendidos"));
  const categoriasSnap = await get(ref(db, "dashboard/categoriasVendidas"));
  const totalSnap = await get(ref(db, "dashboard/ingresosTotales"));

  const ingresos = ingresosSnap.val() || {};
  const reinversion = reinversionSnap.val() || {};
  const productos = productosSnap.val() || {};
  const categorias = categoriasSnap.val() || {};
  const total = totalSnap.val() || 0;

  const totalReinversion = Object.values(reinversion).reduce(
    (acc, item) => acc + (item?.monto || 0), 0
  );

  const fecha = new Date();
  const fechaTexto = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;

  // Crear PDF
  const doc = new jsPDF();

  // Logo
  const img = new Image();
  img.src = logo;
  doc.addImage(img, "PNG", 10, 10, 33, 20);

  // Encabezado
  doc.setFontSize(16);
  doc.text("M&J SHOP", 105, 20, null, null, "center");
  doc.setFontSize(12);
  doc.text(`Reporte anual de ingresos - ${anio}`, 105, 28, null, null, "center");
  doc.setFontSize(10);
  doc.text(`Generado el ${fechaTexto}`, 200, 10, null, null, "right");

  // Tabla ingresos por mes
  const tablaMeses = meses.map((mes) => [
    mes.charAt(0).toUpperCase() + mes.slice(1),
    `$${(ingresos[mes] || 0).toLocaleString()}`,
    `$${(reinversion[mes]?.monto || 0).toLocaleString()}`,
  ]);
  autoTable(doc, {
    startY: 40,
    head: [["Mes", "Ingreso", "Inversión"]],
    body: tablaMeses,
  });

  // Productos
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Producto", "Cantidad"]],
    body: Object.entries(productos).map(([prod, cantidad]) => [prod, cantidad]),
  });

  // Categorias
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Categoría", "Cantidad"]],
    body: Object.entries(categorias).map(([cat, cantidad]) => [cat, cantidad]),
  });

  // Totales
  doc.setFontSize(11);
  doc.text(
    `Ingreso total del año: $${total.toLocaleString()}`,
    14,
    doc.lastAutoTable.finalY + 15
  );
  doc.text(
    `Total reinvertido: $${totalReinversion.toLocaleString()}`,
    14,
    doc.lastAutoTable.finalY + 22
  );

  doc.save(`Reporte_MJShop_${anio}.pdf`);
};
