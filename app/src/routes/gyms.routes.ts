import { Router } from "express";
import { GymsController } from "../controllers/gyms.controller.js";
import { GymsRankingController } from "../controllers/gyms-ranking.controller.js";

const router = Router();

router.get("/search", GymsController.buscar);
router.get("/near", GymsController.listarProximas);

router.post("/ranking/checkin", GymsRankingController.registrarCheckin);
router.get("/ranking/top", GymsRankingController.listarTop);

router.get("/sincronizacao/pendentes", GymsController.listarPendentes);
router.post("/sincronizacao/reprocessar", GymsController.reprocessar);

router.get("/:id", GymsController.obter);
router.patch("/:id", GymsController.atualizar);

export default router;