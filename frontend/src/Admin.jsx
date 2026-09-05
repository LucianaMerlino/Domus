import { useEffect, useState } from "react";

import {
    obtenerAdmin,
    obtenerTareas,
    crearTarea
} from "./api";

function Admin({ id }) {
    const [admin, setAdmin] = useState(null);
    const [tareas, setTareas] = useState([]);

    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");

    const [errorTitulo, setErrorTitulo] = useState("");
    const [errorDescripcion, setErrorDescripcion] = useState("");

    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        obtenerAdmin(id)
            .then(setAdmin)
            .catch((error) => setError(error.message));

        cargarTareas();
    }, [id]);

    async function cargarTareas() {
        try {
            const datos = await obtenerTareas();
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

        // Si hay errores, no enviamos el formulario
        if (!formularioValido) {
            return;
        }

        try {
            const nuevaTarea = await crearTarea({
                nombre: titulo.trim(),
                descripcion: descripcion.trim()
            });

            setTareas((tareasActuales) => [
                nuevaTarea,
                ...tareasActuales
            ]);

            setTitulo("");
            setDescripcion("");

            setMensaje("Tarea creada correctamente");
        } catch (error) {
            setError(error.message);
        }
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

            <h2>Tareas</h2>

            {tareas.length === 0 ? (
                <p>No hay tareas creadas.</p>
            ) : (
                <div className="lista-tareas">

                    {tareas.map((tarea) => (
                        <div
                            className="tarea"
                            key={tarea.id}
                        >

                            <h3>
                                {tarea.nombre}
                            </h3>

                            <p>
                                {tarea.descripcion ||
                                    "Sin descripción"}
                            </p>

                            <span>
                                Estado: {tarea.estado}
                            </span>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

export default Admin;