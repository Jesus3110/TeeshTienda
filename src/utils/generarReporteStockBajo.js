import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import { getDatabase, ref, get } from "firebase/database";

export const generarReporteStockBajo = async () => {
  const db = getDatabase();
  const productosSnap = await get(ref(db, "productos"));

  if (!productosSnap.exists()) {
    alert("❌ No se encontraron productos");
    return;
  }

  const productos = Object.entries(productosSnap.val()).map(([id, val]) => ({
    idFirebase: id,
    ...val,
  }));

  const productosFaltantes = productos.filter((p) => {
    const stockMin = typeof p.stockMinimo === "number" ? p.stockMinimo : 5;
    return p.activo && p.stock <= stockMin;
  });

  if (productosFaltantes.length === 0) {
    alert("✅ No hay productos con stock bajo. ¡Todo en orden!");
    return;
  }

  const fechaHoy = new Date();
  const fechaTexto = `${fechaHoy.toLocaleDateString()} ${fechaHoy.toLocaleTimeString()}`;
  const anioActual = fechaHoy.getFullYear();

  const doc = new jsPDF();
  const img = new Image();
  img.src = logo;
  doc.addImage(img, "PNG", 10, 10, 33, 20);

  doc.setFontSize(16);
  doc.text("M&J SHOP", 105, 20, null, null, "center");
  doc.setFontSize(12);
  doc.text("Reporte de Productos con Stock Bajo", 105, 28, null, null, "center");
  doc.setFontSize(10);
  doc.text(`Generado el ${fechaTexto}`, 200, 10, null, null, "right");

  autoTable(doc, {
    startY: 45,
    head: [["Producto", "Categoría", "Stock", "Stock mínimo"]],
    body: productosFaltantes.map((p) => [
      p.nombre,
      p.categoria,
      p.stock,
      p.stockMinimo || 5,
    ]),
    headStyles: {
      fillColor: [220, 53, 69], // rojo alerta
      textColor: 255,
      fontStyle: "bold",
      halign: "center"
    },
    bodyStyles: {
      fillColor: [255, 245, 245],
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'left' },
      2: { halign: 'center' },
      3: { halign: 'center' }
    }
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.text(`Página ${i} de ${pageCount}`, 14, pageHeight - 10);
    doc.text(`@M&JShop${anioActual}`, pageWidth - 14, pageHeight - 10, { align: "right" });
  }

  doc.save(`Reporte_MJShop_Stock_Bajo_${fechaHoy.toLocaleDateString().replaceAll("/", "-")}.pdf`);
};
