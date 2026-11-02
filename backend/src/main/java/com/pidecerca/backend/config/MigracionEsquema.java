package com.pidecerca.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class MigracionEsquema implements CommandLineRunner {

    private static final Logger registro = LoggerFactory.getLogger(MigracionEsquema.class);

    private final JdbcTemplate jdbc;

    public MigracionEsquema(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        ampliarEstadoDelPedido();
    }

    private void ampliarEstadoDelPedido() {

        String[] intentos = {
                "ALTER TABLE pedido MODIFY COLUMN estado VARCHAR(30)",
                "ALTER TABLE pedido ALTER COLUMN estado VARCHAR(30)"
        };

        for (String sentencia : intentos) {
            try {
                jdbc.execute(sentencia);
                return;
            } catch (Exception e) {
                registro.debug("No se pudo ejecutar {}: {}", sentencia, e.getMessage());
            }
        }

        registro.warn("No se pudo ampliar la columna estado de la tabla pedido");
    }
}
