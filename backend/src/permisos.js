const pool = require("./config/database");

// Indica si el usuario es administrador del hogar indicado
async function esAdminDelHogar(hogarId, usuarioId) {
    const id = Number(usuarioId);

    if (!Number.isInteger(id) || id <= 0) {
        return false;
    }

    const resultado = await pool.query(
        `SELECT 1
         FROM miembros_hogar
         WHERE hogar_id = $1
           AND usuario_id = $2
           AND rol = 'admin'`,
        [hogarId, id]
    );

    return resultado.rows.length > 0;
}

module.exports = { esAdminDelHogar };
