import { Route, Routes } from "react-router";
import AdminPage from "./pages/AdminPage";
import Event from "./pages/Event";
import Home from './pages/Home'
import NotFound from "./pages/NotFound";

function App() {
	return (
		<Routes>
			{/* <Route path="/" element={<Home />} /> */}
			<Route path="/" element={<Home />} />
			<Route path="/event/:id" element={<Event />} />
			<Route path="/admin" element={<AdminPage />} />
			<Route path="*" element={<NotFound />} /> 
		</Routes>
	);
}

export default App;



<Route path="*" element={<NotFound />} />