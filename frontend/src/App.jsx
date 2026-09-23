import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Admin from "./Admin";
import Perfil from "./Perfil";
import Login from "./Login";
import { obtenerSesion } from "./sesion";


// Home: sin sesión va al login; con sesión muestra
// el panel del admin o el perfil del integrante
function Home() {
    const sesion = obtenerSesion();

    if (!sesion) {
        return <Navigate to="/login" replace />;
    }

    return sesion.rol === "admin"
        ? <Admin id={sesion.id} />
        : <Perfil id={sesion.id} />;
}

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;
