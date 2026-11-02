package com.pidecerca.backend.repository;

import com.pidecerca.backend.entity.Reclamo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReclamoRepository extends JpaRepository<Reclamo, Long> {

    List<Reclamo> findAllByOrderByFechaDesc();

    List<Reclamo> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    long countByEstado(String estado);
}
