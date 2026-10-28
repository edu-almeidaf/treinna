import { Router, Request, Response } from "express";
import gymsRoutes from "./gyms.routes.js";
import checkinsRoutes from "./checkins.routes.js";
import plansRoutes from "./plans.routes.js";
import usersRoutes from "./users.routes.js";
import { getDb } from "../database/mongo.js";
import { getRedisClient } from "../database/redis.js";
import { getElasticClient } from "../database/elastic.js";

const routes = Router();

// Rota de Health Check de todos os bancos NoSQL
routes.get("/health", async (req: Request, res: Response) => {
  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status_geral: "OK",
    bancos: {},
  };

  // 1. Testar MongoDB
  try {
    const mongoDb = getDb();
    await mongoDb.command({ ping: 1 });
    status.bancos.mongodb = { status: "ONLINE", database: mongoDb.databaseName };
  } catch (err: any) {
    status.bancos.mongodb = { status: "OFFLINE", erro: err.message };
    status.status_geral = "PARCIAL";
  }

  // 2. Testar Redis
  try {
    const redis = getRedisClient();
    const pong = await redis.ping();
    status.bancos.redis = { status: "ONLINE", resposta: pong };
  } catch (err: any) {
    status.bancos.redis = { status: "OFFLINE", erro: err.message };
    status.status_geral = "PARCIAL";
  }

  // 3. Testar Elasticsearch
  try {
    const elastic = getElasticClient();
    const health = await elastic.cluster.health({});
    status.bancos.elasticsearch = { status: "ONLINE", cluster_status: health.status };
  } catch (err: any) {
    status.bancos.elasticsearch = { status: "OFFLINE", erro: err.message };
    status.status_geral = "PARCIAL";
  }

  const httpStatus = status.status_geral === "OK" ? 200 : 207;
  res.status(httpStatus).json(status);
});

// Rotas do Treinna
routes.use("/gyms", gymsRoutes);
routes.use("/checkins", checkinsRoutes);
routes.use("/users", usersRoutes);
routes.use("/plans", plansRoutes);

export default routes;
