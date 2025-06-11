import React from "react";
import "../styles/modal.css";

const ModalAlerta = ({ mensaje, tipo = "info", onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-form">
        <h3 className={`modal-title ${tipo}`}>{mensaje}</h3>
        <button className="btn-red" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ModalAlerta; 