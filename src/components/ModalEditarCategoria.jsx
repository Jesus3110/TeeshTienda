import React, { useState } from "react";
import { getDatabase, ref, update } from "firebase/database";
import "../styles/modal.css";

const ModalEditarCategoria = ({ categoria, onClose }) => {
  const [nombre, setNombre] = useState(categoria.nombre || "");
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [modalConfirmar, setModalConfirmar] = useState(false);

  const editarCategoria = async (e) => {
    e.preventDefault();
    setError("");
  
    const nombreTrim = nombre.trim();
  
    if (!nombreTrim) {
      setError("El nombre no puede estar vacío");
      return;
    }
  
    if (nombreTrim === categoria.nombre) {
      setError("⚠️ No se detectaron cambios");
      return;
    }
  
    try {
      const db = getDatabase();
      const refCat = ref(db, `categorias/${categoria.idFirebase}`);
      await update(refCat, {
        nombre: nombreTrim,
        updatedAt: Date.now(),
      });
  
      setExito(true);
    } catch (err) {
      console.error(err);
      setError("❌ Error al actualizar la categoría");
    }
  };
  
  return (
    <div className="modal-backdrop">
      <div className="modal-form">
        {exito ? (
          <>
            <h3 className="modal-title">✅ Categoría actualizada correctamente</h3>
            <button className="btn-red" onClick={onClose}>Aceptar</button>
          </>
        ) : (
          <form onSubmit={editarCategoria}>
            <h2 className="modal-title">Editar Categoría</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="nombreCategoria">Nuevo nombre de categoría:</label>
              <input
                id="nombreCategoria"
                type="text"
                placeholder="Nuevo nombre de categoría"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="form-input"
              />
              {error && <div className="form-error">{error}</div>}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-red">Guardar cambios</button>
              <button type="button" onClick={onClose} className="btn-table btn-delete">Cancelar</button>
            </div>
          </form>
        )}
      </div>
      {modalConfirmar && (
  <ModalConfirmacion
    mensaje="¿Estás seguro de que deseas eliminar esta categoría?"
    onConfirmar={handleConfirmarEliminar}
    onCancelar={() => setModalConfirmar(false)}
  />
)}

    </div>
  );
};

export default ModalEditarCategoria;
