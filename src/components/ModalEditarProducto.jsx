import React, { useState, useEffect } from "react";
import { getDatabase, ref, update, onValue } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../styles/modal.css";

const ModalEditarProducto = ({ producto, onClose }) => {
  const [formData, setFormData] = useState({ ...producto });
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errores, setErrores] = useState({});
  const [exitoVisible, setExitoVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [sinCambiosVisible, setSinCambiosVisible] = useState(false);

  useEffect(() => {
    setFormData({ ...producto });
    const db = getDatabase();
     const refCategorias = ref(db, "categorias");
    
      onValue(refCategorias, (snapshot) => {
        const data = snapshot.val() || {};
        const lista = Object.values(data)
          .filter((cat) => cat.activa) // solo activas
          .map((cat) => cat.nombre);
        setCategorias(lista);
      });
  }, [producto]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen" && files.length > 0) {
      setNuevaImagen(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!formData.nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    if (!formData.descripcion) nuevosErrores.descripcion = "La descripción es obligatoria";
    if (!formData.precio) nuevosErrores.precio = "El precio es obligatorio";
    if (!formData.stock) nuevosErrores.stock = "El stock es obligatorio";
    if (!formData.categoria) nuevosErrores.categoria = "Selecciona una categoría";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
  
    // Verifica si hay cambios
    const comparacion = {
      ...formData,
      imagen: nuevaImagen ? "" : formData.imagen // evita confusión por Blob vs string
    };
  
    const original = {
      ...producto,
      imagen: formData.imagen
    };
  
    if (JSON.stringify(comparacion) === JSON.stringify(original)) {
      setSinCambiosVisible(true);
      return;
    }
  
    setSubiendo(true);
    try {
      let urlImagen = formData.imagen;
  
      if (nuevaImagen) {
        const storage = getStorage();
        const imagenRef = sRef(storage, `productos/${uuidv4()}_${nuevaImagen.name}`);
        await uploadBytes(imagenRef, nuevaImagen);
        urlImagen = await getDownloadURL(imagenRef);
      }
  
      const db = getDatabase();
      const productoRef = ref(db, `productos/${producto.idFirebase}`);
  
      await update(productoRef, {
        ...formData,
        imagen: urlImagen,
        updatedAt: Date.now()
      });
  
      setExitoVisible(true);
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      setErrorMensaje(err.message || "Error al actualizar");
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
            <h3>✅ Producto actualizado correctamente</h3>
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
            <h2>Editar Producto</h2>
            <form onSubmit={handleSubmit}>
              <input name="nombre" value={formData.nombre} onChange={handleChange}
                     placeholder="Nombre" style={{ borderColor: errores.nombre ? 'red' : undefined }} />
              {errores.nombre && <small style={{ color: "red" }}>{errores.nombre}</small>}

              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange}
                        placeholder="Descripción" style={{ borderColor: errores.descripcion ? 'red' : undefined }} />
              {errores.descripcion && <small style={{ color: "red" }}>{errores.descripcion}</small>}

              <input name="precio" type="number" value={formData.precio} onChange={handleChange}
                     placeholder="Precio" style={{ borderColor: errores.precio ? 'red' : undefined }} />
              {errores.precio && <small style={{ color: "red" }}>{errores.precio}</small>}

              <input name="stock" type="number" value={formData.stock} onChange={handleChange}
                     placeholder="Stock" style={{ borderColor: errores.stock ? 'red' : undefined }} />
              {errores.stock && <small style={{ color: "red" }}>{errores.stock}</small>}

              <select
  name="categoria"
  value={formData.categoria}
  onChange={handleChange}
  style={{ borderColor: errores.categoria ? "red" : undefined }}
>
  <option value="">-- Selecciona una categoría --</option>
  {categorias.map((cat) => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>

              {errores.categoria && <small style={{ color: "red" }}>{errores.categoria}</small>}

              {formData.imagen && (
  <div style={{ marginBottom: "10px" }}>
    <p>Imagen actual:</p>
    <img src={formData.imagen} alt="Vista previa" width="100" />
  </div>
)}

<input name="imagen" type="file" accept="image/*" onChange={handleChange} />


              <button type="submit" disabled={subiendo}>
                {subiendo ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" onClick={onClose}>Cancelar</button>
            </form>
          </div>
          {sinCambiosVisible && (
  <div className="modal-backdrop">
    <div className="modal-form">
      <h3 style={{ color: "#555" }}>⚠️ No se detectaron cambios en el producto</h3>
      <button onClick={() => setSinCambiosVisible(false)}>Aceptar</button>
    </div>
  </div>
)}

        </div>
      )}
    </>
  );
};

export default ModalEditarProducto;
