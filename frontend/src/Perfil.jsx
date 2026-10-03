import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    crearHogar,
    obtenerPerfil,
    obtenerTareasUsuario,
    marcarTareaRealizada
} from "./api";

import { guardarSesion, obtenerSesion } from "./sesion";
import BotonCerrarSesion from "./BotonCerrarSesion";

import "./Perfil.css";


function Perfil() {
    const navigate = useNavigate();

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
    const [mostrarFormularioHogar, setMostrarFormularioHogar] = useState(false);
    const [nombreHogar, setNombreHogar] = useState("");
    const [creandoHogar, setCreandoHogar] = useState(false);


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

    async function crearNuevoHogar(event) {
        event.preventDefault();

        const nombre = nombreHogar.trim();

        if (!nombre) {
            setError("El nombre del hogar es obligatorio");
            return;
        }

        try {
            setCreandoHogar(true);
            setError("");

            const hogarCreado = await crearHogar(id, nombre);
            const sesionActual = obtenerSesion();

            guardarSesion({
                ...sesionActual,
                rol: "admin",
                hogar_id: hogarCreado.id,
                hogar: hogarCreado.nombre
            });

            setPerfil((perfilActual) => ({
                ...perfilActual,
                rol: "admin",
                hogar_id: hogarCreado.id,
                hogar: hogarCreado.nombre
            }));

            setMostrarFormularioHogar(false);
            setNombreHogar("");
            navigate("/", { replace: true });

        } catch (error) {
            setError(error.message);
        } finally {
            setCreandoHogar(false);
        }
    }


    async function realizarTarea() {

        if (!tareaSeleccionada) {
            return;
        }

        try {

            setError("");
            setMensajeExito("");

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


                    {/* Rol + cerrar sesión */}

                    <div className="header-acciones">

                        <button
                            type="button"
                            className="perfil-inicio"
                            onClick={() => navigate("/")}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
                            </svg>
                            <span>Inicio</span>
                        </button>

                        <div className="perfil-rol">

                            {textoRol(perfil.rol)}

                        </div>

                        <BotonCerrarSesion />

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


            {!perfil.hogar && (
                <section className="perfil-crear-hogar">
                    {!mostrarFormularioHogar ? (
                        <button
                            type="button"
                            className="boton-agregar-miembro"
                            onClick={() => setMostrarFormularioHogar(true)}
                        >
                            Crear hogar
                        </button>
                    ) : (
                        <form onSubmit={crearNuevoHogar} className="form-agregar-miembro">
                            <label htmlFor="nombre-hogar">Nombre del hogar</label>
                            <input
                                id="nombre-hogar"
                                type="text"
                                value={nombreHogar}
                                onChange={(event) => setNombreHogar(event.target.value)}
                                maxLength={100}
                                autoFocus
                                placeholder="Mi hogar"
                            />

                            {error && (
                                <p className="mensaje-error-miembro">{error}</p>
                            )}

                            <div className="acciones-agregar-miembro">
                                <button
                                    type="button"
                                    className="boton-cancelar-miembro"
                                    onClick={() => {
                                        setMostrarFormularioHogar(false);
                                        setNombreHogar("");
                                        setError("");
                                    }}
                                    disabled={creandoHogar}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="boton-confirmar-miembro"
                                    disabled={creandoHogar}
                                >
                                    {creandoHogar ? "Creando..." : "Confirmar"}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            )}

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
    );
}


export default Perfil;
