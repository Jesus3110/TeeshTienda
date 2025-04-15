import React, { useState, useEffect } from "react"; // ¡incluye useEffect!
import { getDatabase, ref, set, get, onValue } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../styles/modal.css";




const ModalFormularioProducto = ({ onClose }) => {
  const [categorias, setCategorias] = useState([]);
  const [exitoVisible, setExitoVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
const [errorMensaje, setErrorMensaje] = useState("");
const [errores, setErrores] = useState({});



useEffect(() => {
  const db = getDatabase();
  const refCategorias = ref(db, "categorias");

  onValue(refCategorias, (snapshot) => {
    const data = snapshot.val() || {};
    const lista = Object.values(data)
      .filter((cat) => cat.activa) // solo activas
      .map((cat) => cat.nombre);
    setCategorias(lista);
  });
}, []);


  const [producto, setProducto] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    categoria: "Ropa",
    imagen: null,
  });

  const [subiendo, setSubiendo] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      setProducto((prev) => ({ ...prev, imagen: files[0] }));
    } else {
      setProducto((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = {};
  
    if (!producto.nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    if (!producto.descripcion) nuevosErrores.descripcion = "La descripción es obligatoria";
    if (!producto.precio) nuevosErrores.precio = "El precio es obligatorio";
    if (!producto.stock) nuevosErrores.stock = "El stock es obligatorio";
  
    setErrores(nuevosErrores);
  
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }
    setSubiendo(true);
    try {
      const db = getDatabase();
      const productosRef = ref(db, "productos");

      const snapshot = await get(productosRef);
      const data = snapshot.val() || {};
      const nuevoID = Object.keys(data).length + 1;

      let urlImagen = "";
      if (producto.imagen) {
        const storage = getStorage();
        const imagenRef = sRef(storage, `productos/${uuidv4()}_${producto.imagen.name}`);
        await uploadBytes(imagenRef, producto.imagen);
        urlImagen = await getDownloadURL(imagenRef);
      }

      const nuevoProducto = {
        id: nuevoID,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: parseFloat(producto.precio),
        stock: parseInt(producto.stock),
        categoria: producto.categoria,
        imagen: urlImagen,
        activo: true,
        destacado: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
      };

      const newRef = ref(db, `productos/${uuidv4()}`);
      await set(newRef, nuevoProducto);
      setExitoVisible(true);
    } catch (error) {
      setErrorMensaje(error.message || "Error al subir producto");
setErrorVisible(true);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <>
      {exitoVisible ? (
        <div className="modal-backdrop">
          <div className="modal-form">
            <h3>✅ Producto agregado correctamente</h3>
            <button onClick={onClose}>Aceptar</button>
          </div>
        </div>
      ) : errorVisible ? (
        <div className="modal-backdrop">
          <div className="modal-form">
            <h3 style={{ color: "red" }}>❌ {errorMensaje}</h3>
            <button onClick={onClose}>Cerrar</button>
          </div>
        </div>
      ) : (
        <div className="modal-backdrop">
          <div className="modal-form">
            <h2>Agregar Producto</h2>
            <form onSubmit={handleSubmit}>
  <input
    name="nombre"
    placeholder="Nombre"
    onChange={handleChange}
    style={{ borderColor: errores.nombre ? 'red' : undefined }}
  />
  {errores.nombre && <small style={{ color: "red" }}>{errores.nombre}</small>}

  <textarea
    name="descripcion"
    placeholder="Descripción"
    onChange={handleChange}
    style={{ borderColor: errores.descripcion ? 'red' : undefined }}
  />
  {errores.descripcion && <small style={{ color: "red" }}>{errores.descripcion}</small>}

  <input
    name="precio"
    type="number"
    placeholder="Precio"
    onChange={handleChange}
    style={{ borderColor: errores.precio ? 'red' : undefined }}
  />
  {errores.precio && <small style={{ color: "red" }}>{errores.precio}</small>}

  <input
    name="stock"
    type="number"
    placeholder="Stock"
    onChange={handleChange}
    style={{ borderColor: errores.stock ? 'red' : undefined }}
  />
  {errores.stock && <small style={{ color: "red" }}>{errores.stock}</small>}

  <select
  name="categoria"
  value={producto.categoria}
  onChange={handleChange}
  style={{ borderColor: errores.categoria ? "red" : undefined }}
>
  <option value="">-- Selecciona una categoría --</option>
  {categorias.map((cat) => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>


  {errores.categoria && <small style={{ color: "red" }}>{errores.categoria}</small>}

  <input
    name="imagen"
    type="file"
    accept="image/*"
    onChange={handleChange}
  />

  <button type="submit" disabled={subiendo}>
    {subiendo ? "Subiendo..." : "Agregar"}
  </button>
  <button type="button" onClick={onClose}>Cancelar</button>
</form>

          </div>
        </div>
      )}
    </>
  );
  
};

export default ModalFormularioProducto;
