import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Admin from "./Admin";
import Perfil from "./Perfil";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/admin/1"
                    element={<Admin id={1} />}
                />

                <Route
                    path="/admin/2"
                    element={<Admin id={2} />}
                />


                <Route
                    path="/perfil/1"
                    element={<Perfil id={1} />}
                />

                <Route
                    path="/perfil/2"
                    element={<Perfil id={2} />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;