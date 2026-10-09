const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { puntosDelUsuario } = require("../puntos");

// ======================================================
// GET /api/usuarios/:id/perfil
// Obtiene la información del perfil de un usuario
// ======================================================
router.get("/:id/perfil", async (req, res) => {
    try {
        const usuarioId = Number(req.params.id);

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({
                error: "El id del usuario no es válido"
            });
        }

        const usuarioResultado = await pool.query(
            `
            SELECT
                u.id,
                u.nombre,
                u.email,
                COALESCE(mh.rol, 'integrante') AS rol,
                h.id AS hogar_id,
                h.nombre AS hogar
            FROM usuarios u
            LEFT JOIN miembros_hogar mh
                ON mh.usuario_id = u.id
            LEFT JOIN hogares h
                ON h.id = mh.hogar_id
            WHERE u.id = $1
            LIMIT 1
            `,
            [usuarioId]
        );

        if (usuarioResultado.rows.length === 0) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        const usuario = usuarioResultado.rows[0];

        const puntos = await puntosDelUsuario(usuario.id);

        res.json({
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            hogar_id: usuario.hogar_id,
            hogar: usuario.hogar,
            puntos_acumulados: puntos.ganados,
            puntos_disponibles: puntos.disponibles
        });

    } catch (error) {
        console.error("Error al obtener perfil:", error);

        res.status(500).json({
            error: "No se pudo obtener el perfil del usuario"
        });
    }
});


// ======================================================
// GET /api/usuarios/:id/tareas?estado=pendiente
// Obtiene las tareas asignadas al usuario
// ======================================================
router.get("/:id/tareas", async (req, res) => {
    try {
        const usuarioId = Number(req.params.id);

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({
                error: "El id del usuario no es válido"
            });
        }

        const usuarioResultado = await pool.query(
            `
            SELECT id, nombre
            FROM usuarios
            WHERE id = $1
            `,
            [usuarioId]
        );

        if (usuarioResultado.rows.length === 0) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        const estado = (req.query.estado || "").toLowerCase();

        const valores = [usuarioId];

        let filtroEstado = "";

        if (estado === "pendiente") {
            filtroEstado = `
                AND t.completada = FALSE
                AND LOWER(t.estado) = 'pendiente'
            `;
        } else if (estado === "realizada") {
            filtroEstado = `
                AND (
                    t.completada = TRUE
                    OR LOWER(t.estado) = 'realizada'
                )
            `;
        }

        const resultado = await pool.query(
            `
            SELECT
                t.id,
                t.hogar_id,
                t.nombre,
                t.descripcion,
                t.puntos,
                t.estado,
                t.asignado_id,
                u.nombre AS asignado_a,
                t.completada,
                t.creado_en
            FROM tareas t
            LEFT JOIN usuarios u ON u.id = t.asignado_id
            WHERE t.asignado_id = $1
            ${filtroEstado}
            ORDER BY t.id DESC
            `,
            valores
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al obtener tareas del usuario:", error);

        res.status(500).json({
            error: "No se pudieron obtener las tareas del usuario"
        });
    }
});


// ======================================================
// GET /api/usuarios/:id/home
// Información general del hogar del usuario
// ======================================================
router.get("/:id/home", async (req, res) => {
    try {
        const usuarioId = Number(req.params.id);

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({
                error: "El id del usuario no es válido"
            });
        }

        // Primero verificamos a qué hogar pertenece el usuario
        const hogarResultado = await pool.query(
            `
            SELECT
                h.id,
                h.nombre,
                h.icono,
                mh.rol
            FROM miembros_hogar mh
            JOIN hogares h
                ON h.id = mh.hogar_id
            WHERE mh.usuario_id = $1
            LIMIT 1
            `,
            [usuarioId]
        );

        // Usuario válido pero sin hogar
        if (hogarResultado.rows.length === 0) {
            return res.json({
                hogar: null,
                integrantes: [],
                cantidad_integrantes: 0,
                tareas: [],
                cantidad_tareas_realizadas: 0
            });
        }

        const hogar = hogarResultado.rows[0];

        // Integrantes del hogar
        const integrantesResultado = await pool.query(
            `
            SELECT
                u.id,
                u.nombre,
                mh.rol
            FROM miembros_hogar mh
            JOIN usuarios u
                ON u.id = mh.usuario_id
            WHERE mh.hogar_id = $1
            ORDER BY u.nombre
            `,
            [hogar.id]
        );

        // Tareas del hogar
        const tareasResultado = await pool.query(
            `
            SELECT
                t.id,
                t.nombre,
                t.descripcion,
                t.puntos,
                t.estado,
                t.completada,
                t.asignado_id,
                u.nombre AS asignado_a
            FROM tareas t
            LEFT JOIN usuarios u ON u.id = t.asignado_id
            WHERE t.hogar_id = $1
            ORDER BY t.id DESC
            `,
            [hogar.id]
        );

        const tareasRealizadas = tareasResultado.rows.filter(
            (tarea) =>
                tarea.completada === true ||
                tarea.estado === "Realizada"
        ).length;

        res.json({
            hogar: {
                id: hogar.id,
                nombre: hogar.nombre,
                icono: hogar.icono,
                rol: hogar.rol
            },
            integrantes: integrantesResultado.rows,
            cantidad_integrantes: integrantesResultado.rows.length,
            tareas: tareasResultado.rows,
            cantidad_tareas_realizadas: tareasRealizadas
        });

    } catch (error) {
        console.error("Error al obtener información del Home:", error);

        res.status(500).json({
            error: "No se pudo obtener la información del hogar"
        });
    }
});


module.exports = router;