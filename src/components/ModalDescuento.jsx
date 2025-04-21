import React, { useState } from "react";
import { getDatabase, ref, push } from "firebase/database";
import "../styles/modal.css";

const ModalDescuento = ({ onClose }) => {
  const [porcentaje, setPorcentaje] = useState("");
  const [validoHasta, setValidoHasta] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!porcentaje || !validoHasta) {
      setError("Todos los campos son obligatorios");
      return;
    }

    const db = getDatabase();
    const descuentosRef = ref(db, "descuentos");

    const nuevoDescuento = {
      porcentaje: parseInt(porcentaje),
      validoHasta: new Date(validoHasta).getTime(),
      creadoEn: Date.now()
    };

    try {
      await push(descuentosRef, nuevoDescuento);
      onClose();
    } catch (err) {
      setError("Error al crear el descuento");
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-contenido">
        <button className="modal-cerrar" onClick={onClose}>×</button>
        <h3>Agregar nuevo descuento</h3>
        
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Porcentaje de descuento:</label>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              placeholder="Ej: 20"
            />
            <span>%</span>
          </div>

          <div className="form-group">
            <label>Válido hasta:</label>
            <input 
              type="date" 
              value={validoHasta}
              onChange={(e) => setValidoHasta(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button type="submit" className="btn-guardar">
            Guardar Descuento
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalDescuento;