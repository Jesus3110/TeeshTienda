// src/components/ModalConfirmacion.jsx
import React from "react";
import "../styles/modal.css";

const ModalConfirmacion = ({ mensaje, onConfirmar, onCancelar }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-form">
        <h3 style={{ marginBottom: "1rem" }}>{mensaje}</h3>
        <button onClick={onConfirmar} style={{ marginRight: "1rem", backgroundColor: "#dc3545", color: "#fff" }}>
          Sí, eliminar
        </button>
        <button onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
