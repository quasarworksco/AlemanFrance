/* =========================================================
   Configuración de servicios externos — Cars AlemanFrance
   ---------------------------------------------------------
   1) FIREBASE / FIRESTORE
      Reemplaza los valores de "firebaseConfig" con los de tu
      proyecto (Consola Firebase → Configuración → Tus apps → Web).
      El catálogo se lee de la colección definida en COLECCION.

   2) CLOUDINARY
      Coloca tu "cloud name". Las imágenes se sirven optimizadas
      con transformaciones automáticas (formato + calidad).

   NOTA: mientras estos valores sean los de ejemplo, el sitio
   funciona igual mostrando datos de demostración (fallback).
   ========================================================= */

export const firebaseConfig = {
  apiKey:            "AIzaSyCGEMq03avRceDfCaOq_OK7s-VZJz_rVXY",
  authDomain:        "caralemanfrance.firebaseapp.com",
  projectId:         "caralemanfrance",
  storageBucket:     "caralemanfrance.firebasestorage.app",
  messagingSenderId: "645263745788",
  appId:             "1:645263745788:web:d29547e78b2e99f89d2d79"
};

// Colección de Firestore que contiene el inventario.
export const COLECCION = "productos";

// Cloudinary: nombre de tu cloud (dashboard de Cloudinary).
export const CLOUDINARY = {
  cloudName: "TU_CLOUD_NAME",
  // Transformaciones aplicadas a cada imagen entregada.
  transform: "f_auto,q_auto,c_fill,w_800,h_500"
};

/**
 * Devuelve true si la configuración de Firebase ya fue reemplazada
 * por valores reales (para decidir si conectar o usar el fallback).
 */
export function firebaseListo() {
  return firebaseConfig.apiKey !== "TU_API_KEY" &&
         firebaseConfig.projectId !== "tu-proyecto";
}

/**
 * Construye la URL optimizada de Cloudinary a partir del publicId.
 * Si se pasa una URL absoluta (http...), se devuelve tal cual.
 */
export function cloudinaryUrl(publicId) {
  if (!publicId) return "";
  if (/^https?:\/\//i.test(publicId)) return publicId;
  return `https://res.cloudinary.com/${CLOUDINARY.cloudName}/image/upload/${CLOUDINARY.transform}/${publicId}`;
}
