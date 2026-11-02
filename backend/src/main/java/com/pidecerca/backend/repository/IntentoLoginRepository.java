package com.pidecerca.backend.repository;

import com.pidecerca.backend.entity.IntentoLogin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface IntentoLoginRepository extends JpaRepository<IntentoLogin, Long> {

    List<IntentoLogin> findTop100ByOrderByFechaDesc();

    List<IntentoLogin> findByExitoFalseAndFechaAfter(LocalDateTime desde);

    long countByCorreoIgnoreCaseAndExitoFalseAndFechaAfter(String correo, LocalDateTime desde);
}
