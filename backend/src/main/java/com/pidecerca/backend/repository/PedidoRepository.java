package com.pidecerca.backend.repository;

import com.pidecerca.backend.entity.EstadoPedido;
import com.pidecerca.backend.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findAllByOrderByFechaDesc();

    List<Pedido> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    List<Pedido> findByNegocioIdOrderByFechaDesc(Long negocioId);

    List<Pedido> findByNegocioIdAndEstadoInOrderByFechaAsc(Long negocioId, Collection<EstadoPedido> estados);

    List<Pedido> findByEstadoOrderByFechaDesc(EstadoPedido estado);

    List<Pedido> findByEstadoAndFechaBefore(EstadoPedido estado, java.time.LocalDateTime fecha);

    List<Pedido> findByEstadoAndLimitePagoBefore(EstadoPedido estado, LocalDateTime limite);

    List<Pedido> findByEstadoAndLimiteRecogerBefore(EstadoPedido estado, LocalDateTime limite);

    List<Pedido> findByFechaAfter(LocalDateTime desde);

    long countByEstado(EstadoPedido estado);

    long countByFechaAfter(LocalDateTime fecha);

    boolean existsByNegocioId(Long negocioId);

    boolean existsByUsuarioId(Long usuarioId);

    @Query("select coalesce(sum(p.total), 0) from Pedido p where p.estado <> com.pidecerca.backend.entity.EstadoPedido.CANCELADO and not (p.estado = com.pidecerca.backend.entity.EstadoPedido.NO_RECOGIDO and exists (select 1 from Pago g where g.pedido = p and g.metodo = 'EFECTIVO')) and not exists (select 1 from Pago q where q.pedido = p and q.estado in (com.pidecerca.backend.entity.EstadoPago.PENDIENTE, com.pidecerca.backend.entity.EstadoPago.FALLIDO)) and p.fecha >= :desde")
    Double sumarVentasDesde(@Param("desde") LocalDateTime desde);

    @Query("select coalesce(sum(p.total), 0) from Pedido p where p.estado <> com.pidecerca.backend.entity.EstadoPedido.CANCELADO and not (p.estado = com.pidecerca.backend.entity.EstadoPedido.NO_RECOGIDO and exists (select 1 from Pago g where g.pedido = p and g.metodo = 'EFECTIVO')) and not exists (select 1 from Pago q where q.pedido = p and q.estado in (com.pidecerca.backend.entity.EstadoPago.PENDIENTE, com.pidecerca.backend.entity.EstadoPago.FALLIDO))")
    Double sumarVentasTotales();
}
