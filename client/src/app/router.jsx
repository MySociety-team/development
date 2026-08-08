import { createBrowserRouter } from "react-router";

import App from "../App.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  }
]);

export default router;
