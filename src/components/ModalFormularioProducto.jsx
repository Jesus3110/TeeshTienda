import React, { useState, useEffect } from "react";
import { getDatabase, ref, set, get, onValue } from "firebase/database";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../styles/modal.css";

function calcularPrecioConComision(precioNetoDeseado) {
  const porcentajeStripe = 0.036;
  const fijoStripe = 3.0;
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
  const [imagenes, setImagenes] = useState([]); // varias imágenes
  const [imagenPrincipal, setImagenPrincipal] = useState(null); // index o id de la principal
  const [colores, setColores] = useState([]);
  const [colorNuevo, setColorNuevo] = useState("#000000"); // hex por defecto
  const [tieneColores, setTieneColores] = useState(false);


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
        const descuentosArray = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((desc) => desc.validoHasta > ahora);

        setDescuentosDisponibles(descuentosArray);
      }
    });

    return () => unsubscribeDescuentos();
  }, []);

  useEffect(() => {
    if (!aplicarDescuento && producto.precioOriginal) {
      setProducto((prev) => ({
        ...prev,
        precio: prev.precioOriginal,
        precioOriginal: null,
        descuentoAplicado: null,
      }));
      setDescuentoSeleccionado(null);
      setPrecioConDescuento(0);
    }
  }, [aplicarDescuento]);

  const calcularPrecioConDescuento = (precio, porcentaje) => {
    return precio - precio * (porcentaje / 100);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      setProducto((prev) => ({ ...prev, imagen: files[0] }));
    } else if (name === "precio") {
      setProducto((prev) => ({
        ...prev,
        precio: value, // SIEMPRE el precio base, sin descuento ni comisión
        precioOriginal: value,
      }));
      if (aplicarDescuento && descuentoSeleccionado) {
        setPrecioConDescuento(
          calcularPrecioConDescuento(
            parseFloat(value),
            descuentoSeleccionado.porcentaje
          )
        );
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
      const descuento = descuentosDisponibles.find((d) => d.id === descuentoId);
      setDescuentoSeleccionado(descuento);
      if (descuento && producto.precio) {
        const precioNum = parseFloat(producto.precio);
        setPrecioConDescuento(
          calcularPrecioConDescuento(precioNum, descuento.porcentaje)
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = {};

    if (!producto.nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    if (!producto.descripcion)
      nuevosErrores.descripcion = "La descripción es obligatoria";
    if (!producto.precio) nuevosErrores.precio = "El precio es obligatorio";
    if (!producto.stock) nuevosErrores.stock = "El stock es obligatorio";
    if (!producto.marca) nuevosErrores.marca = "La marca es obligatoria";
    if (aplicarDescuento && !descuentoSeleccionado)
      nuevosErrores.descuento = "Debes seleccionar un descuento";

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

      const storage = getStorage();
      const urls = [];

      for (const img of imagenes) {
        const imgRef = sRef(storage, `productos/${uuidv4()}_${img.name}`);
        await uploadBytes(imgRef, img);
        const url = await getDownloadURL(imgRef);
        urls.push(url);
      }

      const urlImagenPrincipal = urls[imagenPrincipal] || urls[0];

      const precioOriginal = parseFloat(
        producto.precioOriginal || producto.precio
      );

      const precioBase =
        aplicarDescuento && descuentoSeleccionado
          ? calcularPrecioConDescuento(
              precioOriginal,
              descuentoSeleccionado.porcentaje
            )
          : precioOriginal;

      const precioFinal = calcularPrecioConComision(precioBase); // ✅ Aquí se aplica la comisión

      const nuevoProducto = {
        id: nuevoID,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: precioFinal,
        precioOriginal: precioOriginal,
        stock: parseInt(producto.stock),
        marca: producto.marca,
        categoria: producto.categoria,
        imagen: urlImagenPrincipal,
        imagenes: urls,
        colores: colores,
        activo: true,
        destacado: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
        descuentoAplicado: aplicarDescuento ? descuentoSeleccionado?.id : null,
      };

      console.log("Quiero ganar:", precioOriginal);
      console.log("Precio con descuento (si aplica):", precioBase);
      console.log("Precio final para el cliente (con comisión):", precioFinal);

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
    <div className="modal-backdrop">
      <div className="modal-form">
        {exitoVisible ? (
          <>
            <h3 className="modal-title">✅ Producto agregado correctamente</h3>
            <button className="btn-red" onClick={onClose}>
              Aceptar
            </button>
          </>
        ) : errorVisible ? (
          <>
            <h3 className="modal-title" style={{ color: "red" }}>
              ❌ {errorMensaje}
            </h3>
            <button className="btn-table btn-delete" onClick={onClose}>
              Cerrar
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="modal-title">Agregar Producto</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre:
              </label>
              <input
                name="nombre"
                id="nombre"
                placeholder="Nombre del producto"
                value={producto.nombre}
                onChange={handleChange}
                className="form-input"
              />
              {errores.nombre && (
                <div className="form-error">{errores.nombre}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="descripcion">
                Descripción:
              </label>
              <textarea
                name="descripcion"
                id="descripcion"
                placeholder="Descripción"
                value={producto.descripcion}
                onChange={handleChange}
                className="form-input"
              />
              {errores.descripcion && (
                <div className="form-error">{errores.descripcion}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="precio">
                Precio:
              </label>
              <input
                name="precio"
                id="precio"
                type="number"
                placeholder="Precio deseado (lo que tú quieres ganar)"
                onChange={handleChange}
                className={`form-input${errores.precio ? " error" : ""}`}
              />
              {errores.precio && (
                <div className="form-error">{errores.precio}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="stock">
                Stock:
              </label>
              <input
                name="stock"
                id="stock"
                type="number"
                placeholder="Cantidad en stock"
                onChange={handleChange}
                className={`form-input${errores.stock ? " error" : ""}`}
              />
              {errores.stock && (
                <div className="form-error">{errores.stock}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="marca">
                Marca:
              </label>
              <input
                name="marca"
                id="marca"
                placeholder="Marca del producto"
                value={producto.marca}
                onChange={handleChange}
                className={`form-input${errores.marca ? " error" : ""}`}
              />
              {errores.marca && (
                <div className="form-error">{errores.marca}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Categoría:</label>
              <select
                name="categoria"
                value={producto.categoria}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">-- Selecciona una categoría --</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errores.categoria && (
                <div className="form-error">{errores.categoria}</div>
              )}
            </div>
            <div className="form-group">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={aplicarDescuento}
                  onChange={() => setAplicarDescuento(!aplicarDescuento)}
                  className="custom-checkbox"
                />
                ¿Aplicar descuento?
              </label>
            </div>
            {aplicarDescuento && (
              <div className="form-group">
                <label className="form-label">Seleccionar descuento:</label>
                <select
                  name="descuento"
                  onChange={handleDescuentoChange}
                  value={descuentoSeleccionado?.id || ""}
                  className="form-input"
                >
                  <option value="">-- Seleccione un descuento --</option>
                  {descuentosDisponibles.map((descuento) => (
                    <option key={descuento.id} value={descuento.id}>
                      {descuento.porcentaje}% - Válido hasta{" "}
                      {new Date(descuento.validoHasta).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                {descuentoSeleccionado && producto.precio && (
                  <div className="descuento-info">
                    <p>
                      <strong>Precio original:</strong> $
                      {parseFloat(producto.precio).toFixed(2)}
                    </p>
                    <p>
                      <strong>Descuento:</strong>{" "}
                      {descuentoSeleccionado.porcentaje}%
                    </p>
                    <p>
                      <strong>Precio final:</strong> $
                      {precioConDescuento.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="form-group">
  <label className="switch-label">
    <input
      type="checkbox"
      checked={tieneColores}
      onChange={() => setTieneColores(!tieneColores)}
      className="custom-checkbox"
    />
    ¿Este producto tiene varios colores?
  </label>
</div>
{tieneColores && (
  <div className="form-group">
    <label className="form-label">Colores disponibles:</label>
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <input
        type="color"
        value={colorNuevo}
        onChange={(e) => setColorNuevo(e.target.value)}
        style={{ width: "50px", height: "40px", border: "none" }}
      />
      <button
        type="button"
        className="btn-table"
        onClick={() => {
          if (!colores.includes(colorNuevo)) {
            setColores([...colores, colorNuevo]);
          }
        }}
      >
        Agregar color
      </button>
    </div>

    {colores.length > 0 && (
      <div className="color-list" style={{ marginTop: "0.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {colores.map((hex, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                backgroundColor: hex,
                borderRadius: "50%",
                border: "1px solid #ccc",
              }}
            />
            <span>{hex}</span>
            <button type="button" onClick={() => setColores(colores.filter((_, i) => i !== idx))}>
              ❌
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}


            <div className="form-group">
              <label className="form-label">Imagenes:</label>
              <input
                name="imagenes"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setImagenes(files);
                  setImagenPrincipal(0); // por defecto, la primera imagen
                }}
                className="form-input"
              />
              {imagenes.length > 0 && (
  <div className="preview-grid">
    {imagenes.map((imgUrl, index) => (
      <div
        key={index}
        className={`preview-img-container ${imagenPrincipal === index ? "principal" : ""}`}
      >
        <img
          src={imgUrl instanceof File ? URL.createObjectURL(imgUrl) : imgUrl}
          alt={`img-${index}`}
          onClick={() => setImagenPrincipal(index)}
        />
        <button
          type="button"
          className="btn-remove-img"
          onClick={() => {
            const nuevas = [...imagenes];
            nuevas.splice(index, 1);
            setImagenes(nuevas);

            // si se elimina la principal, actualizar el índice
            if (imagenPrincipal === index) {
              setImagenPrincipal(0);
            } else if (imagenPrincipal > index) {
              setImagenPrincipal(imagenPrincipal - 1);
            }
          }}
        >
          ❌
        </button>
      </div>
    ))}
  </div>
)}

            </div>
            <div className="form-actions">
              <button type="submit" disabled={subiendo} className="btn-red">
                {subiendo ? "Subiendo..." : "Agregar Producto"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-table btn-delete"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalFormularioProducto;
