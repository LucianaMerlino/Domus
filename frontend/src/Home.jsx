import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BotonCerrarSesion from "./BotonCerrarSesion";
import TareasHogar from "./TareasHogar";
import { obtenerHome, actualizarNombreHogar, actualizarIconoHogar, agregarMiembro, eliminarMiembro, actualizarRolMiembro } from "./api";
import "./App.css";
import "./Home.css";

const ICONOS_DOMUS = ["🏠", "🏡", "🏢", "🏘️"];

function Home({ id }) {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreHogar, setNombreHogar] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [modalIcono, setModalIcono] = useState(false);
  const [guardandoIcono, setGuardandoIcono] = useState(false);
  const [modalMiembros, setModalMiembros] = useState(false);
  const [agregarAbierto, setAgregarAbierto] = useState(false);
  const [emailMiembro, setEmailMiembro] = useState("");
  const [errorMiembro, setErrorMiembro] = useState("");
  const [procesandoMiembro, setProcesandoMiembro] = useState(false);
  const [modoPermisos, setModoPermisos] = useState(false);
  const [rolesPendientes, setRolesPendientes] = useState({});
  const [miembroAEliminar, setMiembroAEliminar] = useState(null);

  useEffect(() => {
    obtenerHome(id).then(setDatos).catch(e => setError(e.message)).finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <div className="admin-container"><h1>Domus</h1><p>Cargando...</p></div>;
  if (!datos) return <div className="admin-container"><h1>Domus</h1><p className="mensaje-error">{error || "No se pudo cargar el Home"}</p></div>;

  const esAdmin = datos.hogar?.rol === "admin";

  function iniciarEdicionNombre() {
    setNombreHogar(datos.hogar.nombre);
    setEditandoNombre(true);
    setError("");
  }

  async function guardarNombre(e) {
    e.preventDefault();
    const nombre = nombreHogar.trim();
    if (!nombre) return setError("El nombre del hogar no puede quedar vacío.");
    try {
      setGuardandoNombre(true);
      const hogar = await actualizarNombreHogar(datos.hogar.id, id, nombre);
      setDatos(actual => ({...actual, hogar:{...actual.hogar, nombre:hogar.nombre}}));
      setEditandoNombre(false);
    } catch (e) { setError(e.message); }
    finally { setGuardandoNombre(false); }
  }

  async function seleccionarIcono(icono) {
    try {
      setGuardandoIcono(true);
      const hogar = await actualizarIconoHogar(datos.hogar.id, id, icono);
      setDatos(actual => ({...actual, hogar:{...actual.hogar, icono:hogar.icono}}));
      setModalIcono(false);
    } catch (e) { setError(e.message); }
    finally { setGuardandoIcono(false); }
  }

  function abrirMiembros() {
    setModalMiembros(true); setAgregarAbierto(false); setErrorMiembro(""); setModoPermisos(false); setRolesPendientes({});
  }

  function cerrarMiembros() {
    setModalMiembros(false); setAgregarAbierto(false); setEmailMiembro(""); setErrorMiembro(""); setModoPermisos(false); setRolesPendientes({});
  }

  async function manejarAgregarMiembro(e) {
    e.preventDefault();
    const email = emailMiembro.trim();
    if (!email) { setErrorMiembro("El email es obligatorio"); return; }
    try {
      setProcesandoMiembro(true); setErrorMiembro("");
      const nuevo = await agregarMiembro(datos.hogar.id, email, id);
      setDatos(actual => ({ ...actual, integrantes: [...actual.integrantes, nuevo], cantidad_integrantes: actual.cantidad_integrantes + 1 }));
      setEmailMiembro(""); setAgregarAbierto(false);
    } catch (e) { setErrorMiembro(e.message); } finally { setProcesandoMiembro(false); }
  }

  function iniciarPermisos() {
    setAgregarAbierto(false); setModoPermisos(true);
    setRolesPendientes(Object.fromEntries(datos.integrantes.map(m => [m.id, m.rol])));
  }

  function alternarRol(miembroId) {
    setRolesPendientes(actual => ({ ...actual, [miembroId]: (actual[miembroId] || "integrante") === "admin" ? "integrante" : "admin" }));
  }

  async function guardarPermisos() {
    try {
      setProcesandoMiembro(true); setErrorMiembro("");
      for (const miembro of datos.integrantes) {
        const nuevoRol = rolesPendientes[miembro.id];
        if (nuevoRol && nuevoRol !== miembro.rol) await actualizarRolMiembro(datos.hogar.id, miembro.id, id, nuevoRol);
      }
      setDatos(actual => ({ ...actual, integrantes: actual.integrantes.map(m => ({ ...m, rol: rolesPendientes[m.id] || m.rol })) }));
      setModoPermisos(false); setRolesPendientes({});
    } catch (e) { setErrorMiembro(e.message); } finally { setProcesandoMiembro(false); }
  }

  async function confirmarEliminarMiembro() {
    if (!miembroAEliminar) return;
    try {
      setProcesandoMiembro(true); setErrorMiembro("");
      await eliminarMiembro(datos.hogar.id, miembroAEliminar.id, id);
      setDatos(actual => ({ ...actual, integrantes: actual.integrantes.filter(m => Number(m.id) !== Number(miembroAEliminar.id)), cantidad_integrantes: actual.cantidad_integrantes - 1 }));
      setMiembroAEliminar(null);
    } catch (e) { setErrorMiembro(e.message); } finally { setProcesandoMiembro(false); }
  }

  return <div className="admin-container home-contenedor">
    <h1>Domus</h1>

    <div className="home-cabecera-completa">
      <div className="home-identidad">
        {datos.hogar ? <>
          <button type="button" className="boton-hogar" disabled={!esAdmin} onClick={() => esAdmin && setModalIcono(true)} title={esAdmin ? "Editar ícono del hogar" : "Ícono del hogar"}>{datos.hogar.icono || "🏠"}</button>
          {editandoNombre ? <form className="home-editar-nombre" onSubmit={guardarNombre}>
            <input value={nombreHogar} onChange={e => setNombreHogar(e.target.value)} maxLength={100} autoFocus />
            <button type="submit" disabled={guardandoNombre}>Guardar</button>
            <button type="button" onClick={() => setEditandoNombre(false)} disabled={guardandoNombre}>Cancelar</button>
          </form> : <>
            <span className="home-nombre-hogar">{datos.hogar.nombre}</span>
            {esAdmin && <button type="button" onClick={iniciarEdicionNombre}>Editar</button>}
          </>}
        </> : <span>Aún no pertencés a un hogar</span>}
      </div>
      <div className="header-acciones">
        <button type="button" className="boton-ranking" onClick={() => navigate("/perfil")}><span aria-hidden="true">👤</span> Mi perfil</button>
        <BotonCerrarSesion />
      </div>
    </div>

    {datos.hogar && <div className="home-rol-linea"><span className="home-rol">{esAdmin ? "Administrador/a" : "Miembro"}</span></div>}
    {error && <p className="mensaje-error">{error}</p>}

    {!datos.hogar ? <div className="tareas-hogar-container"><h2>Aún no pertencés a un hogar</h2></div> : <>
      <div className="tareas-hogar-container">
        <div className="tareas-hogar-header"><h2>Integrantes del hogar</h2><div className="home-integrantes-acciones"><span className="badge-puntos">{datos.cantidad_integrantes} integrantes</span>{esAdmin && <button type="button" className="boton-gestionar-miembros" onClick={abrirMiembros}>Gestionar miembros</button>}</div></div>
        <div className="lista-miembros">{datos.integrantes.map(m => <div className="miembro-item" key={m.id}><div className="miembro-avatar">{m.nombre?.charAt(0).toUpperCase() || "?"}</div><div className="miembro-info"><span className="miembro-nombre">{m.nombre}</span><span className={m.rol === "admin" ? "miembro-rol admin" : "miembro-rol"}>{m.rol === "admin" ? "Administrador/a" : "Miembro"}</span></div></div>)}</div>
      </div>

      <TareasHogar hogarId={datos.hogar.id} usuarioId={id} miembros={datos.integrantes} esAdmin={esAdmin} realizadasInicial={datos.cantidad_tareas_realizadas} />
    </>}



    {modalMiembros && esAdmin && <div className="modal-fondo" onClick={cerrarMiembros}><div className="modal modal-miembros" onClick={e => e.stopPropagation()}>
      <div className="modal-miembros-header"><h2>Miembros del hogar</h2><button type="button" className="cerrar-modal-miembros" onClick={cerrarMiembros}>×</button></div>
      <div className="agregar-miembro-container">{!agregarAbierto ? <button type="button" className="boton-agregar-miembro" onClick={() => { setModoPermisos(false); setAgregarAbierto(true); }}>+ Agregar miembro</button> : <form className="form-agregar-miembro" onSubmit={manejarAgregarMiembro}><label htmlFor="email-miembro">Email del usuario</label><input id="email-miembro" type="email" value={emailMiembro} onChange={e => { setEmailMiembro(e.target.value); setErrorMiembro(""); }} placeholder="ejemplo@gmail.com" autoFocus />{errorMiembro && <p className="mensaje-error-miembro">{errorMiembro}</p>}<div className="acciones-agregar-miembro"><button type="button" className="boton-cancelar-miembro" onClick={() => { setAgregarAbierto(false); setEmailMiembro(""); setErrorMiembro(""); }}>Cancelar</button><button type="submit" className="boton-confirmar-miembro" disabled={procesandoMiembro}>{procesandoMiembro ? "Agregando..." : "Agregar"}</button></div></form>}</div>
      <div className="modal-miembros-acciones">{!modoPermisos ? <button type="button" className="boton-editar-permisos" onClick={iniciarPermisos}>Editar permisos</button> : <><button type="button" className="boton-editar-permisos" onClick={guardarPermisos} disabled={procesandoMiembro}>Guardar cambios</button><button type="button" className="boton-cancelar-miembros" onClick={() => { setModoPermisos(false); setRolesPendientes({}); }}>Cancelar</button></>}</div>
      <div className="lista-miembros">{datos.integrantes.map(m => { const rol = modoPermisos ? (rolesPendientes[m.id] || m.rol) : m.rol; return <div className="miembro-item" key={m.id}><div className="miembro-avatar">{m.nombre?.charAt(0).toUpperCase() || "?"}</div><div className="miembro-info"><span className="miembro-nombre">{m.nombre}</span><span className={rol === "admin" ? "miembro-rol admin" : "miembro-rol"}>{rol === "admin" ? "Administrador/a" : "Miembro"}</span></div>{Number(m.id) !== Number(id) && <div className="miembro-item-acciones">{modoPermisos && <button type="button" className="miembro-toggle" onClick={() => alternarRol(m.id)}>{rol === "admin" ? "Administrador" : "Miembro"}</button>}<button type="button" className="boton-eliminar-miembro" onClick={() => setMiembroAEliminar(m)}>Eliminar</button></div>}</div>})}</div>
    </div></div>}

    {miembroAEliminar && <div className="modal-fondo modal-fondo-confirmacion" onClick={() => setMiembroAEliminar(null)}><div className="modal modal-confirmar-miembro" onClick={e => e.stopPropagation()}><h2>¿Seguro que querés eliminar este miembro?</h2><p>Vas a eliminar a &quot;{miembroAEliminar.nombre}&quot; del hogar.</p><div className="modal-botones"><button type="button" onClick={() => setMiembroAEliminar(null)}>Cancelar</button><button type="button" onClick={confirmarEliminarMiembro} disabled={procesandoMiembro}>Eliminar</button></div></div></div>}

    {modalIcono && esAdmin && <div className="modal-fondo" onClick={() => setModalIcono(false)}><div className="modal" onClick={e => e.stopPropagation()}><h2>Elegir ícono del hogar</h2><div className="home-iconos">{ICONOS_DOMUS.map(icono => <button key={icono} type="button" disabled={guardandoIcono} onClick={() => seleccionarIcono(icono)}>{icono}</button>)}</div><div className="modal-botones"><button type="button" disabled={guardandoIcono} onClick={() => setModalIcono(false)}>Cancelar</button></div></div></div>}
  </div>;
}

export default Home;
