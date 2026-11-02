package com.pidecerca.backend.dto;

import java.util.List;

public record CobrosRequest(List<MetodoRequest> metodos, String nombreCobro, Boolean aceptaEfectivo, Boolean verificado) {

    public CobrosRequest(List<MetodoRequest> metodos, String nombreCobro, Boolean aceptaEfectivo) {
        this(metodos, nombreCobro, aceptaEfectivo, false);
    }

    public record MetodoRequest(String codigo, String numero) {
    }
}
