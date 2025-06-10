import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { guardarBanner } from "../services/bannersService";

function ModalBanner({ banner, onClose, onGuardarExitoso }) {
  const [formData, setFormData] = useState({
    titulo: banner?.titulo || "",
    activo: banner?.activo !== false,
    imagenURL: banner?.imagenURL || "",
    descuentoId: banner?.descuentoId || "",
    porcentaje: banner?.porcentaje || "",
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [descuentosDisponibles, setDescuentosDisponibles] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const descuentosRef = ref(db, "descuentos");
    onValue(descuentosRef, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data).map(([id, value]) => ({
        id,
        nombre: value.nombre || `Descuento ${value.porcentaje}%`,
        porcentaje: value.porcentaje,
      }));
      setDescuentosDisponibles(lista);
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setImagenFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      await guardarBanner(formData, imagenFile, banner?.id);
      onGuardarExitoso();
      onClose();
    } catch (error) {
      console.error("Error guardando banner:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-form">
        <h2 className="modal-title">{banner ? "Editar Banner" : "Nuevo Banner"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título:</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Título del banner"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descuento asociado:</label>
            <select
              name="descuentoId"
              value={formData.descuentoId}
              onChange={(e) => {
                const id = e.target.value;
                const selected = descuentosDisponibles.find((d) => d.id === id);
                setFormData((prev) => ({
                  ...prev,
                  descuentoId: id,
                  porcentaje: selected ? selected.porcentaje : "",
                }));
              }}
              className="form-input"
            >
              <option value="">-- Selecciona un descuento --</option>
              {descuentosDisponibles.map((desc) => (
                <option key={desc.id} value={desc.id}>
                  {desc.nombre} ({desc.porcentaje}%)
                </option>
              ))}
            </select>
            {formData.descuentoId && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    descuentoId: "",
                    porcentaje: "",
                    titulo: "",
                  }));
                }}
                className="btn-table btn-delete"
              >
                🧹 Quitar descuento
              </button>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Porcentaje visual:</label>
            <input
              type="number"
              name="porcentaje"
              value={formData.porcentaje}
              onChange={handleInputChange}
              min={1}
              max={100}
              placeholder="Ej. 25"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="switch-label">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleInputChange}
                className="custom-checkbox"
              />
              Banner activo
            </label>
          </div>
          {formData.imagenURL && (
            <div className="form-group">
              <label className="form-label">Imagen actual:</label>
              <img
                src={formData.imagenURL}
                alt="Banner actual"
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{banner ? "Nueva imagen (opcional)" : "Imagen (requerida)"}</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              required={!banner}
              className="form-input"
            />
          </div>
          <div className="form-actions">
            <button
              type="submit"
              disabled={cargando}
              className="btn-red"
            >
              {cargando ? "Guardando..." : "Guardar"}
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
      </div>
    </div>
  );
}

export default ModalBanner;
