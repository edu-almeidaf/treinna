import fs from "fs";
import path from "path";
import { connectMongo, getCollection, closeMongo } from "../database/mongo.js";
import { connectElastic, getElasticClient, closeElastic } from "../database/elastic.js";

function getElasticInitConfig() {
  const possiblePaths = [
    path.resolve(process.cwd(), "init", "elastic-init.json"),
    path.resolve(process.cwd(), "..", "init", "elastic-init.json"),
    path.resolve("/app", "init", "elastic-init.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf-8");
      return JSON.parse(raw);
    }
  }

  throw new Error("Arquivo init/elastic-init.json não encontrado.");
}

/**
 * Monta o documento do índice "academias" a partir de um documento do MongoDB.
 * Achata as propriedades aninhadas para facilitar a busca no Elasticsearch.
 */
export function montarDocumentoBusca(gym: any) {
  return {
    gym_id: gym._id.toString(),
    nome: gym.nome,
    modalidades: Array.isArray(gym.modalidades) ? gym.modalidades.join(", ") : gym.modalidades,
    cidade: gym.localizacao?.cidade || "",
    ativo: gym.ativo === true,
    mensalidade_base: gym.mensalidade_base || 0,
  };
}

export async function seedElasticsearch(keepConnectionsOpen = false) {
  console.log("[Elasticsearch] Verificando/sincronizando índice 'academias' a partir de init/elastic-init.json...");

  await connectMongo();
  await connectElastic();

  const elastic = getElasticClient();
  const indexName = "academias";
  const initConfig = getElasticInitConfig();

  // 1. Recria o índice com base no arquivo declarativo
  const indexExists = await elastic.indices.exists({ index: indexName });
  if (indexExists) {
    console.log(`[Elasticsearch] Índice '${indexName}' já existe. Recriando...`);
    await elastic.indices.delete({ index: indexName });
  }

  await elastic.indices.create({
    index: indexName,
    settings: initConfig.settings,
    mappings: initConfig.mappings,
  });

  // 2. Busca todas as academias no MongoDB Treinna
  const colGyms = getCollection("gyms");
  const gyms = await colGyms.find().toArray();

  // 3. Indexa academia por academia
  let count = 0;
  for (const gym of gyms) {
    await elastic.index({
      index: indexName,
      id: gym._id.toString(),
      document: montarDocumentoBusca(gym),
    });
    count++;
  }

  await elastic.indices.refresh({ index: indexName });
  console.log(`[Elasticsearch] Sucesso! ${count} academias sincronizadas no índice '${indexName}'.`);

  if (!keepConnectionsOpen) {
    await closeMongo();
    await closeElastic();
  }

  return count;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].includes("seed-elastic")) {
  seedElasticsearch().catch((err) => {
    console.error("Erro ao popular Elasticsearch:", err);
    process.exit(1);
  });
}