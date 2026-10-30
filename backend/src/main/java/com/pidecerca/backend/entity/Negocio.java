package com.pidecerca.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "negocio")
public class Negocio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    private String descripcion;

    private String tipoComida;

    private String direccion;

    private String telefono;

    private String imagen;

    @Column(length = 7)
    private String diasAtencion;

    @Column(length = 5)
    private String horaApertura;

    @Column(length = 5)
    private String horaCierre;

    private String horario;

    private Double latitud;

    private Double longitud;

    private Integer tiempoEstimado;

    private Boolean abierto;

    private Boolean activo;

    @Enumerated(EnumType.STRING)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private EstadoAprobacion estadoAprobacion;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String motivoRechazo;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime fechaSolicitud;

    @JsonIgnore
    private LocalDateTime fechaCambioNombre;

    @JsonIgnore
    private LocalDateTime ultimaConexion;

    @JsonIgnore
    private Integer pedidosSinResponder;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String motivoCierre;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Boolean ubicacionEnVivo;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime ubicacionActualizada;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @JsonIgnoreProperties({"correo", "telefono", "password", "rol", "activo", "fechaRegistro", "aceptoPrivacidad", "fechaPrivacidad", "fechaCambioPassword"})
    private Usuario propietario;

    @Transient
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Double distanciaMetros;

    public Negocio() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getTipoComida() {
        return tipoComida;
    }

    public void setTipoComida(String tipoComida) {
        this.tipoComida = tipoComida;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }

    public String getDiasAtencion() {
        return diasAtencion;
    }

    public void setDiasAtencion(String diasAtencion) {
        this.diasAtencion = diasAtencion;
    }

    public String getHoraApertura() {
        return horaApertura;
    }

    public void setHoraApertura(String horaApertura) {
        this.horaApertura = horaApertura;
    }

    public String getHoraCierre() {
        return horaCierre;
    }

    public void setHoraCierre(String horaCierre) {
        this.horaCierre = horaCierre;
    }

    public String getHorario() {
        return horario;
    }

    public void setHorario(String horario) {
        this.horario = horario;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }

    public Integer getTiempoEstimado() {
        return tiempoEstimado;
    }

    public void setTiempoEstimado(Integer tiempoEstimado) {
        this.tiempoEstimado = tiempoEstimado;
    }

    public Boolean getAbierto() {
        return abierto;
    }

    public void setAbierto(Boolean abierto) {
        this.abierto = abierto;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public EstadoAprobacion getEstadoAprobacion() {
        return estadoAprobacion;
    }

    public void setEstadoAprobacion(EstadoAprobacion estadoAprobacion) {
        this.estadoAprobacion = estadoAprobacion;
    }

    public String getMotivoRechazo() {
        return motivoRechazo;
    }

    public void setMotivoRechazo(String motivoRechazo) {
        this.motivoRechazo = motivoRechazo;
    }

    public LocalDateTime getFechaSolicitud() {
        return fechaSolicitud;
    }

    public void setFechaSolicitud(LocalDateTime fechaSolicitud) {
        this.fechaSolicitud = fechaSolicitud;
    }

    public Boolean getUbicacionEnVivo() {
        return ubicacionEnVivo;
    }

    public void setUbicacionEnVivo(Boolean ubicacionEnVivo) {
        this.ubicacionEnVivo = ubicacionEnVivo;
    }

    public LocalDateTime getUbicacionActualizada() {
        return ubicacionActualizada;
    }

    public void setUbicacionActualizada(LocalDateTime ubicacionActualizada) {
        this.ubicacionActualizada = ubicacionActualizada;
    }

    public LocalDateTime getUltimaConexion() {
        return ultimaConexion;
    }

    public void setUltimaConexion(LocalDateTime ultimaConexion) {
        this.ultimaConexion = ultimaConexion;
    }

    public Integer getPedidosSinResponder() {
        return pedidosSinResponder;
    }

    public void setPedidosSinResponder(Integer pedidosSinResponder) {
        this.pedidosSinResponder = pedidosSinResponder;
    }

    public String getMotivoCierre() {
        return motivoCierre;
    }

    public void setMotivoCierre(String motivoCierre) {
        this.motivoCierre = motivoCierre;
    }

    public LocalDateTime getFechaCambioNombre() {
        return fechaCambioNombre;
    }

    public void setFechaCambioNombre(LocalDateTime fechaCambioNombre) {
        this.fechaCambioNombre = fechaCambioNombre;
    }

    @JsonProperty(value = "proximoCambioNombre", access = JsonProperty.Access.READ_ONLY)
    public LocalDateTime getProximoCambioNombre() {
        return Limites.proximoCambio(fechaCambioNombre);
    }

    public boolean estaAprobado() {
        return estadoAprobacion == EstadoAprobacion.APROBADO;
    }

    public Usuario getPropietario() {
        return propietario;
    }

    public void setPropietario(Usuario propietario) {
        this.propietario = propietario;
    }

    public Double getDistanciaMetros() {
        return distanciaMetros;
    }

    public void setDistanciaMetros(Double distanciaMetros) {
        this.distanciaMetros = distanciaMetros;
    }
}
