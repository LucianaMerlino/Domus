const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Obtener todas las tareas (con filtros y orden)
router.get("/", async (req, res) => {
    try {
        const { estado, asignado, orden } = req.query;

        const condiciones = [];
        const valores = [];
        let indice = 1;

        // Filtro por estado
        if (estado && estado !== "todas") {
            condiciones.push(`estado = $${indice}`);
            valores.push(estado);
            indice++;
        }

        // Filtro por asignación
        if (asignado && asignado !== "todos") {
            if (asignado === "sin_asignar") {
                condiciones.push(`asignado_a IS NULL`);
            } else {
                condiciones.push(`asignado_a = $${indice}`);
                valores.push(asignado);
                indice++;
            }
        }

        const where = condiciones.length > 0
            ? `WHERE ${condiciones.join(" AND ")}`
            : "";

        // Orden por puntos
        let orderBy = "ORDER BY id DESC";
        if (orden === "asc") {
            orderBy = "ORDER BY puntos ASC";
        } else if (orden === "desc") {
            orderBy = "ORDER BY puntos DESC";
        }

        const consulta = `
            SELECT id, hogar_id, nombre, descripcion, puntos, estado, asignado_a, completada, creado_en
            FROM tareas
            ${where}
            ${orderBy}
        `;

        const resultado = await pool.query(consulta, valores);

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
        const { nombre, descripcion, puntos } = req.body;

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

        // Validación de puntos
        let puntosLimpios = 0;

        if (puntos !== undefined && puntos !== null && puntos !== "") {
            const puntosNumero = Number(puntos);

            if (!Number.isInteger(puntosNumero) || puntosNumero < 0) {
                return res.status(400).json({
                    error: "Los puntos deben ser un número entero mayor o igual a 0"
                });
            }

            puntosLimpios = puntosNumero;
        }

        // Hogar de prueba
        const hogarId = 1;

        const resultado = await pool.query(
            `INSERT INTO tareas
                (hogar_id, nombre, descripcion, puntos, estado)
             VALUES
                ($1, $2, $3, $4, 'Pendiente')
             RETURNING id, hogar_id, nombre, descripcion, puntos, estado, asignado_a, creado_en`,
            [
                hogarId,
                nombreLimpio,
                descripcion ? descripcion.trim() : null,
                puntosLimpios
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

// Eliminar una tarea
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      "DELETE FROM tareas WHERE id = $1 RETURNING id",
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        error: "No se encontró la tarea"
      });
    }

    res.json({
      mensaje: "Tarea eliminada correctamente"
    });

  } catch (error) {
    console.error("Error al eliminar tarea:", error);

    res.status(500).json({
      error: "No se pudo eliminar la tarea"
    });
  }
});

module.exports = router;