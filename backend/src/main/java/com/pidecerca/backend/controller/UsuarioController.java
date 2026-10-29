package com.pidecerca.backend.controller;

import com.pidecerca.backend.dto.CambiarPasswordRequest;
import com.pidecerca.backend.dto.PerfilRequest;
import com.pidecerca.backend.dto.UsuarioRequest;
import com.pidecerca.backend.dto.UsuarioResponse;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.service.RegistroAccionService;
import com.pidecerca.backend.service.UsuarioActualService;
import com.pidecerca.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioActualService usuarioActualService;
    private final RegistroAccionService registroAccionService;

    public UsuarioController(
            UsuarioService usuarioService,
            UsuarioActualService usuarioActualService,
            RegistroAccionService registroAccionService) {

        this.usuarioService = usuarioService;
        this.usuarioActualService = usuarioActualService;
        this.registroAccionService = registroAccionService;
    }

    @GetMapping("/me")
    public UsuarioResponse miPerfil() {
        return UsuarioResponse.de(usuarioActualService.obtener());
    }

    @PutMapping("/me")
    public UsuarioResponse actualizarMiPerfil(@RequestBody PerfilRequest request) {
        return UsuarioResponse.de(
                usuarioService.actualizarPerfil(usuarioActualService.obtener(), request));
    }

    @PutMapping("/me/password")
    public void cambiarMiPassword(@RequestBody CambiarPasswordRequest request) {
        usuarioService.cambiarPassword(usuarioActualService.obtener(), request);
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioService.listar().stream().map(UsuarioResponse::protegido).toList();
    }

    @GetMapping("/{id}")
    public UsuarioResponse obtenerPorId(@PathVariable Long id) {
        return UsuarioResponse.protegido(usuarioService.obtenerPorId(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse crear(@RequestBody UsuarioRequest request) {
        Usuario usuario = usuarioService.crear(request);
        registroAccionService.registrar(usuarioActualService.obtener(), "CREAR_USUARIO",
                "Creaste la cuenta de " + usuario.getNombre() + " (" + usuario.getRol() + ")");
        return UsuarioResponse.protegido(usuario);
    }

    @PutMapping("/{id}")
    public UsuarioResponse actualizar(@PathVariable Long id, @RequestBody UsuarioRequest request) {
        Usuario actual = usuarioActualService.obtener();
        Usuario usuario = usuarioService.actualizar(id, request, actual);
        registroAccionService.registrar(actual, "EDITAR_USUARIO", "Editaste la cuenta de " + usuario.getNombre());
        return UsuarioResponse.protegido(usuario);
    }

    @PutMapping("/{id}/activo")
    public UsuarioResponse cambiarActivo(@PathVariable Long id, @RequestParam boolean valor) {
        Usuario actual = usuarioActualService.obtener();
        Usuario usuario = usuarioService.cambiarActivo(id, valor, actual);
        registroAccionService.registrar(actual, valor ? "ACTIVAR_USUARIO" : "SUSPENDER_USUARIO",
                (valor ? "Activaste a " : "Suspendiste a ") + usuario.getNombre());
        return UsuarioResponse.protegido(usuario);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        Usuario actual = usuarioActualService.obtener();
        String nombre = usuarioService.obtenerPorId(id).getNombre();
        usuarioService.eliminar(id, actual);
        registroAccionService.registrar(actual, "ELIMINAR_USUARIO", "Eliminaste la cuenta de " + nombre);
    }
}
