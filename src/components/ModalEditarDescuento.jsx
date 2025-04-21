import React, { useState } from "react";
import { getDatabase, ref, update } from "firebase/database";
import "../styles/modal.css";

const ModalEditarDescuento = ({ descuento, onClose }) => {
  const [porcentaje, setPorcentaje] = useState(descuento.porcentaje);
  const [validoHasta, setValidoHasta] = useState(
    new Date(descuento.validoHasta).toISOString().split('T')[0]
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!porcentaje || !validoHasta) {
      setError("Todos los campos son obligatorios");
      return;
    }

    const db = getDatabase();
    const descuentoRef = ref(db, `descuentos/${descuento.id}`);

    try {
      await update(descuentoRef, {
        porcentaje: parseInt(porcentaje),
        validoHasta: new Date(validoHasta).getTime()
      });
      onClose();
    } catch (err) {
      setError("Error al actualizar el descuento");
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-contenido">
        <button className="modal-cerrar" onClick={onClose}>×</button>
        <h3>Editar descuento</h3>
        
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
            Actualizar Descuento
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarDescuento;