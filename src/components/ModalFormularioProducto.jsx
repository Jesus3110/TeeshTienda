import React, { useState, useEffect } from "react";
import { getDatabase, ref, set, get, onValue } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../styles/modal.css";

function calcularPrecioConComision(precioNetoDeseado) {
  const porcentajeStripe = 0.036;
  const fijoStripe = 3.00;
  const iva = 0.16;

  const base = (precioNetoDeseado + fijoStripe) / (1 - porcentajeStripe);
  const ivaTotal = (base - precioNetoDeseado) * iva;
  const totalFinal = base + ivaTotal;

  return parseFloat(totalFinal.toFixed(2));
}


const ModalFormularioProducto = ({ onClose }) => {
  const [categorias, setCategorias] = useState([]);
  const [descuentosDisponibles, setDescuentosDisponibles] = useState([]);
  const [exitoVisible, setExitoVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");
  const [errores, setErrores] = useState({});
  const [aplicarDescuento, setAplicarDescuento] = useState(false);
  const [descuentoSeleccionado, setDescuentoSeleccionado] = useState(null);
  const [precioConDescuento, setPrecioConDescuento] = useState(0);

  const [producto, setProducto] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    categoria: "Ropa",
    imagen: null,
    precioOriginal: 0,
    descuentoAplicado: null,
     marca: "",
  });

  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    const refCategorias = ref(db, "categorias");
    const refDescuentos = ref(db, "descuentos");

    // Obtener categorías
    onValue(refCategorias, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.values(data)
        .filter((cat) => cat.activa)
        .map((cat) => cat.nombre);
      setCategorias(lista);
    });

    // Obtener descuentos vigentes
    const unsubscribeDescuentos = onValue(refDescuentos, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ahora = Date.now();
        const descuentosArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).filter(desc => desc.validoHasta > ahora);
        
        setDescuentosDisponibles(descuentosArray);
      }
    });

    return () => unsubscribeDescuentos();
  }, []);

  const calcularPrecioConDescuento = (precio, porcentaje) => {
    return precio - (precio * (porcentaje / 100));
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      setProducto((prev) => ({ ...prev, imagen: files[0] }));
    }  else if (name === "precio") {
  const precioDeseado = parseFloat(value);
  const precioBruto = calcularPrecioConComision(precioDeseado);
  setProducto((prev) => ({ 
    ...prev, 
    precio: precioBruto, 
    precioOriginal: precioBruto 
  }));
  if (descuentoSeleccionado) {
    setPrecioConDescuento(calcularPrecioConDescuento(precioBruto, descuentoSeleccionado.porcentaje));
  }
} else {
      setProducto((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDescuentoChange = (e) => {
    const descuentoId = e.target.value;
    if (descuentoId === "") {
      setDescuentoSeleccionado(null);
      setPrecioConDescuento(0);
    } else {
      const descuento = descuentosDisponibles.find(d => d.id === descuentoId);
      setDescuentoSeleccionado(descuento);
      if (descuento && producto.precio) {
        const precioNum = parseFloat(producto.precio);
        setPrecioConDescuento(calcularPrecioConDescuento(precioNum, descuento.porcentaje));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = {};
  
    if (!producto.nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    if (!producto.descripcion) nuevosErrores.descripcion = "La descripción es obligatoria";
    if (!producto.precio) nuevosErrores.precio = "El precio es obligatorio";
    if (!producto.stock) nuevosErrores.stock = "El stock es obligatorio";
    if (!producto.marca) nuevosErrores.marca = "La marca es obligatoria";

  
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

      const precioFinal = aplicarDescuento && descuentoSeleccionado ? 
  precioConDescuento : parseFloat(producto.precio);


      const nuevoProducto = {
        id: nuevoID,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: precioFinal,
        precioOriginal: parseFloat(producto.precio),
        stock: parseInt(producto.stock),
        marca: producto.marca,
        categoria: producto.categoria,
        imagen: urlImagen,
        activo: true,
        destacado: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
        descuentoAplicado: aplicarDescuento ? descuentoSeleccionado?.id : null,
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
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  name="nombre"
                  placeholder="Nombre del producto"
                  onChange={handleChange}
                  style={{ borderColor: errores.nombre ? 'red' : undefined }}
                />
                {errores.nombre && <small style={{ color: "red" }}>{errores.nombre}</small>}
              </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  name="descripcion"
                  placeholder="Descripción del producto"
                  onChange={handleChange}
                  style={{ borderColor: errores.descripcion ? 'red' : undefined }}
                />
                {errores.descripcion && <small style={{ color: "red" }}>{errores.descripcion}</small>}
              </div>

              <div className="form-group">
                <label>Precio deseado (lo que tú quieres ganar):</label>
                <input
                  name="precio"
                  type="number"
                  placeholder="Precio del producto"
                  onChange={handleChange}
                  style={{ borderColor: errores.precio ? 'red' : undefined }}
                />
                {errores.precio && <small style={{ color: "red" }}>{errores.precio}</small>}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={aplicarDescuento}
                    onChange={() => setAplicarDescuento(!aplicarDescuento)}
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
                  
                  {descuentoSeleccionado && producto.precio && (
                    <div className="descuento-info">
                      <p><strong>Precio original:</strong> ${parseFloat(producto.precio).toFixed(2)}</p>
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
                  placeholder="Cantidad en stock"
                  onChange={handleChange}
                  style={{ borderColor: errores.stock ? 'red' : undefined }}
                />
                {errores.stock && <small style={{ color: "red" }}>{errores.stock}</small>}
              </div>

              <div className="form-group">
  <label>Marca:</label>
  <input
    name="marca"
    placeholder="Marca del producto"
    value={producto.marca}
    onChange={handleChange}
    style={{ borderColor: errores.marca ? 'red' : undefined }}
  />
  {errores.marca && <small style={{ color: "red" }}>{errores.marca}</small>}
</div>


              <div className="form-group">
                <label>Categoría:</label>
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
              </div>

              <div className="form-group">
                <label>Imagen:</label>
                <input
                  name="imagen"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={subiendo} className="btn-primary">
                  {subiendo ? "Subiendo..." : "Agregar Producto"}
                </button>
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalFormularioProducto;