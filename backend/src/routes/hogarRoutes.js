const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ======================================================
// Crear un hogar y asignar al usuario como administrador
// ======================================================
router.post("/", async (req, res) => {
    try {
        const usuarioId = Number(req.body?.usuarioId ?? req.body?.id ?? req.body?.usuario_id);
        const nombre = typeof req.body?.nombre === "string"
            ? req.body.nombre.trim()
            : "";

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({
                error: "El usuario indicado no es válido"
            });
        }

        if (!nombre) {
            return res.status(400).json({
                error: "El nombre del hogar es obligatorio"
            });
        }

        if (nombre.length > 100) {
            return res.status(400).json({
                error: "El nombre del hogar no puede superar los 100 caracteres"
            });
        }

        const usuario = await pool.query(
            `SELECT id, nombre, rol
             FROM usuarios
             WHERE id = $1`,
            [usuarioId]
        );

        if (usuario.rows.length === 0) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        const nombreUsuario = usuario.rows[0].nombre;

        const yaTieneHogar = await pool.query(
            `SELECT 1
             FROM miembros_hogar
             WHERE usuario_id = $1
             LIMIT 1`,
            [usuarioId]
        );

        if (yaTieneHogar.rows.length > 0) {
            return res.status(409).json({
                error: "Este usuario ya pertenece a un hogar"
            });
        }

        const hogarResultado = await pool.query(
            `INSERT INTO hogares (nombre)
             VALUES ($1)
             RETURNING id, nombre`,
            [nombre]
        );

        const hogar = hogarResultado.rows[0];

        await pool.query(
            `INSERT INTO miembros_hogar (hogar_id, usuario_id)
             VALUES ($1, $2)`,
            [hogar.id, usuarioId]
        );

        await pool.query(
            `UPDATE usuarios
             SET rol = 'admin'
             WHERE id = $1`,
            [usuarioId]
        );

        const tareasLimpias = await pool.query(
            `UPDATE tareas
             SET asignado_a = NULL,
                 estado = 'Pendiente',
                 completada = FALSE
             WHERE asignado_a = $1
             RETURNING id`,
            [nombreUsuario]
        );

        res.status(201).json({
            id: hogar.id,
            nombre: hogar.nombre,
            usuarioId,
            tareasLimpias: tareasLimpias.rowCount || 0
        });
    } catch (error) {
        console.error("Error al crear hogar:", error);
        res.status(500).json({
            error: "No se pudo crear el hogar"
        });
    }
});

// ======================================================
// Obtener el ranking de puntos del hogar
// ======================================================
router.get("/:id/ranking", async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT
                u.id,
                u.nombre,
                COALESCE(SUM(t.puntos), 0) AS puntos
             FROM miembros_hogar m
             JOIN usuarios u ON u.id = m.usuario_id
             LEFT JOIN tareas t
                ON t.asignado_a = u.nombre
               AND t.hogar_id = m.hogar_id
               AND t.completada = TRUE
             WHERE m.hogar_id = $1
             GROUP BY u.id, u.nombre
             ORDER BY u.nombre`,
            [req.params.id]
        );

        res.json(resultado.rows.map((miembro) => ({
            ...miembro,
            puntos: Number(miembro.puntos)
        })));
    } catch (error) {
        console.error("Error al obtener el ranking del hogar:", error);
        res.status(500).json({ error: "No se pudo obtener el ranking del hogar" });
    }
});

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

        const sigueEnOtroHogar = await pool.query(
            `SELECT 1
             FROM miembros_hogar
             WHERE usuario_id = $1
             LIMIT 1`,
            [usuarioId]
        );

        if (sigueEnOtroHogar.rows.length === 0) {
            const usuarioActual = await pool.query(
                `SELECT nombre
                 FROM usuarios
                 WHERE id = $1`,
                [usuarioId]
            );

            if (usuarioActual.rows.length > 0) {
                await pool.query(
                    `UPDATE usuarios
                     SET rol = 'integrante'
                     WHERE id = $1`,
                    [usuarioId]
                );

                await pool.query(
                    `UPDATE tareas
                     SET asignado_a = NULL,
                         estado = 'Pendiente',
                         completada = FALSE
                     WHERE asignado_a = $1`,
                    [usuarioActual.rows[0].nombre]
                );
            }
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


// ======================================================
// PUT /api/hogares/:id/nombre
// Editar nombre del hogar
// ======================================================
router.put("/:id/nombre", async (req, res) => {
    try {
        const hogarId = Number(req.params.id);
        const usuarioId = Number(req.body?.usuarioId);
        const nombre = typeof req.body?.nombre === "string"
            ? req.body.nombre.trim()
            : "";

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

        if (nombre === "") {
            return res.status(400).json({
                error: "El nombre del hogar no puede quedar vacío."
            });
        }

        if (nombre.length > 100) {
            return res.status(400).json({
                error: "El nombre del hogar no puede superar los 100 caracteres"
            });
        }

        // Verificar que el usuario sea administrador de ESE hogar
        const administrador = await pool.query(
            `
            SELECT u.id
            FROM miembros_hogar mh
            JOIN usuarios u
                ON u.id = mh.usuario_id
            WHERE mh.hogar_id = $1
              AND u.id = $2
              AND u.rol = 'admin'
            `,
            [hogarId, usuarioId]
        );

        if (administrador.rows.length === 0) {
            return res.status(403).json({
                error: "Solo el administrador puede modificar el nombre del hogar"
            });
        }

        const resultado = await pool.query(
            `
            UPDATE hogares
            SET nombre = $1
            WHERE id = $2
            RETURNING id, nombre, icono
            `,
            [nombre, hogarId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: "No se encontró el hogar"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al actualizar nombre del hogar:", error);

        res.status(500).json({
            error: "No se pudo actualizar el nombre del hogar"
        });
    }
});


// ======================================================
// PUT /api/hogares/:id/icono
// Editar ícono del hogar
// ======================================================
router.put("/:id/icono", async (req, res) => {
    try {
        const hogarId = Number(req.params.id);
        const usuarioId = Number(req.body?.usuarioId);
        const icono = typeof req.body?.icono === "string"
            ? req.body.icono.trim()
            : "";

        const iconosDisponibles = [
            "🏠",
            "🏡",
            "🏢",
            "🏘️",
            "/wireframes/domus/domus-icon-aqua-fucsia.png",
            "/wireframes/domus/domus-icon-verde-celeste.png",
            "/wireframes/domus/domus-icon-rojo-gris.png",
            "/wireframes/domus/domus-icon-lila-amarillo.png"
        ];

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

        if (!iconosDisponibles.includes(icono)) {
            return res.status(400).json({
                error: "El ícono seleccionado no es válido"
            });
        }

        const administrador = await pool.query(
            `
            SELECT u.id
            FROM miembros_hogar mh
            JOIN usuarios u
                ON u.id = mh.usuario_id
            WHERE mh.hogar_id = $1
              AND u.id = $2
              AND u.rol = 'admin'
            `,
            [hogarId, usuarioId]
        );

        if (administrador.rows.length === 0) {
            return res.status(403).json({
                error: "Solo el administrador puede modificar el ícono del hogar"
            });
        }

        const resultado = await pool.query(
            `
            UPDATE hogares
            SET icono = $1
            WHERE id = $2
            RETURNING id, nombre, icono
            `,
            [icono, hogarId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: "No se encontró el hogar"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al actualizar ícono del hogar:", error);

        res.status(500).json({
            error: "No se pudo actualizar el ícono del hogar"
        });
    }
});


module.exports = router;
