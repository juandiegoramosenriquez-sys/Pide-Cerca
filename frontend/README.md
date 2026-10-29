# Web de PideCerca

React 19 con Vite. Una sola web con tres áreas; al iniciar sesión cada persona entra a la suya.

| Área | Ruta | Color | Pantallas |
|------|------|-------|-----------|
| Cliente | `/` | Brasa | Puestos cercanos, menú del puesto, carrito y pago, seguimiento, mis pedidos, avisos, perfil |
| Negocio | `/negocio` | Rocoto | Pedidos con aviso sonoro, mi menú, ventas, mi puesto. Si el puesto no está aprobado muestra "Estamos revisando tu puesto" |
| Administrador | `/admin` | Carbón | Resumen, puestos (aprobar, rechazar, suspender), usuarios con datos ocultos, registro de acciones |

Acceso: `/ingresar`, `/registro` (clientes) y `/registro-negocio` (puestos).

## Ejecutar

El backend debe estar encendido en `http://localhost:8080`.

```bash
npm install
npm run dev
```

Abre http://localhost:5173

Para usar otra dirección del backend, crea un archivo `.env` con `VITE_API_URL=https://tu-backend/api`.

## Diseño

- Textos de 16 px, botones de 52 px de alto y letra del sistema (carga rápido).
- Modo claro con degradado, modo oscuro neón o automático según la hora.
- Estados del pedido: Recibido (ámbar), En proceso (azul), Listo (verde), Entregado y Cancelado (gris).

## Instalable (PWA)

Incluye `manifest.webmanifest`, íconos y `sw.js`. Al publicarla con HTTPS se puede instalar desde el navegador o convertir en APK con PWABuilder.
