package com.pidecerca.backend.config;

import com.pidecerca.backend.service.NegocioService;
import com.pidecerca.backend.service.PedidoService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class Vigilante {

    private final PedidoService pedidoService;
    private final NegocioService negocioService;

    public Vigilante(PedidoService pedidoService, NegocioService negocioService) {
        this.pedidoService = pedidoService;
        this.negocioService = negocioService;
    }

    @Scheduled(fixedDelay = 30000, initialDelay = 30000)
    public void revisar() {
        pedidoService.vencerPendientes();
        negocioService.cerrarSinConexion();
    }
}
