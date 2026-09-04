import { useEffect, useState } from "react";
import { obtenerAdmin } from "./api";

function Admin({ id }) {
    const [admin, setAdmin] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        obtenerAdmin(id)
            .then(setAdmin)
            .catch((error) => setError(error.message));
    }, [id]);

    if (error) {
        return <h1>{error}</h1>;
    }

    if (!admin) {
        return <h1>Cargando...</h1>;
    }

    return (
        <div>
            <h1>Domus</h1>

            <h2>{admin.nombre}</h2>

            <p>Rol: {admin.rol}</p>

            <p>Email: {admin.email}</p>
        </div>
    );
}

export default Admin;