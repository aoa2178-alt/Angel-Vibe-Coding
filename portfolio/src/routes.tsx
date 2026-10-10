import { createBrowserRouter } from "react-router";
import { BlogPage, HomePage } from "./pages";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/blog",
    Component: BlogPage,
  },
]);
