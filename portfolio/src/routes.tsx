import { createBrowserRouter } from "react-router";
import { BlogPage, EssayPage, HomePage } from "./pages";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/blog",
    Component: BlogPage,
  },
  {
    path: "/blog/:slug",
    Component: EssayPage,
  },
]);
