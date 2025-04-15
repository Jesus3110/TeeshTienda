import { getDatabase, ref, push, onValue } from "firebase/database";
import { app } from "../firebase/firebaseConfig";

const db = getDatabase(app);

// Guardar producto
export const agregarProducto = (producto) => {
  const productosRef = ref(db, "productos");
  push(productosRef, producto);
};

// Obtener productos
// Obtener productos
export const escucharProductos = (callback) => {
  const productosRef = ref(db, "productos");
  onValue(productosRef, (snapshot) => {
    const data = snapshot.val();
    const productos = data
      ? Object.entries(data).map(([idFirebase, value]) => ({ idFirebase, ...value }))
      : [];
    callback(productos);
  });
};
