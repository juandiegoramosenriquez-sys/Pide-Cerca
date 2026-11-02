package com.pidecerca.backend.dto;

public record ComunicadoRequest(String destino, Long negocioId, String titulo, String mensaje) {
}
