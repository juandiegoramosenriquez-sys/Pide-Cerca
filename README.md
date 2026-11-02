# PideCerca

Web para pedir comida por anticipado en puestos callejeros y recogerla sin esperar.

- **Clientes:** ven los puestos cercanos, piden, pagan y siguen el estado de su pedido.
- **Negocios:** las dueñas y dueños de los puestos reciben pedidos, manejan su menú y ven sus ventas.
- **Administrador:** aprueba los puestos nuevos y supervisa la plataforma.

## Estructura

```
Pide-Cerca
├── backend/     Spring Boot (Java): login, roles, pedidos, puestos
├── frontend/    React: una sola web con 3 áreas (cliente, negocio, admin)
├── docs/        Requisitos, casos de uso, base de datos, arquitectura e interfaces
├── database/    Script de las tablas
└── README.md
```

## Tecnologías

| Parte | Tecnología |
|-------|------------|
| Backend | Java 21, Spring Boot, Spring Security con JWT, Spring Data JPA |
| Frontend | React, Vite, PWA instalable |
| Base de datos | MySQL 9 (H2 para pruebas sin MySQL) |

## Qué hace cada área

- **Cliente:** busca puestos por comida, nombre o zona con GPS, pide, paga (pago de prueba), sigue su pedido con un código de entrega de 4 dígitos, califica, guarda favoritos, vuelve a pedir y reporta problemas desde Ayuda. Si no recoge un pedido a tiempo suma una falta; con las faltas del límite ya no puede pagar en efectivo.
- **Negocio (la tía):** abre y cierra su puesto (también solo, según su horario), recibe pedidos con aviso sonoro, marca "Se acabó" con un toque, maneja su menú, ve sus ventas por día y recibe los avisos del administrador.
- **Administrador:** aprueba puestos, ve la ficha de puestos y clientes, y en la pestaña Control ve el ranking de ventas, puestos con problemas, clientes con faltas, el dinero, los reclamos, manda comunicados, cambia las reglas de la plataforma, revisa la seguridad y descarga reportes en Excel.

## Reglas que cambia el administrador

Minutos para recoger un pedido listo, faltas que bloquean el efectivo, distancia máxima para pedir, máximo por producto y por pedido, intentos de ingreso antes de bloquear, minutos de bloqueo y reclamos por día. Están en Control, pestaña Reglas.

## Diseño

| Área | Color |
|------|-------|
| Cliente | Verde salvia |
| Negocio | Vino |
| Administrador | Gris |
| Antes de entrar (login) | Gris neutro |

Estilo suave y fino: bordes delgados, esquinas pequeñas, sin degradados. Modo claro en tonos crema y modo oscuro en gris plomo. Letra DM Sans para el texto y Fraunces para los títulos. Detalles en [docs/Interfaces](docs/Interfaces/interfaces.md).

## Cómo ejecutarlo en tu computadora

1. `1-iniciar-backend.bat` enciende el backend (puerto 8080). Espera a ver "Started BackendApplication".
2. `2-iniciar-web.bat` enciende la web (puerto 5173).
3. `3-ver-en-celular.bat` abre la web en el celular conectado por cable USB.
4. `4-copia-de-seguridad.bat` guarda una copia de la base de datos en la carpeta `respaldos` (Git la ignora).
5. `5-restaurar-copia.bat` devuelve la base a una copia anterior.

Las claves van en `backend/secrets.properties` (usa `secrets.example.properties` como guía). Ese archivo nunca se sube a GitHub.

## Pruebas

```
cd backend
mvnw test -Dtest=ReglasTest,PedidoServiceTest
```

## Avance

- [x] Paso 0: Repositorio y estructura
- [x] Paso 1: Crear el proyecto Spring Boot
- [x] Paso 2: Backend (entidades, seguridad, pedidos, aprobación de puestos)
- [x] Paso 3: Crear el proyecto React
- [x] Paso 4: Base del diseño (colores, letras, botones)
- [x] Paso 5: Pantallas del cliente
- [x] Paso 6: Pantallas del negocio
- [x] Paso 7: Panel del administrador
- [x] Paso 8: Control del admin, faltas, reclamos, avisos, calificaciones y copias de seguridad
- [ ] Paso 9: Publicar en internet con https, pago real y generar el APK

## Documentación

- [Requisitos](docs/Requisitos/requisitos.md)
- [Casos de uso](docs/CasoDeUso/casos-uso.md)
- [Base de datos](docs/BaseDeDatos/base-datos.md)
- [Arquitectura](docs/Arquitectura/arquitectura.md)
- [Interfaces](docs/Interfaces/interfaces.md)
