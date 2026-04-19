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
  const capacidadeManual = Number(produto.capacidade_por_folha || 0);
  if (capacidadeManual > 0) {
    return { capacidadePorFolha: capacidadeManual, orientacao: "Manual" };
  }

  const larguraFolha = Number(papel.largura);
  const alturaFolha = Number(papel.altura);
  const larguraItem = Number(produto.largura);
  const alturaItem = Number(produto.altura);
  const margem = Number(produto.margem);

  const larguraComMargem = larguraItem + margem;
  const alturaComMargem = alturaItem + margem;

  const qtdNormal =
    Math.floor(larguraFolha / larguraComMargem) *
    Math.floor(alturaFolha / alturaComMargem);

  const qtdRot =
    Math.floor(larguraFolha / alturaComMargem) *
    Math.floor(alturaFolha / larguraComMargem);

  return qtdRot > qtdNormal
    ? { capacidadePorFolha: qtdRot, orientacao: "Rotacionada" }
    : { capacidadePorFolha: qtdNormal, orientacao: "Normal" };
}

export function calcularCustoMateriaisExtrasUnitario(produto, materias) {
  let total = 0;
  for (const item of produto.materiaisExtras || []) {
    const materia = materias.find((m) => m.id === item.materia_id);
    if (materia) total += Number(materia.custo) * Number(item.quantidade);
  }
  return total;
}

export function calcularProdutoUnitario({ produto, papel, materias, configuracoes, quantidade }) {
  const quantidadeNumerica = Number(quantidade || 0);
  const { capacidadePorFolha, orientacao } = calcularCapacidadeFolha(produto, papel);
  if (!capacidadePorFolha || capacidadePorFolha <= 0) {
    throw new Error("Esse item não cabe na folha configurada.");
  }

  if (!quantidadeNumerica || quantidadeNumerica <= 0) {
    throw new Error("Informe uma quantidade válida.");
  }

  const custoTintaPorFolha =
    Number(configuracoes.custo_tanque || 0) /
    Number(configuracoes.rendimento_folhas || 1);

  const folhasNecessarias = Math.ceil(quantidadeNumerica / capacidadePorFolha);
  const aproveitamentoReal = (quantidadeNumerica / (folhasNecessarias * capacidadePorFolha)) * 100;
  const desperdicio = 100 - aproveitamentoReal;

  const custoTotalPapel = folhasNecessarias * Number(papel.valor_folha);
  const custoTotalTinta = folhasNecessarias * custoTintaPorFolha;
  const custoTotalImpressao = custoTotalPapel + custoTotalTinta;
  const custoUnitarioImpressao = custoTotalImpressao / quantidadeNumerica;

  const custoUnitarioExtras = calcularCustoMateriaisExtrasUnitario(produto, materias);
  const custoTotalExtras = custoUnitarioExtras * quantidadeNumerica;

  const subtotalBaseUnitario = custoUnitarioImpressao + custoUnitarioExtras;
  const subtotalBaseTotal = custoTotalImpressao + custoTotalExtras;

  const percentualFixo = Number(configuracoes.custo_fixo_padrao) / 100;
  const percentualVariavel = Number(configuracoes.custo_variavel_padrao) / 100;
  const percentualLucro = Number(produto.lucro) / 100;

  const acrescimoFixoTotal = subtotalBaseTotal * percentualFixo;
  const acrescimoVariavelTotal = subtotalBaseTotal * percentualVariavel;
  const subtotalComCustosTotal = subtotalBaseTotal + acrescimoFixoTotal + acrescimoVariavelTotal;
  const lucroTotal = subtotalComCustosTotal * percentualLucro;
  const precoSugeridoTotal = subtotalComCustosTotal + lucroTotal;

  const subtotalComCustos = subtotalComCustosTotal / quantidadeNumerica;
  const precoSugeridoUnitario = precoSugeridoTotal / quantidadeNumerica;
  const acrescimoFixoUnitario = acrescimoFixoTotal / quantidadeNumerica;
  const acrescimoVariavelUnitario = acrescimoVariavelTotal / quantidadeNumerica;
  const lucroUnitario = lucroTotal / quantidadeNumerica;

  return {
    quantidade: quantidadeNumerica,
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
    custoTotalExtras,
    subtotalBaseUnitario,
    subtotalBaseTotal,
    acrescimoFixoUnitario,
    acrescimoFixoTotal,
    acrescimoVariavelUnitario,
    acrescimoVariavelTotal,
    subtotalComCustos,
    subtotalComCustosTotal,
    lucroUnitario,
    lucroTotal,
    precoSugeridoUnitario,
    precoSugeridoTotal,
  };
}
