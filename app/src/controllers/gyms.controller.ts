import { Request, Response } from "express";
import { getCollection } from "../database/mongo.js";

export class GymsController {
  // 1. Academias Próximas (Radar) - Uso do $near
  static async listarProximas(req: Request, res: Response): Promise<void> {
    try {
      const { lng, lat, distanciaMetros = 5000 } = req.query;

      if (!lng || !lat) {
        res.status(400).json({ erro: "Coordenadas (lng, lat) são obrigatórias." });
        return;
      }

      const col = getCollection("gyms");
      const academias = await col.find({
        ativo: true,
        localizacao: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)]
            },
            $maxDistance: Number(distanciaMetros)
          }
        }
      }).toArray();

      res.json(academias);
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }

  // 3. Busca de Academias por Modalidade - Uso do $in
  static async buscarModalidade(req: Request, res: Response): Promise<void> {
    try {
      const { modalidade } = req.query;

      if (!modalidade) {
        res.status(400).json({ erro: "Parâmetro 'modalidade' é obrigatório." });
        return;
      }

      const col = getCollection("gyms");
      const academias = await col
        .find({ ativo: true, modalidades: { $in: [modalidade] } })
        .sort({ mensalidade_base: 1 })
        .toArray();

      res.json(academias);
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }
}