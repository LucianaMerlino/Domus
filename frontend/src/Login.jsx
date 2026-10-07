import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login, registrarUsuario } from "./api";
import { guardarSesion } from "./sesion";

import "./Login.css";


function Login() {

    const navigate = useNavigate();

    const [usuario, setUsuario] = useState("");
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [registrando, setRegistrando] = useState(false);


    async function iniciarSesion(event) {

        event.preventDefault();

        if (!email.trim() || !contrasena) {
            setError("Completá email y contraseña");
            return;
        }

        try {

            setEnviando(true);
            setError("");

            const datosSesion = await login(email.trim(), contrasena);

            guardarSesion(datosSesion);
            navigate("/", { replace: true });

        } catch (error) {

            setError(error.message);

        } finally {

            setEnviando(false);

        }
    }

    async function registrar(event) {
        event.preventDefault();

        if (!usuario.trim() || !email.trim() || !contrasena) {
            setError("Completá usuario, email y contraseña");
            return;
        }

        if (!email.includes("@")) {
            setError("El email debe incluir un @");
            return;
        }

        try {
            setEnviando(true);
            setError("");

            // El registro devuelve la sesión: queda logueado y va al home
            const datosSesion = await registrarUsuario(usuario.trim(), email.trim(), contrasena);

            guardarSesion(datosSesion);
            navigate("/", { replace: true });
        } catch (error) {
            setError(error.message);
        } finally {
            setEnviando(false);
        }
    }

    function alternarModo() {
        setRegistrando(!registrando);
        setError("");
    }


    return (
        <div className="login-page">

            <form className="login-card" onSubmit={registrando ? registrar : iniciarSesion}>

                <h1>Domus</h1>

                {registrando && (
                    <>
                        <label htmlFor="usuario">Nombre de usuario</label>
                        <input
                            id="usuario"
                            type="text"
                            autoComplete="username"
                            value={usuario}
                            onChange={(event) => setUsuario(event.target.value)}
                            required
                        />
                    </>
                )}

                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <label htmlFor="contrasena">Contraseña</label>
                <input
                    id="contrasena"
                    type="password"
                    autoComplete={registrando ? "new-password" : "current-password"}
                    value={contrasena}
                    onChange={(event) => setContrasena(event.target.value)}
                    required
                />

                {error && (
                    <p className="login-error">{error}</p>
                )}

                <button type="submit" disabled={enviando}>
                    {enviando
                        ? (registrando ? "Registrando..." : "Ingresando...")
                        : (registrando ? "Registrarme" : "Ingresar")}
                </button>

                <button type="button" className="login-mode-button" onClick={alternarModo}>
                    {registrando ? "Volver a iniciar sesión" : "Crear una cuenta"}
                </button>

            </form>

        </div>
    );
}


export default Login;
