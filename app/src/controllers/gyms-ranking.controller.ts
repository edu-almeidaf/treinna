import { Request, Response } from "express";
import { zsetIncr, zsetRevRangeWithScores } from "../database/redis.js";

const CHAVE_RANKING = "treinna:ranking:gyms";

export class GymsRankingController {
  static async registrarCheckin(req: Request, res: Response): Promise<void> {
    try {
      const { gym, quantidade = 1 } = req.body;

      if (!gym || typeof gym !== "string") {
        res.status(400).json({ erro: "Informe o nome da academia." });
        return;
      }

      const novoScore = await zsetIncr(CHAVE_RANKING, gym, Number(quantidade));

      res.json({
        estrutura: "SORTED SET (ZSET)",
        comando: "ZINCRBY",
        chave: CHAVE_RANKING,
        academia: gym,
        checkins_adicionados: Number(quantidade),
        total_acumulado: parseFloat(novoScore),
        mensagem: `Check-in registrado! A academia '${gym}' agora acumula ${novoScore} acessos.`,
      });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }

  static async listarTop(req: Request, res: Response): Promise<void> {
    try {
      const limite = Math.max(1, parseInt(req.query.limite as string) || 5);

      const ranking = await zsetRevRangeWithScores(CHAVE_RANKING, 0, limite - 1);

      res.json({
        estrutura: "SORTED SET (ZSET)",
        comando: `ZREVRANGE 0 ${limite - 1} WITHSCORES`,
        chave: CHAVE_RANKING,
        total_itens_retornados: ranking.length,
        ranking: ranking.map((item, idx) => ({
          posicao: idx + 1,
          academia: item.member,
          checkins: item.score,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }
}