const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Obtener todas las tareas (con filtros y orden)
router.get("/", async (req, res) => {
    try {
        const { estado, asignado, orden, hogar } = req.query;

        const condiciones = [];
        const valores = [];
        let indice = 1;

        // Filtro por hogar
        if (hogar) {
            condiciones.push(`hogar_id = $${indice}`);
            valores.push(hogar);
            indice++;
        }

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

// Lógica compartida para crear una tarea dentro de un hogar.
// La usan POST /api/tasks (hogar de prueba) y POST /api/hogares/:id/tareas.
async function crearTareaEnHogar(hogarId, cuerpo, res) {
    try {
        const hogarNumero = Number(hogarId);

        if (!Number.isInteger(hogarNumero) || hogarNumero <= 0) {
            return res.status(400).json({
                error: "El hogar indicado no es válido"
            });
        }

        const { nombre, descripcion, puntos, asignado_a } = cuerpo;

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

        // Solo letras, espacios, comillas, puntos y comas
        if (!/^[\p{L}\s'".,]+$/u.test(nombreLimpio)) {
            return res.status(400).json({
                error: "El título solo puede contener letras, comillas, puntos y comas"
            });
        }

        // Máximo 500 caracteres
        if (descripcion && descripcion.length > 500) {
            return res.status(400).json({
                error: "La descripción no puede superar los 500 caracteres"
            });
        }

        // Validación de puntos (mínimo 0, entero)
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

        // Miembro asignado (opcional): por ahora siempre llega vacío -> null
        const asignadoLimpio =
            typeof asignado_a === "string" && asignado_a.trim() !== ""
                ? asignado_a.trim()
                : null;

        const resultado = await pool.query(
            `INSERT INTO tareas
                (hogar_id, nombre, descripcion, puntos, estado, asignado_a)
             VALUES
                ($1, $2, $3, $4, 'Pendiente', $5)
             RETURNING id, hogar_id, nombre, descripcion, puntos, estado, asignado_a, completada, creado_en`,
            [
                hogarNumero,
                nombreLimpio,
                descripcion ? descripcion.trim() : null,
                puntosLimpios,
                asignadoLimpio
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al crear tarea:", error);

        // Título duplicado en el mismo hogar (UNIQUE(hogar_id, nombre))
        if (error.code === "23505") {
            return res.status(400).json({
                error: "Ya existe una tarea con ese título"
            });
        }

        // hogar_id inexistente (violación de clave foránea)
        if (error.code === "23503") {
            return res.status(400).json({
                error: "El hogar indicado no existe"
            });
        }

        res.status(500).json({
            error: "No se pudo crear la tarea"
        });
    }
}

// Crear una nueva tarea en el hogar de prueba (se mantiene por compatibilidad)
router.post("/", (req, res) => {
    const hogarDePrueba = 1;
    crearTareaEnHogar(hogarDePrueba, req.body, res);
});

// Actualizar una tarea existente
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, puntos, estado, asignado_a } = req.body;

        if (!nombre || nombre.trim() === "") {
            return res.status(400).json({
                error: "El título es un campo obligatorio"
            });
        }

        const nombreLimpio = nombre.trim();
        if (nombreLimpio.length > 100 || !/^[\p{L}\s'".,]+$/u.test(nombreLimpio)) {
            return res.status(400).json({
                error: "El título no es válido"
            });
        }

        if (descripcion && descripcion.length > 500) {
            return res.status(400).json({
                error: "La descripción no puede superar los 500 caracteres"
            });
        }

        const puntosNumero = Number(puntos);
        if (!Number.isInteger(puntosNumero) || puntosNumero <= 0) {
            return res.status(400).json({
                error: "Los puntos deben ser un número entero mayor a 0"
            });
        }

        const estadosValidos = ["Pendiente", "Realizada"];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: "El estado no es válido"
            });
        }

        const tareaResultado = await pool.query(
            "SELECT hogar_id FROM tareas WHERE id = $1",
            [id]
        );

        if (tareaResultado.rows.length === 0) {
            return res.status(404).json({ error: "No se encontró la tarea" });
        }

        const hogarId = tareaResultado.rows[0].hogar_id;
        const asignadoLimpio = typeof asignado_a === "string" && asignado_a.trim() !== ""
            ? asignado_a.trim()
            : null;

        if (asignadoLimpio) {
            const miembroResultado = await pool.query(
                `SELECT 1
                 FROM miembros_hogar m
                 JOIN usuarios u ON u.id = m.usuario_id
                 WHERE m.hogar_id = $1 AND u.nombre = $2`,
                [hogarId, asignadoLimpio]
            );

            if (miembroResultado.rows.length === 0) {
                return res.status(400).json({
                    error: "El miembro asignado no pertenece al hogar"
                });
            }
        }

        const resultado = await pool.query(
            `UPDATE tareas
             SET nombre = $1,
                 descripcion = $2,
                 puntos = $3,
                 estado = $4,
                 asignado_a = $5,
                 completada = $6
             WHERE id = $7
             RETURNING id, hogar_id, nombre, descripcion, puntos, estado, asignado_a, completada, creado_en`,
            [
                nombreLimpio,
                descripcion ? descripcion.trim() : null,
                puntosNumero,
                estado,
                asignadoLimpio,
                estado === "Realizada",
                id
            ]
        );

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error("Error al actualizar tarea:", error);

        if (error.code === "23505") {
            return res.status(400).json({
                error: "Ya existe una tarea con ese título"
            });
        }

        res.status(500).json({ error: "No se pudo actualizar la tarea" });
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
module.exports.crearTareaEnHogar = crearTareaEnHogar;
