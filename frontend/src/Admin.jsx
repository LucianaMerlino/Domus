import { useEffect, useState } from "react";
import "./App.css";

import {
    obtenerAdmin,
    obtenerTareas,
    crearTarea,
    eliminarTarea
} from "./api";

function Admin({ id }) {
    const [admin, setAdmin] = useState(null);
    const [tareas, setTareas] = useState([]);
    const [tareaAEliminar, setTareaAEliminar] = useState(null);

    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");

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
        obtenerAdmin(id)
            .then(setAdmin)
            .catch((error) => setError(error.message));

        cargarTareas();
    }, [id]);

    // Se recarga cada vez que cambia un filtro
    useEffect(() => {
        cargarTareas();
    }, [estado, asignado, orden]);

    async function cargarTareas() {
        try {
            const datos = await obtenerTareas({
                estado: estado !== "Todos" ? estado : undefined,
                asignado: asignado !== "Todos" ? asignado : undefined,
                orden: orden || undefined
            });
            setTareas(datos);
        } catch (error) {
            setError(error.message);
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
            setErrorTitulo(
                "El título no puede superar los 100 caracteres"
            );
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
            const nuevaTarea = await crearTarea({
                nombre: titulo.trim(),
                descripcion: descripcion.trim(),
                puntos: puntos !== "" ? Number(puntos) : 0
            });

            setTareas((tareasActuales) => [
                nuevaTarea,
                ...tareasActuales
            ]);

            setTitulo("");
            setDescripcion("");
            setPuntos("");

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

            <h2>Crear nueva tarea</h2>

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
                        rows={5}
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
                
                {/* PUNTOS */}
                <div className="form-group">

                    <label htmlFor="puntos">
                        Puntos
                    </label>

                    <input
                        id="puntos"
                        type="number"
                        min="0"
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

                {/* Mover este boton al listado de las tareas*/}
                <button type="submit">
                    Crear tarea
                </button>

            </form>

            {mensaje && (
                <p className="mensaje-exito">
                    {mensaje}
                </p>
            )}

            {error && (
                <p className="mensaje-error">
                    {error}
                </p>
            )}

            <hr />

            <div className="tareas-hogar-container">

                <h2>Tareas del hogar</h2>

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
                            <div className="fila-tarea" key={tarea.id}>

                                <div className="fila-info">
                                    <span className="fila-nombre">
                                        {tarea.nombre}
                                    </span>

                                    {tarea.descripcion && (
                                        <span className="fila-descripcion">
                                            {tarea.descripcion}
                                        </span>
                                    )}
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
                                    onClick={() => abrirModalEliminar(tarea)}>
                                    🗑️
                                </button>

                            </div>
                        ))}

                    </div>
                )}

            </div>

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
        </div>
        

    );
}


export default Admin;