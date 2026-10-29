package com.pidecerca.backend.dto;

import com.pidecerca.backend.entity.EstadoAprobacion;
import com.pidecerca.backend.entity.Negocio;
import com.pidecerca.backend.entity.Usuario;

import java.time.LocalDateTime;

public record SolicitudNegocioResponse(
        Long id,
        String nombre,
        String tipoComida,
        String direccion,
        String descripcion,
        Boolean activo,
        EstadoAprobacion estadoAprobacion,
        String motivoRechazo,
        LocalDateTime fechaSolicitud,
        String propietarioNombre,
        String propietarioCorreo,
        String propietarioTelefono) {

    public static SolicitudNegocioResponse de(Negocio negocio) {
        Usuario dueno = negocio.getPropietario();
        return new SolicitudNegocioResponse(
                negocio.getId(),
                negocio.getNombre(),
                negocio.getTipoComida(),
                negocio.getDireccion(),
                negocio.getDescripcion(),
                negocio.getActivo(),
                negocio.getEstadoAprobacion(),
                negocio.getMotivoRechazo(),
                negocio.getFechaSolicitud(),
                dueno == null ? null : String.join(" ",
                        dueno.getNombre() == null ? "" : dueno.getNombre(),
                        dueno.getApellido() == null ? "" : dueno.getApellido()).trim(),
                dueno == null ? null : Privacidad.ocultarCorreo(dueno.getCorreo()),
                dueno == null ? null : Privacidad.ocultarTelefono(dueno.getTelefono())
        );
    }
}
