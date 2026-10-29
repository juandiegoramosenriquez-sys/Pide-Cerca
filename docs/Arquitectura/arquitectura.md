# Arquitectura de PideCerca

## 1. Descripción

PideCerca es una aplicación web formada por dos partes: un **backend** en Spring Boot, que contiene toda la lógica y los datos, y un **frontend** en React, que muestra las pantallas a cada tipo de usuario.

```
Celular o computadora
        │
        ▼
  Frontend React  ──── API REST (JSON + token JWT) ────►  Backend Spring Boot  ──►  MySQL
  (una sola web)                                          (un solo "cerebro")        (local)
```

## 2. Componentes

### Frontend (React + Vite)
Una sola web con tres áreas. Al iniciar sesión, cada persona entra automáticamente a la suya según su rol.

| Área | Ruta | Quién la usa | Color |
|------|------|--------------|-------|
| Cliente | `/` | Personas que piden comida | Brasa (naranja) |
| Negocio | `/negocio` | Dueñas y dueños de los puestos | Rocoto (rojo) |
| Administrador | `/admin` | Solo el administrador de la plataforma | Carbón (gris oscuro) |

Se publica como **PWA**: se puede instalar en el celular desde el navegador y convertir en APK con PWABuilder.

### Backend (Java + Spring Boot)
- API REST con autenticación por token JWT.
- Permisos por rol: CLIENTE, NEGOCIO y ADMIN.
- Lógica de pedidos, cálculo de distancias, notificaciones y aprobación de negocios.
- Registro de las acciones importantes del administrador.

### Base de datos (MySQL)
MySQL 9 instalado en la computadora de desarrollo, base `pide_cerca_dab`. Spring Boot crea y actualiza las tablas automáticamente. El script completo está en `database/schema.sql`.

## 3. Roles

| Rol | Cómo obtiene su cuenta |
|-----|------------------------|
| Cliente | Se registra solo desde la web |
| Negocio | Se registra solo; su puesto queda **pendiente** hasta que el administrador lo aprueba |
| Administrador | Cuenta única creada por configuración; no se puede registrar desde la web |

## 4. Privacidad y seguridad
- Contraseñas cifradas con BCrypt; nadie puede verlas.
- El administrador ve los correos parcialmente ocultos y no ve datos de pago.
- Las acciones del administrador (aprobar, suspender) quedan registradas.
- Aviso de privacidad aceptado al registrarse (Ley N.° 29733).
- HTTPS en producción.

## 5. Despliegue
| Parte | Servicio |
|-------|----------|
| Frontend | Vercel |
| Backend | Render |
| Base de datos | MySQL en un servicio en la nube (por definir) |

## 6. Herramientas
- **IntelliJ IDEA:** backend.
- **Visual Studio Code:** frontend y documentación.
- **MySQL Workbench:** ver y administrar la base de datos.
- **Git y GitHub:** control de versiones.
