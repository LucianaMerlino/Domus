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
                    h.id AS hogar_id,
                    h.nombre AS hogar
                FROM usuarios u
                LEFT JOIN miembros_hogar mh
                    ON mh.usuario_id = u.id
                LEFT JOIN hogares h
                    ON h.id = mh.hogar_id
                WHERE u.id = $1
                AND u.rol = 'admin'
                ORDER BY h.id
                LIMIT 1`,
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