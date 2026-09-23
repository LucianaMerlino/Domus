import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "./api";
import { guardarSesion } from "./sesion";

import "./Login.css";


function Login() {

    const navigate = useNavigate();

    const [usuario, setUsuario] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);


    async function iniciarSesion(event) {

        event.preventDefault();

        if (!usuario.trim() || !contrasena) {
            setError("Completá usuario y contraseña");
            return;
        }

        try {

            setEnviando(true);
            setError("");

            const datosSesion = await login(usuario.trim(), contrasena);

            guardarSesion(datosSesion);
            navigate("/", { replace: true });

        } catch (error) {

            setError(error.message);

        } finally {

            setEnviando(false);

        }
    }


    return (
        <div className="login-page">

            <form className="login-card" onSubmit={iniciarSesion}>

                <h1>Domus</h1>

                <label htmlFor="usuario">Usuario</label>
                <input
                    id="usuario"
                    type="text"
                    autoComplete="username"
                    value={usuario}
                    onChange={(event) => setUsuario(event.target.value)}
                    required
                />

                <label htmlFor="contrasena">Contraseña</label>
                <input
                    id="contrasena"
                    type="password"
                    autoComplete="current-password"
                    value={contrasena}
                    onChange={(event) => setContrasena(event.target.value)}
                    required
                />

                {error && (
                    <p className="login-error">{error}</p>
                )}

                <button type="submit" disabled={enviando}>
                    {enviando ? "Ingresando..." : "Ingresar"}
                </button>

            </form>

        </div>
    );
}


export default Login;
