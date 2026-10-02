import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login, registrarUsuario } from "./api";
import { guardarSesion } from "./sesion";

import "./Login.css";


function Login() {

    const navigate = useNavigate();

    const [usuario, setUsuario] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [registrando, setRegistrando] = useState(false);
    const [mensaje, setMensaje] = useState("");


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

    async function registrar(event) {
        event.preventDefault();

        if (!usuario.trim() || !contrasena) {
            setError("Completá usuario y contraseña");
            return;
        }

        try {
            setEnviando(true);
            setError("");
            setMensaje("");

            const resultado = await registrarUsuario(usuario.trim(), contrasena);
            setMensaje(resultado.mensaje);
        } catch (error) {
            setError(error.message);
        } finally {
            setEnviando(false);
        }
    }

    function alternarModo() {
        setRegistrando(!registrando);
        setError("");
        setMensaje("");
    }


    return (
        <div className="login-page">

            <form className="login-card" onSubmit={registrando ? registrar : iniciarSesion}>

                <h1>Domus</h1>

                <label htmlFor="usuario">{registrando ? "Nombre de usuario" : "Usuario"}</label>
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

                {mensaje && (
                    <p className="login-success" role="status">{mensaje}</p>
                )}

                <button type="submit" disabled={enviando}>
                    {enviando
                        ? (registrando ? "Registrando..." : "Ingresando...")
                        : (registrando ? "Registrar" : "Ingresar")}
                </button>

                <button type="button" className="login-mode-button" onClick={alternarModo}>
                    {registrando ? "Volver a iniciar sesión" : "Crear una cuenta"}
                </button>

            </form>

        </div>
    );
}


export default Login;
