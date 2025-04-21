import React, { useState } from "react";
import { guardarBanner } from "../services/bannersService";

function ModalBanner({ banner, onClose, onGuardarExitoso }) {
  const [formData, setFormData] = useState({
    titulo: banner?.titulo || "",
    activo: banner?.activo !== false,
    imagenURL: banner?.imagenURL || ""
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
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
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Título:</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Título del banner"
              required
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
                cursor: "pointer"
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
                cursor: "pointer"
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