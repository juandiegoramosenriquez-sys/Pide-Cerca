package com.pidecerca.backend.controller;

import com.pidecerca.backend.entity.Ajustes;
import com.pidecerca.backend.service.AjustesService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ajustes")
public class AjustesController {

    private final AjustesService ajustesService;

    public AjustesController(AjustesService ajustesService) {
        this.ajustesService = ajustesService;
    }

    @GetMapping
    public Ajustes ver() {
        return ajustesService.obtener();
    }
}
