import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../database/mongo.js";
import { zsetIncr } from "../database/redis.js";

const CHAVE_RANKING = "treinna:ranking:gyms";

export class CheckinsController {
  static async historicoUsuario(req: Request, res: Response): Promise<void> {
    try {
      const col = getCollection("checkins");
      const checkins = await col
        .find({ user_id: new ObjectId(req.params.id) })
        .sort({ data_hora: -1 })
        .toArray();

      res.json(checkins);
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }

  static async validarAcesso(req: Request, res: Response): Promise<void> {
    try {
      if (!ObjectId.isValid(req.params.id) || req.params.id.length !== 24) {
        res.status(400).json({ erro: "ID de check-in inválido." });
        return;
      }

      const col = getCollection("checkins");
      const checkin = await col.findOne({ _id: new ObjectId(req.params.id) });

      if (!checkin) {
        res.status(404).json({ erro: "Check-in não encontrado." });
        return;
      }

      if (checkin.status === "validado") {
        res.json({ mensagem: "Check-in já estava validado.", ranking: "inalterado" });
        return;
      }

      await col.updateOne({ _id: checkin._id }, { $set: { status: "validado" } });

      // O ranking é uma cópia derivada: falha no Redis não desfaz a validação.
      let ranking = "incrementado (+1)";
      try {
        await zsetIncr(CHAVE_RANKING, checkin.gym.nome, 1);
      } catch (erro: any) {
        ranking = `falhou (${erro.message})`;
      }

      res.json({ mensagem: "Acesso validado com sucesso!", mongodb: "gravado", ranking });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }
}
