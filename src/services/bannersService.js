import { getDatabase, ref, get, set, remove, push } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

/**
 * Valida los datos del banner antes de guardar
 */
const validarBanner = (bannerData) => {
  if (!bannerData) throw new Error("Datos del banner no proporcionados");
  if (typeof bannerData.activo !== 'boolean') {
    bannerData.activo = true; // Valor por defecto
  }
  return bannerData;
};

/**
 * Sube una imagen a Firebase Storage y devuelve su URL
 */
const subirImagenBanner = async (imagenFile) => {
  if (!imagenFile) return null;
  
  try {
    const extension = imagenFile.name.split('.').pop();
    const nombreArchivo = `banner_${uuidv4()}.${extension}`;
    const imagenRef = sRef(getStorage(), `banners/${nombreArchivo}`);
    
    await uploadBytes(imagenRef, imagenFile);
    return await getDownloadURL(imagenRef);
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    throw new Error("Error al subir la imagen del banner");
  }
};

/**
 * Guarda o actualiza un banner en la base de datos
 */
export const guardarBanner = async (bannerData, imagenFile, idExistente = null) => {
  try {
    const db = getDatabase();
    const bannerValidado = validarBanner(bannerData);
    
    // Subir imagen si se proporcionó
    const imagenURL = imagenFile 
      ? await subirImagenBanner(imagenFile)
      : bannerValidado.imagenURL;

    if (!imagenURL && !idExistente) {
      throw new Error("Se requiere una imagen para nuevos banners");
    }

    const datosBanner = {
      ...bannerValidado,
      imagenURL: imagenURL || bannerValidado.imagenURL,
      updatedAt: Date.now()
    };

    // Operación de guardado
    if (idExistente) {
      // Actualizar banner existente
      await set(ref(db, `banners/${idExistente}`), datosBanner);
      return { id: idExistente, ...datosBanner };
    } else {
      // Crear nuevo banner
      const nuevoRef = push(ref(db, 'banners'));
      await set(nuevoRef, datosBanner);
      return { id: nuevoRef.key, ...datosBanner };
    }
  } catch (error) {
    console.error("Error en guardarBanner:", error);
    throw error;
  }
};

/**
 * Obtiene todos los banners activos ordenados
 */
export const obtenerBanners = async () => {
  try {
    const db = getDatabase();
    const bannersRef = ref(db, 'banners');
    const snapshot = await get(bannersRef);

    if (!snapshot.exists()) return [];

    return Object.entries(snapshot.val())
      .map(([id, value]) => ({ id, ...value }))
      .filter(banner => banner.activo !== false)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  } catch (error) {
    console.error("Error en obtenerBanners:", error);
    throw new Error("Error al obtener los banners");
  }
};

/**
 * Elimina un banner y su imagen asociada
 */
export const eliminarBanner = async (id, imagenURL) => {
  try {
    const db = getDatabase();
    const storage = getStorage();

    // Eliminar imagen si existe
    if (imagenURL) {
      try {
        const imagenRef = sRef(storage, imagenURL);
        await deleteObject(imagenRef);
      } catch (storageError) {
        console.warn("No se pudo eliminar la imagen:", storageError);
      }
    }

    // Eliminar de la base de datos
    await remove(ref(db, `banners/${id}`));
    
    return true;
  } catch (error) {
    console.error("Error en eliminarBanner:", error);
    throw new Error("Error al eliminar el banner");
  }
};

/**
 * Obtiene banners activos para el carrusel
 */
export const obtenerBannersActivos = async () => {
  const banners = await obtenerBanners();
  return banners
    .filter(b => b.activo !== false)
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));
};