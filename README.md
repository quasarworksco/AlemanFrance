# Cars AlemanFrance — Landing / E-commerce

Sitio web con estética **glassmorphism** para **Cars AlemanFrance**: importación
internacional de vehículos de gama alta, repuestos especializados y caravanas.
Sedes en **Alemania 🇩🇪** y **Francia 🇫🇷**, envíos a todo **EE. UU.** y nuevo hub
en **Róterdam 🇳🇱**.

## Estructura

```
index.html                     Página principal (Inicio, Catálogo, Logística, Footer)
assets/css/styles.css          Estilos + sistema glassmorphism + paleta de banderas
assets/js/firebase-config.js   Configuración de Firebase/Firestore y Cloudinary
assets/js/app.js               Lógica: catálogo, filtros, WhatsApp, menú móvil
```

## Ejecutar en local

Al usar módulos ES (`type="module"`), ábrelo con un servidor, no con `file://`:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

El sitio funciona **sin configuración**: muestra un catálogo de demostración
(fallback) hasta que conectes tu Firestore real.

## Configurar Firestore

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Añade una app **Web** y copia el objeto de configuración.
3. Pega esos valores en `assets/js/firebase-config.js` → `firebaseConfig`.
4. Crea una colección (por defecto **`productos`**) con documentos así:

```json
{
  "nombre": "Mercedes-Benz Clase S 580",
  "categoria": "vehiculos",              // vehiculos | repuestos | caravanas
  "descripcion": "Sedán de lujo insignia…",
  "precio": 128000,
  "moneda": "USD",
  "origen": "de",                        // de (Alemania) | fr (Francia)
  "imagen": "url-directa-o-publicId",    // o usa "imagenId" para Cloudinary
  "imagenId": "caralemanfrance/clase-s"  // publicId de Cloudinary (opcional)
}
```

En cuanto `firebaseConfig` tenga valores reales, el catálogo se lee en vivo
desde Firestore; si la colección está vacía o falla la conexión, se muestran
los datos de demostración automáticamente.

## Configurar Cloudinary

1. En tu [dashboard de Cloudinary](https://cloudinary.com/console) copia el **Cloud name**.
2. Ponlo en `assets/js/firebase-config.js` → `CLOUDINARY.cloudName`.
3. Sube tus imágenes y guarda el `publicId` en el campo `imagenId` del producto.

Las imágenes se entregan optimizadas con `f_auto,q_auto,c_fill,w_800,h_500`
(formato y calidad automáticos + recorte), configurable en `CLOUDINARY.transform`.

## Contacto (ya integrado)

- **WhatsApp:** `+1 815 821 7564` — botón flotante, en navbar, footer y en cada producto (API `wa.me`).
- **Email:** enlace `mailto:` en el footer (`atencion@caralemanfrance.com`, ajústalo si aplica).

## Personalización rápida

- **Colores:** variables CSS en `:root` (`styles.css`) — banderas de Alemania y Francia.
- **Textos/mercados:** directamente en `index.html`.
- **Número de WhatsApp / email:** constante `WHATSAPP` en `app.js` y `href` en el footer.
