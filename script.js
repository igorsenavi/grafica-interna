const STORAGE_KEYS = {
  materias: "grafica_v3_materias",
  papeis: "grafica_v3_papeis",
  produtos: "grafica_v3_produtos",
  configuracoes: "grafica_v3_configuracoes",
};

let materiasTemporariasProduto = [];

function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getConfiguracoes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.configuracoes)) || {
    custoTanque: 160,
    rendimentoFolhas: 1000,
  };
}

function setConfiguracoes(data) {
  localStorage.setItem(STORAGE_KEYS.configuracoes, JSON.stringify(data));
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function uid() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

function getCustoTintaPorFolha() {
  const configuracoes = getConfiguracoes();
  const custoTanque = Number(configuracoes.custoTanque || 0);
  const rendimentoFolhas = Number(configuracoes.rendimentoFolhas || 0);

  if (!rendimentoFolhas || rendimentoFolhas <= 0) return 0;
  return custoTanque / rendimentoFolhas;
}

function updateDashboard() {
  document.getElementById("totalMaterias").textContent = getData(STORAGE_KEYS.materias).length;
  document.getElementById("totalPapeis").textContent = getData(STORAGE_KEYS.papeis).length;
  document.getElementById("totalProdutos").textContent = getData(STORAGE_KEYS.produtos).length;

  const configuracoes = getConfiguracoes();
  const tintaPorFolha = getCustoTintaPorFolha();

  document.getElementById("dashCustoTanque").textContent = formatCurrency(configuracoes.custoTanque);
  document.getElementById("dashRendimento").textContent = `${Number(configuracoes.rendimentoFolhas || 0)} folhas`;
  document.getElementById("dashTintaFolha").textContent = formatCurrency(tintaPorFolha);
}

function preencherConfiguracoesTela() {
  const configuracoes = getConfiguracoes();
  const tintaPorFolha = getCustoTintaPorFolha();

  const inputCustoTanque = document.getElementById("configCustoTanque");
  const inputRendimentoFolhas = document.getElementById("configRendimentoFolhas");

  if (inputCustoTanque) inputCustoTanque.value = configuracoes.custoTanque;
  if (inputRendimentoFolhas) inputRendimentoFolhas.value = configuracoes.rendimentoFolhas;

  document.getElementById("cfgResCustoTanque").textContent = formatCurrency(configuracoes.custoTanque);
  document.getElementById("cfgResRendimento").textContent = `${Number(configuracoes.rendimentoFolhas || 0)} folhas`;
  document.getElementById("cfgResTintaFolha").textContent = formatCurrency(tintaPorFolha);
}

function renderMaterias() {
  const lista = document.getElementById("listaMaterias");
  const materias = getData(STORAGE_KEYS.materias);

  if (!materias.length) {
    lista.innerHTML = `<p class="empty">Nenhuma matéria-prima cadastrada.</p>`;
    atualizarSelectMaterias();
    return;
  }

  lista.innerHTML = `
    <div class="item-list">
      ${materias
        .map(
          (item) => `
          <div class="row">
            <div class="row-info">
              <strong>${item.nome}</strong>
              <span>Unidade: ${item.unidade}</span>
              <span>Custo por unidade: ${formatCurrency(item.custo)}</span>
              ${item.observacao ? `<span>Obs.: ${item.observacao}</span>` : ""}
            </div>
            <div class="row-actions">
              <button class="btn-danger" onclick="removerMateria('${item.id}')">Excluir</button>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;

  atualizarSelectMaterias();
}

function removerMateria(id) {
  if (!confirm("Deseja excluir esta matéria-prima?")) return;

  const materias = getData(STORAGE_KEYS.materias).filter((item) => item.id !== id);
  setData(STORAGE_KEYS.materias, materias);

  renderMaterias();
  renderProdutos();
  updateDashboard();
}

function renderPapeis() {
  const lista = document.getElementById("listaPapeis");
  const papeis = getData(STORAGE_KEYS.papeis);

  if (!papeis.length) {
    lista.innerHTML = `<p class="empty">Nenhum papel cadastrado.</p>`;
    atualizarSelects();
    return;
  }

  lista.innerHTML = `
    <div class="item-list">
      ${papeis
        .map(
          (papel) => `
          <div class="row">
            <div class="row-info">
              <strong>${papel.nome}</strong>
              <span>Gramatura: ${papel.gramatura || "-"}</span>
              <span>Tamanho da folha: ${papel.largura} x ${papel.altura} cm</span>
              <span>Valor por folha: ${formatCurrency(papel.valorFolha)}</span>
              ${papel.observacao ? `<span>Obs.: ${papel.observacao}</span>` : ""}
            </div>
            <div class="row-actions">
              <button class="btn-danger" onclick="removerPapel('${papel.id}')">Excluir</button>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;

  atualizarSelects();
}

function removerPapel(id) {
  if (!confirm("Deseja excluir este papel?")) return;

  const papeis = getData(STORAGE_KEYS.papeis).filter((item) => item.id !== id);
  setData(STORAGE_KEYS.papeis, papeis);

  renderPapeis();
  renderProdutos();
  updateDashboard();
}

function atualizarSelectMaterias() {
  const select = document.getElementById("produtoMateriaSelect");
  const materias = getData(STORAGE_KEYS.materias);

  if (!select) return;

  if (!materias.length) {
    select.innerHTML = `<option value="">Cadastre uma matéria-prima primeiro</option>`;
    return;
  }

  select.innerHTML = materias
    .map((item) => `<option value="${item.id}">${item.nome} - ${formatCurrency(item.custo)}</option>`)
    .join("");
}

function atualizarSelects() {
  atualizarSelectMaterias();

  const selectProdutoPapel = document.getElementById("produtoPapel");
  const selectSimulacaoProduto = document.getElementById("simulacaoProduto");
  const papeis = getData(STORAGE_KEYS.papeis);
  const produtos = getData(STORAGE_KEYS.produtos);

  if (selectProdutoPapel) {
    if (!papeis.length) {
      selectProdutoPapel.innerHTML = `<option value="">Cadastre um papel primeiro</option>`;
    } else {
      selectProdutoPapel.innerHTML = papeis
        .map((item) => `<option value="${item.id}">${item.nome} - ${formatCurrency(item.valorFolha)}</option>`)
        .join("");
    }
  }

  if (selectSimulacaoProduto) {
    if (!produtos.length) {
      selectSimulacaoProduto.innerHTML = `<option value="">Cadastre um produto primeiro</option>`;
    } else {
      selectSimulacaoProduto.innerHTML = produtos
        .map((item) => `<option value="${item.id}">${item.nome}</option>`)
        .join("");
    }
  }
}

function r3t24NpUrJMNunMMASmhAM953bFGeLXzN7() {
  const container = document.getElementById("materiasDoProduto");
  const materias = getData(STORAGE_KEYS.materias);

  if (!materiasTemporariasProduto.length) {
    container.innerHTML = `<p class="empty">Nenhum material extra adicionado ao produto.</p>`;
    return;
  }

  container.innerHTML = materiasTemporariasProduto
    .map((item, index) => {
      const materia = materias.find((m) => m.id === item.materiaId);
      const nome = materia ? materia.nome : "Matéria não encontrada";

      return `
        <div class="row">
          <div class="row-info">
            <strong>${nome}</strong>
            <span>Quantidade por unidade do produto: ${item.quantidade}</span>
          </div>
          <div class="row-actions">
            <button class="btn-danger" onclick="removerMateriaTemporaria(${index})">Remover</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function removerMateriaTemporaria(index) {
  materiasTemporariasProduto.splice(index, 1);
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
}

function renderProdutos() {
  const lista = document.getElementById("listaProdutos");
  const produtos = getData(STORAGE_KEYS.produtos);
  const papeis = getData(STORAGE_KEYS.papeis);
  const materias = getData(STORAGE_KEYS.materias);

  if (!produtos.length) {
    lista.innerHTML = `<p class="empty">Nenhum produto cadastrado.</p>`;
    atualizarSelects();
    return;
  }

  lista.innerHTML = `
    <div class="product-list">
      ${produtos
        .map((produto) => {
          const papel = papeis.find((p) => p.id === produto.papelId);

          const tagsMaterias = produto.materiaisExtras
            .map((item) => {
              const materia = materias.find((m) => m.id === item.materiaId);
              if (!materia) return "";
              return `<span class="tag">${materia.nome} (${item.quantidade})</span>`;
            })
            .join("");

          return `
            <div class="row">
              <div class="row-info">
                <strong>${produto.nome}</strong>
                <span>Tamanho: ${produto.largura} x ${produto.altura} cm</span>
                <span>Margem: ${produto.margem} cm</span>
                <span>Papel padrão: ${papel ? papel.nome : "Não encontrado"}</span>
                <span>Fixos: ${produto.custoFixo}% | Variáveis: ${produto.custoVariavel}% | Lucro: ${produto.lucro}%</span>
                <div>${tagsMaterias || '<span class="empty">Sem materiais extras.</span>'}</div>
              </div>
              <div class="row-actions">
                <button class="btn-danger" onclick="removerProduto('${produto.id}')">Excluir</button>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  atualizarSelects();
}

function removerProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;

  const produtos = getData(STORAGE_KEYS.produtos).filter((item) => item.id !== id);
  setData(STORAGE_KEYS.produtos, produtos);

  renderProdutos();
  updateDashboard();
  atualizarSelects();
}

function calcularCapacidadeFolha(produto, papel) {
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
    return {
      capacidadePorFolha: qtdRotacionada,
      orientacao: "Rotacionada",
    };
  }

  return {
    capacidadePorFolha: qtdNormal,
    orientacao: "Normal",
  };
}

function calcularCustoMateriaisExtrasUnitario(produto, materias) {
  let total = 0;

  produto.materiaisExtras.forEach((item) => {
    const materia = materias.find((m) => m.id === item.materiaId);
    if (materia) {
      total += Number(materia.custo) * Number(item.quantidade);
    }
  });

  return total;
}

function calcularSimulacao(produtoId, quantidade) {
  const produtos = getData(STORAGE_KEYS.produtos);
  const papeis = getData(STORAGE_KEYS.papeis);
  const materias = getData(STORAGE_KEYS.materias);

  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) return null;

  const papel = papeis.find((p) => p.id === produto.papelId);
  if (!papel) return null;

  const { capacidadePorFolha, orientacao } = calcularCapacidadeFolha(produto, papel);

  if (!capacidadePorFolha || capacidadePorFolha <= 0) {
    return {
      erro: "Esse item não cabe na folha configurada com as medidas atuais.",
    };
  }

  const custoTintaPorFolha = getCustoTintaPorFolha();
  const folhasNecessarias = Math.ceil(Number(quantidade) / capacidadePorFolha);
  const aproveitamentoReal = (Number(quantidade) / (folhasNecessarias * capacidadePorFolha)) * 100;
  const desperdicio = 100 - aproveitamentoReal;

  const custoTotalPapel = folhasNecessarias * Number(papel.valorFolha);
  const custoTotalTinta = folhasNecessarias * custoTintaPorFolha;
  const custoTotalImpressao = custoTotalPapel + custoTotalTinta;
  const custoUnitarioImpressao = custoTotalImpressao / Number(quantidade);

  const custoUnitarioExtras = calcularCustoMateriaisExtrasUnitario(produto, materias);
  const subtotalBaseUnitario = custoUnitarioImpressao + custoUnitarioExtras;

  const acrescimoFixo = subtotalBaseUnitario * (Number(produto.custoFixo) / 100);
  const acrescimoVariavel = subtotalBaseUnitario * (Number(produto.custoVariavel) / 100);
  const subtotalComCustos = subtotalBaseUnitario + acrescimoFixo + acrescimoVariavel;

  const lucroUnitario = subtotalComCustos * (Number(produto.lucro) / 100);
  const precoSugeridoUnitario = subtotalComCustos + lucroUnitario;

  const custoTotalPedido = subtotalComCustos * Number(quantidade);
  const precoSugeridoTotal = precoSugeridoUnitario * Number(quantidade);

  return {
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
    quantidade,
    custoTintaPorFolha,
  };
}

function preencherResultadoSimulacao(resultado) {
  if (resultado.erro) {
    alert(resultado.erro);
    return;
  }

  document.getElementById("resProduto").textContent = resultado.produto.nome;
  document.getElementById("resPapel").textContent = resultado.papel.nome;
  document.getElementById("resOrientacao").textContent = resultado.orientacao;
  document.getElementById("resCabemFolha").textContent = resultado.capacidadePorFolha;
  document.getElementById("resFolhas").textContent = resultado.folhasNecessarias;
  document.getElementById("resAproveitamento").textContent = percent(resultado.aproveitamentoReal);
  document.getElementById("resDesperdicio").textContent = percent(resultado.desperdicio);
  document.getElementById("resCustoTotalPapel").textContent = formatCurrency(resultado.custoTotalPapel);
  document.getElementById("resCustoTotalTinta").textContent = formatCurrency(resultado.custoTotalTinta);
  document.getElementById("resCustoTotalImpressao").textContent = formatCurrency(resultado.custoTotalImpressao);
  document.getElementById("resCustoUnitImpressao").textContent = formatCurrency(resultado.custoUnitarioImpressao);
  document.getElementById("resCustoUnitExtras").textContent = formatCurrency(resultado.custoUnitarioExtras);
  document.getElementById("resSubtotalUnit").textContent = formatCurrency(resultado.subtotalComCustos);
  document.getElementById("resPrecoUnit").textContent = formatCurrency(resultado.precoSugeridoUnitario);
  document.getElementById("resCustoTotalPedido").textContent = formatCurrency(resultado.custoTotalPedido);
  document.getElementById("resPrecoTotal").textContent = formatCurrency(resultado.precoSugeridoTotal);

  document.getElementById("resExplicacao").innerHTML = `
    Para o produto <strong>${resultado.produto.nome}</strong>, cabem
    <strong>${resultado.capacidadePorFolha}</strong> unidades por folha no modo
    <strong>${resultado.orientacao.toLowerCase()}</strong>.
    <br><br>
    Para produzir <strong>${resultado.quantidade}</strong> unidade(s), o sistema calcula
    <strong>${resultado.folhasNecessarias}</strong> folha(s), com aproveitamento real de
    <strong>${percent(resultado.aproveitamentoReal)}</strong>.
    <br><br>
    O custo total do papel é <strong>${formatCurrency(resultado.custoTotalPapel)}</strong>,
    o custo total da tinta é <strong>${formatCurrency(resultado.custoTotalTinta)}</strong>,
    e o custo total de impressão fica em <strong>${formatCurrency(resultado.custoTotalImpressao)}</strong>.
    <br><br>
    A tinta está sendo calculada em <strong>${formatCurrency(resultado.custoTintaPorFolha)}</strong> por folha,
    com base nas configurações da impressora.
  `;
}

document.getElementById("formConfiguracoes").addEventListener("submit", (e) => {
  e.preventDefault();

  const custoTanque = Number(document.getElementById("configCustoTanque").value);
  const rendimentoFolhas = Number(document.getElementById("configRendimentoFolhas").value);

  setConfiguracoes({
    custoTanque,
    rendimentoFolhas,
  });

  preencherConfiguracoesTela();
  updateDashboard();
  alert("Configurações salvas com sucesso.");
});

document.getElementById("formMateria").addEventListener("submit", (e) => {
  e.preventDefault();

  const materias = getData(STORAGE_KEYS.materias);

  const novaMateria = {
    id: uid(),
    nome: document.getElementById("materiaNome").value.trim(),
    unidade: document.getElementById("materiaUnidade").value,
    custo: Number(document.getElementById("materiaCusto").value),
    observacao: document.getElementById("materiaObs").value.trim(),
  };

  materias.push(novaMateria);
  setData(STORAGE_KEYS.materias, materias);

  e.target.reset();
  renderMaterias();
  updateDashboard();
});

document.getElementById("formPapel").addEventListener("submit", (e) => {
  e.preventDefault();

  const papeis = getData(STORAGE_KEYS.papeis);

  const novoPapel = {
    id: uid(),
    nome: document.getElementById("papelNome").value.trim(),
    gramatura: document.getElementById("papelGramatura").value.trim(),
    largura: Number(document.getElementById("papelLargura").value),
    altura: Number(document.getElementById("papelAltura").value),
    valorFolha: Number(document.getElementById("papelValor").value),
    observacao: document.getElementById("papelObs").value.trim(),
  };

  papeis.push(novoPapel);
  setData(STORAGE_KEYS.papeis, papeis);

  e.target.reset();
  document.getElementById("papelLargura").value = 21;
  document.getElementById("papelAltura").value = 29.7;

  renderPapeis();
  updateDashboard();
});

document.getElementById("btnAdicionarMateriaProduto").addEventListener("click", () => {
  const materiaId = document.getElementById("produtoMateriaSelect").value;
  const quantidade = Number(document.getElementById("produtoMateriaQtd").value);

  if (!materiaId || !quantidade || quantidade <= 0) {
    alert("Selecione uma matéria-prima e informe uma quantidade válida.");
    return;
  }

  materiasTemporariasProduto.push({ materiaId, quantidade });
  document.getElementById("produtoMateriaQtd").value = "";
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
});

document.getElementById("formProduto").addEventListener("submit", (e) => {
  e.preventDefault();

  const papelId = document.getElementById("produtoPapel").value;
  if (!papelId) {
    alert("Cadastre e selecione um papel para o produto.");
    return;
  }

  const produtos = getData(STORAGE_KEYS.produtos);

  const novoProduto = {
    id: uid(),
    nome: document.getElementById("produtoNome").value.trim(),
    largura: Number(document.getElementById("produtoLargura").value),
    altura: Number(document.getElementById("produtoAltura").value),
    margem: Number(document.getElementById("produtoMargem").value),
    papelId,
    custoFixo: Number(document.getElementById("produtoCustoFixo").value),
    custoVariavel: Number(document.getElementById("produtoCustoVariavel").value),
    lucro: Number(document.getElementById("produtoLucro").value),
    materiaisExtras: [...materiasTemporariasProduto],
  };

  produtos.push(novoProduto);
  setData(STORAGE_KEYS.produtos, produtos);

  e.target.reset();
  materiasTemporariasProduto = [];
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
  renderProdutos();
  updateDashboard();
});

document.getElementById("formSimulacao").addEventListener("submit", (e) => {
  e.preventDefault();

  const produtoId = document.getElementById("simulacaoProduto").value;
  const quantidade = Number(document.getElementById("simulacaoQuantidade").value);

  if (!produtoId || !quantidade || quantidade <= 0) {
    alert("Selecione um produto e informe uma quantidade válida.");
    return;
  }

  const resultado = calcularSimulacao(produtoId, quantidade);
  if (!resultado) {
    alert("Não foi possível calcular a simulação.");
    return;
  }

  preencherResultadoSimulacao(resultado);
});

document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

function init() {
  if (!localStorage.getItem(STORAGE_KEYS.configuracoes)) {
    setConfiguracoes({
      custoTanque: 160,
      rendimentoFolhas: 1000,
    });
  }

  preencherConfiguracoesTela();
  renderMaterias();
  renderPapeis();
  renderProdutos();
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
  updateDashboard();
  atualizarSelects();
}

init();
