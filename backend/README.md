# Backend de PideCerca

Spring Boot 4 con Java 21 y Maven. Base de datos MySQL.

## Configurar tu MySQL

1. Abre `backend/secrets.properties`. Este archivo no se sube a GitHub. Si no existe, copia `secrets.example.properties` con ese nombre.
2. En `DB_PASSWORD` escribe la contraseña de tu usuario `root` de MySQL.
3. La base `pidecerca` se crea sola la primera vez que arranca el backend, con todas las tablas.

## Ejecutar

Desde IntelliJ: abre la carpeta `backend` y ejecuta `BackendApplication`.

Desde la terminal:

```bash
mvnw spring-boot:run
```

Sin MySQL, con una base de prueba en memoria (H2):

```bash
mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

## Cuentas de prueba

Se crean solas la primera vez.

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | admin@pidecerca.com | admin123 |
| Negocio aprobado | negocio@pidecerca.com | negocio123 |
| Negocio pendiente de aprobación | pepa@pidecerca.com | negocio123 |
| Cliente | cliente@pidecerca.com | cliente123 |

## Novedades frente al proyecto anterior

- MySQL en lugar de PostgreSQL.
- `POST /api/auth/registro-negocio`: el negocio se registra solo y queda pendiente.
- `GET /api/admin/solicitudes`, `POST /api/admin/negocios/{id}/aprobar` y `/rechazar`.
- `GET /api/admin/registro`: registro de las acciones del administrador.
- El administrador ve correos y teléfonos ocultos (`an•••@gmail.com`).
- Solo existe un administrador; no se puede crear otro.
- El registro exige aceptar el aviso de privacidad (`aceptoPrivacidad: true`).
- Los clientes no ven el correo ni el teléfono del dueño del puesto.
