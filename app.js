import { getSession, getUser, signIn, signOut, onAuthStateChange } from "./auth.js";
import { supabase } from "./supabaseClient.js";
import {
  fetchConfiguracoes,
  saveConfiguracoes,
  listMaterias,
  upsertMateria,
  listPapeis,
  upsertPapel,
  listProdutos,
  upsertProduto,
  listKits,
  upsertKit,
  listOrcamentos,
  saveOrcamento
} from "./db.js";
import { formatCurrency, calcularProdutoUnitario } from "./calculations.js";

const state = {
  configuracoes: null,
  materias: [],
  papeis: [],
  produtos: [],
  kits: [],
  orcamentos: [],
  materiaisTemporarios: [],
  kitProdutosTemporarios: [],
  itensOrcamento: [],
  materiaEditandoId: null,
  papelEditandoId: null,
  produtoEditandoId: null,
  kitEditandoId: null,
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
  state.kits = await listKits();
  state.orcamentos = await listOrcamentos();
  renderAll();
}

function renderAll() {
  document.getElementById("totalProdutos").textContent = state.produtos.length;
  document.getElementById("totalKits").textContent = state.kits.length;
  document.getElementById("totalOrcamentos").textContent = state.orcamentos.length;

  const tintaPorFolha =
    Number(state.configuracoes?.custo_tanque || 0) /
    Number(state.configuracoes?.rendimento_folhas || 1);

  document.getElementById("dashTintaFolha").textContent = formatCurrency(tintaPorFolha);

  document.getElementById("configCustoTanque").value = state.configuracoes?.custo_tanque ?? 160;
  document.getElementById("configRendimentoFolhas").value = state.configuracoes?.rendimento_folhas ?? 1000;
  document.getElementById("configCustoFixoPadrao").value = state.configuracoes?.custo_fixo_padrao ?? 3;
  document.getElementById("configCustoVariavelPadrao").value = state.configuracoes?.custo_variavel_padrao ?? 38;
  document.getElementById("configSalarioMensal").value = state.configuracoes?.salario_mensal ?? 1800;
  document.getElementById("configDiasTrabalhadosMes").value = state.configuracoes?.dias_trabalhados_mes ?? 24;
  document.getElementById("configHorasTrabalhadasDia").value = state.configuracoes?.horas_trabalhadas_dia ?? 8;
  document.getElementById("configCustoCnpjMensal").value = state.configuracoes?.custo_cnpj_mensal ?? 88;

  renderMaterias();
  renderPapeis();
  renderProdutos();
  renderMateriaisTemporarios();
  renderKitProdutosTemporarios();
  renderKits();
  renderOrcamentoSelects();
  renderTabelaOrcamento();
  renderPreviewOrcamento();
  renderOrcamentosSalvos();
  atualizarResumoCadastroProduto();
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
          ${item.observacao ? `<span>Obs.: ${item.observacao}</span>` : ""}
        </div>
        <div class="row-actions compact-actions">
          <button onclick="window.editarMateria('${item.id}')">Editar</button>
          <button class="btn-secondary" onclick="window.excluirMateria('${item.id}')">Excluir</button>
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
          ${item.gramatura ? `<span>Gramatura: ${item.gramatura}</span>` : ""}
          ${item.observacao ? `<span>Obs.: ${item.observacao}</span>` : ""}
        </div>
        <div class="row-actions">
          <button onclick="window.editarPapel('${item.id}')">Editar</button>
          <button class="btn-secondary" onclick="window.excluirPapel('${item.id}')">Excluir</button>
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
    ? state.produtos.map((item) => {
        let custosHtml = `<span class="muted-mini">Sem prévia de custo.</span>`;
        try {
          const resumo = calcularResumoProduto(item, 1);
          const vendaManual = Number(item.preco_venda_manual || 0);
          custosHtml = `
            <div class="row-cost-grid">
              <div><span>Custo</span><strong>${formatCurrency(resumo.custoTotalPedido)}</strong></div>
              <div><span>Sugerido</span><strong>${formatCurrency(resumo.precoSugeridoTotal)}</strong></div>
              <div><span>Venda</span><strong>${formatCurrency(vendaManual > 0 ? vendaManual : resumo.precoSugeridoUnitario)}</strong></div>
              <div><span>Aproveitamento</span><strong>${resumo.aproveitamentoReal.toFixed(2)}%</strong></div>
            </div>
          `;
        } catch (error) {}

        return `
      <div class="row row-stack">
        <div class="row-info">
          <strong>${item.nome}</strong>
          <span>${item.largura} x ${item.altura} cm • lucro ${item.lucro}%</span>
          <span>Margem: ${item.margem ?? 0} cm</span>
          <span>Tempo de produção: ${item.tempo_producao_minutos ?? 0} min/un</span>
          <span>Capacidade por folha: ${item.capacidade_manual_folha ? `${item.capacidade_manual_folha} (manual)` : 'automática'}</span>
          <span>Preço de venda: ${Number(item.preco_venda_manual || 0) > 0 ? formatCurrency(item.preco_venda_manual) : 'usar valor sugerido'}</span>
          ${custosHtml}
        </div>
        <div class="row-actions compact-actions">
          <button onclick="window.editarProduto('${item.id}')">Editar</button>
          <button class="btn-secondary" onclick="window.excluirProduto('${item.id}')">Excluir</button>
        </div>
      </div>
    `}).join("")
    : `<p>Nenhum produto cadastrado.</p>`;

  if (kitSelect) {
    kitSelect.innerHTML = state.produtos.length
      ? state.produtos.map((item) => `<option value="${item.id}">${item.nome}</option>`).join("")
      : `<option value="">Cadastre um produto primeiro</option>`;
  }
}

function renderMateriaisTemporarios() {
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
  renderMateriaisTemporarios();
  atualizarResumoCadastroProduto();
};

function renderKitProdutosTemporarios() {
  const el = document.getElementById("produtosDoKit");

  if (!state.kitProdutosTemporarios.length) {
    el.innerHTML = `<p>Nenhum produto adicionado ao kit.</p>`;
    return;
  }

  el.innerHTML = `
    <div class="row" style="background:#eff6ff;border-color:#bfdbfe;">
      <div class="row-info">
        <strong>Produtos adicionados ao kit</strong>
        <span>Confira os itens abaixo antes de salvar.</span>
      </div>
    </div>

    ${state.kitProdutosTemporarios.map((item, index) => {
      const produto = state.produtos.find((p) => p.id === item.produto_id);

      return `
        <div class="row">
          <div class="row-info">
            <strong>${produto?.nome || "Produto"}</strong>
            <span>Quantidade no kit: ${item.quantidade}</span>
          </div>
          <div class="row-actions">
            <button onclick="window.removeTempKitProduto(${index})">Remover</button>
          </div>
        </div>
      `;
    }).join("")}
  `;
}

window.removeTempKitProduto = (index) => {
  state.kitProdutosTemporarios.splice(index, 1);
  renderKitProdutosTemporarios();
};

function renderKits() {
  const lista = document.getElementById("listaKits");

  lista.innerHTML = state.kits.length
    ? state.kits.map((kit) => {
        const itensHtml = (kit.itens || []).map((item) => {
          const produto = state.produtos.find((p) => p.id === item.produto_id);
          return `<span class="tag">${produto?.nome || "Produto"} x${item.quantidade}</span>`;
        }).join("");

        return `
          <div class="row">
            <div class="row-info">
              <strong>${kit.nome}</strong>
              <span>${kit.itens.length} item(ns)</span>
              <div>${itensHtml || '<span class="empty">Sem produtos no kit.</span>'}</div>
            </div>
            <div class="row-actions">
              <button onclick="window.editarKit('${kit.id}')">Editar</button>
              <button class="btn-secondary" onclick="window.excluirKit('${kit.id}')">Excluir</button>
            </div>
          </div>
        `;
      }).join("")
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

function getProdutoFormPayload() {
  return {
    id: state.produtoEditandoId || undefined,
    nome: document.getElementById("produtoNome").value.trim(),
    largura: Number(document.getElementById("produtoLargura").value || 0),
    altura: Number(document.getElementById("produtoAltura").value || 0),
    margem: Number(document.getElementById("produtoMargem").value || 0),
    papel_id: document.getElementById("produtoPapel").value,
    custo_fixo: Number(state.configuracoes?.custo_fixo_padrao || 0),
    custo_variavel: Number(state.configuracoes?.custo_variavel_padrao || 0),
    lucro: Number(document.getElementById("produtoLucro").value || 0),
    preco_venda_manual: Number(document.getElementById("produtoPrecoVenda").value || 0),
    tempo_producao_minutos: Number(document.getElementById("produtoTempoProducao").value || 0),
    capacidade_manual_folha: Number(document.getElementById("produtoCapacidadeManual").value || 0),
    materiaisExtras: [...state.materiaisTemporarios],
  };
}

function calcularValorVendaProduto(produto, quantidade, resumo = null) {
  const precoManual = Number(produto?.preco_venda_manual || 0);
  if (precoManual > 0) {
    return {
      valorUnitario: precoManual,
      subtotalBruto: precoManual * Number(quantidade || 0),
      origem: "manual",
    };
  }

  const resumoSeguro = resumo || calcularResumoProduto(produto, quantidade);
  return {
    valorUnitario: resumoSeguro.precoSugeridoUnitario,
    subtotalBruto: resumoSeguro.precoSugeridoTotal,
    origem: "sugerido",
  };
}

function atualizarResumoCadastroProduto() {
  const custoEl = document.getElementById("produtoPreviewCustoTotal");
  const sugeridaEl = document.getElementById("produtoPreviewVendaSugerida");
  const informadaEl = document.getElementById("produtoPreviewVendaInformada");
  const lucroEl = document.getElementById("produtoPreviewLucroInformado");
  const metaEl = document.getElementById("produtoPreviewMeta");

  if (!custoEl || !state.configuracoes) return;

  try {
    const produto = getProdutoFormPayload();
    const quantidade = Number(document.getElementById("produtoQtdPreview").value || 1);
    const papel = state.papeis.find((item) => item.id === produto.papel_id);

    if (!papel || !produto.largura || !produto.altura || quantidade <= 0) {
      throw new Error("Preencha papel, tamanho e quantidade da prévia.");
    }

    const resumo = calcularProdutoUnitario({
      produto,
      papel,
      materias: state.materias,
      configuracoes: state.configuracoes,
      quantidade,
    });

    const precoInformado = Number(produto.preco_venda_manual || 0);
    const totalInformado = precoInformado * quantidade;
    const lucroInformado = totalInformado - resumo.custoTotalPedido;

    custoEl.textContent = formatCurrency(resumo.custoTotalPedido);
    sugeridaEl.textContent = formatCurrency(resumo.precoSugeridoTotal);
    informadaEl.textContent = formatCurrency(totalInformado);
    lucroEl.textContent = formatCurrency(lucroInformado);
    metaEl.innerHTML = `
      <span>${papel.nome}</span>
      <span>${resumo.orientacao}</span>
      <span>${resumo.capacidadePorFolha} por folha</span>
      <span>${resumo.folhasNecessarias} folha(s)</span>
      <span>${resumo.aproveitamentoReal.toFixed(2)}% aproveitamento</span>
    `;
  } catch (error) {
    custoEl.textContent = formatCurrency(0);
    sugeridaEl.textContent = formatCurrency(0);
    informadaEl.textContent = formatCurrency(0);
    lucroEl.textContent = formatCurrency(0);
    metaEl.innerHTML = `<span>${error.message || "Preencha os campos do produto para ver a prévia."}</span>`;
  }
}

function calcularResumoProduto(produto, quantidade) {
  const papel = state.papeis.find((p) => p.id === produto.papel_id);
  return calcularProdutoUnitario({
    produto,
    papel,
    materias: state.materias,
    configuracoes: state.configuracoes,
    quantidade
  });
}

function calcularValorUnitarioProduto(produto, quantidade) {
  return calcularResumoProduto(produto, quantidade).precoSugeridoUnitario;
}

function calcularResumoKit(kit, quantidadeKits = 1) {
  let total = 0;
  const detalhes = [];

  for (const item of kit.itens) {
    const produto = state.produtos.find((p) => p.id === item.produto_id);
    if (!produto) continue;

    const quantidadeTotalProduto = Number(item.quantidade) * Number(quantidadeKits);
    const resumo = calcularResumoProduto(produto, quantidadeTotalProduto);
    const venda = calcularValorVendaProduto(produto, quantidadeTotalProduto, resumo);

    detalhes.push({
      nome: produto.nome,
      quantidade: quantidadeTotalProduto,
      valorUnitario: venda.valorUnitario,
      subtotal: venda.subtotalBruto,
      custoTotal: resumo.custoTotalPedido,
    });

    total += venda.subtotalBruto;
  }

  return {
    valorUnitarioKit: quantidadeKits > 0 ? total / Number(quantidadeKits) : 0,
    valorTotalKit: total,
    detalhes,
  };
}

function renderTabelaOrcamento() {
  const body = document.getElementById("orcamentoTabelaBody");

  if (!state.itensOrcamento.length) {
    body.innerHTML = `<tr><td colspan="7">Nenhum item adicionado.</td></tr>`;
  } else {
    body.innerHTML = state.itensOrcamento.map((item, index) => {
      let detalheLinha = "";

      if (item.tipo === "produto" && item.detalhesCusto) {
        const d = item.detalhesCusto;
        detalheLinha = `
          <tr class="details-row">
            <td colspan="7">
              <div class="detail-box">
                <strong>Custos do produto</strong>
                <div class="row-cost-grid">
                  <div><span>Folhas</span><strong>${d.folhasNecessarias}</strong></div>
                  <div><span>Capacidade</span><strong>${d.capacidadePorFolha}</strong></div>
                  <div><span>Aproveitamento</span><strong>${d.aproveitamentoReal.toFixed(2)}%</strong></div>
                  <div><span>Papel</span><strong>${formatCurrency(d.custoTotalPapel)}</strong></div>
                  <div><span>Tinta</span><strong>${formatCurrency(d.custoTotalTinta)}</strong></div>
                  <div><span>Extras</span><strong>${formatCurrency(d.custoTotalExtras || 0)}</strong></div>
                  <div><span>Mão de obra</span><strong>${formatCurrency(d.custoTotalMaoObra || 0)}</strong></div>
                  <div><span>Custo total</span><strong>${formatCurrency(d.custoTotalPedido)}</strong></div>
                </div>
              </div>
            </td>
          </tr>
        `;
      }

      if (item.tipo === "kit" && item.detalhesKit?.length) {
        detalheLinha = `
          <tr class="details-row">
            <td colspan="7">
              <div class="detail-box">
                <strong>Composição do kit</strong>
                ${item.detalhesKit.map((det) => `
                  <div class="kit-cost-line">
                    <span>${det.nome} • ${det.quantidade} un</span>
                    <span>Custo ${formatCurrency(det.custoTotal)}</span>
                    <span>Venda ${formatCurrency(det.subtotal)}</span>
                  </div>
                `).join("")}
              </div>
            </td>
          </tr>
        `;
      }

      return `
        <tr>
          <td>${item.nome}</td>
          <td>${item.tipo}</td>
          <td>${item.quantidade}</td>
          <td>${formatCurrency(item.valorUnitario)}</td>
          <td>${formatCurrency(item.desconto)}</td>
          <td>${formatCurrency(item.valorTotal)}</td>
          <td><button onclick="window.removerItemOrcamento(${index})">Remover</button></td>
        </tr>
        ${detalheLinha}
      `;
    }).join("");
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

  if (!state.itensOrcamento.length) {
    previewItens.innerHTML = `<p>Nenhum item no orçamento.</p>`;
    return;
  }

  previewItens.innerHTML = state.itensOrcamento.map((item) => {
    const detalhes = item.tipo === "kit" && item.detalhesKit?.length
      ? `
        <div style="margin-top:8px; padding-left:12px;">
          ${item.detalhesKit.map((det) => `
            <div style="display:flex; justify-content:space-between; gap:12px; font-size:13px; color:#475569; padding:4px 0;">
              <span>• ${det.nome} — ${det.quantidade} un — ${formatCurrency(det.valorUnitario)}</span>
              <strong>${formatCurrency(det.subtotal)}</strong>
            </div>
          `).join("")}
        </div>
      `
      : "";

    return `
      <div class="preview-line" style="display:block;">
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <span>${item.nome} x${item.quantidade}</span>
          <strong>${formatCurrency(item.valorTotal)}</strong>
        </div>
        ${detalhes}
      </div>
    `;
  }).join("");
}

function renderOrcamentosSalvos() {
  const el = document.getElementById("listaOrcamentosSalvos");
  if (!el) return;

  if (!state.orcamentos.length) {
    el.innerHTML = `<p>Nenhum orçamento salvo.</p>`;
    return;
  }

  el.innerHTML = state.orcamentos.map((orc) => {
    const total = Number(orc.total_final || 0);
    const cliente = orc.cliente || "-";
    const itens = orc.itens || [];

    return `
      <div class="row">
        <div class="row-info">
          <strong>${cliente}</strong>
          <span>${itens.length} item(ns) • ${formatCurrency(total)}</span>
          <span>${new Date(orc.created_at).toLocaleString("pt-BR")}</span>
        </div>
        <div class="row-actions">
          <button onclick="window.abrirOrcamentoSalvo('${orc.id}')">Abrir</button>
        </div>
      </div>
    `;
  }).join("");
}

window.abrirOrcamentoSalvo = (id) => {
  const orc = state.orcamentos.find((o) => o.id === id);
  if (!orc) return;

  document.getElementById("orcamentoCliente").value = orc.cliente || "";
  document.getElementById("orcamentoObservacao").value = orc.observacao || "";

  state.itensOrcamento = (orc.itens || []).map((item) => ({
    tipo: item.tipo,
    itemId: item.referencia_id,
    nome: item.nome,
    quantidade: Number(item.quantidade),
    valorUnitario: Number(item.valor_unitario),
    desconto: Number(item.desconto),
    subtotalBruto: Number(item.subtotal_bruto),
    valorTotal: Number(item.valor_total),
    detalhesKit: [],
    detalhesCusto: null,
  }));

  renderTabelaOrcamento();
  renderPreviewOrcamento();

  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelector('.nav-btn[data-tab="orcamentos"]').classList.add("active");
  document.getElementById("orcamentos").classList.add("active");
};

window.editarMateria = (id) => {
  const item = state.materias.find((m) => m.id === id);
  if (!item) return;

  document.getElementById("materiaNome").value = item.nome || "";
  document.getElementById("materiaUnidade").value = item.unidade || "unidade";
  document.getElementById("materiaCusto").value = item.custo || "";
  document.getElementById("materiaObs").value = item.observacao || "";

  state.materiaEditandoId = id;

  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelector('.nav-btn[data-tab="materias"]').classList.add("active");
  document.getElementById("materias").classList.add("active");
};

window.excluirMateria = async (id) => {
  const confirmar = confirm("Deseja excluir esta matéria-prima?");
  if (!confirmar) return;

  const { error } = await supabase.from("materias_primas").delete().eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadData();
};

window.editarPapel = (id) => {
  const item = state.papeis.find((p) => p.id === id);
  if (!item) return;

  document.getElementById("papelNome").value = item.nome || "";
  document.getElementById("papelGramatura").value = item.gramatura || "";
  document.getElementById("papelLargura").value = item.largura || "";
  document.getElementById("papelAltura").value = item.altura || "";
  document.getElementById("papelValor").value = item.valor_folha || "";
  document.getElementById("papelObs").value = item.observacao || "";

  state.papelEditandoId = id;

  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelector('.nav-btn[data-tab="papeis"]').classList.add("active");
  document.getElementById("papeis").classList.add("active");
};

window.excluirPapel = async (id) => {
  const confirmar = confirm("Deseja excluir este papel?");
  if (!confirmar) return;

  const { error } = await supabase.from("papeis").delete().eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadData();
};

window.editarProduto = (id) => {
  const item = state.produtos.find((p) => p.id === id);
  if (!item) return;

  document.getElementById("produtoNome").value = item.nome || "";
  document.getElementById("produtoLargura").value = item.largura || "";
  document.getElementById("produtoAltura").value = item.altura || "";
  document.getElementById("produtoMargem").value = item.margem || 0;
  document.getElementById("produtoPapel").value = item.papel_id || "";
  document.getElementById("produtoLucro").value = item.lucro || 0;
  document.getElementById("produtoPrecoVenda").value = item.preco_venda_manual || 0;
  document.getElementById("produtoTempoProducao").value = item.tempo_producao_minutos || 0;
  document.getElementById("produtoCapacidadeManual").value = item.capacidade_manual_folha || 0;

  state.materiaisTemporarios = [...(item.materiaisExtras || [])];
  renderMateriaisTemporarios();
  atualizarResumoCadastroProduto();

  state.produtoEditandoId = id;

  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelector('.nav-btn[data-tab="produtos"]').classList.add("active");
  document.getElementById("produtos").classList.add("active");
};

window.excluirProduto = async (id) => {
  const confirmar = confirm("Deseja excluir este produto?");
  if (!confirmar) return;

  const { error } = await supabase.from("produtos").delete().eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadData();
};

window.editarKit = (id) => {
  const kit = state.kits.find((k) => k.id === id);
  if (!kit) return;

  document.getElementById("kitNome").value = kit.nome || "";
  state.kitProdutosTemporarios = [...(kit.itens || [])];
  state.kitEditandoId = id;

  renderKitProdutosTemporarios();

  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelector('.nav-btn[data-tab="kits"]').classList.add("active");
  document.getElementById("kits").classList.add("active");
};

window.excluirKit = async (id) => {
  const confirmar = confirm("Deseja excluir este kit?");
  if (!confirmar) return;

  const { error } = await supabase.from("kits").delete().eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadData();
};

async function salvarOrcamentoCompleto() {
  const subtotalBruto = state.itensOrcamento.reduce((acc, item) => acc + item.subtotalBruto, 0);
  const descontoTotal = state.itensOrcamento.reduce((acc, item) => acc + item.desconto, 0);
  const totalFinal = state.itensOrcamento.reduce((acc, item) => acc + item.valorTotal, 0);

  await saveOrcamento({
    cliente: document.getElementById("orcamentoCliente").value.trim(),
    observacao: document.getElementById("orcamentoObservacao").value.trim(),
    subtotalBruto,
    descontoTotal,
    totalFinal,
    itens: [...state.itensOrcamento]
  });

  state.orcamentos = await listOrcamentos();
  renderOrcamentosSalvos();

  alert("Orçamento salvo com sucesso.");
}

async function exportarImagemOrcamento() {
  const preview = document.getElementById("orcamentoPreview");
  const canvas = await html2canvas(preview, {
    backgroundColor: "#ffffff",
    scale: 2
  });

  const link = document.createElement("a");
  link.download = "orcamento.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
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
      salario_mensal: Number(document.getElementById("configSalarioMensal").value),
      dias_trabalhados_mes: Number(document.getElementById("configDiasTrabalhadosMes").value),
      horas_trabalhadas_dia: Number(document.getElementById("configHorasTrabalhadasDia").value),
      custo_cnpj_mensal: Number(document.getElementById("configCustoCnpjMensal").value),
    });
    renderAll();
    alert("Configurações salvas.");
  });

  document.getElementById("formMateria").addEventListener("submit", async (e) => {
    e.preventDefault();
    await upsertMateria({
      id: state.materiaEditandoId || undefined,
      nome: document.getElementById("materiaNome").value.trim(),
      unidade: document.getElementById("materiaUnidade").value,
      custo: Number(document.getElementById("materiaCusto").value),
      observacao: document.getElementById("materiaObs").value.trim(),
    });
    e.target.reset();
    state.materiaEditandoId = null;
    await loadData();
  });

  document.getElementById("formPapel").addEventListener("submit", async (e) => {
    e.preventDefault();

    await upsertPapel({
      id: state.papelEditandoId || undefined,
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
    state.papelEditandoId = null;

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
    renderMateriaisTemporarios();
    atualizarResumoCadastroProduto();
  });

  document.getElementById("formProduto").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      await upsertProduto(getProdutoFormPayload());

      e.target.reset();
      document.getElementById("produtoPrecoVenda").value = 0;
      document.getElementById("produtoTempoProducao").value = 0;
      document.getElementById("produtoCapacidadeManual").value = 0;
      document.getElementById("produtoQtdPreview").value = 1;
      state.materiaisTemporarios = [];
      state.produtoEditandoId = null;
      renderMateriaisTemporarios();
      atualizarResumoCadastroProduto();

      await loadData();
      alert("Produto salvo com sucesso.");
    } catch (error) {
      alert(error?.message || "Erro ao salvar produto.");
      console.error(error);
    }
  });

  document.getElementById("btnAdicionarProdutoKit").addEventListener("click", () => {
    const produtoId = document.getElementById("kitProdutoSelect").value;
    const quantidade = Number(document.getElementById("kitProdutoQtd").value);

    if (!produtoId || !quantidade || quantidade <= 0) {
      alert("Selecione um produto e informe uma quantidade válida.");
      return;
    }

    state.kitProdutosTemporarios.push({
      produto_id: produtoId,
      quantidade
    });

    document.getElementById("kitProdutoQtd").value = "";
    renderKitProdutosTemporarios();
  });

  document.getElementById("formKit").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("kitNome").value.trim();
    if (!nome || !state.kitProdutosTemporarios.length) {
      alert("Adicione pelo menos um produto ao kit.");
      return;
    }

    await upsertKit({
      id: state.kitEditandoId || undefined,
      nome,
      itens: [...state.kitProdutosTemporarios]
    });

    e.target.reset();
    state.kitProdutosTemporarios = [];
    state.kitEditandoId = null;
    renderKitProdutosTemporarios();

    await loadData();
  });

  document.getElementById("orcamentoTipo").addEventListener("change", renderOrcamentoSelects);

  document.getElementById("btnAdicionarItemOrcamento").addEventListener("click", () => {
    const tipo = document.getElementById("orcamentoTipo").value;
    const itemId = document.getElementById("orcamentoItemSelect").value;
    const quantidade = Number(document.getElementById("orcamentoQtd").value);
    const desconto = Number(document.getElementById("orcamentoDesconto").value || 0);

    if (!itemId || !quantidade || quantidade <= 0) return;

    let nome = "";
    let valorUnitario = 0;
    let subtotalBruto = 0;
    let detalhesKit = [];

    let detalhesCusto = null;

    if (tipo === "produto") {
      const produto = state.produtos.find((p) => p.id === itemId);
      if (!produto) return;

      const resumo = calcularResumoProduto(produto, quantidade);
      const venda = calcularValorVendaProduto(produto, quantidade, resumo);
      nome = produto.nome;
      valorUnitario = venda.valorUnitario;
      subtotalBruto = venda.subtotalBruto;
      detalhesCusto = resumo;
    } else {
      const kit = state.kits.find((k) => k.id === itemId);
      if (!kit) return;

      const resumoKit = calcularResumoKit(kit, quantidade);
      nome = kit.nome;
      valorUnitario = resumoKit.valorUnitarioKit;
      subtotalBruto = resumoKit.valorTotalKit;
      detalhesKit = resumoKit.detalhes;
    }

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
      valorTotal,
      detalhesKit,
      detalhesCusto,
    });

    document.getElementById("orcamentoQtd").value = 1;
    document.getElementById("orcamentoDesconto").value = 0;

    renderTabelaOrcamento();
    renderPreviewOrcamento();
  });

  [
    "produtoNome",
    "produtoLargura",
    "produtoAltura",
    "produtoMargem",
    "produtoPapel",
    "produtoLucro",
    "produtoPrecoVenda",
    "produtoTempoProducao",
    "produtoCapacidadeManual",
    "produtoQtdPreview"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", atualizarResumoCadastroProduto);
      el.addEventListener("change", atualizarResumoCadastroProduto);
    }
  });

  document.getElementById("orcamentoCliente").addEventListener("input", renderPreviewOrcamento);
  document.getElementById("orcamentoObservacao").addEventListener("input", renderPreviewOrcamento);
  document.getElementById("btnSalvarOrcamento").addEventListener("click", salvarOrcamentoCompleto);
  document.getElementById("btnGerarImagemOrcamento").addEventListener("click", exportarImagemOrcamento);

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
