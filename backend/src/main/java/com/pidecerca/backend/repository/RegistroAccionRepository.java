package com.pidecerca.backend.repository;

import com.pidecerca.backend.entity.RegistroAccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistroAccionRepository extends JpaRepository<RegistroAccion, Long> {

    List<RegistroAccion> findTop100ByOrderByFechaDesc();
}
