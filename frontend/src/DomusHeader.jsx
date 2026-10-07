import { Link } from "react-router-dom";
import BotonCerrarSesion from "./BotonCerrarSesion";

function DomusHeader({ active }) {
  return (
    <header className="domus-navbar">
      <Link className="domus-brand" to="/" aria-label="Domus, inicio">
        <img src="/wireframes/domus/domus-icon-original.png" alt="" />
        <span>Domus</span>
      </Link>

      <nav className="domus-nav" aria-label="Navegación principal">
        <Link className={active === "home" ? "active" : ""} to="/">Inicio</Link>
        <Link className={active === "ranking" ? "active" : ""} to="/ranking">Ranking</Link>
        <Link className={`domus-profile-link ${active === "profile" ? "active" : ""}`} to="/perfil">
          <span className="domus-user-avatar" aria-hidden="true" />
          <span>Mi perfil</span>
        </Link>
        <BotonCerrarSesion />
      </nav>
    </header>
  );
}

export default DomusHeader;
