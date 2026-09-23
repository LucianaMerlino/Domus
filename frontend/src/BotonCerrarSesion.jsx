import { useNavigate } from "react-router-dom";

import { cerrarSesion } from "./sesion";

import "./BotonCerrarSesion.css";


function BotonCerrarSesion() {

    const navigate = useNavigate();

    function salir() {
        cerrarSesion();
        navigate("/login", { replace: true });
    }

    return (
        <button
            type="button"
            className="boton-cerrar-sesion"
            onClick={salir}
        >
            Cerrar Sesión
        </button>
    );
}


export default BotonCerrarSesion;
