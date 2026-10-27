import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../database/mongo.js";

export class UsersController {
  // 5. Upgrade de Plano do Aluno - Atualização de referência
  static async atualizarPlano(req: Request, res: Response): Promise<void> {
    try {
      const { novoPlanoId } = req.body;

      if (!novoPlanoId) {
        res.status(400).json({ erro: "Campo 'novoPlanoId' é obrigatório." });
        return;
      }

      const col = getCollection("users");
      const resultado = await col.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { plano_id: new ObjectId(novoPlanoId) } }
      );

      if (resultado.matchedCount === 0) {
        res.status(404).json({ erro: "Usuário não encontrado." });
        return;
      }

      res.json({ mensagem: "Upgrade de plano realizado com sucesso!" });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }
}