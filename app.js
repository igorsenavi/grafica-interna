import { signIn, signOut, getSession, getUser, onAuthStateChange } from "./auth.js";
import {
  fetchConfiguracoes,
  saveConfiguracoes,
  listMaterias,
  upsertMateria,
  deleteMateria,
  listPapeis,
  upsertPapel,
  deletePapel,
  listProdutos,
  upsertProduto,
  deleteProduto,
  listOrcamentos,
  saveOrcamento,
  deleteOrcamento,
} from "./db.js";
import { calcularSimulacao } from "./calculations.js";
import {
  showAuthScreen,
  showAppScreen,
  setAuthMessage,
  bindTabs,
  renderDashboard,
  fillConfiguracoes,
  fillSelects,
  renderMaterias,
  renderPapeis,
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7,
  renderProdutos,
  renderResultado,
  renderOrcamentos,
} from "./ui.js";

const state = {
  configuracoes: null,
  materias: [],
  papeis: [],
  produtos: [],
  orcamentos: [],
  materiaisTemporarios: [],
  ultimoResultado: null,
};

function resetMateriaForm() {
  document.getElementById("formMateria").reset();
  document.getElementById("materiaIdEdicao").value = "";
  document.getElementById("tituloFormMateria").textContent = "Nova matéria-prima";
  document.getElementById("btnSalvarMateria").textContent = "Salvar matéria-prima";
  document.getElementById("btnCancelarMateria").classList.add("hidden");
}

function resetPapelForm() {
  document.getElementById("formPapel").reset();
  document.getElementById("papelIdEdicao").value = "";
  document.getElementById("papelLargura").value = 21;
  document.getElementById("papelAltura").value = 29.7;
  document.getElementById("tituloFormPapel").textContent = "Novo papel";
  document.getElementById("btnSalvarPapel").textContent = "Salvar papel";
  document.getElementById("btnCancelarPapel").classList.add("hidden");
}

function resetProdutoForm() {
  document.getElementById("formProduto").reset();
  document.getElementById("produtoIdEdicao").value = "";
  document.getElementById("tituloFormProduto").textContent = "Novo produto";
  document.getElementById("btnSalvarProduto").textContent = "Salvar produto";
  document.getElementById("btnCancelarProduto").classList.add("hidden");
  state.materiaisTemporarios = [];
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7(state.materiaisTemporarios, state.materias, onRemoveTempMaterial);
}

async function loadAppData() {
  state.configuracoes = await fetchConfiguracoes();
  state.materias = await listMaterias();
  state.papeis = await listPapeis();
  state.produtos = await listProdutos();
  state.orcamentos = await listOrcamentos();

  fillConfiguracoes(state.configuracoes);
  fillSelects(state);
  renderDashboard(state);
  renderMaterias(state.materias, { onEdit: onEditMateria, onDelete: onDeleteMateria });
  renderPapeis(state.papeis, { onEdit: onEditPapel, onDelete: onDeletePapel });
  renderProdutos(state.produtos, state.papeis, state.materias, {
    onEdit: onEditProduto,
    onDelete: onDeleteProduto,
  });
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7(state.materiaisTemporarios, state.materias, onRemoveTempMaterial);
  renderOrcamentos(state.orcamentos, { onOpen: onOpenOrcamento, onDelete: onDeleteOrcamento });
}

async function bootAuthenticated() {
  const user = await getUser();
  showAppScreen(user?.email || "");
  await loadAppData();
}

async function handleLogin(event) {
  event.preventDefault();
  setAuthMessage("");

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    await signIn(email, password);
    await bootAuthenticated();
  } catch (error) {
    setAuthMessage(error.message || "Falha ao entrar.");
  }
}

async function handleLogout() {
  try {
    await signOut();
    showAuthScreen();
  } catch (error) {
    alert(error.message || "Erro ao sair.");
  }
}

async function handleConfiguracoes(event) {
  event.preventDefault();

  try {
    state.configuracoes = await saveConfiguracoes({
      custo_tanque: Number(document.getElementById("configCustoTanque").value),
      rendimento_folhas: Number(document.getElementById("configRendimentoFolhas").value),
    });

    renderDashboard(state);
    fillConfiguracoes(state.configuracoes);
    alert("Configurações salvas.");
  } catch (error) {
    alert(error.message);
  }
}

async function handleMateria(event) {
  event.preventDefault();

  try {
    await upsertMateria({
      id: document.getElementById("materiaIdEdicao").value || undefined,
      nome: document.getElementById("materiaNome").value.trim(),
      unidade: document.getElementById("materiaUnidade").value,
      custo: Number(document.getElementById("materiaCusto").value),
      observacao: document.getElementById("materiaObs").value.trim(),
    });

    resetMateriaForm();
    await loadAppData();
  } catch (error) {
    alert(error.message);
  }
}

function onEditMateria(id) {
  const item = state.materias.find((m) => m.id === id);
  if (!item) return;

  document.getElementById("materiaIdEdicao").value = item.id;
  document.getElementById("materiaNome").value = item.nome;
  document.getElementById("materiaUnidade").value = item.unidade;
  document.getElementById("materiaCusto").value = item.custo;
  document.getElementById("materiaObs").value = item.observacao || "";
  document.getElementById("tituloFormMateria").textContent = "Editar matéria-prima";
  document.getElementById("btnSalvarMateria").textContent = "Atualizar matéria-prima";
  document.getElementById("btnCancelarMateria").classList.remove("hidden");
}

async function onDeleteMateria(id) {
  if (!confirm("Deseja excluir esta matéria-prima?")) return;
  try {
    await deleteMateria(id);
    await loadAppData();
  } catch (error) {
    alert(error.message);
  }
}

async function handlePapel(event) {
  event.preventDefault();

  try {
    await upsertPapel({
      id: document.getElementById("papelIdEdicao").value || undefined,
      nome: document.getElementById("papelNome").value.trim(),
      gramatura: document.getElementById("papelGramatura").value.trim(),
      largura: Number(document.getElementById("papelLargura").value),
      altura: Number(document.getElementById("papelAltura").value),
      valor_folha: Number(document.getElementById("papelValor").value),
      observacao: document.getElementById("papelObs").value.trim(),
    });

    resetPapelForm();
    await loadAppData();
  } catch (error) {
    alert(error.message);
  }
}

function onEditPapel(id) {
  const item = state.papeis.find((p) => p.id === id);
  if (!item) return;

  document.getElementById("papelIdEdicao").value = item.id;
  document.getElementById("papelNome").value = item.nome;
  document.getElementById("papelGramatura").value = item.gramatura || "";
  document.getElementById("papelLargura").value = item.largura;
  document.getElementById("papelAltura").value = item.altura;
  document.getElementById("papelValor").value = item.valor_folha;
  document.getElementById("papelObs").value = item.observacao || "";
  document.getElementById("tituloFormPapel").textContent = "Editar papel";
  document.getElementById("btnSalvarPapel").textContent = "Atualizar papel";
  document.getElementById("btnCancelarPapel").classList.remove("hidden");
}

async function onDeletePapel(id) {
  if (!confirm("Deseja excluir este papel?")) return;
  try {
    await deletePapel(id);
    await loadAppData();
  } catch (error) {
    alert(error.message);
  }
}

function onAddTempMaterial() {
  const materiaId = document.getElementById("produtoMateriaSelect").value;
  const quantidade = Number(document.getElementById("produtoMateriaQtd").value);

  if (!materiaId || !quantidade || quantidade <= 0) {
    alert("Selecione uma matéria-prima e informe uma quantidade válida.");
    return;
  }

  state.materiaisTemporarios.push({
    materia_id: materiaId,
    quantidade,
  });

  document.getElementById("produtoMateriaQtd").value = "";
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7(state.materiaisTemporarios, state.materias, onRemoveTempMaterial);
}

function onRemoveTempMaterial(index) {
  state.materiaisTemporarios.splice(index, 1);
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7(state.materiaisTemporarios, state.materias, onRemoveTempMaterial);
}

async function handleProduto(event) {
  event.preventDefault();

  try {
    await upsertProduto({
      id: document.getElementById("produtoIdEdicao").value || undefined,
      nome: document.getElementById("produtoNome").value.trim(),
      largura: Number(document.getElementById("produtoLargura").value),
      altura: Number(document.getElementById("produtoAltura").value),
      margem: Number(document.getElementById("produtoMargem").value),
      papel_id: document.getElementById("produtoPapel").value,
      custo_fixo: Number(document.getElementById("produtoCustoFixo").value),
      custo_variavel: Number(document.getElementById("produtoCustoVariavel").value),
      lucro: Number(document.getElementById("produtoLucro").value),
      materiaisExtras: state.materiaisTemporarios,
    });

    resetProdutoForm();
    await loadAppData();
  } catch (error) {
    alert(error.message);
  }
}

function onEditProduto(id) {
  const item = state.produtos.find((p) => p.id === id);
  if (!item) return;

  document.getElementById("produtoIdEdicao").value = item.id;
  document.getElementById("produtoNome").value = item.nome;
  document.getElementById("produtoLargura").value = item.largura;
  document.getElementById("produtoAltura").value = item.altura;
  document.getElementById("produtoMargem").value = item.margem;
  document.getElementById("produtoPapel").value = item.papel_id;
  document.getElementById("produtoCustoFixo").value = item.custo_fixo;
  document.getElementById("produtoCustoVariavel").value = item.custo_variavel;
  document.getElementById("produtoLucro").value = item.lucro;
  state.materiaisTemporarios = [...(item.materiaisExtras || [])];
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7(state.materiaisTemporarios, state.materias, onRemoveTempMaterial);
  document.getElementById("tituloFormProduto").textContent = "Editar produto";
  document.getElementById("btnSalvarProduto").textContent = "Atualizar produto";
  document.getElementById("btnCancelarProduto").classList.remove("hidden");
}

async function onDeleteProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;
  try {
    await deleteProduto(id);
    await loadAppData();
  } catch (error) {
    alert(error.message);
  }
}

async function handleSimulacao(event) {
  event.preventDefault();

  try {
    const produtoId = document.getElementById("simulacaoProduto").value;
    const quantidade = Number(document.getElementById("simulacaoQuantidade").value);

    const produto = state.produtos.find((p) => p.id === produtoId);
    if (!produto) throw new Error("Produto não encontrado.");

    const papel = state.papeis.find((p) => p.id === produto.papel_id);
    if (!papel) throw new Error("Papel não encontrado.");

    const resultado = calcularSimulacao({
      produto,
      papel,
      materias: state.materias,
      configuracoes: state.configuracoes,
      quantidade,
    });

    state.ultimoResultado = resultado;
    renderResultado(resultado);
  } catch (error) {
    alert(error.message);
  }
}

async function handleSalvarOrcamento() {
  if (!state.ultimoResultado) {
    alert("Faça uma simulação antes.");
    return;
  }

  try {
    await saveOrcamento(state.ultimoResultado);
    state.orcamentos = await listOrcamentos();
    renderOrcamentos(state.orcamentos, { onOpen: onOpenOrcamento, onDelete: onDeleteOrcamento });
    renderDashboard(state);
    alert("Orçamento salvo.");
  } catch (error) {
    alert(error.message);
  }
}

function onOpenOrcamento(id) {
  const row = state.orcamentos.find((o) => o.id === id);
  if (!row) return;

  state.ultimoResultado = row.resultado;
  renderResultado(row.resultado);
  document.getElementById("simulacaoProduto").value = row.resultado.produto.id;
  document.getElementById("simulacaoQuantidade").value = row.quantidade;

  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelector('.nav-btn[data-tab="simulacao"]').classList.add("active");
  document.getElementById("simulacao").classList.add("active");
}

async function onDeleteOrcamento(id) {
  if (!confirm("Deseja excluir este orçamento?")) return;
  try {
    await deleteOrcamento(id);
    state.orcamentos = await listOrcamentos();
    renderOrcamentos(state.orcamentos, { onOpen: onOpenOrcamento, onDelete: onDeleteOrcamento });
    renderDashboard(state);
  } catch (error) {
    alert(error.message);
  }
}

async function init() {
  bindTabs();

  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document.getElementById("formConfiguracoes").addEventListener("submit", handleConfiguracoes);
  document.getElementById("formMateria").addEventListener("submit", handleMateria);
  document.getElementById("formPapel").addEventListener("submit", handlePapel);
  document.getElementById("btnAdicionarMateriaProduto").addEventListener("click", onAddTempMaterial);
  document.getElementById("formProduto").addEventListener("submit", handleProduto);
  document.getElementById("formSimulacao").addEventListener("submit", handleSimulacao);
  document.getElementById("btnSalvarOrcamento").addEventListener("click", handleSalvarOrcamento);

  document.getElementById("btnCancelarMateria").addEventListener("click", resetMateriaForm);
  document.getElementById("btnCancelarPapel").addEventListener("click", resetPapelForm);
  document.getElementById("btnCancelarProduto").addEventListener("click", resetProdutoForm);

  onAuthStateChange(async (session) => {
    if (session) {
      await bootAuthenticated();
    } else {
      showAuthScreen();
    }
  });

  const session = await getSession();
  if (session) {
    await bootAuthenticated();
  } else {
    showAuthScreen();
  }
}

init();
