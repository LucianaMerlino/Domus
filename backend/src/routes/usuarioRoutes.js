const express = require("express");
const router = express.Router();
const pool = require("../config/database");

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
                u.rol,
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

        // Las tareas actualmente se asignan usando el nombre
        // del usuario en tareas.asignado_a.
        const puntosResultado = await pool.query(
            `
            SELECT COALESCE(SUM(t.puntos), 0) AS puntos_acumulados
            FROM tareas t
            WHERE t.asignado_a = $1
              AND t.completada = TRUE
            `,
            [usuario.nombre]
        );

        res.json({
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            hogar_id: usuario.hogar_id,
            hogar: usuario.hogar,
            puntos_acumulados: Number(
                puntosResultado.rows[0].puntos_acumulados
            )
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

        // Primero obtenemos el nombre del usuario porque
        // actualmente tareas.asignado_a guarda ese nombre.
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

        const nombreUsuario = usuarioResultado.rows[0].nombre;

        const estado = (req.query.estado || "").toLowerCase();

        const valores = [nombreUsuario];

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
                t.asignado_a,
                t.completada,
                t.creado_en
            FROM tareas t
            WHERE t.asignado_a = $1
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


module.exports = router;