import { useEffect, useState } from "react";
import { obtenerTareas, actualizarTarea, eliminarTarea } from "./api";
import PoolTareas from "./PoolTareas";
import "./Perfil.css";

function TareasHogar({ hogarId, usuarioId, miembros, esAdmin }) {
  const [tareas, setTareas] = useState([]);
  const [estado, setEstado] = useState("Todos");
  const [asignado, setAsignado] = useState("Todos");
  const [orden, setOrden] = useState("");
  const [seccion, setSeccion] = useState("tareas");
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tareaAEliminar, setTareaAEliminar] = useState(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", estado: "Pendiente", asignado_id: "", puntos: "" });
  const [error, setError] = useState("");

  async function cargarTareas() {
    try {
      setError("");
      const datos = await obtenerTareas({
        hogar: hogarId,
        estado: estado !== "Todos" ? estado : undefined,
        asignado: asignado !== "Todos" ? asignado : undefined,
        orden: orden || undefined
      });
      setTareas(datos);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { if (hogarId) cargarTareas(); }, [hogarId, estado, asignado, orden]);

  function abrirDetalle(tarea) {
    setTareaSeleccionada(tarea);
    setModoEdicion(false);
    setError("");
  }

  function editar() {
    setForm({
      nombre: tareaSeleccionada.nombre || "",
      descripcion: tareaSeleccionada.descripcion || "",
      estado: tareaSeleccionada.estado || "Pendiente",
      asignado_id: tareaSeleccionada.asignado_id ? String(tareaSeleccionada.asignado_id) : "",
      puntos: String(tareaSeleccionada.puntos ?? 0)
    });
    setModoEdicion(true);
  }

  async function guardar(event) {
    event.preventDefault();
    const puntos = Number(form.puntos);
    if (!form.nombre.trim()) return setError("El título es un campo obligatorio");
    if (!Number.isInteger(puntos) || puntos <= 0) return setError("Los puntos deben ser un número entero mayor a 0");
    try {
      const actualizada = await actualizarTarea(tareaSeleccionada.id, { ...form, nombre: form.nombre.trim(), puntos, asignado_id: form.asignado_id ? Number(form.asignado_id) : null }, usuarioId);
      setTareaSeleccionada(actualizada);
      setModoEdicion(false);
      await cargarTareas();
    } catch (e) { setError(e.message); }
  }

  async function confirmarEliminar() {
    try {
      await eliminarTarea(tareaAEliminar.id, usuarioId);
      setTareaAEliminar(null);
      setTareaSeleccionada(null);
      await cargarTareas();
    } catch (e) { setError(e.message); }
  }

  return <>
    <div className="home-tareas-barra">
      <div>
        <h2>Tareas del hogar</h2>
      </div>
    </div>

    {esAdmin && <div className="tabs-admin home-tabs">
      <button type="button" className={seccion === "tareas" ? "tab-activa" : ""} onClick={() => setSeccion("tareas")}>Todas las tareas</button>
      <button type="button" className={seccion === "pool" ? "tab-activa" : ""} onClick={() => setSeccion("pool")}>Pool de tareas</button>
    </div>}

    {esAdmin && seccion === "pool" ? (
      <PoolTareas hogarId={hogarId} usuarioId={usuarioId} miembros={miembros} onTareaCreada={() => { setSeccion("tareas"); cargarTareas(); }} />
    ) : (
      <div className="tareas-hogar-container home-tareas-compartidas">
        <div className="filtros-tareas">
          <div className="filtro-grupo"><label>Estado</label><select value={estado} onChange={e => setEstado(e.target.value)}><option>Todos</option><option>Pendiente</option><option>Realizada</option></select></div>
          <div className="filtro-grupo"><label>Asignada a</label><select value={asignado} onChange={e => setAsignado(e.target.value)}><option value="Todos">Todos</option><option value="sin_asignar">Sin asignar</option>{miembros.map(m => <option key={m.id} value={m.id}>{m.nombre}{m.rol === "admin" ? " (admin)" : ""}</option>)}</select></div>
          <div className="filtro-grupo"><label>Puntos</label><select value={orden} onChange={e => setOrden(e.target.value)}><option value="">Todos</option><option value="asc">Menor a mayor</option><option value="desc">Mayor a menor</option></select></div>
        </div>
        {error && <p className="mensaje-error">{error}</p>}
        {tareas.length === 0 ? <p className="sin-tareas">No hay tareas con estos filtros.</p> : <div className="lista-tareas">{tareas.map(t => <div className="fila-tarea" key={t.id} role="button" tabIndex={0} onClick={() => abrirDetalle(t)} onKeyDown={e => (e.key === "Enter" || e.key === " ") && abrirDetalle(t)}>
          <div className="fila-info"><span className="fila-nombre">{t.nombre}</span><span className="fila-descripcion">{t.descripcion || "Sin descripción"}</span></div>
          <span className="fila-asignado">{t.asignado_a || "Sin asignar"}</span>
          <span className={(t.estado || "").toLowerCase() === "realizada" ? "badge-estado realizada" : "badge-estado pendiente"}>{t.estado || "Pendiente"}</span>
          <span className="badge-puntos">{t.puntos ?? 0} pts</span>
          {esAdmin && <button type="button" className="boton-eliminar" onClick={e => { e.stopPropagation(); setTareaAEliminar(t); }}>🗑️</button>}
        </div>)}</div>}
      </div>
    )}

    {tareaSeleccionada && (
      <div className="perfil-modal-overlay" onClick={() => { setTareaSeleccionada(null); setModoEdicion(false); }}>
        <div className="perfil-modal home-task-modal" onClick={e => e.stopPropagation()}>
          {modoEdicion ? (
            <form onSubmit={guardar} className="home-edit-form">
              <h3>Editar tarea</h3>
              <div className="form-group"><label>Título</label><input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})}/></div>
              <div className="form-group"><label>Descripción</label><textarea value={form.descripcion} onChange={e => setForm({...form, descripcion:e.target.value})}/></div>
              <div className="form-group"><label>Estado</label><select value={form.estado} onChange={e => setForm({...form, estado:e.target.value})}><option>Pendiente</option><option>Realizada</option></select></div>
              <div className="form-group"><label>Asignada a</label><select value={form.asignado_id} onChange={e => setForm({...form, asignado_id:e.target.value})}><option value="">Sin asignar</option>{miembros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select></div>
              <div className="form-group"><label>Puntos</label><input type="number" min="1" value={form.puntos} onChange={e => setForm({...form, puntos:e.target.value})}/></div>
              {error && <p className="mensaje-error">{error}</p>}
              <div className="perfil-modal-acciones">
                <button type="button" className="btn-cerrar" onClick={() => setModoEdicion(false)}>Cancelar</button>
                <button type="submit" className="btn-realizar">Guardar</button>
              </div>
            </form>
          ) : (
            <>
              <h3>{tareaSeleccionada.nombre}</h3>
              <div className="perfil-modal-info">
                <span className={(tareaSeleccionada.estado || "").toLowerCase() === "realizada" ? "perfil-estado realizada" : "perfil-estado pendiente"}>{tareaSeleccionada.estado || "Pendiente"}</span>
                <span className="perfil-tarea-puntos">{tareaSeleccionada.puntos ?? 0} pts</span>
              </div>
              <p className="perfil-modal-descripcion">{tareaSeleccionada.descripcion || "Sin descripción"}</p>
              <p className="home-modal-asignado"><strong>Asignada a:</strong> {tareaSeleccionada.asignado_a || "Sin asignar"}</p>
              <div className="perfil-modal-acciones">
                <button type="button" className="btn-cerrar" onClick={() => setTareaSeleccionada(null)}>Cerrar</button>
                {esAdmin && <button type="button" className="btn-realizar" onClick={editar}>Editar</button>}
              </div>
            </>
          )}
        </div>
      </div>
    )}

    {tareaAEliminar && <div className="modal-fondo"><div className="modal"><h2>¿Seguro que querés eliminar esta tarea?</h2><p>Vas a eliminar “{tareaAEliminar.nombre}” de forma definitiva.</p><div className="modal-botones"><button type="button" onClick={() => setTareaAEliminar(null)}>Cancelar</button><button type="button" onClick={confirmarEliminar}>Eliminar</button></div></div></div>}
  </>;
}
export default TareasHogar;
