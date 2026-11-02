package com.pidecerca.backend.repository;

import com.pidecerca.backend.entity.Comunicado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComunicadoRepository extends JpaRepository<Comunicado, Long> {

    List<Comunicado> findTop50ByOrderByFechaDesc();
}
