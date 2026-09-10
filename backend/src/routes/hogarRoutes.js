const express = require("express");
const router = express.Router();
const pool = require("../config/database");

const { crearTareaEnHogar } = require("./taskRoutes");

// Listar los miembros de un hogar (para poder asignarlos a una tarea)
router.get("/:id/miembros", async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT u.id, u.nombre, u.rol
             FROM miembros_hogar m
             JOIN usuarios u ON u.id = m.usuario_id
             WHERE m.hogar_id = $1
             ORDER BY u.nombre`,
            [req.params.id]
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error("Error al obtener miembros del hogar:", error);

        res.status(500).json({
            error: "No se pudieron obtener los miembros del hogar"
        });
    }
});

// Crear una nueva tarea dentro de un hogar puntual
router.post("/:id/tareas", (req, res) => {
    crearTareaEnHogar(req.params.id, req.body, res);
});

module.exports = router;
