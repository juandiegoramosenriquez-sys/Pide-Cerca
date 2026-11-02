package com.pidecerca.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ajustes")
public class Ajustes {

    @Id
    private Long id = 1L;

    private Integer minutosParaRecoger = 15;

    private Integer faltasBloqueanEfectivo = 2;

    private Integer distanciaMaximaMetros = 5000;

    private Integer maxPorProducto = 10;

    private Integer maxPorPedido = 30;

    private Integer intentosLoginMaximos = 5;

    private Integer minutosBloqueoLogin = 10;

    private Integer reclamosPorDia = 1;

    public Long getId() {
        return id;
    }

    public Integer getMinutosParaRecoger() {
        return minutosParaRecoger;
    }

    public void setMinutosParaRecoger(Integer minutosParaRecoger) {
        this.minutosParaRecoger = minutosParaRecoger;
    }

    public Integer getFaltasBloqueanEfectivo() {
        return faltasBloqueanEfectivo;
    }

    public void setFaltasBloqueanEfectivo(Integer faltasBloqueanEfectivo) {
        this.faltasBloqueanEfectivo = faltasBloqueanEfectivo;
    }

    public Integer getDistanciaMaximaMetros() {
        return distanciaMaximaMetros;
    }

    public void setDistanciaMaximaMetros(Integer distanciaMaximaMetros) {
        this.distanciaMaximaMetros = distanciaMaximaMetros;
    }

    public Integer getMaxPorProducto() {
        return maxPorProducto;
    }

    public void setMaxPorProducto(Integer maxPorProducto) {
        this.maxPorProducto = maxPorProducto;
    }

    public Integer getMaxPorPedido() {
        return maxPorPedido;
    }

    public void setMaxPorPedido(Integer maxPorPedido) {
        this.maxPorPedido = maxPorPedido;
    }

    public Integer getIntentosLoginMaximos() {
        return intentosLoginMaximos;
    }

    public void setIntentosLoginMaximos(Integer intentosLoginMaximos) {
        this.intentosLoginMaximos = intentosLoginMaximos;
    }

    public Integer getMinutosBloqueoLogin() {
        return minutosBloqueoLogin;
    }

    public void setMinutosBloqueoLogin(Integer minutosBloqueoLogin) {
        this.minutosBloqueoLogin = minutosBloqueoLogin;
    }

    public Integer getReclamosPorDia() {
        return reclamosPorDia == null ? 1 : reclamosPorDia;
    }

    public void setReclamosPorDia(Integer valor) {
        this.reclamosPorDia = valor;
    }
}
