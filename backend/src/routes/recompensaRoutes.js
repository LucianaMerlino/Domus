const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { esAdminDelHogar } = require("../permisos");
const { TITULO_VALIDO, MENSAJE_TITULO_INVALIDO } = require("../validaciones");
const { puntosDelUsuario } = require("../puntos");

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
    r.estado, r.asignado_id, u.nombre AS asignado_a, r.creado_en,
    r.reclamada_por, ur.nombre AS reclamada_por_nombre, r.reclamada_en
`;

const DESDE_RECOMPENSAS = `
    FROM recompensas r
    LEFT JOIN usuarios u ON u.id = r.asignado_id
    LEFT JOIN usuarios ur ON ur.id = r.reclamada_por
`;

async function obtenerRecompensa(id, cliente = pool) {
    const resultado = await cliente.query(
        `SELECT ${CAMPOS_RECOMPENSA} ${DESDE_RECOMPENSAS} WHERE r.id = $1`,
        [id]
    );
    return resultado.rows[0];
}

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
             ${DESDE_RECOMPENSAS}
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
        res.status(201).json(await obtenerRecompensa(creado.rows[0].id));
    } catch (error) {
        console.error("Error al crear recompensa:", error);
        res.status(500).json({ error: "No se pudo crear la recompensa" });
    }
});

// Reclamar recompensa (DOM-53): cualquier integrante del hogar con saldo
// suficiente. Se gastan los puntos y se guarda quién la reclamó.
router.post("/recompensas/:id/reclamar", async (req, res) => {
    const usuarioId = Number(req.body?.usuarioId);
    const cliente = await pool.connect();

    try {
        await cliente.query("BEGIN");

        // Bloquea la recompensa para que no se reclame dos veces a la vez
        const recompensa = await cliente.query(
            "SELECT hogar_id, costo_puntos, estado FROM recompensas WHERE id = $1 FOR UPDATE",
            [req.params.id]
        );

        if (recompensa.rows.length === 0) {
            await cliente.query("ROLLBACK");
            return res.status(404).json({ error: "No se encontró la recompensa" });
        }

        const { hogar_id: hogarId, costo_puntos: costo, estado } = recompensa.rows[0];

        if (!(await perteneceAlHogar(hogarId, usuarioId))) {
            await cliente.query("ROLLBACK");
            return res.status(403).json({ error: "No pertenecés a este hogar" });
        }

        if (estado === "Reclamada") {
            await cliente.query("ROLLBACK");
            return res.status(409).json({ error: "Recompensa ya reclamada" });
        }

        // Serializa los reclamos de un mismo usuario para que no gaste dos
        // veces los mismos puntos en reclamos simultáneos
        await cliente.query("SELECT pg_advisory_xact_lock($1)", [usuarioId]);

        const { disponibles } = await puntosDelUsuario(usuarioId, cliente);

        if (disponibles < costo) {
            await cliente.query("ROLLBACK");
            return res.status(400).json({ error: "No tienes suficientes puntos" });
        }

        await cliente.query(
            `UPDATE recompensas
             SET estado = 'Reclamada',
                 reclamada_por = $1,
                 reclamada_en = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [usuarioId, req.params.id]
        );

        await cliente.query("COMMIT");

        res.json(await obtenerRecompensa(req.params.id));
    } catch (error) {
        await cliente.query("ROLLBACK").catch(() => {});
        console.error("Error al reclamar recompensa:", error);
        res.status(500).json({ error: "No se pudo reclamar la recompensa" });
    } finally {
        cliente.release();
    }
});

module.exports = router;
