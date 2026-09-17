import { useEffect, useState } from "react";

import {
    obtenerPerfil,
    obtenerTareasUsuario,
    marcarTareaRealizada
} from "./api";

import "./Perfil.css";


function Perfil({ id }) {

    const [perfil, setPerfil] = useState(null);
    const [tareas, setTareas] = useState([]);
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        cargarPerfil();
    }, [id]);


    async function cargarPerfil() {

        try {

            setCargando(true);
            setError("");

            const datosPerfil = await obtenerPerfil(id);

            const datosTareas = await obtenerTareasUsuario(
                id,
                "pendiente"
            );

            setPerfil(datosPerfil);
            setTareas(datosTareas);

        } catch (error) {

            setError(error.message);

        } finally {

            setCargando(false);

        }
    }


    function abrirDetalle(tarea) {
        setTareaSeleccionada(tarea);
    }


    function cerrarDetalle() {
        setTareaSeleccionada(null);
    }


    async function realizarTarea() {

        if (!tareaSeleccionada) {
            return;
        }

        try {

            setError("");

            const tareaRealizada = await marcarTareaRealizada(
                tareaSeleccionada.id
            );


            /*
             * Actualizamos los puntos inmediatamente
             * sin recargar la página.
             */
            setPerfil((perfilActual) => ({
                ...perfilActual,

                puntos_acumulados:
                    Number(perfilActual.puntos_acumulados || 0) +
                    Number(tareaRealizada.puntos || 0)
            }));


            /*
             * La tarea deja de aparecer en
             * "Mis tareas pendientes".
             */
            setTareas((tareasActuales) =>
                tareasActuales.filter(
                    (tarea) =>
                        tarea.id !== tareaRealizada.id
                )
            );


            /*
             * Cerramos el modal.
             */
            setTareaSeleccionada(null);

        } catch (error) {

            setError(error.message);

        }
    }


    function textoRol(rol) {

        return rol === "admin"
            ? "Administrador/a"
            : "Miembro";
    }


    function claseEstado(estado) {

        const estadoNormalizado =
            (estado || "").toLowerCase();


        if (estadoNormalizado === "realizada") {

            return "perfil-estado realizada";

        }

        return "perfil-estado pendiente";
    }


    /*
     * Mientras se carga la información.
     */
    if (cargando) {

        return (
            <div className="perfil-cargando">
                Cargando perfil...
            </div>
        );
    }


    /*
     * Si hubo un error y no tenemos perfil.
     */
    if (error && !perfil) {

        return (
            <div className="perfil-page">

                <p className="perfil-error">
                    {error}
                </p>

            </div>
        );
    }


    /*
     * Seguridad por si no existe el perfil.
     */
    if (!perfil) {
        return null;
    }


    return (

        <div className="perfil-page">


            {/* =================================================
                TARJETA PRINCIPAL DEL PERFIL
                ================================================= */}

            <section className="perfil-header">


                {/* Parte superior */}

                <div className="perfil-header-top">


                    {/* Usuario */}

                    <div className="perfil-user">


                        {/* Avatar */}

                        <div className="perfil-avatar">

                            {perfil.nombre
                                ? perfil.nombre
                                    .charAt(0)
                                    .toUpperCase()
                                : "U"}

                        </div>


                        {/* Nombre + hogar */}

                        <div>

                            <h1 className="perfil-nombre">
                                {perfil.nombre}
                            </h1>

                            <p className="perfil-hogar">
                                Hogar:{" "}
                                {perfil.hogar || "Sin hogar"}
                            </p>

                        </div>

                    </div>


                    {/* Rol */}

                    <div className="perfil-rol">

                        {textoRol(perfil.rol)}

                    </div>


                </div>


                {/* =================================================
                    PUNTOS
                    ================================================= */}

                <div className="perfil-puntos">

                    <p className="perfil-puntos-label">
                        Puntos ganados
                    </p>

                    <p className="perfil-puntos-valor">
                        {perfil.puntos_acumulados || 0}
                    </p>

                </div>


            </section>


            {/* =================================================
                TAREAS PENDIENTES
                ================================================= */}

            <section className="perfil-tareas">


                <h2>
                    Mis tareas pendientes
                </h2>


                {tareas.length === 0 ? (

                    /* Estado vacío */

                    <div className="perfil-vacio">

                        No tenés tareas asignadas

                    </div>

                ) : (

                    /* Lista de tareas */

                    <div className="perfil-lista-tareas">


                        {tareas.map((tarea) => (

                            <button
                                type="button"
                                className="perfil-tarea"
                                key={tarea.id}
                                onClick={() =>
                                    abrirDetalle(tarea)
                                }
                            >


                                {/* Nombre de la tarea */}

                                <p className="perfil-tarea-nombre">

                                    {tarea.nombre}

                                </p>


                                {/* Estado + puntos */}

                                <div className="perfil-tarea-info">


                                    <span
                                        className={claseEstado(
                                            tarea.estado
                                        )}
                                    >

                                        {tarea.estado || "pendiente"}

                                    </span>


                                    <span className="perfil-tarea-puntos">

                                        {tarea.puntos} pts

                                    </span>


                                </div>


                            </button>

                        ))}


                    </div>

                )}


            </section>


            {/* =================================================
                ERROR
                ================================================= */}

            {error && (

                <p className="perfil-error">
                    {error}
                </p>

            )}


            {/* =================================================
                MODAL DE DETALLE
                ================================================= */}

            {tareaSeleccionada && (

                <div
                    className="perfil-modal-overlay"
                    onClick={cerrarDetalle}
                >


                    <div
                        className="perfil-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >


                        {/* Título */}

                        <h3>
                            {tareaSeleccionada.nombre}
                        </h3>


                        {/* Estado + puntos */}

                        <div className="perfil-modal-info">


                            <span
                                className={claseEstado(
                                    tareaSeleccionada.estado
                                )}
                            >

                                {tareaSeleccionada.estado ||
                                    "pendiente"}

                            </span>


                            <span className="perfil-tarea-puntos">

                                {tareaSeleccionada.puntos} pts

                            </span>


                        </div>


                        {/* Descripción */}

                        {tareaSeleccionada.descripcion && (

                            <p className="perfil-modal-descripcion">

                                {tareaSeleccionada.descripcion}

                            </p>

                        )}


                        {/* Acciones */}

                        <div className="perfil-modal-acciones">


                            <button
                                type="button"
                                className="btn-cerrar"
                                onClick={cerrarDetalle}
                            >
                                Cerrar
                            </button>


                            <button
                                type="button"
                                className="btn-realizar"
                                onClick={realizarTarea}
                            >
                                Marcar como realizada
                            </button>


                        </div>


                    </div>


                </div>

            )}


        </div>
    );
}


export default Perfil;