package com.pidecerca.backend.dto;

public final class Privacidad {

    private Privacidad() {
    }

    public static String ocultarCorreo(String correo) {
        if (correo == null || !correo.contains("@")) {
            return correo;
        }
        int arroba = correo.indexOf('@');
        String usuario = correo.substring(0, arroba);
        String visible = usuario.length() <= 2 ? usuario.substring(0, 1) : usuario.substring(0, 2);
        return visible + "•••" + correo.substring(arroba);
    }

    public static String ocultarTelefono(String telefono) {
        if (telefono == null || telefono.length() < 4) {
            return telefono;
        }
        return "•••" + telefono.substring(telefono.length() - 3);
    }
}
