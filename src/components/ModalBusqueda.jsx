import React from "react";
import "../styles/modalBusqueda.css";

function ModalBusqueda({ visible, onClose, resultados, termino, setTermino, onSeleccionar }) {
  if (!visible) return null;

  return (
    <div className="modal-busqueda-overlay" onClick={onClose}>
      <div className="modal-busqueda" onClick={(e) => e.stopPropagation()}>
        <button className="cerrar-modal-busqueda" onClick={onClose}>×</button>
        <h3>Buscar productos</h3>

        <input
          type="text"
          placeholder="Escribe para buscar..."
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          className="input-busqueda-modal"
        />

        <div className="resultados-container">
          {termino.trim() === "" ? (
            <p className="mensaje-estado">Escribe algo para buscar.</p>
          ) : resultados.length === 0 ? (
            <p className="mensaje-estado">No se encontraron resultados.</p>
          ) : (
            resultados.map((prod) => (
  <div key={prod.idFirebase} className="card-producto-modal">
    <img src={prod.imagen || "/img/no-image.png"} alt={prod.nombre} className="img-producto-modal" />
    <h4 className="nombre-producto-modal">{prod.nombre}</h4>
    <div className="estrellas-modal">★★★★★</div>
    <p className="precio-producto-modal">${prod.precio?.toFixed(2)}</p>
    <button className="btn-agregar-modal" onClick={() => onSeleccionar(prod)}>
      Ver Detalles
    </button>
  </div>
))

          )}
        </div>
      </div>
    </div>
  );
}

export default ModalBusqueda;
