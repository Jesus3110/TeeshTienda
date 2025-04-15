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
            <h3>✅ Categoría actualizada correctamente</h3>
            <button onClick={onClose}>Aceptar</button>
          </>
        ) : (
          <form onSubmit={editarCategoria}>
            <h2>Editar Categoría</h2>
            <input
              type="text"
              placeholder="Nuevo nombre de categoría"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ borderColor: error ? "red" : undefined }}
            />
            {error && <small style={{ color: "red" }}>{error}</small>}
            <button type="submit">Guardar cambios</button>
            <button type="button" onClick={onClose}>Cancelar</button>
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
