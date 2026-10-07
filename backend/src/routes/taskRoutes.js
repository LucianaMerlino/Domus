const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { esAdminDelHogar } = require("../permisos");
const { TITULO_VALIDO, MENSAJE_TITULO_INVALIDO } = require("../validaciones");

// Campos que devuelve cada tarea. asignado_a es el nombre de quien la
// tiene asignada (para mostrar); asignado_id es quien la tiene.
const CAMPOS_TAREA = `
    t.id,
    t.hogar_id,
    t.nombre,
    t.descripcion,
    t.puntos,
    t.estado,
    t.asignado_id,
    u.nombre AS asignado_a,
    t.completada,
    t.plantilla_id,
    t.creado_en
`;

const DESDE_TAREAS = `
    FROM tareas t
    LEFT JOIN usuarios u ON u.id = t.asignado_id
`;

async function obtenerTarea(id) {
    const resultado = await pool.query(
        `SELECT ${CAMPOS_TAREA} ${DESDE_TAREAS} WHERE t.id = $1`,
        [id]
    );

    return resultado.rows[0];
}

// Lee el id del miembro asignado: null si viene vacío, NaN si no es válido
function leerAsignado(valor) {
    if (valor === undefined || valor === null || valor === "") {
        return null;
    }

    const id = Number(valor);

    return Number.isInteger(id) && id > 0 ? id : NaN;
}

// Verifica que el usuario asignado pertenezca al hogar
async function perteneceAlHogar(hogarId, usuarioId) {
    const resultado = await pool.query(
        `SELECT 1
         FROM miembros_hogar
         WHERE hogar_id = $1 AND usuario_id = $2`,
        [hogarId, usuarioId]
    );

    return resultado.rows.length > 0;
}

// Crear una instancia de tarea a partir de una plantilla o datos directos
router.post("/", async (req, res) => {
    try {
        const hogarId = Number(req.body.hogar_id ?? req.body.hogarId);
        const plantillaId = req.body.plantilla_id ?? req.body.plantillaId ?? null;
        const asignadoId = leerAsignado(req.body.asignado_id);

        if (!Number.isInteger(hogarId) || hogarId <= 0) {
            return res.status(400).json({
                error: "El hogar indicado no es válido"
            });
        }

        if (!(await esAdminDelHogar(hogarId, req.body.usuarioId))) {
            return res.status(403).json({
                error: "Solo el administrador puede crear tareas"
            });
        }

        let nombre = typeof req.body.nombre === "string" ? req.body.nombre.trim() : "";
        let descripcion = typeof req.body.descripcion === "string" ? req.body.descripcion.trim() : "";
        let puntos = req.body.puntos;

        if (plantillaId != null) {
            const plantillaResultado = await pool.query(
                `SELECT id, hogar_id, nombre, descripcion, puntos
                 FROM plantillas_tarea
                 WHERE id = $1 AND hogar_id = $2`,
                [plantillaId, hogarId]
            );

            if (plantillaResultado.rows.length === 0) {
                return res.status(404).json({
                    error: "La tarea del pool no existe o no pertenece a este hogar"
                });
            }

            const plantilla = plantillaResultado.rows[0];
            nombre = nombre || plantilla.nombre;
            descripcion = descripcion || plantilla.descripcion || "";
            puntos = puntos == null ? plantilla.puntos : puntos;
        }

        if (nombre === "") {
            return res.status(400).json({
                error: "El título es un campo obligatorio"
            });
        }

        if (nombre.length > 100) {
            return res.status(400).json({
                error: "El título no puede superar los 100 caracteres"
            });
        }

        if (!TITULO_VALIDO.test(nombre)) {
            return res.status(400).json({
                error: MENSAJE_TITULO_INVALIDO
            });
        }

        if (descripcion.length > 500) {
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

        if (Number.isNaN(asignadoId) || (asignadoId && !(await perteneceAlHogar(hogarId, asignadoId)))) {
            return res.status(400).json({
                error: "El miembro asignado no pertenece al hogar"
            });
        }

        const resultado = await pool.query(
            `INSERT INTO tareas (
                hogar_id,
                nombre,
                descripcion,
                puntos,
                estado,
                completada,
                asignado_id,
                plantilla_id
             )
             VALUES ($1, $2, $3, $4, 'Pendiente', FALSE, $5, $6)
             RETURNING id`,
            [
                hogarId,
                nombre,
                descripcion || null,
                puntosNumero,
                asignadoId,
                plantillaId
            ]
        );

        res.status(201).json(await obtenerTarea(resultado.rows[0].id));
    } catch (error) {
        console.error("Error al crear tarea:", error);
        res.status(500).json({
            error: "No se pudo crear la tarea"
        });
    }
});

// Obtener todas las tareas (con filtros y orden)
router.get("/", async (req, res) => {
    try {
        const { estado, asignado, orden, hogar } = req.query;

        const condiciones = [];
        const valores = [];
        let indice = 1;

        // Filtro por hogar
        if (hogar) {
            condiciones.push(`t.hogar_id = $${indice}`);
            valores.push(hogar);
            indice++;
        }

        // Filtro por estado
        if (estado && estado !== "todas") {
            condiciones.push(`t.estado = $${indice}`);
            valores.push(estado);
            indice++;
        }

        // Filtro por asignación (id del miembro o "sin_asignar")
        if (asignado && asignado !== "todos") {
            if (asignado === "sin_asignar") {
                condiciones.push(`t.asignado_id IS NULL`);
            } else {
                condiciones.push(`t.asignado_id = $${indice}`);
                valores.push(Number(asignado) || 0);
                indice++;
            }
        }

        const where = condiciones.length > 0
            ? `WHERE ${condiciones.join(" AND ")}`
            : "";

        // Orden por puntos
        let orderBy = "ORDER BY t.id DESC";
        if (orden === "asc") {
            orderBy = "ORDER BY t.puntos ASC";
        } else if (orden === "desc") {
            orderBy = "ORDER BY t.puntos DESC";
        }

        const consulta = `
            SELECT ${CAMPOS_TAREA}
            ${DESDE_TAREAS}
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

// ======================================================
// Marcar una tarea como realizada
// Solo puede quien la tiene asignada o el administrador del hogar
// ======================================================
router.put("/:id/realizada", async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = Number(req.body?.usuarioId);

        const tareaResultado = await pool.query(
            "SELECT hogar_id, asignado_id FROM tareas WHERE id = $1",
            [id]
        );

        if (tareaResultado.rows.length === 0) {
            return res.status(404).json({
                error: "No se encontró la tarea"
            });
        }

        const { hogar_id: hogarId, asignado_id: asignadoId } = tareaResultado.rows[0];
        const esAsignado = asignadoId !== null && asignadoId === usuarioId;

        if (!esAsignado && !(await esAdminDelHogar(hogarId, usuarioId))) {
            return res.status(403).json({
                error: "Solo quien tiene asignada la tarea o el administrador pueden completarla"
            });
        }

        await pool.query(
            `UPDATE tareas
             SET estado = 'Realizada',
                 completada = TRUE
             WHERE id = $1`,
            [id]
        );

        res.json(await obtenerTarea(id));

    } catch (error) {
        console.error(
            "Error al marcar tarea como realizada:",
            error
        );

        res.status(500).json({
            error: "No se pudo marcar la tarea como realizada"
        });
    }
});

// Actualizar una tarea existente
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, puntos, estado, usuarioId } = req.body;
        const asignadoId = leerAsignado(req.body.asignado_id);

        if (!nombre || nombre.trim() === "") {
            return res.status(400).json({
                error: "El título es un campo obligatorio"
            });
        }

        const nombreLimpio = nombre.trim();
        if (nombreLimpio.length > 100) {
            return res.status(400).json({
                error: "El título no puede superar los 100 caracteres"
            });
        }

        if (!TITULO_VALIDO.test(nombreLimpio)) {
            return res.status(400).json({
                error: MENSAJE_TITULO_INVALIDO
            });
        }

        if (descripcion && descripcion.length > 500) {
            return res.status(400).json({
                error: "La descripción no puede superar los 500 caracteres"
            });
        }

        const puntosNumero = Number(puntos);
        if (!Number.isInteger(puntosNumero) || puntosNumero < 0) {
            return res.status(400).json({
                error: "Los puntos deben ser un número entero mayor o igual a 0"
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

        const administrador = await pool.query(
            `SELECT u.id
            FROM miembros_hogar mh
            JOIN usuarios u
                ON u.id = mh.usuario_id
            WHERE mh.hogar_id = $1
            AND u.id = $2
            AND mh.rol = 'admin'`,
            [hogarId, usuarioId]
        );

        if (administrador.rows.length === 0) {
            return res.status(403).json({
                error: "Solo el administrador puede modificar las tareas"
            });
        }

        if (Number.isNaN(asignadoId) || (asignadoId && !(await perteneceAlHogar(hogarId, asignadoId)))) {
            return res.status(400).json({
                error: "El miembro asignado no pertenece al hogar"
            });
        }

        await pool.query(
            `UPDATE tareas
             SET nombre = $1,
                 descripcion = $2,
                 puntos = $3,
                 estado = $4,
                 asignado_id = $5,
                 completada = $6
             WHERE id = $7`,
            [
                nombreLimpio,
                descripcion ? descripcion.trim() : null,
                puntosNumero,
                estado,
                asignadoId,
                estado === "Realizada",
                id
            ]
        );

        res.json(await obtenerTarea(id));
    } catch (error) {
        console.error("Error al actualizar tarea:", error);

        res.status(500).json({ error: "No se pudo actualizar la tarea" });
    }
});

// Eliminar una tarea
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = Number(req.body?.usuarioId);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(403).json({ error: "No se pudo identificar al administrador" });
    }

    const tareaResultado = await pool.query(
      "SELECT hogar_id FROM tareas WHERE id = $1",
      [id]
    );

    if (tareaResultado.rows.length === 0) {
      return res.status(404).json({ error: "No se encontró la tarea" });
    }

    const administrador = await pool.query(
      `SELECT 1
       FROM miembros_hogar mh
       JOIN usuarios u ON u.id = mh.usuario_id
       WHERE mh.hogar_id = $1
         AND u.id = $2
         AND mh.rol = 'admin'`,
      [tareaResultado.rows[0].hogar_id, usuarioId]
    );

    if (administrador.rows.length === 0) {
      return res.status(403).json({ error: "Solo el administrador puede eliminar tareas" });
    }

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
