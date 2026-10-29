CREATE DATABASE IF NOT EXISTS pide_cerca_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pide_cerca_db;

CREATE TABLE IF NOT EXISTS usuario (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre             VARCHAR(255),
    apellido           VARCHAR(255),
    correo             VARCHAR(255) NOT NULL UNIQUE,
    telefono           VARCHAR(255),
    password           VARCHAR(255),
    rol                VARCHAR(20),
    activo             BOOLEAN,
    fecha_registro     DATETIME(6),
    acepto_privacidad  BOOLEAN,
    fecha_privacidad   DATETIME(6)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS negocio (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre             VARCHAR(255),
    descripcion        VARCHAR(255),
    tipo_comida        VARCHAR(255),
    direccion          VARCHAR(255),
    telefono           VARCHAR(255),
    imagen             VARCHAR(255),
    horario            VARCHAR(255),
    latitud            DOUBLE,
    longitud           DOUBLE,
    tiempo_estimado    INT,
    abierto            BOOLEAN,
    activo             BOOLEAN,
    estado_aprobacion  VARCHAR(20),
    motivo_rechazo     VARCHAR(255),
    fecha_solicitud    DATETIME(6),
    usuario_id         BIGINT,
    CONSTRAINT fk_negocio_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT ck_negocio_aprobacion CHECK (estado_aprobacion IN ('PENDIENTE', 'APROBADO', 'RECHAZADO'))
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS categoria (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(255),
    descripcion  VARCHAR(255),
    activo       BOOLEAN,
    negocio_id   BIGINT,
    CONSTRAINT fk_categoria_negocio FOREIGN KEY (negocio_id) REFERENCES negocio (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS producto (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(255),
    descripcion   VARCHAR(255),
    precio        DOUBLE,
    imagen        VARCHAR(255),
    disponible    BOOLEAN,
    negocio_id    BIGINT,
    categoria_id  BIGINT,
    CONSTRAINT fk_producto_negocio FOREIGN KEY (negocio_id) REFERENCES negocio (id),
    CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS pedido (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha               DATETIME(6),
    total               DOUBLE,
    estado              VARCHAR(30),
    tiempo_preparacion  INT,
    fecha_aceptado      DATETIME(6),
    fecha_listo         DATETIME(6),
    fecha_recogido      DATETIME(6),
    notas               VARCHAR(255),
    motivo_cancelacion  VARCHAR(255),
    usuario_id          BIGINT,
    negocio_id          BIGINT,
    CONSTRAINT fk_pedido_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_pedido_negocio FOREIGN KEY (negocio_id) REFERENCES negocio (id),
    CONSTRAINT ck_pedido_estado CHECK (estado IN ('PENDIENTE', 'ACEPTADO', 'EN_PREPARACION', 'LISTO_PARA_RECOGER', 'RECOGIDO', 'CANCELADO'))
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    cantidad         INT,
    precio_unitario  DOUBLE,
    subtotal         DOUBLE,
    pedido_id        BIGINT,
    producto_id      BIGINT,
    CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id) REFERENCES pedido (id),
    CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES producto (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS pago (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    monto      DOUBLE,
    metodo     VARCHAR(20),
    fecha      DATETIME(6),
    estado     VARCHAR(30),
    pedido_id  BIGINT UNIQUE,
    CONSTRAINT fk_pago_pedido FOREIGN KEY (pedido_id) REFERENCES pedido (id),
    CONSTRAINT ck_pago_estado CHECK (estado IN ('PENDIENTE', 'PAGADO', 'REEMBOLSO_PENDIENTE', 'REEMBOLSADO', 'FALLIDO'))
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS notificacion (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    titulo      VARCHAR(255),
    mensaje     VARCHAR(255),
    leida       BOOLEAN,
    fecha       DATETIME(6),
    usuario_id  BIGINT,
    pedido_id   BIGINT,
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_notificacion_pedido FOREIGN KEY (pedido_id) REFERENCES pedido (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS registro_accion (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha       DATETIME(6),
    accion      VARCHAR(255),
    detalle     VARCHAR(500),
    usuario_id  BIGINT,
    CONSTRAINT fk_registro_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE = InnoDB;

CREATE INDEX idx_pedido_negocio_estado ON pedido (negocio_id, estado);
CREATE INDEX idx_pedido_usuario ON pedido (usuario_id);
CREATE INDEX idx_producto_negocio ON producto (negocio_id);
CREATE INDEX idx_notificacion_usuario_leida ON notificacion (usuario_id, leida);
CREATE INDEX idx_negocio_aprobacion ON negocio (estado_aprobacion);
CREATE INDEX idx_registro_accion_fecha ON registro_accion (fecha);
