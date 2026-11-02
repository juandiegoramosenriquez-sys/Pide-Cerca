package com.pidecerca.backend.entity;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedido")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fecha;
    private Double total;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private EstadoPedido estado;

    private Integer tiempoPreparacion;

    private LocalDateTime fechaAceptado;

    private LocalDateTime fechaListo;

    private LocalDateTime fechaRecogido;

    private LocalDateTime limiteRecoger;

    private LocalDateTime limitePago;

    private LocalDateTime fechaAvisoPago;

    @Column(length = 20)
    private String referenciaPago;

    private LocalDateTime fechaPagoObservado;

    private String notas;

    @Column(length = 4)
    private String codigo;

    private String motivoCancelacion;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @JsonIgnoreProperties({"correo", "password", "rol", "activo", "fechaRegistro", "aceptoPrivacidad", "fechaPrivacidad"})
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "negocio_id")
    @JsonIgnoreProperties({"propietario"})
    private Negocio negocio;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @JsonIgnoreProperties({"pedido"})
    private List<DetallePedido> detalles = new ArrayList<>();

    @OneToOne(mappedBy = "pedido")
    @JsonIgnoreProperties({"pedido"})
    private Pago pago;

    public Pedido() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public EstadoPedido getEstado() {
        return estado;
    }

    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }

    public Integer getTiempoPreparacion() {
        return tiempoPreparacion;
    }

    public void setTiempoPreparacion(Integer tiempoPreparacion) {
        this.tiempoPreparacion = tiempoPreparacion;
    }

    public LocalDateTime getFechaAceptado() {
        return fechaAceptado;
    }

    public void setFechaAceptado(LocalDateTime fechaAceptado) {
        this.fechaAceptado = fechaAceptado;
    }

    public LocalDateTime getFechaListo() {
        return fechaListo;
    }

    public void setFechaListo(LocalDateTime fechaListo) {
        this.fechaListo = fechaListo;
    }

    public LocalDateTime getFechaRecogido() {
        return fechaRecogido;
    }

    public void setFechaRecogido(LocalDateTime fechaRecogido) {
        this.fechaRecogido = fechaRecogido;
    }

    public LocalDateTime getLimiteAceptar() {
        if (estado != EstadoPedido.PENDIENTE || fecha == null) {
            return null;
        }
        return fecha.plusMinutes(Limites.MINUTOS_PARA_ACEPTAR);
    }

    public LocalDateTime getLimiteRecoger() {
        return limiteRecoger;
    }

    public void setLimiteRecoger(LocalDateTime limiteRecoger) {
        this.limiteRecoger = limiteRecoger;
    }

    public LocalDateTime getLimitePago() {
        return limitePago;
    }

    public void setLimitePago(LocalDateTime limitePago) {
        this.limitePago = limitePago;
    }

    public LocalDateTime getFechaAvisoPago() {
        return fechaAvisoPago;
    }

    public void setFechaAvisoPago(LocalDateTime fechaAvisoPago) {
        this.fechaAvisoPago = fechaAvisoPago;
    }

    public String getReferenciaPago() {
        return referenciaPago;
    }

    public void setReferenciaPago(String referenciaPago) {
        this.referenciaPago = referenciaPago;
    }

    public LocalDateTime getFechaPagoObservado() {
        return fechaPagoObservado;
    }

    public void setFechaPagoObservado(LocalDateTime fechaPagoObservado) {
        this.fechaPagoObservado = fechaPagoObservado;
    }

    public boolean getPagoObservado() {
        return fechaPagoObservado != null;
    }

    public boolean getPagoAvisado() {
        return fechaAvisoPago != null;
    }

    public java.util.Map<String, Object> getDatosPago() {
        if (estado != EstadoPedido.ESPERANDO_PAGO || pago == null || negocio == null || usuario == null) {
            return null;
        }
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion == null) {
            return null;
        }
        boolean admin = autenticacion.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        boolean dueno = usuario.getCorreo() != null && usuario.getCorreo().equalsIgnoreCase(autenticacion.getName());
        if (!admin && !dueno) {
            return null;
        }
        String numero = negocio.numeroDe(pago.getMetodo());
        java.util.Map<String, Object> datos = new java.util.LinkedHashMap<>();
        datos.put("metodo", pago.getMetodo());
        datos.put("numero", numero);
        datos.put("nombre", negocio.getNombreCobro());
        datos.put("verificado", negocio.getCobrosVerificados());
        datos.put("monto", total);
        return datos;
    }

    public String codigoReal() {
        return codigo;
    }

    public String getCodigo() {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion == null || usuario == null) {
            return null;
        }
        boolean admin = autenticacion.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        boolean dueno = usuario.getCorreo() != null && usuario.getCorreo().equalsIgnoreCase(autenticacion.getName());
        return admin || dueno ? codigo : null;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public String getMotivoCancelacion() {
        return motivoCancelacion;
    }

    public void setMotivoCancelacion(String motivoCancelacion) {
        this.motivoCancelacion = motivoCancelacion;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Negocio getNegocio() {
        return negocio;
    }

    public void setNegocio(Negocio negocio) {
        this.negocio = negocio;
    }

    public List<DetallePedido> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<DetallePedido> detalles) {
        this.detalles = detalles;
    }

    public Pago getPago() {
        return pago;
    }

    public void setPago(Pago pago) {
        this.pago = pago;
    }
}
