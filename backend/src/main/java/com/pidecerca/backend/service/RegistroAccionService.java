package com.pidecerca.backend.service;

import com.pidecerca.backend.entity.RegistroAccion;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.repository.RegistroAccionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistroAccionService {

    private final RegistroAccionRepository registroAccionRepository;

    public RegistroAccionService(RegistroAccionRepository registroAccionRepository) {
        this.registroAccionRepository = registroAccionRepository;
    }

    public void registrar(Usuario usuario, String accion, String detalle) {
        RegistroAccion registro = new RegistroAccion();
        registro.setUsuario(usuario);
        registro.setFecha(LocalDateTime.now());
        registro.setAccion(accion);
        registro.setDetalle(detalle);
        registroAccionRepository.save(registro);
    }

    public List<RegistroAccion> listarRecientes() {
        return registroAccionRepository.findTop100ByOrderByFechaDesc();
    }
}
