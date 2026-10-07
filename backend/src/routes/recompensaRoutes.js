const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { esAdminDelHogar } = require("../permisos");
const { TITULO_VALIDO, MENSAJE_TITULO_INVALIDO } = require("../validaciones");

async function perteneceAlHogar(hogarId, usuarioId) {
    const id = Number(usuarioId);
    if (!Number.isInteger(id) || id <= 0) return false;
    const resultado = await pool.query(
        `SELECT 1 FROM miembros_hogar WHERE hogar_id = $1 AND usuario_id = $2`,
        [hogarId, id]
    );
    return resultado.rows.length > 0;
}

const CAMPOS_RECOMPENSA = `
    r.id, r.hogar_id, r.nombre, r.descripcion, r.costo_puntos,
    r.estado, r.asignado_id, u.nombre AS asignado_a, r.creado_en
`;

// Lista de recompensas: solo integrantes del hogar pueden verla.
router.get("/hogares/:hogarId/recompensas", async (req, res) => {
    try {
        const hogarId = Number(req.params.hogarId);
        const usuarioId = Number(req.query.usuarioId);
        if (!(await perteneceAlHogar(hogarId, usuarioId))) {
            return res.status(403).json({ error: "No pertenecés a este hogar" });
        }

        const resultado = await pool.query(
            `SELECT ${CAMPOS_RECOMPENSA}
             FROM recompensas r
             LEFT JOIN usuarios u ON u.id = r.asignado_id
             WHERE r.hogar_id = $1
             ORDER BY r.id DESC`,
            [hogarId]
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error("Error al obtener recompensas:", error);
        res.status(500).json({ error: "No se pudieron obtener las recompensas" });
    }
});

// Crear recompensa: exclusivamente un admin del mismo hogar.
router.post("/hogares/:hogarId/recompensas", async (req, res) => {
    try {
        const hogarId = Number(req.params.hogarId);
        const usuarioId = Number(req.body?.usuarioId);
        const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
        const descripcion = typeof req.body?.descripcion === "string" ? req.body.descripcion.trim() : "";
        const meta = Number(req.body?.costo_puntos);

        if (!(await esAdminDelHogar(hogarId, usuarioId))) {
            return res.status(403).json({ error: "Solo el administrador del hogar puede crear recompensas" });
        }
        if (!nombre) return res.status(400).json({ error: "El nombre de la recompensa es obligatorio" });
        if (nombre.length > 50) return res.status(400).json({ error: "El nombre de la recompensa no puede superar los 50 caracteres" });
        if (!TITULO_VALIDO.test(nombre)) return res.status(400).json({ error: MENSAJE_TITULO_INVALIDO });
        if (descripcion.length > 200) return res.status(400).json({ error: "La descripción de la recompensa no puede superar los 200 caracteres" });
        if (!Number.isInteger(meta) || meta < 1) return res.status(400).json({ error: "La meta de puntos debe ser un número entero mayor o igual a 1" });

        const creado = await pool.query(
            `INSERT INTO recompensas (hogar_id, nombre, descripcion, costo_puntos, estado)
             VALUES ($1, $2, $3, $4, 'Por reclamar') RETURNING id`,
            [hogarId, nombre, descripcion || null, meta]
        );
        const resultado = await pool.query(
            `SELECT ${CAMPOS_RECOMPENSA}
             FROM recompensas r LEFT JOIN usuarios u ON u.id = r.asignado_id
             WHERE r.id = $1`,
            [creado.rows[0].id]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error("Error al crear recompensa:", error);
        res.status(500).json({ error: "No se pudo crear la recompensa" });
    }
});

module.exports = router;
