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
  const capacidadeManual = Number(produto?.capacidade_manual_folha || 0);
  if (capacidadeManual > 0) {
    return { capacidadePorFolha: capacidadeManual, orientacao: "Manual" };
  }

  const larguraFolha = Number(papel?.largura || 0);
  const alturaFolha = Number(papel?.altura || 0);
  const larguraItem = Number(produto?.largura || 0);
  const alturaItem = Number(produto?.altura || 0);
  const margem = Number(produto?.margem || 0);

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
    if (materia) total += Number(materia.custo || 0) * Number(item.quantidade || 0);
  }
  return total;
}

export function calcularCustoMinutoConfigurado(configuracoes = {}) {
  const salarioMensal = Number(configuracoes.salario_mensal || 0);
  const custoCnpjMensal = Number(configuracoes.custo_cnpj_mensal || 0);
  const diasTrabalhadosMes = Number(configuracoes.dias_trabalhados_mes || 24);
  const horasTrabalhadasDia = Number(configuracoes.horas_trabalhadas_dia || 8);

  const minutosDisponiveisMes = diasTrabalhadosMes * horasTrabalhadasDia * 60;
  if (!minutosDisponiveisMes || minutosDisponiveisMes <= 0) return 0;

  return (salarioMensal + custoCnpjMensal) / minutosDisponiveisMes;
}

export function calcularProdutoUnitario({ produto, papel, materias, configuracoes, quantidade }) {
  const qtd = Number(quantidade || 0);
  const { capacidadePorFolha, orientacao } = calcularCapacidadeFolha(produto, papel);

  if (!capacidadePorFolha || capacidadePorFolha <= 0) {
    throw new Error("Esse item não cabe na folha configurada.");
  }

  if (!qtd || qtd <= 0) {
    throw new Error("Informe uma quantidade válida.");
  }

  const custoTintaPorFolha =
    Number(configuracoes?.custo_tanque || 0) /
    Number(configuracoes?.rendimento_folhas || 1);

  const folhasNecessarias = Math.ceil(qtd / capacidadePorFolha);
  const aproveitamentoReal = (qtd / (folhasNecessarias * capacidadePorFolha)) * 100;
  const desperdicio = 100 - aproveitamentoReal;

  const custoTotalPapel = folhasNecessarias * Number(papel?.valor_folha || 0);
  const custoTotalTinta = folhasNecessarias * custoTintaPorFolha;
  const custoTotalImpressao = custoTotalPapel + custoTotalTinta;
  const custoUnitarioImpressao = custoTotalImpressao / qtd;

  const custoUnitarioExtras = calcularCustoMateriaisExtrasUnitario(produto, materias);
  const custoTotalExtras = custoUnitarioExtras * qtd;

  const tempoProducaoMinutos = Number(produto?.tempo_producao_minutos || 0);
  const tempoTotalMinutos = tempoProducaoMinutos * qtd;
  const custoMinutoOperacional = calcularCustoMinutoConfigurado(configuracoes);
  const custoTotalMaoObra = tempoTotalMinutos * custoMinutoOperacional;
  const custoUnitarioMaoObra = custoTotalMaoObra / qtd;

  const subtotalBaseTotal = custoTotalImpressao + custoTotalExtras + custoTotalMaoObra;
  const subtotalBaseUnitario = subtotalBaseTotal / qtd;

  const percentualFixo = Number(produto?.custo_fixo ?? configuracoes?.custo_fixo_padrao ?? 0);
  const percentualVariavel = Number(produto?.custo_variavel ?? configuracoes?.custo_variavel_padrao ?? 0);

  const acrescimoFixoTotal = subtotalBaseTotal * (percentualFixo / 100);
  const acrescimoVariavelTotal = subtotalBaseTotal * (percentualVariavel / 100);
  const subtotalComCustosTotal = subtotalBaseTotal + acrescimoFixoTotal + acrescimoVariavelTotal;
  const subtotalComCustos = subtotalComCustosTotal / qtd;

  const lucroUnitario = subtotalComCustos * (Number(produto?.lucro || 0) / 100);
  const precoSugeridoUnitario = subtotalComCustos + lucroUnitario;
  const precoSugeridoTotal = precoSugeridoUnitario * qtd;

  return {
    orientacao,
    capacidadePorFolha,
    folhasNecessarias,
    aproveitamentoReal,
    desperdicio,
    quantidade: qtd,
    custoTotalPapel,
    custoTotalTinta,
    custoTotalImpressao,
    custoUnitarioImpressao,
    custoUnitarioExtras,
    custoTotalExtras,
    tempoProducaoMinutos,
    tempoTotalMinutos,
    custoMinutoOperacional,
    custoTotalMaoObra,
    custoUnitarioMaoObra,
    subtotalBaseUnitario,
    subtotalBaseTotal,
    subtotalComCustos,
    subtotalComCustosTotal,
    precoSugeridoUnitario,
    precoSugeridoTotal,
    custoTotalPedido: subtotalComCustosTotal,
  };
}
