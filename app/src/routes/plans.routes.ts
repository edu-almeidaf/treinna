import { Router } from "express";
import { PlansController } from "../controllers/plans.controller.js";

const router = Router();

router.get("/", PlansController.listar);
router.patch("/:id/preco", PlansController.atualizarPreco);

export default router;