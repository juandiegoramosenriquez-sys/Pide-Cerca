package com.pidecerca.backend.entity;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public final class Limites {

    public static final int DIAS_ENTRE_CAMBIOS = 15;

    private static final DateTimeFormatter FORMATO =
            DateTimeFormatter.ofPattern("d 'de' MMMM", Locale.forLanguageTag("es-PE"));

    private Limites() {
    }

    public static LocalDateTime proximoCambio(LocalDateTime ultimoCambio) {
        if (ultimoCambio == null) {
            return null;
        }
        LocalDateTime proximo = ultimoCambio.plusDays(DIAS_ENTRE_CAMBIOS);
        return proximo.isAfter(LocalDateTime.now()) ? proximo : null;
    }

    public static String fechaLegible(LocalDateTime fecha) {
        return fecha.format(FORMATO);
    }
}
