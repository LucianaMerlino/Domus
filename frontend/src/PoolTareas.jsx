import { useEffect, useState } from "react";

import {
    obtenerPlantillas,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla
} from "./api";


const FORMULARIO_VACIO = { nombre: "", descripcion: "", puntos: "" };


// Valida en el cliente con las mismas reglas que el backend
function validarFormulario({ nombre, descripcion, puntos }) {
    const nombreLimpio = nombre.trim();

    if (nombreLimpio === "") {
        return "El título es un campo obligatorio";
    }

    if (!/^[\p{L}\s'".,]+$/u.test(nombreLimpio)) {
        return "El título solo puede contener letras, comillas, puntos y comas";
    }

    if (descripcion.length > 500) {
        return "La descripción no puede superar los 500 caracteres";
    }

    const puntosNumero = Number(puntos);

    if (puntos === "" || !Number.isInteger(puntosNumero) || puntosNumero <= 0) {
        return "Los puntos deben ser un número entero mayor a 0";
    }

    return "";
}


// Pool de tareas del hogar: plantillas con nombre, descripción
// y puntaje estándar que después se van a poder asignar.
function PoolTareas({ hogarId }) {

    const [plantillas, setPlantillas] = useState([]);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    // null = modal cerrado, "nueva" = creando, objeto = editando esa plantilla
    const [plantillaEnEdicion, setPlantillaEnEdicion] = useState(null);
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [errorFormulario, setErrorFormulario] = useState("");
    const [guardando, setGuardando] = useState(false);

    const [plantillaAEliminar, setPlantillaAEliminar] = useState(null);


    useEffect(() => {
        if (hogarId == null) {
            return;
        }

        obtenerPlantillas(hogarId)
            .then(setPlantillas)
            .catch((error) => setError(error.message));
    }, [hogarId]);


    function abrirNueva() {
        setFormulario(FORMULARIO_VACIO);
        setErrorFormulario("");
        setMensaje("");
        setPlantillaEnEdicion("nueva");
    }

    function abrirEdicion(plantilla) {
        setFormulario({
            nombre: plantilla.nombre,
            descripcion: plantilla.descripcion || "",
            puntos: String(plantilla.puntos)
        });
        setErrorFormulario("");
        setMensaje("");
        setPlantillaEnEdicion(plantilla);
    }

    function cerrarFormulario() {
        setPlantillaEnEdicion(null);
    }

    function cambiarCampo(event) {
        setFormulario((actual) => ({
            ...actual,
            [event.target.name]: event.target.value
        }));
    }


    async function guardar(event) {
        event.preventDefault();

        const errorValidacion = validarFormulario(formulario);

        if (errorValidacion) {
            setErrorFormulario(errorValidacion);
            return;
        }

        const datos = {
            nombre: formulario.nombre.trim(),
            descripcion: formulario.descripcion.trim(),
            puntos: Number(formulario.puntos)
        };

        setGuardando(true);
        setErrorFormulario("");

        try {
            if (plantillaEnEdicion === "nueva") {
                const nueva = await crearPlantilla(hogarId, datos);

                setPlantillas((actuales) => [...actuales, nueva]);
                setMensaje("Tarea agregada al pool");
            } else {
                const editada = await actualizarPlantilla(plantillaEnEdicion.id, datos);

                setPlantillas((actuales) =>
                    actuales.map((plantilla) =>
                        plantilla.id === editada.id ? editada : plantilla
                    )
                );
                setMensaje("Tarea del pool actualizada");
            }

            setPlantillaEnEdicion(null);

        } catch (error) {
            setErrorFormulario(error.message);

        } finally {
            setGuardando(false);
        }
    }


    async function confirmarEliminacion() {
        try {
            await eliminarPlantilla(plantillaAEliminar.id);

            setPlantillas((actuales) =>
                actuales.filter((plantilla) => plantilla.id !== plantillaAEliminar.id)
            );
            setMensaje("Tarea eliminada del pool");
            setError("");

        } catch (error) {
            setError(error.message);

        } finally {
            setPlantillaAEliminar(null);
        }
    }


    return (
        <div className="tareas-hogar-container">

            <div className="tareas-hogar-header">
                <h2>Pool de tareas</h2>

                <button type="button" onClick={abrirNueva}>
                    Nueva tarea
                </button>
            </div>

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}
            {error && <p className="mensaje-error">{error}</p>}

            {plantillas.length === 0 ? (
                <p className="sin-tareas">
                    Todavía no hay tareas en el pool.
                </p>
            ) : (
                <div className="lista-tareas">

                    {plantillas.map((plantilla) => (
                        <div
                            className="fila-tarea"
                            key={plantilla.id}
                            onClick={() => abrirEdicion(plantilla)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    abrirEdicion(plantilla);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            title="Editar"
                        >

                            <div className="fila-info">
                                <span className="fila-nombre">
                                    {plantilla.nombre}
                                </span>

                                {plantilla.descripcion && (
                                    <span className="fila-descripcion">
                                        {plantilla.descripcion}
                                    </span>
                                )}
                            </div>

                            <span className="badge-puntos">
                                {plantilla.puntos} pts
                            </span>

                            <button
                                type="button"
                                className="boton-eliminar"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setPlantillaAEliminar(plantilla);
                                }}
                            >
                                🗑️
                            </button>

                        </div>
                    ))}

                </div>
            )}

            {plantillaEnEdicion && (
                <div className="modal-fondo">
                    <div className="modal modal-crear">

                        <h2>
                            {plantillaEnEdicion === "nueva"
                                ? "Nueva tarea del pool"
                                : "Editar tarea del pool"}
                        </h2>

                        <form onSubmit={guardar}>

                            <div className="form-group">
                                <label htmlFor="pool-nombre">Título</label>
                                <input
                                    id="pool-nombre"
                                    name="nombre"
                                    type="text"
                                    value={formulario.nombre}
                                    onChange={cambiarCampo}
                                    maxLength={100}
                                    placeholder="Ingresá el título de la tarea"
                                />
                                <small>{formulario.nombre.length}/100 caracteres</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="pool-descripcion">Descripción</label>
                                <textarea
                                    id="pool-descripcion"
                                    name="descripcion"
                                    value={formulario.descripcion}
                                    onChange={cambiarCampo}
                                    maxLength={500}
                                    rows={4}
                                    placeholder="Ingresá una descripción (opcional)"
                                />
                                <small>{formulario.descripcion.length}/500 caracteres</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="pool-puntos">Puntos que otorga</label>
                                <input
                                    id="pool-puntos"
                                    name="puntos"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={formulario.puntos}
                                    onChange={cambiarCampo}
                                />
                            </div>

                            {errorFormulario && (
                                <p className="mensaje-error">{errorFormulario}</p>
                            )}

                            <div className="modal-botones">
                                <button
                                    type="button"
                                    onClick={cerrarFormulario}
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando}>
                                    {guardando ? "Guardando..." : "Guardar"}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

            {plantillaAEliminar && (
                <div className="modal-fondo">
                    <div className="modal">
                        <h2>¿Seguro que querés eliminar esta tarea del pool?</h2>

                        <p>
                            Vas a eliminar "{plantillaAEliminar.nombre}" del pool.
                            Las tareas ya asignadas no se modifican.
                        </p>

                        <div className="modal-botones">
                            <button type="button" onClick={() => setPlantillaAEliminar(null)}>
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmarEliminacion}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}


export default PoolTareas;
