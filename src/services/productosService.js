import { getDatabase, ref, push, onValue, update, remove } from "firebase/database";
import { app } from "../firebase/firebaseConfig";

const db = getDatabase(app);

// Guardar producto
export const agregarProducto = (producto) => {
  const productosRef = ref(db, "productos");
  return push(productosRef, producto);
};

// Obtener productos
export const escucharProductos = (callback) => {
  const productosRef = ref(db, "productos");
  return onValue(productosRef, (snapshot) => {
    const data = snapshot.val();
    const productos = data
      ? Object.entries(data).map(([idFirebase, value]) => ({ 
          idFirebase, 
          ...value,
          // Asegurar que descuentoId esté definido
          descuentoId: value.descuentoId || null
        }))
      : [];
    callback(productos);
  });
};

// Actualizar producto
export const actualizarProducto = (id, datosActualizados) => {
  const productoRef = ref(db, `productos/${id}`);
  return update(productoRef, datosActualizados);
};

// Eliminar producto
export const eliminarProducto = (id) => {
  const productoRef = ref(db, `productos/${id}`);
  return remove(productoRef);
};

// Toggle estado activo
export const toggleActivoProducto = (id, estadoActual) => {
  const productoRef = ref(db, `productos/${id}`);
  return update(productoRef, { activo: !estadoActual });
};