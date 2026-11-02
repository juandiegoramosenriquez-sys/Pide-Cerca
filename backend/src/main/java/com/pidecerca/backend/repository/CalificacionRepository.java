package com.pidecerca.backend.repository;

import com.pidecerca.backend.entity.Calificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {

    Optional<Calificacion> findByPedidoId(Long pedidoId);

    @Query("select c.negocio.id, avg(c.estrellas), count(c) from Calificacion c group by c.negocio.id")
    List<Object[]> resumenPorNegocio();
}
