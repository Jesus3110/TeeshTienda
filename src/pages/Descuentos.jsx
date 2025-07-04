import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import ModalDescuento from "../components/ModalDescuento";
import ModalEditarDescuento from "../components/ModalEditarDescuento";
import "../styles/modal.css";
import "../styles/descuentos.css";
import { escucharProductos } from "../services/productosService";

const Descuentos = () => {
  const [descuentos, setDescuentos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [descuentoEditar, setDescuentoEditar] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const db = getDatabase();

    // Cargar descuentos
    const descuentosRef = ref(db, "descuentos");
const unsubscribeDescuentos = onValue(descuentosRef, async (snapshot) => {
  const data = snapshot.val() || {};
  const ahora = Date.now();
  const listaFinal = [];

  for (const [id, value] of Object.entries(data)) {
    const validoHasta = value.validoHasta ? new Date(value.validoHasta) : null;

    // Si el descuento ya expiró, lo eliminamos
    if (validoHasta instanceof Date && validoHasta.getTime() <= ahora) {
      const refDescuento = ref(db, `descuentos/${id}`);
      await remove(refDescuento);

      // También limpiamos el descuento en los productos relacionados
      productos.forEach((p) => {
        if (p.descuentoAplicado && p.descuentoAplicado === id) {
          const refProducto = ref(db, `productos/${p.idFirebase}`);
          update(refProducto, {
            descuentoAplicado: null,
            precio: p.precioOriginal || p.precio,
            precioOriginal: null
          });
        }
      });
    } else {
      // Si aún es válido, lo añadimos a la lista final
      listaFinal.push({
        id,
        ...value,
        validoHasta
      });
    }
  }

  setDescuentos(listaFinal);
  setCargando(false);
});


    // Cargar productos
    const unsubscribeProductos = escucharProductos((productos) => {
      const productosConDescuentoId = productos.map(p => ({
        ...p,
        descuentoId: p.descuentoId || null
      }));
      setProductos(productosConDescuentoId);
    });

    return () => {
      unsubscribeDescuentos();
      unsubscribeProductos();
    };
  }, []);

  const eliminarDescuento = async (id) => {
    const confirmar = window.confirm("¿Estás seguro de que quieres eliminar este descuento?");
    if (!confirmar) return;

    const db = getDatabase();
    const refDescuento = ref(db, `descuentos/${id}`);
    try {
      await remove(refDescuento);
      
      // Actualizar productos que tenían este descuento
      const productosConDescuento = productos.filter(p => 
        p.descuentoAplicado && p.descuentoAplicado.toString().trim() === id.toString().trim()
      );
      if (productosConDescuento.length > 0) {
        for (const p of productosConDescuento) {
          const refProducto = ref(db, `productos/${p.idFirebase}`);
          await update(refProducto, {
            descuentoAplicado: null,
            precio: p.precioOriginal || p.precio,
            precioOriginal: null
          });
        }
      }
      // Limpiar banner relacionado si existe
      const bannersRef = ref(db, "banners");
      onValue(bannersRef, (snap) => {
        const banners = snap.val() || {};
        Object.entries(banners).forEach(([bannerId, banner]) => {
          if (banner.descuentoId === id) {
            const refBanner = ref(db, `banners/${bannerId}`);
            update(refBanner, {
              porcentaje: null,
              titulo: null,
              descuentoId: null,
            });
          }
        });
      }, { onlyOnce: true });
    } catch (error) {
      console.error("Error al eliminar descuento:", error);
    }
  };

  // Contar productos con este descuento (versión mejorada)
  const contarProductosConDescuento = (descuentoId) => {
    if (!descuentoId) return 0;
    return productos.filter(p => 
      p.descuentoAplicado && p.descuentoAplicado.toString().trim() === descuentoId.toString().trim()
    ).length;
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "No definido";
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (cargando) {
    return <div className="cargando">Cargando descuentos...</div>;
  }

  return (
    <div className="descuentos-admin">
      <h2>Gestión de Descuentos</h2>

      <div className="filtros-productos-flex filtros-descuentos-compact">
        <button onClick={() => setMostrarModal(true)} className="btn-red">
          ➕ Agregar descuento
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descuento</th>
              <th>Productos</th>
              <th>Válido hasta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {descuentos.map((desc) => {
              const numProductos = contarProductosConDescuento(desc.id);
              return (
                <tr key={desc.id}>
                  <td>{desc.id.substring(0, 8)}...</td>
                  <td>{desc.porcentaje}%</td>
                  <td>
                    {numProductos > 0 ? (
                      <span className="badge">{numProductos} producto(s)</span>
                    ) : (
                      "Ninguno"
                    )}
                  </td>
                  <td>{formatearFecha(desc.validoHasta)}</td>
                  <td className="acciones">
                    <button 
                      className="btn-table btn-edit"
                      onClick={() => {
                        setDescuentoEditar(desc);
                        setMostrarEditar(true);
                      }}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn-table btn-delete"
                      onClick={() => eliminarDescuento(desc.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <ModalDescuento 
          onClose={() => setMostrarModal(false)} 
          descuentosExistentes={descuentos.map(d => d.id)}
        />
      )}

      {mostrarEditar && descuentoEditar && (
        <ModalEditarDescuento
          descuento={descuentoEditar}
          onClose={() => {
            setMostrarEditar(false);
            setDescuentoEditar(null);
          }}
        />
      )}
    </div>
  );
};

export default Descuentos;