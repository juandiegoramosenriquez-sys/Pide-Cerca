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

## Diseño

| Área | Color |
|------|-------|
| Cliente | Brasa (naranja) |
| Negocio | Rocoto (rojo) |
| Administrador | Carbón (gris oscuro) |

Modo claro con degradado y modo oscuro neón. Textos de 16 px, botones de 52 px de alto y lenguaje simple. Detalles en [docs/Interfaces](docs/Interfaces/interfaces.md).

## Avance

- [x] Paso 0: Repositorio y estructura
- [ ] Paso 1: Crear el proyecto Spring Boot
- [ ] Paso 2: Backend (entidades, seguridad, pedidos, aprobación de puestos)
- [ ] Paso 3: Crear el proyecto React
- [ ] Paso 4: Base del diseño (colores, letras, botones)
- [ ] Paso 5: Pantallas del cliente
- [ ] Paso 6: Pantallas del negocio
- [ ] Paso 7: Panel del administrador
- [ ] Paso 8: Publicar en internet y generar el APK

## Documentación

- [Requisitos](docs/Requisitos/requisitos.md)
- [Casos de uso](docs/CasoDeUso/casos-uso.md)
- [Base de datos](docs/BaseDeDatos/base-datos.md)
- [Arquitectura](docs/Arquitectura/arquitectura.md)
- [Interfaces](docs/Interfaces/interfaces.md)
