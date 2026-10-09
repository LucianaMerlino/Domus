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


            <div className="perfil-redesign-heading"><div><small>TU CUENTA</small><h1>Mi perfil</h1></div></div>
            <div className="perfil-redesign-grid">
              <section className="perfil-redesign-card perfil-datos-card">
                <div className="perfil-redesign-user"><div className="perfil-avatar">{perfil.nombre?.charAt(0).toUpperCase() || "U"}</div><div><h2>{perfil.nombre}</h2><p>{textoRol(perfil.rol)} · {perfil.hogar || "Sin hogar"}</p></div></div>
                <h3>Datos personales</h3>
                <div className="perfil-redesign-dato"><span>Correo electrónico</span><strong>{perfil.email || "Sin correo"}</strong></div>
                <div className="perfil-redesign-dato"><span>Hogar</span><strong>{perfil.hogar || "Sin hogar"}</strong></div>
                <div className="perfil-redesign-dato"><span>Integrantes</span><strong>{perfil.total_integrantes != null ? `${perfil.total_integrantes} personas` : "—"}</strong></div>
              </section>
              <section className="perfil-redesign-card perfil-tareas">
                <h2>Puntos y tareas pendientes</h2>
                <div className="perfil-redesign-dato"><span>Puntos ganados</span><strong>{perfil.puntos_acumulados || 0} pts</strong></div>
                <h3>Tareas pendientes</h3>
                <div className="perfil-controles-tareas"><input aria-label="Buscar tarea" type="search" value={busquedaTareas} onChange={e => setBusquedaTareas(e.target.value)} placeholder="Buscar tarea"/><select aria-label="Ordenar tareas por puntos" value={ordenTareas} onChange={e => setOrdenTareas(e.target.value)}><option value="">Orden original</option><option value="asc">Menor a mayor</option><option value="desc">Mayor a menor</option></select></div>
                {tareasOrdenadas.length === 0 ? <p className="perfil-vacio">{busquedaTareas.trim() ? "No se encontraron tareas relacionadas" : "No tenés tareas asignadas"}</p> : <div className="perfil-lista-tareas">{tareasOrdenadas.map(tarea => <button type="button" className="perfil-tarea" key={tarea.id} onClick={() => abrirDetalle(tarea)}><span className="perfil-tarea-nombre">{tarea.nombre}</span><span className="perfil-tarea-info"><span className={claseEstado(tarea.estado)}>{tarea.estado || "Pendiente"}</span><span className="perfil-tarea-puntos">{tarea.puntos} pts</span></span></button>)}</div>}
              </section>
            </div>

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
