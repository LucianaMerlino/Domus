const express = require("express");
const pool = require("../config/database");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, nombre, email, rol FROM usuarios WHERE rol = 'admin' ORDER BY id"
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener los administradores"
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                u.id,
                u.nombre,
                u.email,
                u.rol,
                (
                    SELECT m.hogar_id
                    FROM miembros_hogar m
                    WHERE m.usuario_id = u.id
                    ORDER BY m.hogar_id
                    LIMIT 1
                ) AS hogar_id
             FROM usuarios u
             WHERE u.id = $1 AND u.rol = 'admin'`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Administrador no encontrado"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener el administrador"
        });
    }
});

module.exports = router;