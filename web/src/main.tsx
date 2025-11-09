import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./pages/App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import View from "./pages/View";
import Graph from "./pages/Graph";
import Reading from "./pages/Reading";
import Editing from "./pages/Editing";
import Admin from "./pages/Admin";
import { setToken } from "./lib/api";

const storedToken = localStorage.getItem("token");
if (storedToken) {
  setToken(storedToken);
}

const router = createBrowserRouter([
  { path: "/", element: <App />, children: [
    { index: true, element: <Home/> },
    { path: "login", element: <Login/> },
    { path: "register", element: <Register/> },
    { path: "reading", element: <Reading/> },
    { path: "editing", element: <Editing/> },
    { path: "editor/:id", element: <Editor/> },
    { path: "view/:id", element: <View/> },
    { path: "graph", element: <Graph/> },
    { path: "admin", element: <Admin/> },
  ]},
]);

ReactDOM.createRoot(document.getElementById("root")!).render(<RouterProvider router={router}/>);
