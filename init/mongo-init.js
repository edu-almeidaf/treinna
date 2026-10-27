/**
 * ============================================================================
 * MONGODB INITIALIZATION SCRIPT — TREINNA
 * ============================================================================
 */

db = db.getSiblingDB("treinna");

// ========================================
// 1. Coleção: plans
// ========================================
db.createCollection("plans");
db.plans.insertMany([
  { nome: "Basic", preco: 49.90, beneficios: ["1 check-in por dia", "Musculação"] },
  { nome: "Silver", preco: 89.90, beneficios: ["1 check-in por dia", "Musculação", "Aulas Coletivas"] },
  { nome: "Gold", preco: 149.90, beneficios: ["Acesso total", "Crossfit", "Sem taxa de adesão"] }
]);

const plans = db.plans.find().toArray();
const idBasic = plans[0]._id;
const idSilver = plans[1]._id;
const idGold = plans[2]._id;

// ========================================
// 2. Coleção: gyms
// ========================================
db.createCollection("gyms");
db.gyms.createIndex({ "localizacao": "2dsphere" }); 
db.gyms.createIndex({ "ativo": 1 });

db.gyms.insertMany([
  {
    nome: "Uplay Guarapuava", ativo: true, mensalidade_base: 120.50, plano_minimo_id: idSilver,
    localizacao: { type: "Point", coordinates: [-51.4628, -25.3953] },
    modalidades: ["Musculação", "Crossfit", "Muay Thai"],
    ultimas_avaliacoes: [{ nota: 5, comentario: "Ótima estrutura." }]
  },
  {
    nome: "Ironberg Guarapuava", ativo: true, mensalidade_base: 150.00, plano_minimo_id: idGold,
    localizacao: { type: "Point", coordinates: [-51.4650, -25.3900] },
    modalidades: ["Musculação", "Fisiculturismo"],
    ultimas_avaliacoes: [{ nota: 5, comentario: "Equipamentos de ponta." }, { nota: 4, comentario: "Sempre cheia." }]
  },
  {
    nome: "Academia Flex", ativo: true, mensalidade_base: 70.00, plano_minimo_id: idBasic,
    localizacao: { type: "Point", coordinates: [-51.4700, -25.3850] },
    modalidades: ["Musculação", "Zumba"],
    ultimas_avaliacoes: []
  },
  {
    nome: "Crossfit Guarapuava", ativo: true, mensalidade_base: 130.00, plano_minimo_id: idGold,
    localizacao: { type: "Point", coordinates: [-51.4600, -25.4000] },
    modalidades: ["Crossfit", "LPO"],
    ultimas_avaliacoes: [{ nota: 5, comentario: "Box sensacional!" }]
  },
  {
    nome: "Studio Pilates Zen", ativo: false, mensalidade_base: 100.00, plano_minimo_id: idSilver,
    localizacao: { type: "Point", coordinates: [-51.4550, -25.3920] },
    modalidades: ["Pilates", "Yoga"],
    ultimas_avaliacoes: [{ nota: 4, comentario: "Muito relaxante, mas fecharam para reforma." }]
  }
]);

const gyms = db.gyms.find().toArray();
const idUplay = gyms[0]._id;
const idIronberg = gyms[1]._id;
const idFlex = gyms[2]._id;

// ========================================
// 3. Coleção: users
// ========================================
db.createCollection("users");
db.users.createIndex({ "email": 1 }, { unique: true });

db.users.insertMany([
  { nome: "Eduardo Fernandes", email: "eduardo@email.com", telefone: "42999990001", plano_id: idGold, data_cadastro: new Date("2026-01-10T10:00:00Z") },
  { nome: "Ana Clara Novak", email: "ana@email.com", telefone: "42999990002", plano_id: idSilver, data_cadastro: new Date("2026-02-15T14:30:00Z") },
  { nome: "Matheus Siqueira", email: "matheus@email.com", telefone: "42999990003", plano_id: idBasic, data_cadastro: new Date("2026-03-20T09:15:00Z") },
  { nome: "Lucas Silva", email: "lucas@email.com", telefone: "42999990004", plano_id: idGold, data_cadastro: new Date("2026-04-05T18:00:00Z") },
  { nome: "Mariana Costa", email: "mariana@email.com", telefone: "42999990005", plano_id: idBasic, data_cadastro: new Date("2026-05-12T11:45:00Z") }
]);

const users = db.users.find().toArray();
const idEduardo = users[0]._id;
const idAna = users[1]._id;
const idMatheus = users[2]._id;

// ========================================
// 4. Coleção: checkins
// ========================================
db.createCollection("checkins");
db.checkins.createIndex({ "user_id": 1 });

db.checkins.insertMany([
  { user_id: idEduardo, gym: { gym_id: idUplay, nome: "Uplay Guarapuava" }, data_hora: new Date("2026-09-10T18:30:00Z"), status: "validado" },
  { user_id: idEduardo, gym: { gym_id: idIronberg, nome: "Ironberg Guarapuava" }, data_hora: new Date("2026-09-12T19:00:00Z"), status: "validado" },
  { user_id: idAna, gym: { gym_id: idUplay, nome: "Uplay Guarapuava" }, data_hora: new Date("2026-09-14T07:30:00Z"), status: "validado" },
  { user_id: idMatheus, gym: { gym_id: idFlex, nome: "Academia Flex" }, data_hora: new Date("2026-09-15T18:00:00Z"), status: "pendente" },
  { user_id: idAna, gym: { gym_id: idFlex, nome: "Academia Flex" }, data_hora: new Date("2026-09-15T19:15:00Z"), status: "cancelado" }
]);

// ========================================
// 5. Coleção: reviews
// ========================================
db.createCollection("reviews");
db.reviews.insertMany([
  { user_id: idEduardo, gym_id: idIronberg, nota: 5, comentario: "Equipamentos de ponta.", data: new Date("2026-09-13T10:00:00Z") },
  { user_id: idAna, gym_id: idUplay, nota: 5, comentario: "Ótima estrutura.", data: new Date("2026-09-14T09:00:00Z") },
  { user_id: idMatheus, gym_id: idFlex, nota: 3, comentario: "Aparelhos um pouco antigos, mas quebra o galho.", data: new Date("2026-09-15T20:00:00Z") },
  { user_id: idEduardo, gym_id: idUplay, nota: 4, comentario: "Muito cheia às 18h.", data: new Date("2026-09-10T21:00:00Z") }
]);

print("=== TREINNA inicializado com sucesso! ===");
print("Planos: " + db.plans.countDocuments());
print("Academias: " + db.gyms.countDocuments());
print("Usuários: " + db.users.countDocuments());
print("Check-ins: " + db.checkins.countDocuments());
print("Reviews: " + db.reviews.countDocuments());
print("Total de documentos gerados: 22");