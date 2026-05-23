import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { homeRoutes } from "./modules/home/routers/home.router";
import { canvasRoutes } from "./modules/canvas/routers/canvas.router";

const mainRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      ...homeRoutes,
      ...canvasRoutes,
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default mainRouter;
