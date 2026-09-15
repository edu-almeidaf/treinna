import { Router } from "express";
import { GymsController } from "../controllers/gyms.controller.js";

const router = Router();
router.get("/near", GymsController.listarProximas);
router.get("/search", GymsController.buscarModalidade);

export default router;