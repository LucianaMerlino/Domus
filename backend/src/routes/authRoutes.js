const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Datos que el frontend guarda como sesión: usuario + su hogar, si tiene
const CAMPOS_SESION = `
    u.id,
    u.nombre,
    u.email,
    COALESCE(mh.rol, 'integrante') AS rol,
    h.id AS hogar_id,
    h.nombre AS hogar
`;

const DESDE_SESION = `
    FROM usuarios u
    LEFT JOIN miembros_hogar mh
        ON mh.usuario_id = u.id
    LEFT JOIN hogares h
        ON h.id = mh.hogar_id
`;

// Debe tener texto antes y después de un único "@"
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+$/;

// ======================================================
// POST /api/auth/registro
// Crea un usuario sin asignarlo a un hogar y devuelve
// los datos de la sesión para que quede logueado
// ======================================================
router.post("/registro", async (req, res) => {
    try {
        const usuario = typeof req.body?.usuario === "string"
            ? req.body.usuario.trim()
            : "";
        const email = typeof req.body?.email === "string"
            ? req.body.email.trim()
            : "";
        const contrasena = typeof req.body?.contrasena === "string"
            ? req.body.contrasena
            : "";

        if (!usuario || !email || !contrasena) {
            return res.status(400).json({
                error: "Usuario, email y contraseña son obligatorios"
            });
        }

        if (!EMAIL_VALIDO.test(email)) {
            return res.status(400).json({
                error: "El email debe incluir un @"
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO usuarios (nombre, email, contrasena)
            VALUES ($1, $2, $3)
            RETURNING id
            `,
            [usuario, email, contrasena]
        );

        const sesion = await pool.query(
            `SELECT ${CAMPOS_SESION} ${DESDE_SESION} WHERE u.id = $1`,
            [resultado.rows[0].id]
        );

        res.status(201).json(sesion.rows[0]);

    } catch (error) {
        // Único violado: el email (sin importar mayúsculas)
        if (error.code === "23505") {
            return res.status(409).json({ error: "Email ya registrado" });
        }

        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: "No se pudo registrar el usuario" });
    }
});

// ======================================================
// POST /api/auth/login
// Valida email y contraseña y devuelve los datos
// de la sesión (usuario + su hogar, si tiene)
// ======================================================
router.post("/login", async (req, res) => {
    try {
        const { email, contrasena } = req.body || {};

        if (typeof email !== "string" || !email.trim() || !contrasena) {
            return res.status(400).json({
                error: "Email y contraseña son obligatorios"
            });
        }

        const resultado = await pool.query(
            `
            SELECT ${CAMPOS_SESION}
            ${DESDE_SESION}
            WHERE LOWER(u.email) = LOWER($1)
              AND u.contrasena = $2
            `,
            [email.trim(), contrasena]
        );

        // Mismo mensaje sin importar qué campo falló
        if (resultado.rows.length === 0) {
            return res.status(401).json({
                error: "Email o contraseña incorrectos"
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
