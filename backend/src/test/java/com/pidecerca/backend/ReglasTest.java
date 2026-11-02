package com.pidecerca.backend;

import com.pidecerca.backend.dto.AjustesRequest;
import com.pidecerca.backend.dto.Privacidad;
import com.pidecerca.backend.entity.Ajustes;
import com.pidecerca.backend.entity.Pedido;
import com.pidecerca.backend.entity.Usuario;
import com.pidecerca.backend.exception.ApiException;
import com.pidecerca.backend.repository.AjustesRepository;
import com.pidecerca.backend.service.AjustesService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReglasTest {

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private static AjustesService servicio() {
        AjustesRepository repositorio = mock(AjustesRepository.class);
        when(repositorio.findById(1L)).thenReturn(Optional.of(new Ajustes()));
        when(repositorio.save(any(Ajustes.class))).thenAnswer(i -> i.getArgument(0));
        return new AjustesService(repositorio);
    }

    private static Pedido pedidoDe(String correo) {
        Usuario cliente = new Usuario();
        cliente.setCorreo(correo);
        Pedido pedido = new Pedido();
        pedido.setUsuario(cliente);
        pedido.setCodigo("1234");
        return pedido;
    }

    private static void entrarComo(String correo, String rol) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(correo, null, List.of(new SimpleGrantedAuthority("ROLE_" + rol))));
    }

    @Test
    void losAjustesNuevosTienenValoresPorDefecto() {
        Ajustes ajustes = servicio().obtener();
        assertEquals(15, ajustes.getMinutosParaRecoger());
        assertEquals(2, ajustes.getFaltasBloqueanEfectivo());
        assertEquals(5000, ajustes.getDistanciaMaximaMetros());
        assertEquals(10, ajustes.getMaxPorProducto());
        assertEquals(30, ajustes.getMaxPorPedido());
    }

    @Test
    void elAdminPuedeCambiarUnaRegla() {
        Ajustes ajustes = servicio().actualizar(new AjustesRequest(20, 3, null, null, null, null, null, null, null, null, null));
        assertEquals(20, ajustes.getMinutosParaRecoger());
        assertEquals(3, ajustes.getFaltasBloqueanEfectivo());
        assertEquals(10, ajustes.getMaxPorProducto());
    }

    @Test
    void unaReglaFueraDeRangoSeRechaza() {
        AjustesService servicio = servicio();
        assertThrows(ApiException.class, () -> servicio.actualizar(new AjustesRequest(2, null, null, null, null, null, null, null, null, null, null)));
        assertThrows(ApiException.class, () -> servicio.actualizar(new AjustesRequest(null, 99, null, null, null, null, null, null, null, null, null)));
        assertThrows(ApiException.class, () -> servicio.actualizar(new AjustesRequest(null, null, null, 0, null, null, null, null, null, null, null)));
    }

    @Test
    void elCodigoDeEntregaSoloLoVeElDuenoDelPedido() {
        Pedido pedido = pedidoDe("ana@correo.com");
        entrarComo("ana@correo.com", "CLIENTE");
        assertEquals("1234", pedido.getCodigo());
    }

    @Test
    void laTiaNoVeElCodigoDeEntrega() {
        Pedido pedido = pedidoDe("ana@correo.com");
        entrarComo("tia@correo.com", "NEGOCIO");
        assertNull(pedido.getCodigo());
        assertEquals("1234", pedido.codigoReal());
    }

    @Test
    void elAdminVeElCodigoDeEntrega() {
        Pedido pedido = pedidoDe("ana@correo.com");
        entrarComo("admin@correo.com", "ADMIN");
        assertEquals("1234", pedido.getCodigo());
    }

    @Test
    void sinSesionNadieVeElCodigo() {
        assertNull(pedidoDe("ana@correo.com").getCodigo());
    }

    @Test
    void laPrivacidadOcultaCorreosYTelefonos() {
        assertEquals("pe•••@gmail.com", Privacidad.ocultarCorreo("pepa@gmail.com"));
        assertEquals("•••666", Privacidad.ocultarTelefono("987654666"));
    }
}
