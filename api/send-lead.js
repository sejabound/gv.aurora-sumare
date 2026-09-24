// ============================================================
// PROXY SERVER-SIDE PARA O CRM FLIP
// ============================================================
// Por que esse arquivo existe:
// O navegador do visitante NÃO consegue enviar o lead direto pro Flip
// se o domínio da landing page não estiver liberado (whitelist) no lado
// deles — o preflight de CORS (requisição OPTIONS automática do navegador
// para requests com Content-Type: application/json) é bloqueado antes
// mesmo do POST real sair.
//
// A solução: o formulário envia os dados para ESTE endpoint, que roda no
// servidor da Vercel (não no navegador do visitante). Como é uma chamada
// servidor-para-servidor, CORS não se aplica — o Flip recebe o lead
// normalmente, esteja o domínio "registrado" ou não do lado deles.
//
// Como usar:
// 1. Coloque este arquivo em /api/send-lead.js na raiz do seu projeto
//    (mesmo nível da pasta onde está o index.html).
// 2. Faça o deploy normalmente (git push ou upload) — a Vercel detecta
//    a pasta /api automaticamente e cria o endpoint sozinha, sem
//    configuração extra.
// 3. O endpoint fica disponível em: https://SEU-DOMINIO.vercel.app/api/send-lead
// ============================================================

const FLIP_CRM_WEBHOOK_URL =
  "https://integracaolp.imobiliaria.eurekalabs.com.br/interests?clientId=17a73be8-0fc2-4f8f-bbd9-64bd549ce954";

export default async function handler(req, res) {
  // Só aceitamos POST — qualquer outro método é rejeitado.
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido. Use POST." });
    return;
  }

  try {
    const flipResponse = await fetch(FLIP_CRM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const responseText = await flipResponse.text();

    // Repassa exatamente o status e o corpo que o Flip devolveu, para
    // facilitar o diagnóstico caso algo ainda dê errado (ex: payload
    // com campo faltando, clientId inválido, etc.)
    res
      .status(flipResponse.status)
      .setHeader("Content-Type", "application/json")
      .send(responseText || JSON.stringify({ ok: flipResponse.ok }));
  } catch (err) {
    console.error("Erro ao repassar lead para o Flip CRM:", err);
    res.status(502).json({
      error: "Falha ao se comunicar com o Flip CRM.",
      details: String(err),
    });
  }
}
