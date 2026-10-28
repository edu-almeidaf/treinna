import { Request, Response } from "express";
import { getCollection } from "../database/mongo.js";
import { getElasticClient } from "../database/elastic.js";

export class GymsController {
  // 1. Academias Próximas (Radar) - Mantido no MongoDB nativo ($near)
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

  // 2. Busca Textual Complexa - Movida para o ElasticSearch (Checkpoint 2)
  static async buscar(req: Request, res: Response): Promise<void> {
    try {
      const termo = String(req.query.q || "").trim();
      const cidade = String(req.query.cidade || "").trim();
      const precoMax = Number(req.query.preco_max) || null;

      if (!termo) {
        res.status(400).json({ erro: "Informe o texto da busca em ?q=" });
        return;
      }

      // Filtros exatos (eliminam opções sem alterar a relevância)
      const filtros: any[] = [{ term: { ativo: true } }];
      if (cidade) filtros.push({ term: { cidade } });
      if (precoMax) filtros.push({ range: { mensalidade_base: { lte: precoMax } } });

      const elastic = getElasticClient();
      const resposta = await elastic.search({
        index: "academias",
        query: {
          bool: {
            // Must: Avalia a relevância (Score)
            must: {
              multi_match: {
                query: termo,
                fields: ["nome^3", "modalidades^1"], // Nome vale 3x mais
                fuzziness: "AUTO" // Tolera erros de digitação
              }
            },
            filter: filtros
          }
        }
      });

      // Mapeando a resposta para exibir a pontuação
      const resultados = resposta.hits.hits.map((hit: any) => ({
        nome: hit._source.nome,
        modalidades: hit._source.modalidades,
        cidade: hit._source.cidade,
        mensalidade_base: hit._source.mensalidade_base,
        relevancia: hit._score === null ? null : Number(hit._score.toFixed(2)),
      }));

      res.json({
        origem: "ELASTICSEARCH (multi_match com filtros e fuzziness)",
        termo,
        total: resultados.length,
        resultados,
      });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }
}