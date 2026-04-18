import { getSession, getUser, signIn, signOut, onAuthStateChange } from "./auth.js";
import {
  fetchConfiguracoes,
  saveConfiguracoes,
  listMaterias,
  upsertMateria,
  listPapeis,
  upsertPapel,
  listProdutos,
  upsertProduto
} from "./db.js";
import { formatCurrency, calcularProdutoUnitario } from "./calculations.js";

const state = {
  configuracoes: null,
  materias: [],
  papeis: [],
  produtos: [],
  kits: [],
  materiaisTemporarios: [],
  kitProdutosTemporarios: [],
  itensOrcamento: [],
};

function showAuthScreen() {
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("appScreen").classList.add("hidden");
}

function showAppScreen(email) {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");
  document.getElementById("currentUserEmail").textContent = email || "";
}

function bindTabs() {
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });
}

async function loadData() {
  state.configuracoes = await fetchConfiguracoes();
  state.materias = await listMaterias();
  state.papeis = await listPapeis();
  state.produtos = await listProdutos();
  renderAll();
}

function renderAll() {
  document.getElementById("totalProdutos").textContent = state.produtos.length;
  document.getElementById("totalKits").textContent = state.kits.length;
  document.getElementById("totalOrcamentos").textContent = state.itensOrcamento.length ? 1 : 0;

  const tintaPorFolha =
    Number(state.configuracoes?.custo_tanque || 0) /
    Number(state.configuracoes?.rendimento_folhas || 1);

  document.getElementById("dashTintaFolha").textContent = formatCurrency(tintaPorFolha);

  document.getElementById("configCustoTanque").value = state.configuracoes?.custo_tanque ?? 160;
  document.getElementById("configRendimentoFolhas").value = state.configuracoes?.rendimento_folhas ?? 1000;
  document.getElementById("configCustoFixoPadrao").value = state.configuracoes?.custo_fixo_padrao ?? 3;
  document.getElementById("configCustoVariavelPadrao").value = state.configuracoes?.custo_variavel_padrao ?? 38;

  renderMaterias();
  renderPapeis();
  renderProdutos();
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
  renderKits();
  renderOrcamentoSelects();
  renderTabelaOrcamento();
  renderPreviewOrcamento();
}

function renderMaterias() {
  const lista = document.getElementById("listaMaterias");
  const select = document.getElementById("produtoMateriaSelect");

  lista.innerHTML = state.materias.length
    ? state.materias.map((item) => `
      <div class="row">
        <div class="row-info">
          <strong>${item.nome}</strong>
          <span>${item.unidade} • ${formatCurrency(item.custo)}</span>
        </div>
      </div>
    `).join("")
    : `<p>Nenhuma matéria-prima cadastrada.</p>`;

  select.innerHTML = state.materias.length
    ? state.materias.map((item) => `<option value="${item.id}">${item.nome}</option>`).join("")
    : `<option value="">Cadastre primeiro</option>`;
}

function renderPapeis() {
  const lista = document.getElementById("listaPapeis");
  const select = document.getElementById("produtoPapel");

  lista.innerHTML = state.papeis.length
    ? state.papeis.map((item) => `
      <div class="row">
        <div class="row-info">
          <strong>${item.nome}</strong>
          <span>${item.largura} x ${item.altura} cm • ${formatCurrency(item.valor_folha)}</span>
        </div>
      </div>
    `).join("")
    : `<p>Nenhum papel cadastrado.</p>`;

  select.innerHTML = state.papeis.length
    ? state.papeis.map((item) => `<option value="${item.id}">${item.nome}</option>`).join("")
    : `<option value="">Cadastre primeiro</option>`;
}

function renderProdutos() {
  const lista = document.getElementById("listaProdutos");
  const kitSelect = document.getElementById("kitProdutoSelect");

  lista.innerHTML = state.produtos.length
    ? state.produtos.map((item) => `
      <div class="row">
        <div class="row-info">
          <strong>${item.nome}</strong>
          <span>${item.largura} x ${item.altura} cm • lucro ${item.lucro}%</span>
        </div>
      </div>
    `).join("")
    : `<p>Nenhum produto cadastrado.</p>`;

  if (kitSelect) {
    kitSelect.innerHTML = state.produtos.length
      ? state.produtos.map((item) => `<option value="${item.id}">${item.nome}</option>`).join("")
      : `<option value="">Cadastre um produto primeiro</option>`;
  }
}

function r3t24NpUrJMNunMMASmhAM953bFGeLXzN7() {
  const el = document.getElementById("materiasDoProduto");
  if (!state.materiaisTemporarios.length) {
    el.innerHTML = `<p>Nenhum material extra adicionado.</p>`;
    return;
  }

  el.innerHTML = state.materiaisTemporarios.map((item, index) => {
    const materia = state.materias.find((m) => m.id === item.materia_id);
    return `
      <div class="row">
        <div class="row-info">
          <strong>${materia?.nome || "Matéria"}</strong>
          <span>Qtd: ${item.quantidade}</span>
        </div>
        <div class="row-actions">
          <button onclick="window.removeTempMateria(${index})">Remover</button>
        </div>
      </div>
    `;
  }).join("");
}

window.removeTempMateria = (index) => {
  state.materiaisTemporarios.splice(index, 1);
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
};

function r3t24NpUrJMNunMMASmhAM953bFGeLXzN7() {
  const el = document.getElementById("produtosDoKit");
  if (!state.kitProdutosTemporarios.length) {
    el.innerHTML = `<p>Nenhum produto adicionado ao kit.</p>`;
    return;
  }

  el.innerHTML = state.kitProdutosTemporarios.map((item, index) => {
    const produto = state.produtos.find((p) => p.id === item.produto_id);
    return `
      <div class="row">
        <div class="row-info">
          <strong>${produto?.nome || "Produto"}</strong>
          <span>Qtd: ${item.quantidade}</span>
        </div>
        <div class="row-actions">
          <button onclick="window.removeTempKitProduto(${index})">Remover</button>
        </div>
      </div>
    `;
  }).join("");
}

window.removeTempKitProduto = (index) => {
  state.kitProdutosTemporarios.splice(index, 1);
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
};

function renderKits() {
  const lista = document.getElementById("listaKits");
  lista.innerHTML = state.kits.length
    ? state.kits.map((kit) => `
      <div class="row">
        <div class="row-info">
          <strong>${kit.nome}</strong>
          <span>${kit.itens.length} item(ns)</span>
        </div>
      </div>
    `).join("")
    : `<p>Nenhum kit cadastrado.</p>`;
}

function renderOrcamentoSelects() {
  const tipo = document.getElementById("orcamentoTipo").value;
  const select = document.getElementById("orcamentoItemSelect");

  if (tipo === "produto") {
    select.innerHTML = state.produtos.length
      ? state.produtos.map((p) => `<option value="${p.id}">${p.nome}</option>`).join("")
      : `<option value="">Cadastre um produto primeiro</option>`;
  } else {
    select.innerHTML = state.kits.length
      ? state.kits.map((k) => `<option value="${k.id}">${k.nome}</option>`).join("")
      : `<option value="">Cadastre um kit primeiro</option>`;
  }
}

function calcularValorUnitarioProduto(produto, quantidade) {
  const papel = state.papeis.find((p) => p.id === produto.papel_id);
  const calc = calcularProdutoUnitario({
    produto,
    papel,
    materias: state.materias,
    configuracoes: state.configuracoes,
    quantidade
  });

  return calc.precoSugeridoUnitario;
}

function calcularValorUnitarioKit(kit) {
  let total = 0;

  for (const item of kit.itens) {
    const produto = state.produtos.find((p) => p.id === item.produto_id);
    if (!produto) continue;

    const valorUnit = calcularValorUnitarioProduto(produto, item.quantidade);
    total += valorUnit * Number(item.quantidade);
  }

  return total;
}

function renderTabelaOrcamento() {
  const body = document.getElementById("orcamentoTabelaBody");

  if (!state.itensOrcamento.length) {
    body.innerHTML = `<tr><td colspan="7">Nenhum item adicionado.</td></tr>`;
  } else {
    body.innerHTML = state.itensOrcamento.map((item, index) => `
      <tr>
        <td>${item.nome}</td>
        <td>${item.tipo}</td>
        <td>${item.quantidade}</td>
        <td>${formatCurrency(item.valorUnitario)}</td>
        <td>${formatCurrency(item.desconto)}</td>
        <td>${formatCurrency(item.valorTotal)}</td>
        <td><button onclick="window.removerItemOrcamento(${index})">Remover</button></td>
      </tr>
    `).join("");
  }

  const subtotalBruto = state.itensOrcamento.reduce((acc, item) => acc + item.subtotalBruto, 0);
  const descontoTotal = state.itensOrcamento.reduce((acc, item) => acc + item.desconto, 0);
  const totalFinal = state.itensOrcamento.reduce((acc, item) => acc + item.valorTotal, 0);

  document.getElementById("orcSubtotalBruto").textContent = formatCurrency(subtotalBruto);
  document.getElementById("orcDescontoTotal").textContent = formatCurrency(descontoTotal);
  document.getElementById("orcTotalFinal").textContent = formatCurrency(totalFinal);
}

window.removerItemOrcamento = (index) => {
  state.itensOrcamento.splice(index, 1);
  renderTabelaOrcamento();
  renderPreviewOrcamento();
};

function renderPreviewOrcamento() {
  const cliente = document.getElementById("orcamentoCliente").value || "-";
  const observacao = document.getElementById("orcamentoObservacao").value || "-";
  const totalFinal = state.itensOrcamento.reduce((acc, item) => acc + item.valorTotal, 0);

  document.getElementById("previewCliente").textContent = `Cliente: ${cliente}`;
  document.getElementById("previewObservacao").textContent = `Observação: ${observacao}`;
  document.getElementById("previewTotal").textContent = `Total: ${formatCurrency(totalFinal)}`;

  const previewItens = document.getElementById("previewItens");
  previewItens.innerHTML = state.itensOrcamento.length
    ? state.itensOrcamento.map((item) => `
      <div class="preview-line">
        <span>${item.nome} x${item.quantidade}</span>
        <strong>${formatCurrency(item.valorTotal)}</strong>
      </div>
    `).join("")
    : `<p>Nenhum item no orçamento.</p>`;
}

async function bootAuthenticated() {
  const user = await getUser();
  showAppScreen(user?.email || "");
  await loadData();
}

async function init() {
  bindTabs();

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await signIn(
        document.getElementById("loginEmail").value.trim(),
        document.getElementById("loginPassword").value
      );
      await bootAuthenticated();
    } catch (error) {
      document.getElementById("authMessage").textContent = error.message || "Erro ao entrar.";
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut();
    showAuthScreen();
  });

  document.getElementById("formConfiguracoes").addEventListener("submit", async (e) => {
    e.preventDefault();
    state.configuracoes = await saveConfiguracoes({
      custo_tanque: Number(document.getElementById("configCustoTanque").value),
      rendimento_folhas: Number(document.getElementById("configRendimentoFolhas").value),
      custo_fixo_padrao: Number(document.getElementById("configCustoFixoPadrao").value),
      custo_variavel_padrao: Number(document.getElementById("configCustoVariavelPadrao").value),
    });
    renderAll();
    alert("Configurações salvas.");
  });

  document.getElementById("formMateria").addEventListener("submit", async (e) => {
    e.preventDefault();
    await upsertMateria({
      nome: document.getElementById("materiaNome").value.trim(),
      unidade: document.getElementById("materiaUnidade").value,
      custo: Number(document.getElementById("materiaCusto").value),
      observacao: document.getElementById("materiaObs").value.trim(),
    });
    e.target.reset();
    await loadData();
  });

  document.getElementById("formPapel").addEventListener("submit", async (e) => {
    e.preventDefault();
    await upsertPapel({
      nome: document.getElementById("papelNome").value.trim(),
      gramatura: document.getElementById("papelGramatura").value.trim(),
      largura: Number(document.getElementById("papelLargura").value),
      altura: Number(document.getElementById("papelAltura").value),
      valor_folha: Number(document.getElementById("papelValor").value),
      observacao: document.getElementById("papelObs").value.trim(),
    });
    e.target.reset();
    document.getElementById("papelLargura").value = 21;
    document.getElementById("papelAltura").value = 29.7;
    await loadData();
  });

  document.getElementById("btnAdicionarMateriaProduto").addEventListener("click", () => {
    const materiaId = document.getElementById("produtoMateriaSelect").value;
    const quantidade = Number(document.getElementById("produtoMateriaQtd").value);

    if (!materiaId || !quantidade) return;

    state.materiaisTemporarios.push({
      materia_id: materiaId,
      quantidade,
    });

    document.getElementById("produtoMateriaQtd").value = "";
    r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
  });

  document.getElementById("formProduto").addEventListener("submit", async (e) => {
    e.preventDefault();
    await upsertProduto({
      nome: document.getElementById("produtoNome").value.trim(),
      largura: Number(document.getElementById("produtoLargura").value),
      altura: Number(document.getElementById("produtoAltura").value),
      margem: Number(document.getElementById("produtoMargem").value),
      papel_id: document.getElementById("produtoPapel").value,
      custo_fixo: Number(state.configuracoes.custo_fixo_padrao),
      custo_variavel: Number(state.configuracoes.custo_variavel_padrao),
      lucro: Number(document.getElementById("produtoLucro").value),
      materiaisExtras: [...state.materiaisTemporarios],
    });

    e.target.reset();
    state.materiaisTemporarios = [];
    await loadData();
  });

  document.getElementById("btnAdicionarProdutoKit").addEventListener("click", () => {
    const produtoId = document.getElementById("kitProdutoSelect").value;
    const quantidade = Number(document.getElementById("kitProdutoQtd").value);

    if (!produtoId || !quantidade) return;

    state.kitProdutosTemporarios.push({
      produto_id: produtoId,
      quantidade
    });

    document.getElementById("kitProdutoQtd").value = "";
    r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
  });

  document.getElementById("formKit").addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("kitNome").value.trim();
    if (!nome || !state.kitProdutosTemporarios.length) return;

    state.kits.push({
      id: crypto.randomUUID(),
      nome,
      itens: [...state.kitProdutosTemporarios]
    });

    e.target.reset();
    state.kitProdutosTemporarios = [];
    renderAll();
  });

  document.getElementById("orcamentoTipo").addEventListener("change", renderOrcamentoSelects);

  document.getElementById("btnAdicionarItemOrcamento").addEventListener("click", () => {
    const tipo = document.getElementById("orcamentoTipo").value;
    const itemId = document.getElementById("orcamentoItemSelect").value;
    const quantidade = Number(document.getElementById("orcamentoQtd").value);
    const desconto = Number(document.getElementById("orcamentoDesconto").value || 0);

    if (!itemId || !quantidade) return;

    let nome = "";
    let valorUnitario = 0;

    if (tipo === "produto") {
      const produto = state.produtos.find((p) => p.id === itemId);
      if (!produto) return;
      nome = produto.nome;
      valorUnitario = calcularValorUnitarioProduto(produto, quantidade);
    } else {
      const kit = state.kits.find((k) => k.id === itemId);
      if (!kit) return;
      nome = kit.nome;
      valorUnitario = calcularValorUnitarioKit(kit);
    }

    const subtotalBruto = quantidade * valorUnitario;
    const descontoSeguro = desconto > subtotalBruto ? subtotalBruto : desconto;
    const valorTotal = subtotalBruto - descontoSeguro;

    state.itensOrcamento.push({
      tipo,
      itemId,
      nome,
      quantidade,
      valorUnitario,
      desconto: descontoSeguro,
      subtotalBruto,
      valorTotal
    });

    document.getElementById("orcamentoQtd").value = 1;
    document.getElementById("orcamentoDesconto").value = 0;
    renderTabelaOrcamento();
    renderPreviewOrcamento();
  });

  document.getElementById("orcamentoCliente").addEventListener("input", renderPreviewOrcamento);
  document.getElementById("orcamentoObservacao").addEventListener("input", renderPreviewOrcamento);

  document.getElementById("btnGerarImagemOrcamento").addEventListener("click", () => {
    alert("Na próxima etapa eu adapto esse botão para exportar a área do orçamento como imagem.");
  });

  const session = await getSession();
  if (session) {
    await bootAuthenticated();
  } else {
    showAuthScreen();
  }

  onAuthStateChange(async (session) => {
    if (session) {
      await bootAuthenticated();
    } else {
      showAuthScreen();
    }
  });
}

init();
