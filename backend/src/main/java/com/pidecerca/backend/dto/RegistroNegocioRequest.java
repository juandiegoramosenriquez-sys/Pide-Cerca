package com.pidecerca.backend.dto;

import com.pidecerca.backend.entity.Negocio;

public record RegistroNegocioRequest(
        RegistroRequest propietario,
        Negocio negocio) {
}
