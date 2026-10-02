const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ======================================================
// POST /api/auth/registro
// Crea un usuario sin asignarlo a un hogar
// ======================================================
router.post("/registro", async (req, res) => {
    try {
        const usuario = typeof req.body?.usuario === "string"
            ? req.body.usuario.trim()
            : "";
        const contrasena = typeof req.body?.contrasena === "string"
            ? req.body.contrasena
            : "";

        if (!usuario || !contrasena) {
            return res.status(400).json({
                error: "Usuario y contraseña son obligatorios"
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO usuarios (nombre, nombre_usuario, contrasena)
            VALUES ($1, $1, $2)
            RETURNING id, nombre_usuario
            `,
            [usuario, contrasena]
        );

        res.status(201).json({
            id: resultado.rows[0].id,
            usuario: resultado.rows[0].nombre_usuario,
            mensaje: "Usuario creado con exito"
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ error: "Usuario ya existente" });
        }

        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: "No se pudo registrar el usuario" });
    }
});

// ======================================================
// POST /api/auth/login
// Valida usuario y contraseña y devuelve los datos
// de la sesión (usuario + su hogar, si tiene)
// ======================================================
router.post("/login", async (req, res) => {
    try {
        const { usuario, contrasena } = req.body || {};

        if (!usuario || !usuario.trim() || !contrasena) {
            return res.status(400).json({
                error: "Usuario y contraseña son obligatorios"
            });
        }

        const resultado = await pool.query(
            `
            SELECT
                u.id,
                u.nombre,
                CASE
                    WHEN h.id IS NULL THEN 'integrante'
                    ELSE u.rol
                END AS rol,
                h.id AS hogar_id,
                h.nombre AS hogar
            FROM usuarios u
            LEFT JOIN miembros_hogar mh
                ON mh.usuario_id = u.id
            LEFT JOIN hogares h
                ON h.id = mh.hogar_id
            WHERE u.nombre_usuario = $1
              AND u.contrasena = $2
            ORDER BY h.id
            LIMIT 1
            `,
            [usuario.trim(), contrasena]
        );

        // Mismo mensaje sin importar qué campo falló
        if (resultado.rows.length === 0) {
            return res.status(401).json({
                error: "Usuario o contraseña incorrectos"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al iniciar sesión:", error);

        res.status(500).json({
            error: "No se pudo iniciar sesión"
        });
    }
});

module.exports = router;
