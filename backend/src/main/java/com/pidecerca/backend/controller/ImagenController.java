package com.pidecerca.backend.controller;

import com.pidecerca.backend.dto.ImagenRequest;
import com.pidecerca.backend.entity.Imagen;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.ImagenRepository;
import com.pidecerca.backend.service.UsuarioActualService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/imagenes")
public class ImagenController {

    private static final Set<String> TIPOS = Set.of("image/jpeg", "image/png", "image/webp");
    private static final int TAMANO_MAXIMO = 2 * 1024 * 1024;

    private final ImagenRepository imagenRepository;
    private final UsuarioActualService usuarioActualService;

    public ImagenController(ImagenRepository imagenRepository, UsuarioActualService usuarioActualService) {
        this.imagenRepository = imagenRepository;
        this.usuarioActualService = usuarioActualService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> subir(@RequestBody ImagenRequest request) {

        String texto = request == null ? null : request.datos();

        if (texto == null || !texto.startsWith("data:") || !texto.contains(";base64,")) {
            throw ApiException.solicitudInvalida("La foto no es válida");
        }

        String tipo = texto.substring(5, texto.indexOf(";base64,"));

        if (!TIPOS.contains(tipo)) {
            throw ApiException.solicitudInvalida("Solo se aceptan fotos JPG, PNG o WEBP");
        }

        byte[] datos;
        try {
            datos = Base64.getDecoder().decode(texto.substring(texto.indexOf(";base64,") + 8));
        } catch (IllegalArgumentException e) {
            throw ApiException.solicitudInvalida("La foto no es válida");
        }

        if (datos.length > TAMANO_MAXIMO) {
            throw ApiException.solicitudInvalida("La foto es muy pesada. Usa una de menos de 2 MB");
        }

        Imagen imagen = new Imagen();
        imagen.setTipo(tipo);
        imagen.setDatos(datos);
        imagen.setFecha(LocalDateTime.now());
        imagen.setUsuarioId(usuarioActualService.obtener().getId());

        Imagen guardada = imagenRepository.save(imagen);
        return Map.of("url", "/api/imagenes/" + guardada.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> ver(@PathVariable Long id) {

        Imagen imagen = imagenRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("Foto no encontrada"));

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(imagen.getTipo()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
                .body(imagen.getDatos());
    }
}
