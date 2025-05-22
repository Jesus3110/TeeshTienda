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
        <h2>{banner ? "Editar Banner" : "Nuevo Banner"}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Título:
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Título del banner"
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Descuento asociado:
            </label>
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
              style={{ width: "100%", padding: "0.5rem" }}
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
                    titulo: "", // Descomenta esta línea si quieres limpiar también el título
                  }));
                }}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.4rem 0.8rem",
                  backgroundColor: "#999",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                🧹 Quitar descuento
              </button>
            )}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Porcentaje visual:
            </label>
            <input
              type="number"
              name="porcentaje"
              value={formData.porcentaje}
              onChange={handleInputChange}
              min={1}
              max={100}
              placeholder="Ej. 25"
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleInputChange}
              />
              Banner activo
            </label>
          </div>

          {formData.imagenURL && (
            <div style={{ marginBottom: "1rem" }}>
              <p>Imagen actual:</p>
              <img
                src={formData.imagenURL}
                alt="Banner actual"
                style={{ maxWidth: "200px", maxHeight: "100px" }}
              />
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              {banner ? "Nueva imagen (opcional)" : "Imagen (requerida)"}
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              required={!banner}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              type="submit"
              disabled={cargando}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#D62828",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {cargando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ccc",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
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
