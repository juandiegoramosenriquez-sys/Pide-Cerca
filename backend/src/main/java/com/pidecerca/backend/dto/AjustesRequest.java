package com.pidecerca.backend.dto;

public record AjustesRequest(
        Integer minutosParaRecoger,
        Integer faltasBloqueanEfectivo,
        Integer distanciaMaximaMetros,
        Integer maxPorProducto,
        Integer maxPorPedido,
        Integer intentosLoginMaximos,
        Integer minutosBloqueoLogin,
        Integer reclamosPorDia,
        Integer minutosParaPagar,
        Integer faltaPorNoPagar,
        Integer minutosRevisionPago) {
}
