-- Esquema de referencia de PideCerca (MySQL 9).
-- El backend crea y actualiza las tablas solo (ddl-auto=update); este archivo sirve para consultar la estructura.

CREATE DATABASE IF NOT EXISTS pide_cerca_db CHARACTER SET utf8mb4;
USE pide_cerca_db;

CREATE TABLE IF NOT EXISTS usuario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    apellido VARCHAR(255),
    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(255),
    password VARCHAR(255),
    rol VARCHAR(255),
    activo BOOLEAN,
    fecha_registro DATETIME(6),
    acepto_privacidad BOOLEAN,
    fecha_privacidad DATETIME(6),
    fecha_cambio_password DATETIME(6),
    faltas INT,
    sesiones_desde DATETIME(6)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS negocio (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    descripcion VARCHAR(255),
    tipo_comida VARCHAR(255),
    direccion VARCHAR(255),
    telefono VARCHAR(255),
    imagen VARCHAR(255),
    dias_atencion VARCHAR(7),
    hora_apertura VARCHAR(5),
    hora_cierre VARCHAR(5),
    horario VARCHAR(255),
    latitud DOUBLE,
    longitud DOUBLE,
    tiempo_estimado INT,
    abierto BOOLEAN,
    activo BOOLEAN,
    estado_aprobacion VARCHAR(30),
    motivo_rechazo VARCHAR(255),
    fecha_solicitud DATETIME(6),
    fecha_cambio_nombre DATETIME(6),
    fecha_aprobacion DATETIME(6),
    ultima_conexion DATETIME(6),
    pedidos_sin_responder INT,
    motivo_cierre VARCHAR(255),
    ubicacion_en_vivo BOOLEAN,
    ubicacion_actualizada DATETIME(6),
    usuario_id BIGINT,
    apertura_automatica BOOLEAN,
    abierto_por_horario BOOLEAN,
    cerrado_manual_fecha DATE,
    CONSTRAINT fk_negocio_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS categoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    descripcion VARCHAR(255),
    activo BOOLEAN,
    negocio_id BIGINT,
    CONSTRAINT fk_categoria_negocio FOREIGN KEY (negocio_id) REFERENCES negocio (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS producto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    descripcion VARCHAR(255),
    precio DOUBLE,
    imagen VARCHAR(255),
    disponible BOOLEAN,
    negocio_id BIGINT,
    categoria_id BIGINT,
    CONSTRAINT fk_producto_negocio FOREIGN KEY (negocio_id) REFERENCES negocio (id),
    CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS pedido (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME(6),
    total DOUBLE,
    estado VARCHAR(30),
    tiempo_preparacion INT,
    fecha_aceptado DATETIME(6),
    fecha_listo DATETIME(6),
    fecha_recogido DATETIME(6),
    limite_recoger DATETIME(6),
    notas VARCHAR(255),
    codigo VARCHAR(4),
    motivo_cancelacion VARCHAR(255),
    usuario_id BIGINT,
    negocio_id BIGINT,
    CONSTRAINT fk_pedido_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_pedido_negocio FOREIGN KEY (negocio_id) REFERENCES negocio (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT,
    precio_unitario DOUBLE,
    subtotal DOUBLE,
    pedido_id BIGINT,
    producto_id BIGINT,
    CONSTRAINT fk_detalle_pedido_pedido FOREIGN KEY (pedido_id) REFERENCES pedido (id),
    CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (producto_id) REFERENCES producto (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS pago (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    monto DOUBLE,
    metodo VARCHAR(255),
    fecha DATETIME(6),
    estado VARCHAR(30),
    pedido_id BIGINT,
    CONSTRAINT fk_pago_pedido FOREIGN KEY (pedido_id) REFERENCES pedido (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS notificacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255),
    mensaje VARCHAR(255),
    leida BOOLEAN,
    fecha DATETIME(6),
    usuario_id BIGINT,
    pedido_id BIGINT,
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_notificacion_pedido FOREIGN KEY (pedido_id) REFERENCES pedido (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS registro_accion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME(6),
    accion VARCHAR(255),
    detalle VARCHAR(500),
    usuario_id BIGINT,
    CONSTRAINT fk_registro_accion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS imagen (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(255),
    datos MEDIUMBLOB,
    fecha DATETIME(6),
    usuario_id BIGINT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS ajustes (
    id BIGINT PRIMARY KEY,
    minutos_para_recoger INT,
    faltas_bloquean_efectivo INT,
    distancia_maxima_metros INT,
    max_por_producto INT,
    max_por_pedido INT,
    intentos_login_maximos INT,
    minutos_bloqueo_login INT,
    reclamos_por_dia INT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS reclamo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT,
    pedido_id BIGINT,
    tipo VARCHAR(255),
    mensaje VARCHAR(600),
    estado VARCHAR(255),
    respuesta VARCHAR(600),
    fecha DATETIME(6),
    fecha_resolucion DATETIME(6),
    CONSTRAINT fk_reclamo_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS comunicado (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255),
    mensaje VARCHAR(600),
    destino VARCHAR(255),
    destinatario VARCHAR(255),
    enviados INT,
    fecha DATETIME(6)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS intento_login (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(255) NOT NULL,
    ip VARCHAR(255),
    exito BOOLEAN,
    fecha DATETIME(6)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS favorito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT,
    negocio_id BIGINT,
    CONSTRAINT fk_favorito_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_favorito_negocio FOREIGN KEY (negocio_id) REFERENCES negocio (id),
    CONSTRAINT uk_favorito UNIQUE (usuario_id, negocio_id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS calificacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNIQUE,
    usuario_id BIGINT,
    negocio_id BIGINT,
    estrellas INT,
    comentario VARCHAR(300),
    fecha DATETIME(6),
    CONSTRAINT fk_calificacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_calificacion_negocio FOREIGN KEY (negocio_id) REFERENCES negocio (id)
) ENGINE = InnoDB;
