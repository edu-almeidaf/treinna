import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../database/mongo.js";
import { cacheGet, cacheSet, cacheDel } from "../database/redis.js";

const CHAVE_CACHE = "treinna:plans:todos";
const TTL_SEGUNDOS = 300;

export class PlansController {
  static async listar(req: Request, res: Response): Promise<void> {
    const t0 = performance.now();
    try {
      const cached = await cacheGet<any[]>(CHAVE_CACHE);

      if (cached) {
        const tempoMs = (performance.now() - t0).toFixed(2);
        res.json({
          origem: "REDIS (CACHE HIT)",
          tempo_resposta: `${tempoMs} ms`,
          total: cached.length,
          planos: cached,
        });
        return;
      }

      const col = getCollection("plans");
      const planos = await col.find().sort({ preco: 1 }).toArray();

      await cacheSet(CHAVE_CACHE, planos, TTL_SEGUNDOS);

      const tempoMs = (performance.now() - t0).toFixed(2);
      res.json({
        origem: "MONGODB (CACHE MISS)",
        tempo_resposta: `${tempoMs} ms`,
        total: planos.length,
        planos,
      });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }

  static async atualizarPreco(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { preco } = req.body;

      if (!preco) {
        res.status(400).json({ erro: "Campo 'preco' é obrigatório." });
        return;
      }

      const col = getCollection("plans");
      const resultado = await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { preco: Number(preco) } }
      );

      if (resultado.matchedCount === 0) {
        res.status(404).json({ erro: "Plano não encontrado." });
        return;
      }

      await cacheDel(CHAVE_CACHE);

      res.json({
        mensagem: "Preço atualizado com sucesso no MongoDB!",
        cache_invalidado: true,
      });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }
}