import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import ClienteLayout from "../components/ClienteLayout";
import AssistantLayout from "../components/AssistantLayout";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { getDatabase, ref, get, update } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import "../styles/perfil.css";
import Modal from "react-modal";
import bcrypt from "bcryptjs";
import AdminLayout from "../components/AdminLayout";
import ModalAlerta from "../components/ModalAlerta";

const Perfil = () => {
  const { usuario, rol, setUsuario } = useContext(AuthContext);
  const [perfil, setPerfil] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cambiarPass, setCambiarPass] = useState(false);
  const [confirmarPass, setConfirmarPass] = useState("");
  const [verNuevaPass, setVerNuevaPass] = useState(false);
  const [verConfirmarPass, setVerConfirmarPass] = useState(false);
  const [alerta, setAlerta] = useState({ visible: false, mensaje: "", tipo: "error" });

  const direccionCompleta = perfil?.direccion
    ? `${perfil.direccion.calle} ${perfil.direccion.numero}, ${perfil.direccion.colonia}, ${perfil.direccion.ciudad}, ${perfil.direccion.estado}, ${perfil.direccion.cp}`
    : "";

  const direccionURL = `https://www.google.com/maps?q=${encodeURIComponent(
    direccionCompleta
  )}&output=embed`;

  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const perfilRef = ref(db, `usuarios/${usuario.uid}`);

    get(perfilRef).then((snapshot) => {
      if (snapshot.exists()) {
        setPerfil(snapshot.val());
        const data = snapshot.val();
        setPerfil(data);

        // ⚠️ Desestructuramos `direccion` dentro de formData
        setFormData({
          nombre: data.nombre || "",
          correo: data.correo || "",
          telefono: data.telefono || "",
          nuevaPass: "",
          imagen: data.imagen || "",
          calle: data.direccion?.calle || "",
          numero: data.direccion?.numero || "",
          colonia: data.direccion?.colonia || "",
          ciudad: data.direccion?.ciudad || "",
          estado: data.direccion?.estado || "",
          cp: data.direccion?.cp || ""
        });
      }
    });
  }, [usuario]);

  const validarPassword = (password) => {
    const requisitos = [
      { test: /.{8,}/, msg: "Mínimo 8 caracteres" },
      { test: /[A-Z]/, msg: "Una letra mayúscula" },
      { test: /[a-z]/, msg: "Una letra minúscula" },
      { test: /[0-9]/, msg: "Un número" },
      { test: /[^A-Za-z0-9]/, msg: "Un carácter especial" },
    ];

    return requisitos.filter((r) => !r.test.test(password)).map((r) => r.msg);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    if (e.target.files[0]) {
      setNuevaImagen(e.target.files[0]);
    }
  };

  const handleGuardar = async () => {
    const db = getDatabase();
    const perfilRef = ref(db, `usuarios/${usuario.uid}`);
    let datosActualizados = {
      ...formData,
      direccion: {
        calle: formData.calle,
        numero: formData.numero,
        colonia: formData.colonia,
        ciudad: formData.ciudad,
        estado: formData.estado,
        cp: formData.cp,
      },
    };

    delete datosActualizados.calle;
    delete datosActualizados.numero;
    delete datosActualizados.colonia;
    delete datosActualizados.ciudad;
    delete datosActualizados.estado;
    delete datosActualizados.cp;

    if (cambiarPass) {
      const errores = validarPassword(formData.nuevaPass || "");
      if (errores.length > 0) {
        setAlerta({ visible: true, mensaje: "❌ La contraseña no cumple los requisitos:\n" + errores.join("\n"), tipo: "error" });
        return;
      }
      if (formData.nuevaPass !== confirmarPass) {
        setAlerta({ visible: true, mensaje: "❌ Las contraseñas no coinciden", tipo: "error" });
        return;
      }
      datosActualizados.password = await bcrypt.hash(formData.nuevaPass, 10);
    }

    delete datosActualizados.nuevaPass;

    if (nuevaImagen) {
      const storage = getStorage();
      const storageReference = storageRef(storage, `usuarios/${usuario.uid}`);
      await uploadBytes(storageReference, nuevaImagen);
      const urlImagen = await getDownloadURL(storageReference);
      datosActualizados.imagen = urlImagen;
    }

    await update(perfilRef, datosActualizados);
    setPerfil(datosActualizados);
    setEditando(false);
    setNuevaImagen(null);
    // Vuelve a cargar el usuario desde Firebase
    const snapshotActualizado = await get(perfilRef);
    if (snapshotActualizado.exists()) {
      const datosActualizadosCompletos = snapshotActualizado.val();
      localStorage.setItem("adminId", usuario.uid);
      setPerfil(datosActualizadosCompletos);
      // Actualiza también en el contexto si usas AuthContext:
      setUsuario({ uid: usuario.uid, ...datosActualizadosCompletos });
    }
  };

  const contenido = (
    <div className="perfil-container">
      <h2>Mi Perfil</h2>
      {editando ? (
        <form className="perfil-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre || ""}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Teléfono:</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono || ""}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Calle:</label>
            <input
              type="text"
              name="calle"
              value={formData.calle || ""}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Número:</label>
            <input
              type="text"
              name="numero"
              value={formData.numero || ""}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Colonia:</label>
            <input
              type="text"
              name="colonia"
              value={formData.colonia || ""}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Ciudad:</label>
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad || ""}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Estado:</label>
            <input
              type="text"
              name="estado"
              value={formData.estado || ""}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Código Postal:</label>
            <input
              type="text"
              name="cp"
              value={formData.cp || ""}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Cambiar contraseña:</label>
            <input
              type="checkbox"
              checked={cambiarPass}
              onChange={(e) => setCambiarPass(e.target.checked)}
              className="custom-checkbox"
            />
          </div>

          {cambiarPass && (
            <>
              <div className="form-group">
                <label>Nueva contraseña:</label>
                <div className="password-input-container">
                  <input
                    type={verNuevaPass ? "text" : "password"}
                    name="nuevaPass"
                    value={formData.nuevaPass || ""}
                    onChange={handleChange}
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setVerNuevaPass(!verNuevaPass)}
                    className="toggle-password-btn"
                  >
                    {verNuevaPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirmar contraseña:</label>
                <div className="password-input-container">
                  <input
                    type={verConfirmarPass ? "text" : "password"}
                    value={confirmarPass}
                    onChange={(e) => setConfirmarPass(e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setVerConfirmarPass(!verConfirmarPass)}
                    className="toggle-password-btn"
                  >
                    {verConfirmarPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Imagen de perfil:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNuevaImagen(e.target.files[0])}
              className="form-input file-input"
            />
          </div>

          <div className="button-group">
            <button onClick={handleGuardar} className="btn-guardar">
              Guardar cambios
            </button>
            <button
              onClick={() => setEditando(false)}
              className="btn-cancelar"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="perfil-info">
          <div className="perfil-imagen">
            <img
              src={perfil?.imagen || "/img/default-user.png"}
              alt="Foto de perfil"
            />
          </div>
          <div className="perfil-detalles">
            <p><strong>Nombre:</strong> {perfil?.nombre}</p>
            <p><strong>Correo:</strong> {perfil?.correo}</p>
            <p><strong>Teléfono:</strong> {perfil?.telefono}</p>
            {perfil?.direccion && (
              <>
                <p><strong>Dirección:</strong></p>
                <p>{perfil.direccion.calle} {perfil.direccion.numero}</p>
                <p>{perfil.direccion.colonia}</p>
                <p>{perfil.direccion.ciudad}, {perfil.direccion.estado}</p>
                <p>CP: {perfil.direccion.cp}</p>
                <button
                  className="btn-ver-maps"
                  onClick={() => setModalAbierto(true)}
                >
                  Ver en Google Maps
                </button>
              </>
            )}
          </div>
          <button onClick={() => setEditando(true)} className="btn-editar">
            Editar perfil
          </button>
        </div>
      )}

      <Modal
        isOpen={modalAbierto}
        onRequestClose={() => setModalAbierto(false)}
        className="modal-maps"
        overlayClassName="overlay-maps"
      >
        <h2>Ubicación</h2>
        <iframe
          src={direccionURL}
          width="100%"
          height="400"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ borderRadius: "12px", border: "none" }}
        ></iframe>
        <button
          onClick={() => setModalAbierto(false)}
          className="btn-cerrar-maps"
        >
          Cerrar
        </button>
      </Modal>

      {alerta.visible && (
        <ModalAlerta
          mensaje={alerta.mensaje}
          tipo={alerta.tipo}
          onClose={() => setAlerta({ ...alerta, visible: false })}
        />
      )}
    </div>
  );

  if (!perfil) {
    return (
      <div className="loading-container">
        <div className="loading">Cargando perfil...</div>
      </div>
    );
  }

  // Seleccionar el layout según el rol
  if (rol === "admin") {
    return <AdminLayout>{contenido}</AdminLayout>;
  }

  if (rol === "asistente") {
    return <AssistantLayout>{contenido}</AssistantLayout>;
  }

  return <ClienteLayout>{contenido}</ClienteLayout>;
};

export default Perfil;
