import Home from "./pages/Home";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Create from "./pages/Create";
import Layout from "./pages/Layout";
import UnderConstruction from "./pages/UnderConstruction";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/tbd" element={<UnderConstruction />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
