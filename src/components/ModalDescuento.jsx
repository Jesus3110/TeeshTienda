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
    <div className="modal-backdrop">
      <div className="modal-form">
        <h3 className="modal-title">Agregar nuevo descuento</h3>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="porcentaje">Porcentaje de descuento:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id="porcentaje"
                type="number"
                min="1"
                max="100"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                placeholder="Ej: 20"
                className="form-input"
                style={{ width: '100%' }}
              />
              <span>%</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="validoHasta">Válido hasta:</label>
            <input
              id="validoHasta"
              type="date"
              value={validoHasta}
              onChange={(e) => setValidoHasta(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="form-input"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-red">
              Guardar Descuento
            </button>
            <button type="button" onClick={onClose} className="btn-table btn-delete">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalDescuento;