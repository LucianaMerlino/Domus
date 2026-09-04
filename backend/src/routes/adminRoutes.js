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
            "SELECT id, nombre, email, rol FROM usuarios WHERE id = $1 AND rol = 'admin'",
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