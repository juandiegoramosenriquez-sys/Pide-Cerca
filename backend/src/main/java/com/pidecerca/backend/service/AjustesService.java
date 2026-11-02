package com.pidecerca.backend.service;

import com.pidecerca.backend.dto.AjustesRequest;
import com.pidecerca.backend.entity.Ajustes;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.AjustesRepository;
import org.springframework.stereotype.Service;

@Service
public class AjustesService {

    private final AjustesRepository ajustesRepository;

    public AjustesService(AjustesRepository ajustesRepository) {
        this.ajustesRepository = ajustesRepository;
    }

    public Ajustes obtener() {
        return ajustesRepository.findById(1L).orElseGet(() -> ajustesRepository.save(new Ajustes()));
    }

    public Ajustes actualizar(AjustesRequest cambios) {

        if (cambios == null) {
            throw ApiException.solicitudInvalida("No hay cambios que guardar");
        }

        Ajustes ajustes = obtener();

        ajustes.setMinutosParaRecoger(rango(cambios.minutosParaRecoger(), 5, 120, "Los minutos para recoger", ajustes.getMinutosParaRecoger()));
        ajustes.setFaltasBloqueanEfectivo(rango(cambios.faltasBloqueanEfectivo(), 1, 10, "Las faltas para bloquear el efectivo", ajustes.getFaltasBloqueanEfectivo()));
        ajustes.setDistanciaMaximaMetros(rango(cambios.distanciaMaximaMetros(), 500, 50000, "La distancia máxima", ajustes.getDistanciaMaximaMetros()));
        ajustes.setMaxPorProducto(rango(cambios.maxPorProducto(), 1, 50, "El máximo por producto", ajustes.getMaxPorProducto()));
        ajustes.setMaxPorPedido(rango(cambios.maxPorPedido(), 1, 100, "El máximo por pedido", ajustes.getMaxPorPedido()));
        ajustes.setIntentosLoginMaximos(rango(cambios.intentosLoginMaximos(), 3, 20, "Los intentos de ingreso", ajustes.getIntentosLoginMaximos()));
        ajustes.setMinutosBloqueoLogin(rango(cambios.minutosBloqueoLogin(), 1, 120, "Los minutos de bloqueo", ajustes.getMinutosBloqueoLogin()));

        ajustes.setReclamosPorDia(rango(cambios.reclamosPorDia(), 1, 10, "Los reclamos por día", ajustes.getReclamosPorDia()));

        ajustes.setMinutosParaPagar(rango(cambios.minutosParaPagar(), 3, 60, "Los minutos para pagar", ajustes.getMinutosParaPagar()));
        ajustes.setFaltaPorNoPagar(rango(cambios.faltaPorNoPagar(), 0, 1, "Las faltas por no pagar", ajustes.getFaltaPorNoPagar()));

        ajustes.setMinutosRevisionPago(rango(cambios.minutosRevisionPago(), 5, 240, "Los minutos para revisar un pago", ajustes.getMinutosRevisionPago()));

        return ajustesRepository.save(ajustes);
    }

    private static int rango(Integer valor, int minimo, int maximo, String nombre, int actual) {

        if (valor == null) {
            return actual;
        }

        if (valor < minimo || valor > maximo) {
            throw ApiException.solicitudInvalida(nombre + " debe estar entre " + minimo + " y " + maximo);
        }

        return valor;
    }
}
