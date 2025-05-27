import React, { useState } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/verificacion.css";

function VerificarCorreo() {
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [error, setError] = useState("");
  const [verificado, setVerificado] = useState(false);
  const navigate = useNavigate();
  const { uid } = useParams(); // <- el ID del usuario debe venir en la URL

  const handleVerificar = async () => {
    try {
      setError("");
      const db = getDatabase();
      const userRef = ref(db, `usuarios/${uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        setError("Usuario no encontrado.");
        return;
      }

      const datos = snapshot.val();

      if (datos.verificadoCorreo) {
        setError("Este correo ya está verificado.");
        return;
      }

      if (datos.codigoCorreo !== codigoIngresado) {
        setError("El código ingresado no es correcto.");
        return;
      }

      await update(userRef, {
        verificadoCorreo: true,
        codigoCorreo: null, // eliminar el código
      });

      setVerificado(true);
      setTimeout(() => navigate("/perfil"), 3000);
    } catch (err) {
      console.error("Error al verificar:", err);
      setError("Ocurrió un error al verificar.");
    }
  };

  return (
    <div className="verificacion-container">
      <div className="verificacion-card">
        <h2>Verificación de Correo</h2>

        {verificado ? (
          <p className="success-msg">✅ Correo verificado correctamente. Redirigiendo...</p>
        ) : (
          <>
            <p>Introduce el código que recibiste por correo:</p>
            <input
              className="codigo-input"
              type="text"
              value={codigoIngresado}
              onChange={(e) => setCodigoIngresado(e.target.value)}
              placeholder="Código de verificación"
            />
            {error && <p className="error-msg">{error}</p>}
            <button onClick={handleVerificar} className="btn-verificar">
              Verificar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VerificarCorreo;
