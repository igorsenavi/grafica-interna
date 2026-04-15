import { formatCurrency, percent } from "./calculations.js";

export function showAuthScreen() {
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("appScreen").classList.add("hidden");
}

export function showAppScreen(email) {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");
  document.getElementById("currentUserEmail").textContent = email || "";
}

export function setAuthMessage(message = "") {
  document.getElementById("authMessage").textContent = message;
}

export function bindTabs() {
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });
}

export function renderDashboard({ materias, papeis, produtos, orcamentos, configuracoes }) {
  document.getElementById("totalMaterias").textContent = materias.length;
  document.getElementById("totalPapeis").textContent = papeis.length;
  document.getElementById("totalProdutos").textContent = produtos.length;
  document.getElementById("totalOrcamentos").textContent = orcamentos.length;
  document.getElementById("dashCustoTanque").textContent = formatCurrency(configuracoes?.custo_tanque ?? 0);

  const tintaPorFolha =
    Number(configuracoes?.custo_tanque ?? 0) / Number(configuracoes?.rendimento_folhas || 1);

  document.getElementById("dashTintaFolha").textContent = formatCurrency(tintaPorFolha);
}

export function fillConfiguracoes(configuracoes) {
  document.getElementById("configCustoTanque").value = configuracoes?.custo_tanque ?? 160;
  document.getElementById("configRendimentoFolhas").value = configuracoes?.rendimento_folhas ?? 1000;
}

export function fillSelects({ materias, papeis, produtos }) {
  const materiaSelect = document.getElementById("produtoMateriaSelect");
  const papelSelect = document.getElementById("produtoPapel");
  const produtoSelect = document.getElementById("simulacaoProduto");

  materiaSelect.innerHTML = materias.length
    ? materias.map((m) => `<option value="${m.id}">${m.nome} - ${formatCurrency(m.custo)}</option>`).join("")
    : `<option value="">Cadastre uma matéria-prima primeiro</option>`;

  papelSelect.innerHTML = papeis.length
    ? papeis.map((p) => `<option value="${p.id}">${p.nome} - ${formatCurrency(p.valor_folha)}</option>`).join("")
    : `<option value="">Cadastre um papel primeiro</option>`;

  produtoSelect.innerHTML = produtos.length
    ? produtos.map((p) => `<option value="${p.id}">${p.nome}</option>`).join("")
    : `<option value="">Cadastre um produto primeiro</option>`;
}

export function renderMaterias(materias, handlers) {
  const lista = document.getElementById("listaMaterias");
  if (!materias.length) {
    lista.innerHTML = `<p class="empty">Nenhuma matéria-prima cadastrada.</p>`;
    return;
  }

  lista.innerHTML = materias.map((item) => `
    <div class="row">
      <div class="row-info">
        <strong>${item.nome}</strong>
        <span>Unidade: ${item.unidade}</span>
        <span>Custo por unidade: ${formatCurrency(item.custo)}</span>
        ${item.observacao ? `<span>Obs.: ${item.observacao}</span>` : ""}
      </div>
      <div class="row-actions">
        <button data-edit-materia="${item.id}">Editar</button>
        <button class="btn-danger" data-delete-materia="${item.id}">Excluir</button>
      </div>
    </div>
  `).join("");

  lista.querySelectorAll("[data-edit-materia]").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onEdit(btn.dataset.editMateria));
  });

  lista.querySelectorAll("[data-delete-materia]").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onDelete(btn.dataset.deleteMateria));
  });
}

export function renderPapeis(papeis, handlers) {
  const lista = document.getElementById("listaPapeis");
  if (!papeis.length) {
    lista.innerHTML = `<p class="empty">Nenhum papel cadastrado.</p>`;
    return;
  }

  lista.innerHTML = papeis.map((item) => `
    <div class="row">
      <div class="row-info">
        <strong>${item.nome}</strong>
        <span>Gramatura: ${item.gramatura || "-"}</span>
        <span>Tamanho: ${item.largura} x ${item.altura} cm</span>
        <span>Valor por folha: ${formatCurrency(item.valor_folha)}</span>
        ${item.observacao ? `<span>Obs.: ${item.observacao}</span>` : ""}
      </div>
      <div class="row-actions">
        <button data-edit-papel="${item.id}">Editar</button>
        <button class="btn-danger" data-delete-papel="${item.id}">Excluir</button>
      </div>
    </div>
  `).join("");

  lista.querySelectorAll("[data-edit-papel]").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onEdit(btn.dataset.editPapel));
  });

  lista.querySelectorAll("[data-delete-papel]").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onDelete(btn.dataset.deletePapel));
  });
}

export function r3t24NpUrJMNunMMASmhAM953bFGeLXzN7(materiaisTemporarios, materias, onRemove) {
  const container = document.getElementById("materiasDoProduto");

  if (!materiaisTemporarios.length) {
    container.innerHTML = `<p class="empty">Nenhum material extra adicionado ao produto.</p>`;
    return;
  }

  container.innerHTML = materiaisTemporarios.map((item, index) => {
    const materia = materias.find((m) => m.id === item.materia_id);
    return `
      <div class="row">
        <div class="row-info">
          <strong>${materia?.nome || "Matéria não encontrada"}</strong>
          <span>Quantidade: ${item.quantidade}</span>
        </div>
        <div class="row-actions">
          <button class="btn-danger" data-remove-temp="${index}">Remover</button>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll("[data-remove-temp]").forEach((btn) => {
    btn.addEventListener("click", () => onRemove(Number(btn.dataset.removeTemp)));
  });
}

export function renderProdutos(produtos, papeis, materias, handlers) {
  const lista = document.getElementById("listaProdutos");
  if (!produtos.length) {
    lista.innerHTML = `<p class="empty">Nenhum produto cadastrado.</p>`;
    return;
  }

  lista.innerHTML = produtos.map((produto) => {
    const papel = papeis.find((p) => p.id === produto.papel_id);
    const tags = (produto.materiaisExtras || []).map((item) => {
      const materia = materias.find((m) => m.id === item.materia_id);
      return `<span class="tag">${materia?.nome || "Item"} (${item.quantidade})</span>`;
    }).join("");

    return `
      <div class="row">
        <div class="row-info">
          <strong>${produto.nome}</strong>
          <span>Tamanho: ${produto.largura} x ${produto.altura} cm</span>
          <span>Margem: ${produto.margem} cm</span>
          <span>Papel: ${papel?.nome || "-"}</span>
          <span>Fixos: ${produto.custo_fixo}% | Variáveis: ${produto.custo_variavel}% | Lucro: ${produto.lucro}%</span>
          <div>${tags || '<span class="empty">Sem materiais extras.</span>'}</div>
        </div>
        <div class="row-actions">
          <button data-edit-produto="${produto.id}">Editar</button>
          <button class="btn-danger" data-delete-produto="${produto.id}">Excluir</button>
        </div>
      </div>
    `;
  }).join("");

  lista.querySelectorAll("[data-edit-produto]").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onEdit(btn.dataset.editProduto));
  });

  lista.querySelectorAll("[data-delete-produto]").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onDelete(btn.dataset.deleteProduto));
  });
}

export function renderResultado(resultado) {
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
    Para produzir <strong>${resultado.quantidade}</strong> unidade(s), o sistema calcula
    <strong>${resultado.folhasNecessarias}</strong> folha(s), com aproveitamento real de
    <strong>${percent(resultado.aproveitamentoReal)}</strong>.
  `;

  document.getElementById("btnSalvarOrcamento").disabled = false;
}

export function renderOrcamentos(orcamentos, handlers) {
  const lista = document.getElementById("listaOrcamentos");
  if (!orcamentos.length) {
    lista.innerHTML = `<p class="empty">Nenhum orçamento salvo.</p>`;
    return;
  }

  lista.innerHTML = orcamentos.map((orc) => {
    const r = orc.resultado;
    return `
      <div class="orcamento-card">
        <h4>${r.produto.nome}</h4>
        <p><strong>Salvo em:</strong> ${new Date(orc.created_at).toLocaleString("pt-BR")}</p>
        <div class="orcamento-meta">
          <span><strong>Quantidade:</strong> ${orc.quantidade}</span>
          <span><strong>Papel:</strong> ${r.papel.nome}</span>
          <span><strong>Cabem por folha:</strong> ${r.capacidadePorFolha}</span>
          <span><strong>Folhas necessárias:</strong> ${r.folhasNecessarias}</span>
          <span><strong>Aproveitamento:</strong> ${percent(r.aproveitamentoReal)}</span>
          <span><strong>Preço unitário:</strong> ${formatCurrency(r.precoSugeridoUnitario)}</span>
          <span><strong>Preço total:</strong> ${formatCurrency(r.precoSugeridoTotal)}</span>
          <span><strong>Custo total:</strong> ${formatCurrency(r.custoTotalPedido)}</span>
        </div>
        <div class="row-actions" style="margin-top:12px;">
          <button data-open-orc="${orc.id}">Reabrir</button>
          <button class="btn-danger" data-delete-orc="${orc.id}">Excluir</button>
        </div>
      </div>
    `;
  }).join("");

  lista.querySelectorAll("[data-open-orc]").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onOpen(btn.dataset.openOrc));
  });

  lista.querySelectorAll("[data-delete-orc]").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onDelete(btn.dataset.deleteOrc));
  });
}
