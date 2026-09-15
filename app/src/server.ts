import express, { Request, Response } from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { connectMongo, closeMongo } from "./database/mongo.js";

const app = express();
const PORT = process.env.PORT || 3400;

app.use(cors());
app.use(express.json());

// Mapa da API
app.get("/", (req: Request, res: Response) => {
  res.json({
    titulo: "Treinna API",
    endpoints: {
      academias_proximas: "GET /api/gyms/near?lng=-51.46&lat=-25.39",
      busca_modalidade: "GET /api/gyms/search?modalidade=Crossfit"
    }
  });
});

app.use("/api", routes);

async function bootstrap() {
  await connectMongo();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Treinna API rodando em http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await closeMongo();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap();