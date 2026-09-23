const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Pool de tareas del hogar: plantillas ("tareas base") con
// nombre, descripción y puntaje estándar. Más adelante, asignar
// una tarea va a crear una fila en "tareas" con plantilla_id.

const CAMPOS = "id, hogar_id, nombre, descripcion, puntos, creado_en";


// Valida el cuerpo de una plantilla. Devuelve { error } o { datos }.
function validarPlantilla({ nombre, descripcion, puntos } = {}) {
    if (!nombre || nombre.trim() === "") {
        return { error: "El título es un campo obligatorio" };
    }

    const nombreLimpio = nombre.trim();

    if (nombreLimpio.length > 100) {
        return { error: "El título no puede superar los 100 caracteres" };
    }

    if (!/^[\p{L}\s'".,]+$/u.test(nombreLimpio)) {
        return { error: "El título solo puede contener letras, comillas, puntos y comas" };
    }

    if (descripcion && descripcion.length > 500) {
        return { error: "La descripción no puede superar los 500 caracteres" };
    }

    const puntosNumero = Number(puntos);

    if (puntos === "" || puntos == null || !Number.isInteger(puntosNumero) || puntosNumero <= 0) {
        return { error: "Los puntos deben ser un número entero mayor a 0" };
    }

    return {
        datos: {
            nombre: nombreLimpio,
            descripcion: descripcion && descripcion.trim() ? descripcion.trim() : null,
            puntos: puntosNumero
        }
    };
}


// Traduce errores de la base a respuestas para el cliente
function responderError(res, error, mensajePorDefecto) {
    // Nombre repetido en el hogar (índice único hogar_id + LOWER(nombre))
    if (error.code === "23505") {
        return res.status(409).json({
            error: "Ya existe una tarea en el pool con ese nombre"
        });
    }

    // hogar_id inexistente
    if (error.code === "23503") {
        return res.status(400).json({
            error: "El hogar indicado no existe"
        });
    }

    console.error(mensajePorDefecto, error);

    res.status(500).json({ error: mensajePorDefecto });
}


// ======================================================
// GET /api/hogares/:hogarId/plantillas
// Lista el pool de tareas del hogar
// ======================================================
router.get("/hogares/:hogarId/plantillas", async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT ${CAMPOS}
             FROM plantillas_tarea
             WHERE hogar_id = $1
             ORDER BY LOWER(nombre)`,
            [req.params.hogarId]
        );

        res.json(resultado.rows);

    } catch (error) {
        responderError(res, error, "No se pudo obtener el pool de tareas");
    }
});


// ======================================================
// POST /api/hogares/:hogarId/plantillas
// Crea una plantilla en el pool del hogar
// ======================================================
router.post("/hogares/:hogarId/plantillas", async (req, res) => {
    try {
        const hogarId = Number(req.params.hogarId);

        if (!Number.isInteger(hogarId) || hogarId <= 0) {
            return res.status(400).json({
                error: "El hogar indicado no es válido"
            });
        }

        const { error, datos } = validarPlantilla(req.body);

        if (error) {
            return res.status(400).json({ error });
        }

        const resultado = await pool.query(
            `INSERT INTO plantillas_tarea (hogar_id, nombre, descripcion, puntos)
             VALUES ($1, $2, $3, $4)
             RETURNING ${CAMPOS}`,
            [hogarId, datos.nombre, datos.descripcion, datos.puntos]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {
        responderError(res, error, "No se pudo crear la tarea en el pool");
    }
});


// ======================================================
// PUT /api/plantillas/:id
// Edita una plantilla. Las tareas ya asignadas no cambian.
// ======================================================
router.put("/plantillas/:id", async (req, res) => {
    try {
        const { error, datos } = validarPlantilla(req.body);

        if (error) {
            return res.status(400).json({ error });
        }

        const resultado = await pool.query(
            `UPDATE plantillas_tarea
             SET nombre = $1,
                 descripcion = $2,
                 puntos = $3
             WHERE id = $4
             RETURNING ${CAMPOS}`,
            [datos.nombre, datos.descripcion, datos.puntos, req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: "No se encontró la tarea en el pool"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        responderError(res, error, "No se pudo editar la tarea del pool");
    }
});


// ======================================================
// DELETE /api/plantillas/:id
// Elimina una plantilla del pool
// ======================================================
router.delete("/plantillas/:id", async (req, res) => {
    try {
        const resultado = await pool.query(
            "DELETE FROM plantillas_tarea WHERE id = $1 RETURNING id",
            [req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: "No se encontró la tarea en el pool"
            });
        }

        res.json({
            mensaje: "Tarea eliminada del pool"
        });

    } catch (error) {
        responderError(res, error, "No se pudo eliminar la tarea del pool");
    }
});


module.exports = router;
