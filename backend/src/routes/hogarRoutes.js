const express = require("express");
const router = express.Router();
const pool = require("../config/database");


// ======================================================
// Obtener miembros de un hogar
// ======================================================
router.get("/:id/miembros", async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT
                u.id,
                u.nombre,
                u.email,
                u.rol
             FROM miembros_hogar m
             JOIN usuarios u
                ON u.id = m.usuario_id
             WHERE m.hogar_id = $1
             ORDER BY u.nombre`,
            [req.params.id]
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error(
            "Error al obtener miembros del hogar:",
            error
        );

        res.status(500).json({
            error: "No se pudieron obtener los miembros del hogar"
        });
    }
});


// ======================================================
// Agregar un miembro a un hogar
// ======================================================
router.post("/:id/miembros", async (req, res) => {
    try {
        const hogarId = Number(req.params.id);
        const { email, adminId } = req.body;

        // ------------------------------------------------
        // Validación del hogar
        // ------------------------------------------------
        if (!Number.isInteger(hogarId)) {
            return res.status(400).json({
                error: "El hogar indicado no es válido"
            });
        }

        // ------------------------------------------------
        // Validación del email
        // ------------------------------------------------
        if (!email || email.trim() === "") {
            return res.status(400).json({
                error: "El email es obligatorio"
            });
        }

        // ------------------------------------------------
        // Validación del administrador que realiza
        // la operación
        // ------------------------------------------------
        if (!adminId) {
            return res.status(403).json({
                error: "No se pudo identificar al administrador"
            });
        }

        const administrador = await pool.query(
            `SELECT
                u.id,
                u.rol
             FROM usuarios u
             JOIN miembros_hogar m
                ON m.usuario_id = u.id
             WHERE u.id = $1
               AND m.hogar_id = $2`,
            [adminId, hogarId]
        );

        if (administrador.rows.length === 0) {
            return res.status(403).json({
                error: "No pertenecés a este hogar"
            });
        }

        if (administrador.rows[0].rol !== "admin") {
            return res.status(403).json({
                error: "Solo el administrador puede agregar miembros"
            });
        }

        // ------------------------------------------------
        // Buscar usuario por email
        // ------------------------------------------------
        const usuario = await pool.query(
            `SELECT
                id,
                nombre,
                email,
                rol
             FROM usuarios
             WHERE LOWER(email) = LOWER($1)
             LIMIT 1`,
            [email.trim()]
        );

        if (usuario.rows.length === 0) {
            return res.status(404).json({
                error: "No existe un usuario con ese email"
            });
        }

        const usuarioEncontrado = usuario.rows[0];

        // ------------------------------------------------
        // Verificar si ya pertenece al hogar
        // ------------------------------------------------
        const miembroExistente = await pool.query(
            `SELECT id
             FROM miembros_hogar
             WHERE hogar_id = $1
               AND usuario_id = $2`,
            [hogarId, usuarioEncontrado.id]
        );

        if (miembroExistente.rows.length > 0) {
            return res.status(409).json({
                error: "Este usuario ya pertenece al hogar"
            });
        }

        // ------------------------------------------------
        // Agregar usuario al hogar
        // ------------------------------------------------
        const nuevoMiembro = await pool.query(
            `INSERT INTO miembros_hogar (
                hogar_id,
                usuario_id
             )
             VALUES ($1, $2)
             RETURNING id`,
            [
                hogarId,
                usuarioEncontrado.id
            ]
        );

        // ------------------------------------------------
        // Devolver información del miembro agregado
        // ------------------------------------------------
        res.status(201).json({
            id: usuarioEncontrado.id,
            nombre: usuarioEncontrado.nombre,
            email: usuarioEncontrado.email,
            rol: usuarioEncontrado.rol,
            miembro_hogar_id: nuevoMiembro.rows[0].id
        });

    } catch (error) {
        console.error(
            "Error al agregar miembro al hogar:",
            error
        );

        res.status(500).json({
            error: "No se pudo agregar el miembro al hogar"
        });
    }
});


router.put("/:id/miembros/:usuarioId/rol", async (req, res) => {
    try {
        const hogarId = Number(req.params.id);
        const usuarioId = Number(req.params.usuarioId);
        const { adminId, rol } = req.body || {};

        if (!Number.isInteger(hogarId) || hogarId <= 0) {
            return res.status(400).json({
                error: "El hogar indicado no es válido"
            });
        }

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({
                error: "El usuario indicado no es válido"
            });
        }

        if (!adminId) {
            return res.status(403).json({
                error: "Se requiere identificar al administrador"
            });
        }

        const rolNormalizado = rol === "admin" ? "admin" : "integrante";

        if (!["admin", "integrante"].includes(rolNormalizado)) {
            return res.status(400).json({
                error: "El rol indicado no es válido"
            });
        }

        const administrador = await pool.query(
            `SELECT u.id, u.rol
             FROM miembros_hogar m
             JOIN usuarios u ON u.id = m.usuario_id
             WHERE m.hogar_id = $1 AND u.id = $2`,
            [hogarId, adminId]
        );

        if (administrador.rows.length === 0 || administrador.rows[0].rol !== "admin") {
            return res.status(403).json({
                error: "Solo el administrador puede cambiar permisos"
            });
        }

        const miembro = await pool.query(
            `SELECT u.id, u.rol
             FROM miembros_hogar m
             JOIN usuarios u ON u.id = m.usuario_id
             WHERE m.hogar_id = $1 AND u.id = $2`,
            [hogarId, usuarioId]
        );

        if (miembro.rows.length === 0) {
            return res.status(404).json({
                error: "No se encontró ese miembro en el hogar"
            });
        }

        const rolActual = miembro.rows[0].rol;

        if (rolActual === "admin" && rolNormalizado !== "admin") {
            const admins = await pool.query(
                `SELECT COUNT(*)::int AS total
                 FROM miembros_hogar m
                 JOIN usuarios u ON u.id = m.usuario_id
                 WHERE m.hogar_id = $1 AND u.rol = 'admin'`,
                [hogarId]
            );

            if ((admins.rows[0]?.total ?? 0) <= 1) {
                return res.status(400).json({
                    error: "Un hogar no puede quedar sin administradores"
                });
            }
        }

        const resultado = await pool.query(
            `UPDATE usuarios
             SET rol = $1
             WHERE id = $2
             RETURNING id, nombre, email, rol`,
            [rolNormalizado, usuarioId]
        );

        res.json({
            mensaje: "Rol actualizado correctamente",
            usuario: resultado.rows[0]
        });
    } catch (error) {
        console.error("Error al actualizar el rol del miembro:", error);

        res.status(500).json({
            error: "No se pudo actualizar el rol del miembro"
        });
    }
});

// Eliminar un miembro del hogar
router.delete("/:id/miembros/:usuarioId", async (req, res) => {
    try {
        const hogarId = Number(req.params.id);
        const usuarioId = Number(req.params.usuarioId);
        const { adminId } = req.body || {};

        if (!Number.isInteger(hogarId) || hogarId <= 0) {
            return res.status(400).json({
                error: "El hogar indicado no es válido"
            });
        }

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({
                error: "El usuario indicado no es válido"
            });
        }

        if (!adminId) {
            return res.status(403).json({
                error: "Se requiere identificar al administrador"
            });
        }

        const administrador = await pool.query(
            `SELECT u.id, u.rol
             FROM miembros_hogar m
             JOIN usuarios u ON u.id = m.usuario_id
             WHERE m.hogar_id = $1 AND u.id = $2`,
            [hogarId, adminId]
        );

        if (administrador.rows.length === 0 || administrador.rows[0].rol !== "admin") {
            return res.status(403).json({
                error: "Solo el administrador puede eliminar miembros"
            });
        }

        if (Number(adminId) === usuarioId) {
            return res.status(403).json({
                error: "El administrador no puede eliminarse a sí mismo"
            });
        }

        const miembro = await pool.query(
            `SELECT u.id, u.rol
             FROM miembros_hogar m
             JOIN usuarios u ON u.id = m.usuario_id
             WHERE m.hogar_id = $1 AND u.id = $2`,
            [hogarId, usuarioId]
        );

        if (miembro.rows.length === 0) {
            return res.status(404).json({
                error: "No se encontró ese miembro en el hogar"
            });
        }

        if (miembro.rows[0].rol === "admin") {
            const admins = await pool.query(
                `SELECT COUNT(*)::int AS total
                 FROM miembros_hogar m
                 JOIN usuarios u ON u.id = m.usuario_id
                 WHERE m.hogar_id = $1 AND u.rol = 'admin'`,
                [hogarId]
            );

            if ((admins.rows[0]?.total ?? 0) <= 1) {
                return res.status(400).json({
                    error: "Un hogar no puede quedar sin administradores"
                });
            }
        }

        const resultado = await pool.query(
            `DELETE FROM miembros_hogar
             WHERE hogar_id = $1 AND usuario_id = $2
             RETURNING *`,
            [hogarId, usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: "No se encontró ese miembro en el hogar"
            });
        }

        res.json({
            mensaje: "Miembro eliminado del hogar",
            usuarioId
        });
    } catch (error) {
        console.error("Error al eliminar miembro del hogar:", error);

        res.status(500).json({
            error: "No se pudo eliminar el miembro del hogar"
        });
    }
});


module.exports = router;
