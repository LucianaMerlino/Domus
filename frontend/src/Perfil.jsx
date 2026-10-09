import { useEffect, useState } from "react";

import {
    obtenerPerfil,
    obtenerTareasUsuario,
    marcarTareaRealizada
} from "./api";

import { obtenerSesion } from "./sesion";
import DomusHeader from "./DomusHeader";

import "./Perfil.css";


function Perfil() {
    const sesion = obtenerSesion();
    const id = sesion?.id;

    const [perfil, setPerfil] = useState(null);
    const [tareas, setTareas] = useState([]);
    const [busquedaTareas, setBusquedaTareas] = useState("");
    const [ordenTareas, setOrdenTareas] = useState("");
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");


    useEffect(() => {
        cargarPerfil();
    }, [id]);

    useEffect(() => {
        let cancelado = false;

        async function actualizarPerfilYTareas() {
            try {
                const [datosPerfil, datosTareas] = await Promise.all([
                    obtenerPerfil(id),
                    obtenerTareasUsuario(id, "pendiente")
                ]);

                if (!cancelado) {
                    setPerfil(datosPerfil);
                    setTareas(datosTareas);
                }
            } catch (error) {
                if (!cancelado) setError(error.message);
            }
        }

        const intervalo = window.setInterval(actualizarPerfilYTareas, 5000);

        return () => {
            cancelado = true;
            window.clearInterval(intervalo);
        };
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
            setMensajeExito("");

            const tareaRealizada = await marcarTareaRealizada(
                tareaSeleccionada.id,
                id
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
             * La tarea completada deja la lista de pendientes.
             */
            setTareas((tareasActuales) =>
                tareasActuales.filter((tarea) => tarea.id !== tareaRealizada.id)
            );


            /*
             * Cerramos el modal.
             */
            setTareaSeleccionada(null);

            const puntosGanados = Number(tareaRealizada.puntos || 0);
            setMensajeExito(
                puntosGanados === 1
                    ? "¡Tarea marcada como realizada! Sumaste 1 punto."
                    : `¡Tarea marcada como realizada! Sumaste ${puntosGanados} puntos.`
            );

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


    const tareasFiltradas = tareas.filter((tarea) =>
        tarea.nombre.toLowerCase().includes(busquedaTareas.trim().toLowerCase())
    );

    const tareasOrdenadas = [...tareasFiltradas].sort((tareaA, tareaB) => {
        if (ordenTareas === "asc") return Number(tareaA.puntos) - Number(tareaB.puntos);
        if (ordenTareas === "desc") return Number(tareaB.puntos) - Number(tareaA.puntos);
        return 0;
    });

    /*
     * Mientras se carga la información.
     */
    if (cargando) {

        return (
            <>
                <DomusHeader active="profile" />
                <div className="perfil-cargando">Cargando perfil...</div>
            </>
        );
    }


    /*
     * Si hubo un error y no tenemos perfil.
     */
    if (error && !perfil) {

        return (
            <>
                <DomusHeader active="profile" />
                <div className="perfil-page"><p className="perfil-error">{error}</p></div>
            </>
        );
    }


    /*
     * Seguridad por si no existe el perfil.
     */
    if (!perfil) {
        return null;
    }


    return (
        <>
        <DomusHeader active="profile" />
        {perfil.hogar && <div className="domus-contextbar"><span aria-hidden="true">⌂</span><strong>{perfil.hogar}</strong></div>}
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


                    {/* Rol + cerrar sesión */}

                    <div className="header-acciones">

                        <div className="perfil-rol">

                            {textoRol(perfil.rol)}

                        </div>

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
                TAREAS DEL USUARIO
                ================================================= */}

            <section className="perfil-tareas">


                <h2>
                    Mis tareas
                </h2>

                <div className="perfil-controles-tareas">
                    <div>
                        <label className="perfil-busqueda-label" htmlFor="buscar-tarea-perfil">
                            Buscar tarea
                        </label>
                        <input
                            id="buscar-tarea-perfil"
                            className="perfil-busqueda-input"
                            type="search"
                            value={busquedaTareas}
                            onChange={(event) => setBusquedaTareas(event.target.value)}
                            placeholder="Ingresá el nombre o parte del nombre"
                        />
                    </div>
                    <div className="perfil-filtro-orden">
                        <label htmlFor="orden-tareas-perfil">Puntos</label>
                        <select
                            id="orden-tareas-perfil"
                            value={ordenTareas}
                            onChange={(event) => setOrdenTareas(event.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="asc">Menor a mayor</option>
                            <option value="desc">Mayor a menor</option>
                        </select>
                    </div>
                </div>

                {tareasOrdenadas.length === 0 ? (

                    /* Estado vacío */

                    <div className="perfil-vacio">

                        {busquedaTareas.trim() ? "No se encontraron tareas relacionadas" : "No tenés tareas asignadas"}

                    </div>

                ) : (

                    /* Lista de tareas */

                    <div className="perfil-lista-tareas">


                        {tareasOrdenadas.map((tarea) => (

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

            {mensajeExito && (
                <p className="perfil-exito">{mensajeExito}</p>
            )}

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


                            {!tareaSeleccionada.completada && tareaSeleccionada.estado?.toLowerCase() !== "realizada" && (
                                <button
                                    type="button"
                                    className="btn-realizar"
                                    onClick={realizarTarea}
                                >
                                    Marcar como realizada
                                </button>
                            )}


                        </div>


                    </div>


                </div>

            )}


        </div>
        </>
    );
}


export default Perfil;
