import React, { useState, useEffect } from "react";
import { getDatabase, ref, update, onValue } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../styles/modal.css";

const ModalEditarProducto = ({ producto,descuentos, onClose }) => {
  const [formData, setFormData] = useState({ ...producto });
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errores, setErrores] = useState({});
  const [exitoVisible, setExitoVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [descuentosDisponibles, setDescuentosDisponibles] = useState([]);
  const [aplicarDescuento, setAplicarDescuento] = useState(!!producto.descuentoAplicado);
  const [descuentoSeleccionado, setDescuentoSeleccionado] = useState(null);
  const [precioConDescuento, setPrecioConDescuento] = useState(0);
  const [sinCambiosVisible, setSinCambiosVisible] = useState(false);

useEffect(() => {
  setFormData({ ...producto });

  // Mostrar todos o solo válidos
  const ahora = Date.now();
  const descuentosValidos = descuentos.filter(desc =>
    desc.validoHasta instanceof Date && desc.validoHasta.getTime() > ahora
  );

  setDescuentosDisponibles(descuentosValidos);

  // Si el producto ya tiene un descuento aplicado
  if (producto.descuentoAplicado) {
    const descuentoActual = descuentosValidos.find(d => d.id === producto.descuentoAplicado);
    setDescuentoSeleccionado(descuentoActual);

    if (descuentoActual && producto.precioOriginal) {
      setPrecioConDescuento(
        producto.precioOriginal - (producto.precioOriginal * (descuentoActual.porcentaje / 100))
      );
    }
  }

  // Cargar categorías desde Firebase
  const db = getDatabase();
  const refCategorias = ref(db, "categorias");
  const unsubscribeCategorias = onValue(refCategorias, (snapshot) => {
    const data = snapshot.val() || {};
    const lista = Object.values(data)
      .filter((cat) => cat.activa)
      .map((cat) => cat.nombre);
    setCategorias(lista);
  });

  return () => unsubscribeCategorias();
}, [producto, descuentos]);



  const calcularPrecioConDescuento = (precio, porcentaje) => {
    return precio - (precio * (porcentaje / 100));
  };

  const handleDescuentoChange = (e) => {
    const descuentoId = e.target.value;
    if (descuentoId === "") {
      setDescuentoSeleccionado(null);
      setPrecioConDescuento(0);
    } else {
      const descuento = descuentosDisponibles.find(d => d.id === descuentoId);
      setDescuentoSeleccionado(descuento);
      if (descuento && formData.precioOriginal) {
        setPrecioConDescuento(calcularPrecioConDescuento(formData.precioOriginal, descuento.porcentaje));
      }
    }
  };

  // Dentro de tu componente ModalEditarProducto...

const handleChange = (e) => {
  const { name, value, files } = e.target;

  if (name === "imagen" && files.length > 0) {
    setNuevaImagen(files[0]);
  } else if (name === "precio") {
    // Permitimos borrar el campo
    const precio = value === '' ? '' : parseFloat(value);

    if (aplicarDescuento) {
      setFormData(prev => ({
        ...prev,
        precioOriginal: precio
      }));

      if (descuentoSeleccionado && precio !== '') {
        setPrecioConDescuento(calcularPrecioConDescuento(precio, descuentoSeleccionado.porcentaje));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        precio: precio
      }));
    }
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
      imagen: nuevaImagen ? "" : formData.imagen,
      precio: aplicarDescuento && descuentoSeleccionado ? precioConDescuento : formData.precio,
      descuentoAplicado: aplicarDescuento ? descuentoSeleccionado?.id : null
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
  
      const precioFinal = aplicarDescuento && descuentoSeleccionado ? 
        precioConDescuento : parseFloat(formData.precio);
  
      const db = getDatabase();
      const productoRef = ref(db, `productos/${producto.idFirebase}`);
  
      await update(productoRef, {
        ...formData,
        imagen: urlImagen,
        precio: precioFinal,
        precioOriginal: formData.precioOriginal || parseFloat(formData.precio),
        descuentoAplicado: aplicarDescuento ? descuentoSeleccionado?.id : null,
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
              <div className="form-group">
                <label>Nombre:</label>
                <input 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange}
                  placeholder="Nombre del producto"
                  style={{ borderColor: errores.nombre ? 'red' : undefined }} 
                />
                {errores.nombre && <small style={{ color: "red" }}>{errores.nombre}</small>}
              </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea 
                  name="descripcion" 
                  value={formData.descripcion} 
                  onChange={handleChange}
                  placeholder="Descripción del producto"
                  style={{ borderColor: errores.descripcion ? 'red' : undefined }} 
                />
                {errores.descripcion && <small style={{ color: "red" }}>{errores.descripcion}</small>}
              </div>

              <div className="form-group">
                <label>Precio:</label>
                <input 
                  name="precio" 
                  type="number" 
                  value={aplicarDescuento ? formData.precioOriginal : formData.precio} 
                  onChange={handleChange}
                  placeholder="Precio del producto"
                  style={{ borderColor: errores.precio ? 'red' : undefined }} 
                />
                {errores.precio && <small style={{ color: "red" }}>{errores.precio}</small>}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={aplicarDescuento}
                    onChange={() => {
                      setAplicarDescuento(!aplicarDescuento);
                      if (!aplicarDescuento && !formData.precioOriginal) {
                        setFormData(prev => ({
                          ...prev,
                          precioOriginal: parseFloat(prev.precio)
                        }));
                      }
                    }}
                  />
                  ¿Aplicar descuento?
                </label>
              </div>

              {aplicarDescuento && (
                <div className="form-group">
                  <label>Seleccionar descuento:</label>
                  <select
                    name="descuento"
                    onChange={handleDescuentoChange}
                    value={descuentoSeleccionado?.id || ''}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Seleccione un descuento --</option>
                    {descuentosDisponibles.map((descuento) => (
                      <option key={descuento.id} value={descuento.id}>
                        {descuento.porcentaje}% - Válido hasta {new Date(descuento.validoHasta).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  
                  {descuentoSeleccionado && formData.precioOriginal && (
                    <div className="descuento-info">
                      <p><strong>Precio original:</strong> ${formData.precioOriginal.toFixed(2)}</p>
                      <p><strong>Descuento:</strong> {descuentoSeleccionado.porcentaje}%</p>
                      <p><strong>Precio final:</strong> ${precioConDescuento.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Stock:</label>
                <input 
                  name="stock" 
                  type="number" 
                  value={formData.stock} 
                  onChange={handleChange}
                  placeholder="Cantidad en stock"
                  style={{ borderColor: errores.stock ? 'red' : undefined }} 
                />
                {errores.stock && <small style={{ color: "red" }}>{errores.stock}</small>}
              </div>

              <div className="form-group">
                <label>Categoría:</label>
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
              </div>

              <div className="form-group">
                <label>Imagen:</label>
                {formData.imagen && (
                  <div style={{ marginBottom: "10px" }}>
                    <p>Imagen actual:</p>
                    <img src={formData.imagen} alt="Vista previa" width="100" />
                  </div>
                )}
                <input name="imagen" type="file" accept="image/*" onChange={handleChange} />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={subiendo} className="btn-primary">
                  {subiendo ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancelar
                </button>
              </div>
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