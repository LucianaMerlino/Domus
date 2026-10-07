import { useEffect, useState } from "react";
import { obtenerRecompensas, crearRecompensa } from "./api";

const VACIA = { nombre: "", descripcion: "", costo_puntos: "" };

function validar(form) {
  const nombre = form.nombre.trim();
  if (!nombre) return "El nombre de la recompensa es obligatorio";
  if (nombre.length > 50) return "El nombre de la recompensa no puede superar los 50 caracteres";
  if (!/^[\p{L}\p{N}\s'".,]+$/u.test(nombre)) return "El título solo puede contener letras, números, comillas, puntos y comas";
  if (form.descripcion.length > 200) return "La descripción de la recompensa no puede superar los 200 caracteres";
  const meta = Number(form.costo_puntos);
  if (form.costo_puntos === "" || !Number.isInteger(meta) || meta < 1) return "La meta de puntos debe ser un número entero mayor o igual a 1";
  return "";
}

function Recompensas({ hogarId, usuarioId, esAdmin }) {
  const [recompensas, setRecompensas] = useState([]);
  const [modalCrear, setModalCrear] = useState(false);
  const [form, setForm] = useState(VACIA);
  const [error, setError] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!hogarId || !usuarioId) return;
    obtenerRecompensas(hogarId, usuarioId).then(setRecompensas).catch(e => setError(e.message));
  }, [hogarId, usuarioId]);

  function abrirCrear() { setForm(VACIA); setErrorForm(""); setModalCrear(true); }
  function cerrarCrear() { if (!guardando) { setModalCrear(false); setForm(VACIA); setErrorForm(""); } }
  function cambiar(e) { setForm(actual => ({ ...actual, [e.target.name]: e.target.value })); }

  async function guardar(e) {
    e.preventDefault();
    const validacion = validar(form);
    if (validacion) return setErrorForm(validacion);
    try {
      setGuardando(true); setErrorForm("");
      const nueva = await crearRecompensa(hogarId, {
        nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), costo_puntos: Number(form.costo_puntos)
      }, usuarioId);
      setRecompensas(actual => [nueva, ...actual]);
      setModalCrear(false); setForm(VACIA);
    } catch (e) { setErrorForm(e.message); }
    finally { setGuardando(false); }
  }

  return <div className="tareas-hogar-container">
    <div className="tareas-hogar-header">
      <h2>Recompensas</h2>
      {esAdmin && <button type="button" onClick={abrirCrear}>Crear Recompensa</button>}
    </div>

    {error && <p className="mensaje-error">{error}</p>}
    {recompensas.length === 0 ? <p className="sin-tareas">No hay recompensas creadas</p> :
      <div className="lista-tareas">{recompensas.map(r =>
        <div className="fila-tarea" key={r.id}>
          <div className="fila-info"><span className="fila-nombre">{r.nombre}</span>{r.descripcion && <span className="fila-descripcion">{r.descripcion}</span>}</div>
          <span className="fila-asignado">{r.asignado_a || "Sin asignar"}</span>
          <span className={(r.estado || "").toLowerCase() === "reclamada" ? "badge-estado realizada" : "badge-estado pendiente"}>{r.estado || "Por reclamar"}</span>
          <span className="badge-puntos">{r.costo_puntos} pts</span>
        </div>)}</div>}

    {modalCrear && esAdmin && <div className="modal-fondo" onClick={cerrarCrear}>
      <div className="modal modal-crear" onClick={e => e.stopPropagation()}>
        <h2>Crear Recompensa</h2>
        <form onSubmit={guardar}>
          <div className="form-group"><label htmlFor="recompensa-nombre">Nombre recompensa</label><input id="recompensa-nombre" name="nombre" value={form.nombre} onChange={cambiar} maxLength={50} placeholder="Ingresá el nombre de la recompensa" autoFocus /><small>{form.nombre.length}/50 caracteres</small></div>
          <div className="form-group"><label htmlFor="recompensa-descripcion">Descripción Recompensa</label><textarea id="recompensa-descripcion" name="descripcion" value={form.descripcion} onChange={cambiar} maxLength={200} rows={4} placeholder="Ingresá una descripción (opcional)" /><small>{form.descripcion.length}/200 caracteres</small></div>
          <div className="form-group"><label htmlFor="recompensa-meta">Meta de puntos</label><input id="recompensa-meta" name="costo_puntos" type="number" min="1" step="1" value={form.costo_puntos} onChange={cambiar} /></div>
          {errorForm && <p className="mensaje-error">{errorForm}</p>}
          <div className="modal-botones"><button type="button" onClick={cerrarCrear} disabled={guardando}>Cancelar</button><button type="submit" disabled={guardando}>{guardando ? "Creando..." : "Crear"}</button></div>
        </form>
      </div>
    </div>}
  </div>;
}

export default Recompensas;
