import { send } from 'emailjs-com';

export const enviarCorreoAdmin = async (correoDestino, correoGenerado, password, nombreCompleto) => {
  return await send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    {
      email: correoDestino,        // ✅ se usa como To Email
      usuario: correoGenerado,     // ✅ aparece como {{usuario}} en contenido
      name: nombreCompleto,
      password: password
    },
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  );
};

