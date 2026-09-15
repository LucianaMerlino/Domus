import { useEffect, useState } from "react";
import "./App.css";

import {
    obtenerAdmin,
    obtenerTareas,
    obtenerMiembros,
    crearTarea,
    eliminarTarea,
    actualizarTarea
} from "./api";

// Fallback si el admin todavía no tiene un hogar asignado
const HOGAR_POR_DEFECTO = 1;

function Admin({ id }) {
    const [admin, setAdmin] = useState(null);
    const [hogarId, setHogarId] = useState(null);
    const [tareas, setTareas] = useState([]);
    const [miembros, setMiembros] = useState([]);
    const [tareaAEliminar, setTareaAEliminar] = useState(null);
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [tituloEdicion, setTituloEdicion] = useState("");
    const [descripcionEdicion, setDescripcionEdicion] = useState("");
    const [estadoEdicion, setEstadoEdicion] = useState("Pendiente");
    const [asignadoEdicion, setAsignadoEdicion] = useState("");
    const [puntosEdicion, setPuntosEdicion] = useState("");
    const [errorEdicion, setErrorEdicion] = useState("");
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);

    // Modal de creación de tarea
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);

    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [asignadoNuevo, setAsignadoNuevo] = useState("");

    const [puntos, setPuntos] = useState("");
    const [errorPuntos, setErrorPuntos] = useState("");

    const [errorTitulo, setErrorTitulo] = useState("");
    const [errorDescripcion, setErrorDescripcion] = useState("");

    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    // Estados de filtro
    const [estado, setEstado] = useState("Todos");
    const [asignado, setAsignado] = useState("Todos");
    const [orden, setOrden] = useState("");

    useEffect(() => {
        // Primero el admin: de ahí sale a qué hogar pertenece
        obtenerAdmin(id)
            .then((datosAdmin) => {
                setAdmin(datosAdmin);

                const hogarDelAdmin = datosAdmin.hogar_id ?? HOGAR_POR_DEFECTO;
                setHogarId(hogarDelAdmin);

                // Solo los miembros de ese hogar
                return obtenerMiembros(hogarDelAdmin);
            })
            .then(setMiembros)
            .catch((error) => setError(error.message));
    }, [id]);

    // Se recarga al saber el hogar y cada vez que cambia un filtro
    useEffect(() => {
        if (hogarId == null) {
            return;
        }

        let cancelado = false;

        obtenerTareas({
            hogar: hogarId,
            estado: estado !== "Todos" ? estado : undefined,
            asignado: asignado !== "Todos" ? asignado : undefined,
            orden: orden || undefined
        })
            .then((datos) => {
                if (!cancelado) {
                    setTareas(datos);
                }
            })
            .catch((error) => {
                if (!cancelado) {
                    setError(error.message);
                }
            });

        return () => {
            cancelado = true;
        };
    }, [hogarId, estado, asignado, orden]);

    // Abre el modal siempre vacío (criterio de aceptación)
    function abrirModalCrear() {
        setTitulo("");
        setDescripcion("");
        setAsignadoNuevo("");
        setPuntos("");
        setErrorTitulo("");
        setErrorDescripcion("");
        setErrorPuntos("");
        setError(null);
        setMensaje(null);
        setModalCrearAbierto(true);
    }

    function cerrarModalCrear() {
        setModalCrearAbierto(false);
    }

    function abrirModalDetalle(tarea) {
        setTareaSeleccionada(tarea);
        setModoEdicion(false);
        setErrorEdicion("");
    }

    function cerrarModalDetalle() {
        setTareaSeleccionada(null);
        setModoEdicion(false);
        setErrorEdicion("");
    }

    function iniciarEdicion() {
        setTituloEdicion(tareaSeleccionada.nombre || "");
        setDescripcionEdicion(tareaSeleccionada.descripcion || "");
        setEstadoEdicion(tareaSeleccionada.estado || "Pendiente");
        setAsignadoEdicion(tareaSeleccionada.asignado_a || "");
        setPuntosEdicion(String(tareaSeleccionada.puntos ?? ""));
        setErrorEdicion("");
        setModoEdicion(true);
    }

    function cancelarEdicion() {
        setErrorEdicion("");
        setModoEdicion(false);
    }

    async function guardarEdicion(event) {
        event.preventDefault();
        setErrorEdicion("");

        if (tituloEdicion.trim() === "") {
            setErrorEdicion("El título es un campo obligatorio");
            return;
        }

        const puntosNumero = Number(puntosEdicion);
        if (!Number.isInteger(puntosNumero) || puntosNumero < 0) {
            setErrorEdicion("Los puntos deben ser un número entero mayor o igual a 0");
            return;
        }

        setGuardandoEdicion(true);

        try {
            const tareaActualizada = await actualizarTarea(tareaSeleccionada.id, {
                nombre: tituloEdicion.trim(),
                descripcion: descripcionEdicion.trim(),
                estado: estadoEdicion,
                asignado_a: asignadoEdicion || null,
                puntos: puntosNumero
            });

            setTareas((tareasActuales) =>
                tareasActuales.map((tarea) =>
                    tarea.id === tareaActualizada.id ? tareaActualizada : tarea
                )
            );
            setTareaSeleccionada(tareaActualizada);
            setModoEdicion(false);
        } catch (error) {
            setErrorEdicion(error.message);
        } finally {
            setGuardandoEdicion(false);
        }
    }

    async function manejarCrearTarea(event) {
        event.preventDefault();

        // Limpiamos mensajes anteriores
        setError(null);
        setMensaje(null);
        setErrorTitulo("");
        setErrorDescripcion("");
        setErrorPuntos("");

        let formularioValido = true;

        // Validación del título
        if (titulo.trim() === "") {
            setErrorTitulo("El título es un campo obligatorio");
            formularioValido = false;
        } else if (titulo.length > 100) {
            setErrorTitulo("El título no puede superar los 100 caracteres");
            formularioValido = false;
        } else if (!/^[\p{L}\s'".,]+$/u.test(titulo)) {
            setErrorTitulo("El título solo puede contener letras, comillas, puntos y comas");
            formularioValido = false;
        }

        // Validación de la descripción
        if (descripcion.length > 500) {
            setErrorDescripcion(
                "La descripción no puede superar los 500 caracteres"
            );
            formularioValido = false;
        }

        // Validación de puntos
        if (puntos !== "") {
            const puntosNumero = Number(puntos);

            if (!Number.isInteger(puntosNumero) || puntosNumero < 0) {
                setErrorPuntos("Los puntos deben ser un número entero mayor o igual a 0");
                formularioValido = false;
            }
        }

        // Si hay errores, no enviamos el formulario
        if (!formularioValido) {
            return;
        }

        try {
            const nuevaTarea = await crearTarea(hogarId ?? HOGAR_POR_DEFECTO, {
                nombre: titulo.trim(),
                descripcion: descripcion.trim(),
                puntos: puntos !== "" ? Number(puntos) : 0,
                asignado_a: asignadoNuevo !== "" ? asignadoNuevo : null
            });

            setTareas((tareasActuales) => [
                nuevaTarea,
                ...tareasActuales
            ]);

            setTitulo("");
            setDescripcion("");
            setAsignadoNuevo("");
            setPuntos("");

            setModalCrearAbierto(false);
            setMensaje("Tarea creada correctamente");
        } catch (error) {
            setError(error.message);
        }
    }

    //Modal de eliminar tarea
    function abrirModalEliminar(tarea) {
        setTareaAEliminar(tarea);
    }

    //Cerrar modal de eliminar tarea
    function cancelarEliminacion() {
        setTareaAEliminar(null);
    }

    async function confirmarEliminacion() {
        try {
            await eliminarTarea(tareaAEliminar.id);

            setTareas((tareasActuales) =>
                tareasActuales.filter(
                    (tarea) => tarea.id !== tareaAEliminar.id
                )
            );

            setTareaAEliminar(null);
            setMensaje("Tarea eliminada correctamente");
            setError(null);

        } catch (error) {
            setError(error.message);
        }
    }

    // Devuelve la clase de color según el estado de la tarea
    function claseEstado(valorEstado) {
        const estadoNormalizado = (valorEstado || "").toLowerCase();

        if (estadoNormalizado === "realizada" || estadoNormalizado === "completada") {
            return "badge-estado realizada";
        }

        return "badge-estado pendiente";
    }

    if (!admin) {
        return <h1>Cargando...</h1>;
    }

    return (
        <div className="admin-container">

            <h1>Domus</h1>

            <h2>{admin.nombre}</h2>

            <p>Rol: {admin.rol}</p>

            <p>Email: {admin.email}</p>

            <hr />

            {mensaje && (
                <p className="mensaje-exito">
                    {mensaje}
                </p>
            )}

            {error && !modalCrearAbierto && (
                <p className="mensaje-error">
                    {error}
                </p>
            )}

            <div className="tareas-hogar-container">

                <div className="tareas-hogar-header">
                    <h2>Tareas del hogar</h2>

                    <button type="button" onClick={abrirModalCrear}>
                        Nueva tarea
                    </button>
                </div>

                <div className="filtros-tareas">

                    <div className="filtro-grupo">
                        <label htmlFor="filtro-estado">Estado</label>
                        <select
                            id="filtro-estado"
                            value={estado}
                            onChange={(event) => setEstado(event.target.value)}
                        >
                            <option value="Todos">Todos</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Realizada">Realizada</option>
                        </select>
                    </div>
                    <div className="filtro-grupo">
                        <label htmlFor="filtro-asignado">Asignada a</label>
                        <select
                            id="filtro-asignado"
                            value={asignado}
                            onChange={(event) => setAsignado(event.target.value)}
                        >
                            <option value="Todos">Todos</option>
                            <option value="sin_asignar">Sin asignar</option>

                            {miembros.map((miembro) => (
                                <option
                                    key={miembro.id}
                                    value={miembro.nombre}
                                >
                                    {miembro.nombre}
                                    {miembro.rol === "admin" ? " (admin)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filtro-grupo">
                        <label htmlFor="filtro-orden">Puntos</label>
                        <select
                            id="filtro-orden"
                            value={orden}
                            onChange={(event) => setOrden(event.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="asc">Menor a mayor</option>
                            <option value="desc">Mayor a menor</option>
                        </select>
                    </div>

                </div>

                {tareas.length === 0 ? (
                    <p className="sin-tareas">No hay tareas con estos filtros.</p>
                ) : (
                    <div className="lista-tareas">

                        {tareas.map((tarea) => (
                            <div
                                className="fila-tarea"
                                key={tarea.id}
                                onClick={() => abrirModalDetalle(tarea)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        abrirModalDetalle(tarea);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >

                                <div className="fila-info">
                                    <span className="fila-nombre">
                                        {tarea.nombre}
                                    </span>
                                </div>

                                <span className="fila-asignado">
                                    {tarea.asignado_a || "sin asignar"}
                                </span>

                                 <span className={claseEstado(tarea.estado)}>
                                    {(tarea.estado || "").toLowerCase()}
                                </span>

                                <span className="badge-puntos">
                                    {tarea.puntos ?? 0} pts
                                </span>

                                <button
                                    type="button"
                                    className="boton-eliminar"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        abrirModalEliminar(tarea);
                                    }}>
                                    🗑️
                                </button>

                            </div>
                        ))}

                    </div>
                )}

            </div>

            {modalCrearAbierto && (
                <div className="modal-fondo">
                    <div className="modal modal-crear">

                        <h2>Nueva tarea</h2>

                        <form onSubmit={manejarCrearTarea}>

                            {/* TÍTULO */}
                            <div className="form-group">

                                <label htmlFor="titulo">
                                    Título
                                </label>

                                <input
                                    id="titulo"
                                    type="text"
                                    value={titulo}
                                    onChange={(event) => {
                                        setTitulo(event.target.value);

                                        // Quitamos el error mientras escribe
                                        if (event.target.value.trim() !== "") {
                                            setErrorTitulo("");
                                        }
                                    }}
                                    maxLength={100}
                                    placeholder="Ingresá el título de la tarea"
                                    className={errorTitulo ? "input-error" : ""}
                                />

                                <small>
                                    {titulo.length}/100 caracteres
                                </small>

                                {errorTitulo && (
                                    <p className="mensaje-error">
                                        {errorTitulo}
                                    </p>
                                )}

                            </div>

                            {/* DESCRIPCIÓN */}
                            <div className="form-group">

                                <label htmlFor="descripcion">
                                    Descripción
                                </label>

                                <textarea
                                    id="descripcion"
                                    value={descripcion}
                                    onChange={(event) => {
                                        setDescripcion(event.target.value);

                                        if (event.target.value.length <= 500) {
                                            setErrorDescripcion("");
                                        }
                                    }}
                                    maxLength={500}
                                    placeholder="Ingresá una descripción (opcional)"
                                    rows={4}
                                    className={
                                        errorDescripcion
                                            ? "input-error"
                                            : ""
                                    }
                                />

                                <small>
                                    {descripcion.length}/500 caracteres
                                </small>

                                {errorDescripcion && (
                                    <p className="mensaje-error">
                                        {errorDescripcion}
                                    </p>
                                )}

                            </div>

                            {/* MIEMBRO ASIGNADO */}
                            <div className="form-group">

                                <label htmlFor="asignado-nuevo">
                                    Miembro asignado
                                </label>

                                <select
                                    id="asignado-nuevo"
                                    value={asignadoNuevo}
                                    onChange={(event) => setAsignadoNuevo(event.target.value)}
                                >
                                    <option value="">Sin asignar</option>

                                    {miembros.map((miembro) => (
                                        <option
                                            key={miembro.id}
                                            value={miembro.nombre}
                                        >
                                            {miembro.nombre}
                                            {miembro.rol === "admin" ? " (admin)" : ""}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            {/* PUNTOS */}
                            <div className="form-group">

                                <label htmlFor="puntos">
                                    Puntos que otorga
                                </label>

                                <input
                                    id="puntos"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={puntos}
                                    onChange={(event) => {
                                        setPuntos(event.target.value);
                                        setErrorPuntos("");
                                    }}
                                    placeholder="0"
                                    className={errorPuntos ? "input-error" : ""}
                                />

                                {errorPuntos && (
                                    <p className="mensaje-error">
                                        {errorPuntos}
                                    </p>
                                )}

                            </div>

                            {error && (
                                <p className="mensaje-error">
                                    {error}
                                </p>
                            )}

                            <div className="modal-botones">
                                <button
                                    type="button"
                                    onClick={cerrarModalCrear}>
                                    Cancelar
                                </button>
                                <button type="submit">
                                    Guardar
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

            {tareaAEliminar && (
                <div className="modal-fondo">
                    <div className="modal">
                        <h2>¿Seguro que querés eliminar esta tarea?</h2>

                        <p>
                            Vas a eliminar "{tareaAEliminar.nombre}" de forma definitiva.
                        </p>

                        <div className="modal-botones">
                                <button
                                    type="button"
                                    onClick={cancelarEliminacion}>
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmarEliminacion}>
                                    Eliminar
                                </button>
                            </div>
                    </div>
                </div>
            )}

            {tareaSeleccionada && (
                <div className="modal-fondo">
                    <div className="modal modal-detalle">
                        {modoEdicion ? (
                            <form onSubmit={guardarEdicion}>
                                <h2>Editar tarea</h2>

                                <div className="form-group">
                                    <label htmlFor="titulo-edicion">Título</label>
                                    <input
                                        id="titulo-edicion"
                                        type="text"
                                        value={tituloEdicion}
                                        onChange={(event) => setTituloEdicion(event.target.value)}
                                        maxLength={100}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="descripcion-edicion">Descripción</label>
                                    <textarea
                                        id="descripcion-edicion"
                                        value={descripcionEdicion}
                                        onChange={(event) => setDescripcionEdicion(event.target.value)}
                                        maxLength={500}
                                        rows={4}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="estado-edicion">Estado</label>
                                    <select
                                        id="estado-edicion"
                                        value={estadoEdicion}
                                        onChange={(event) => setEstadoEdicion(event.target.value)}
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Realizada">Realizada</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="asignado-edicion">Miembro asignado</label>
                                    <select
                                        id="asignado-edicion"
                                        value={asignadoEdicion}
                                        onChange={(event) => setAsignadoEdicion(event.target.value)}
                                    >
                                        <option value="">Sin asignar</option>
                                        {miembros.map((miembro) => (
                                            <option key={miembro.id} value={miembro.nombre}>
                                                {miembro.nombre}
                                                {miembro.rol === "admin" ? " (admin)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="puntos-edicion">Puntos</label>
                                    <input
                                        id="puntos-edicion"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={puntosEdicion}
                                        onChange={(event) => setPuntosEdicion(event.target.value)}
                                    />
                                </div>

                                {errorEdicion && <p className="mensaje-error">{errorEdicion}</p>}

                                <div className="modal-botones">
                                    <button type="button" onClick={cancelarEdicion} disabled={guardandoEdicion}>
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={guardandoEdicion}>
                                        {guardandoEdicion ? "Guardando..." : "Guardar"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h2>{tareaSeleccionada.nombre}</h2>

                                <p className="detalle-descripcion">
                                    {tareaSeleccionada.descripcion || "Sin descripción."}
                                </p>

                                <div className="detalle-datos">
                                    <div className="detalle-dato">
                                        <span className="detalle-etiqueta">Estado</span>
                                        <span className={claseEstado(tareaSeleccionada.estado)}>
                                            {(tareaSeleccionada.estado || "pendiente").toLowerCase()}
                                        </span>
                                    </div>

                                    <div className="detalle-dato">
                                        <span className="detalle-etiqueta">Asignada a</span>
                                        <span className="detalle-valor">
                                            {tareaSeleccionada.asignado_a || "Sin asignar"}
                                        </span>
                                    </div>

                                    <div className="detalle-dato">
                                        <span className="detalle-etiqueta">Puntos</span>
                                        <span className="detalle-valor">
                                            {tareaSeleccionada.puntos ?? 0} pts
                                        </span>
                                    </div>
                                </div>

                                <div className="modal-botones">
                                    {admin.rol === "admin" && (
                                        <button type="button" onClick={iniciarEdicion}>
                                            Editar
                                        </button>
                                    )}
                                    <button type="button" onClick={cerrarModalDetalle}>
                                        Cerrar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>


    );
}


export default Admin;
