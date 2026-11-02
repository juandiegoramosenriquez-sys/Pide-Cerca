package com.pidecerca.backend.dto;

import com.pidecerca.backend.entity.EstadoAprobacion;
import com.pidecerca.backend.entity.MetodosDigitales;
import com.pidecerca.backend.entity.Negocio;
import com.pidecerca.backend.entity.Usuario;

import java.time.LocalDateTime;
import java.util.List;

public record FichaNegocioResponse(
        Long id,
        String nombre,
        String tipoComida,
        String direccion,
        String imagen,
        Double latitud,
        Double longitud,
        String horario,
        String diasAtencion,
        String horaApertura,
        String horaCierre,
        Boolean activo,
        Boolean abierto,
        EstadoAprobacion estadoAprobacion,
        String motivoRechazo,
        LocalDateTime fechaSolicitud,
        LocalDateTime fechaAprobacion,
        LocalDateTime fechaPrivacidad,
        LocalDateTime ultimaConexion,
        String propietarioNombre,
        String propietarioCorreo,
        String propietarioTelefono,
        long pedidos,
        double ventas,
        long sinResponder,
        String nombreCobro,
        Boolean aceptaEfectivo,
        Boolean cobrosVerificados,
        List<Cobro> cobros) {

    public record Cobro(String codigo, String nombre, String numero) {
    }

    public static FichaNegocioResponse de(Negocio negocio, long pedidos, double ventas, long sinResponder) {
        Usuario dueno = negocio.getPropietario();
        return new FichaNegocioResponse(
                negocio.getId(),
                negocio.getNombre(),
                negocio.getTipoComida(),
                negocio.getDireccion(),
                negocio.getImagen(),
                negocio.getLatitud(),
                negocio.getLongitud(),
                negocio.getHorario(),
                negocio.getDiasAtencion(),
                negocio.getHoraApertura(),
                negocio.getHoraCierre(),
                negocio.getActivo(),
                negocio.getAbierto(),
                negocio.getEstadoAprobacion(),
                negocio.getMotivoRechazo(),
                negocio.getFechaSolicitud(),
                negocio.getFechaAprobacion(),
                dueno == null ? null : dueno.getFechaPrivacidad(),
                negocio.getUltimaConexion(),
                dueno == null ? null : String.join(" ",
                        dueno.getNombre() == null ? "" : dueno.getNombre(),
                        dueno.getApellido() == null ? "" : dueno.getApellido()).trim(),
                dueno == null ? null : Privacidad.ocultarCorreo(dueno.getCorreo()),
                dueno == null ? null : Privacidad.ocultarTelefono(dueno.getTelefono()),
                pedidos,
                ventas,
                sinResponder,
                negocio.getNombreCobro(),
                negocio.getAceptaEfectivo(),
                negocio.getCobrosVerificados(),
                negocio.getCobros().stream()
                        .map(c -> new Cobro(c.getCodigo(), MetodosDigitales.nombre(c.getCodigo()), c.getNumero()))
                        .toList()
        );
    }
}
