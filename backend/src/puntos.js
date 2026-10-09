const pool = require("./config/database");

// Puntos del usuario: los ganados con tareas realizadas, los gastados en
// recompensas reclamadas y el saldo disponible para reclamar otras.
// Acepta un cliente para usarse dentro de una transacción.
async function puntosDelUsuario(usuarioId, cliente = pool) {
    const resultado = await cliente.query(
        `SELECT
            (SELECT COALESCE(SUM(puntos), 0)
             FROM tareas
             WHERE asignado_id = $1 AND completada = TRUE) AS ganados,
            (SELECT COALESCE(SUM(costo_puntos), 0)
             FROM recompensas
             WHERE reclamada_por = $1) AS gastados`,
        [usuarioId]
    );

    const ganados = Number(resultado.rows[0].ganados);
    const gastados = Number(resultado.rows[0].gastados);

    return { ganados, gastados, disponibles: ganados - gastados };
}

module.exports = { puntosDelUsuario };
