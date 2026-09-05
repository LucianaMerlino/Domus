const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Obtener todas las tareas
router.get("/", async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT id, hogar_id, nombre, descripcion, puntos, estado, completada, creado_en
             FROM tareas
             ORDER BY id DESC`
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error("Error al obtener tareas:", error);

        res.status(500).json({
            error: "No se pudieron obtener las tareas"
        });
    }
});

// Crear una nueva tarea
router.post("/", async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        // El título es obligatorio
        if (!nombre || nombre.trim() === "") {
            return res.status(400).json({
                error: "El título es un campo obligatorio"
            });
        }

        const nombreLimpio = nombre.trim();

        // Máximo 100 caracteres
        if (nombreLimpio.length > 100) {
            return res.status(400).json({
                error: "El título no puede superar los 100 caracteres"
            });
        }

        // Máximo 500 caracteres
        if (descripcion && descripcion.length > 500) {
            return res.status(400).json({
                error: "La descripción no puede superar los 500 caracteres"
            });
        }

        // Hogar de prueba
        const hogarId = 1;

        const resultado = await pool.query(
            `INSERT INTO tareas
                (hogar_id, nombre, descripcion, estado)
             VALUES
                ($1, $2, $3, 'Pendiente')
             RETURNING id, hogar_id, nombre, descripcion, puntos, estado, completada, creado_en`,
            [
                hogarId,
                nombreLimpio,
                descripcion ? descripcion.trim() : null
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al crear tarea:", error);

        // Título duplicado
        if (error.code === "23505") {
            return res.status(400).json({
                error: "Ya existe una tarea con ese título"
            });
        }

        res.status(500).json({
            error: "No se pudo crear la tarea"
        });
    }
});

module.exports = router;