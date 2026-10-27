import { Router } from "express";
import { UsersController } from "../controllers/users.controller.js";

const router = Router();
router.patch("/:id/plano", UsersController.atualizarPlano);

export default router;