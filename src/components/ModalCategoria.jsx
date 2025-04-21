import React from "react";
import "../styles/modalCategoria.css";

function ModalCategoria({ categoria, productos, onClose, onAddToCart }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-categoria">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <h2 className="modal-categoria-titulo">{categoria.nombre}</h2>
        
        <div className="grid-productos-categoria">
          {productos.length > 0 ? (
            productos.map((producto) => (
              <div className="card-producto-categoria" key={producto.idFirebase}>
                <img 
                  src={producto.imagen} 
                  alt={producto.nombre}
                  className="img-producto-categoria"
                />
                <div className="producto-info">
                  <h3>{producto.nombre}</h3>
                  <div className="producto-precio">${producto.precio}</div>
                  <button 
                    className="btn-agregar-carrito"
                    onClick={() => {
                      onAddToCart(producto);
                      onClose();
                    }}
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="sin-productos">No hay productos en esta categoría</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalCategoria;