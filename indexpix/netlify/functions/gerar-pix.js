exports.handler = async function(event) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ erro: "Método não permitido" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const valor = Number(body.valor);

    if (!valor || valor < 1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ erro: "Valor mínimo R$ 1,00" })
      };
    }

    if (!process.env.JUMPFY_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ erro: "Chave JUMPFY_API_KEY não encontrada no Netlify" })
      };
    }

    const resposta = await fetch("https://jumpfy.io/api/pix/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.JUMPFY_API_KEY
      },
      body: JSON.stringify({
        amount: valor,
        description: "Pagamento Nexus Tech",
        external_id: "nexus-" + Date.now(),
        expiration: 1800
      })
    });

    const texto = await resposta.text();

    let dados;
    try {
      dados = JSON.parse(texto);
    } catch (e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          erro: "Jumpfy não retornou JSON",
          resposta: texto
        })
      };
    }

    if (!resposta.ok) {
      return {
        statusCode: resposta.status,
        headers,
        body: JSON.stringify({
          erro: dados.message || dados.erro || "Erro na Jumpfy",
          detalhes: dados
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(dados.transaction || dados)
    };

  } catch (erro) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        erro: erro.message || "Erro interno"
      })
    };
  }
};
