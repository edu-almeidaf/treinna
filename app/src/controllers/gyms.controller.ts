import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../database/mongo.js";
import { getElasticClient } from "../database/elastic.js";
import { cacheDel, listPush, listPop, listRange } from "../database/redis.js";
import { montarDocumentoBusca } from "../scripts/seed-elastic.js";

const CHAVE_PENDENTES = "treinna:sync:pendentes";

export class GymsController {
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

  static async buscar(req: Request, res: Response): Promise<void> {
    try {
      const termo = String(req.query.q || "").trim();
      const cidade = String(req.query.cidade || "").trim();
      const precoMax = Number(req.query.preco_max) || null;

      if (!termo) {
        res.status(400).json({ erro: "Informe o texto da busca em ?q=" });
        return;
      }

      const filtros: any[] = [{ term: { ativo: true } }];
      if (cidade) filtros.push({ term: { cidade } });
      if (precoMax) filtros.push({ range: { mensalidade_base: { lte: precoMax } } });

      const elastic = getElasticClient();
      const resposta = await elastic.search({
        index: "academias",
        query: {
          bool: {
            must: {
              multi_match: {
                query: termo,
                fields: ["nome^3", "modalidades^1"],
                fuzziness: "AUTO"
              }
            },
            filter: filtros
          }
        }
      });

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

  static async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nome, ativo, mensalidade_base } = req.body;

      const alteracoes: any = {};
      if (nome !== undefined) alteracoes.nome = String(nome);
      if (ativo !== undefined) alteracoes.ativo = Boolean(ativo);
      if (mensalidade_base !== undefined) alteracoes.mensalidade_base = Number(mensalidade_base);

      const col = getCollection("gyms");
      const gymAtualizada = await col.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: alteracoes },
        { returnDocument: "after" }
      );

      if (!gymAtualizada) {
        res.status(404).json({ erro: "Academia não encontrada." });
        return;
      }

      await cacheDel(`treinna:gym:${id}`);

      try {
        if (req.query.simular_falha === "elastic") throw new Error("ElasticSearch fora do ar");

        const elastic = getElasticClient();
        await elastic.index({
          index: "academias",
          id: gymAtualizada._id.toString(),
          document: montarDocumentoBusca(gymAtualizada),
          refresh: "wait_for",
        });
      } catch (erro: any) {
        await listPush(CHAVE_PENDENTES, gymAtualizada._id.toString());
        res.status(202).json({
          mongodb: "gravado",
          redis: "invalidado",
          elasticsearch: `falhou (${erro.message}); pendência registrada`,
        });
        return;
      }

      res.json({ mongodb: "gravado", redis: "invalidado", elasticsearch: "atualizado (1 documento)" });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }

  static async listarPendentes(req: Request, res: Response): Promise<void> {
    try {
      const pendentes = await listRange(CHAVE_PENDENTES);
      res.json({ chave: CHAVE_PENDENTES, total: pendentes.length, pendentes });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }

  static async reprocessar(req: Request, res: Response): Promise<void> {
    try {
      const reprocessadas: string[] = [];
      let id: string | null;

      while ((id = await listPop(CHAVE_PENDENTES)) !== null) {
        const gym = await getCollection("gyms").findOne({ _id: new ObjectId(id) });
        if (!gym) continue;

        try {
          const elastic = getElasticClient();
          await elastic.index({
            index: "academias",
            id: gym._id.toString(),
            document: montarDocumentoBusca(gym),
            refresh: "wait_for",
          });
          reprocessadas.push(gym.nome);
        } catch {
          await listPush(CHAVE_PENDENTES, id, "left"); 
          break;
        }
      }

      res.json({ reprocessadas_total: reprocessadas.length, academias_recuperadas: reprocessadas });
    } catch (err: any) {
      res.status(500).json({ erro: err.message });
    }
  }
}