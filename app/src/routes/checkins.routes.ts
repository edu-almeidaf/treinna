import { Router } from "express";
import { CheckinsController } from "../controllers/checkins.controller.js";

const router = Router();
router.get("/user/:id", CheckinsController.historicoUsuario);
router.patch("/:id/validar", CheckinsController.validarAcesso);

export default router;