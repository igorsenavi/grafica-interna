export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export function calcularCapacidadeFolha(produto, papel) {
  const larguraFolha = Number(papel.largura);
  const alturaFolha = Number(papel.altura);
  const larguraItem = Number(produto.largura);
  const alturaItem = Number(produto.altura);
  const margem = Number(produto.margem);

  const larguraComMargem = larguraItem + margem;
  const alturaComMargem = alturaItem + margem;

  const normalColunas = Math.floor(larguraFolha / larguraComMargem);
  const normalLinhas = Math.floor(alturaFolha / alturaComMargem);
  const qtdNormal = normalColunas * normalLinhas;

  const rotColunas = Math.floor(larguraFolha / alturaComMargem);
  const rotLinhas = Math.floor(alturaFolha / larguraComMargem);
  const qtdRotacionada = rotColunas * rotLinhas;

  if (qtdRotacionada > qtdNormal) {
    return { capacidadePorFolha: qtdRotacionada, orientacao: "Rotacionada" };
  }

  return { capacidadePorFolha: qtdNormal, orientacao: "Normal" };
}

export function calcularCustoMateriaisExtrasUnitario(produto, materias) {
  let total = 0;

  for (const item of produto.materiaisExtras || []) {
    const materia = materias.find((m) => m.id === item.materia_id);
    if (materia) {
      total += Number(materia.custo) * Number(item.quantidade);
    }
  }

  return total;
}

export function calcularSimulacao({ produto, papel, materias, configuracoes, quantidade }) {
  const { capacidadePorFolha, orientacao } = calcularCapacidadeFolha(produto, papel);

  if (!capacidadePorFolha || capacidadePorFolha <= 0) {
    throw new Error("Esse item não cabe na folha configurada com as medidas atuais.");
  }

  const custoTintaPorFolha =
    Number(configuracoes.custo_tanque || 0) / Number(configuracoes.rendimento_folhas || 1);

  const folhasNecessarias = Math.ceil(Number(quantidade) / capacidadePorFolha);
  const aproveitamentoReal = (Number(quantidade) / (folhasNecessarias * capacidadePorFolha)) * 100;
  const desperdicio = 100 - aproveitamentoReal;

  const custoTotalPapel = folhasNecessarias * Number(papel.valor_folha);
  const custoTotalTinta = folhasNecessarias * custoTintaPorFolha;
  const custoTotalImpressao = custoTotalPapel + custoTotalTinta;
  const custoUnitarioImpressao = custoTotalImpressao / Number(quantidade);

  const custoUnitarioExtras = calcularCustoMateriaisExtrasUnitario(produto, materias);
  const subtotalBaseUnitario = custoUnitarioImpressao + custoUnitarioExtras;

  const acrescimoFixo = subtotalBaseUnitario * (Number(produto.custo_fixo) / 100);
  const acrescimoVariavel = subtotalBaseUnitario * (Number(produto.custo_variavel) / 100);
  const subtotalComCustos = subtotalBaseUnitario + acrescimoFixo + acrescimoVariavel;

  const lucroUnitario = subtotalComCustos * (Number(produto.lucro) / 100);
  const precoSugeridoUnitario = subtotalComCustos + lucroUnitario;

  const custoTotalPedido = subtotalComCustos * Number(quantidade);
  const precoSugeridoTotal = precoSugeridoUnitario * Number(quantidade);

  return {
    criado_em: new Date().toISOString(),
    quantidade: Number(quantidade),
    produto,
    papel,
    orientacao,
    capacidadePorFolha,
    folhasNecessarias,
    aproveitamentoReal,
    desperdicio,
    custoTotalPapel,
    custoTotalTinta,
    custoTotalImpressao,
    custoUnitarioImpressao,
    custoUnitarioExtras,
    subtotalComCustos,
    precoSugeridoUnitario,
    custoTotalPedido,
    precoSugeridoTotal,
    custoTintaPorFolha,
  };
}
