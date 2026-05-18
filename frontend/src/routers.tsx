import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { additionRoutes } from "./modules/addition/routers/addition.router";
import { multiplicationRoutes } from "./modules/multiplication/routers/multiplication.router";

const mainRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [...additionRoutes, ...multiplicationRoutes],
  },
]);

export default mainRouter;
