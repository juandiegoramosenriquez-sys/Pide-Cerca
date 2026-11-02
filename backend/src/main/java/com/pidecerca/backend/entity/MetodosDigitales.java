package com.pidecerca.backend.entity;

import java.util.LinkedHashMap;
import java.util.Map;

public final class MetodosDigitales {

    public static final Map<String, String> NOMBRES = new LinkedHashMap<>();

    static {
        NOMBRES.put("YAPE", "Yape");
        NOMBRES.put("PLIN", "Plin");
    }

    private MetodosDigitales() {
    }

    public static String nombre(String codigo) {
        return NOMBRES.getOrDefault(codigo, codigo);
    }
}
