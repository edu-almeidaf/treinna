import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../database/mongo.js";

export class CheckinsController {
  // 2. Histórico de Check-ins do Aluno - Leitura otimizada
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

  // 4. Validar Entrada na Catraca - Atualização atômica ($set)
  static async validarAcesso(req: Request, res: Response): Promise<void> {
    try {
      const col = getCollection("checkins");
      const resultado = await col.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "validado" } }
      );

      if (resultado.matchedCount === 0) {
        res.status(404).json({ erro: "Check-in não encontrado." });
        return;
      }

      res.json({ mensagem: "Acesso validado com sucesso!" });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }
}