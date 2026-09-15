import { Router } from "express";
import gymsRoutes from "./gyms.routes.js";
import checkinsRoutes from "./checkins.routes.js";
import usersRoutes from "./users.routes.js";

const routes = Router();

// Rotas do Treinna
routes.use("/gyms", gymsRoutes);
routes.use("/checkins", checkinsRoutes);
routes.use("/users", usersRoutes);

export default routes;