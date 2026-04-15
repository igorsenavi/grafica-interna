const STORAGE_KEYS = {
  materias: "grafica_materias",
  produtos: "grafica_produtos",
  papeis: "grafica_papeis",
};

let materiasTemporariasProduto = [];

function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function uid() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

function calcularPrecoProduto(produto, materias) {
  let custoBase = 0;

  produto.materias.forEach((item) => {
    const materia = materias.find((m) => m.id === item.materiaId);
    if (materia) {
      custoBase += Number(materia.custo) * Number(item.quantidade);
    }
  });

  const custoFixo = custoBase * (Number(produto.custoFixo) / 100);
  const custoVariavel = custoBase * (Number(produto.custoVariavel) / 100);
  const subtotal = custoBase + custoFixo + custoVariavel;
  const lucro = subtotal * (Number(produto.lucro) / 100);
  const precoVenda = subtotal + lucro;

  return {
    custoBase,
    subtotal,
    precoVenda,
  };
}

function updateDashboard() {
  document.getElementById("totalMaterias").textContent = getData(STORAGE_KEYS.materias).length;
  document.getElementById("totalProdutos").textContent = getData(STORAGE_KEYS.produtos).length;
  document.getElementById("totalPapeis").textContent = getData(STORAGE_KEYS.papeis).length;
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
            <span>Custo: ${formatCurrency(item.custo)}</span>
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
  const materias = getData(STORAGE_KEYS.materias).filter((item) => item.id !== id);
  setData(STORAGE_KEYS.materias, materias);
  renderMaterias();
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

function r3t24NpUrJMNunMMASmhAM953bFGeLXzN7() {
  const container = document.getElementById("materiasDoProduto");
  const materias = getData(STORAGE_KEYS.materias);

  if (!materiasTemporariasProduto.length) {
    container.innerHTML = `<p class="empty">Nenhuma matéria-prima adicionada ao produto.</p>`;
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
            <span>Quantidade: ${item.quantidade}</span>
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
  const materias = getData(STORAGE_KEYS.materias);

  if (!produtos.length) {
    lista.innerHTML = `<p class="empty">Nenhum produto cadastrado.</p>`;
    return;
  }

  lista.innerHTML = `
    <div class="product-list">
      ${produtos
        .map((produto) => {
          const calculo = calcularPrecoProduto(produto, materias);

          const tagsMaterias = produto.materias
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
                <span>Custo base: ${formatCurrency(calculo.custoBase)}</span>
                <span>Preço sugerido: ${formatCurrency(calculo.precoVenda)}</span>
                <span>Fixos: ${produto.custoFixo}% | Variáveis: ${produto.custoVariavel}% | Lucro: ${produto.lucro}%</span>
                <div>${tagsMaterias}</div>
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
}

function removerProduto(id) {
  const produtos = getData(STORAGE_KEYS.produtos).filter((item) => item.id !== id);
  setData(STORAGE_KEYS.produtos, produtos);
  renderProdutos();
  updateDashboard();
}

function renderPapeis() {
  const lista = document.getElementById("listaPapeis");
  const papeis = getData(STORAGE_KEYS.papeis);
  const select = document.getElementById("papelAproveitamentoSelect");

  if (!papeis.length) {
    lista.innerHTML = `<p class="empty">Nenhum papel cadastrado.</p>`;
    select.innerHTML = `<option value="">Cadastre um papel primeiro</option>`;
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
            <span>Valor por folha A4: ${formatCurrency(papel.valor)}</span>
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

  select.innerHTML = papeis
    .map((papel) => `<option value="${papel.id}">${papel.nome} - ${formatCurrency(papel.valor)}</option>`)
    .join("");
}

function removerPapel(id) {
  const papeis = getData(STORAGE_KEYS.papeis).filter((item) => item.id !== id);
  setData(STORAGE_KEYS.papeis, papeis);
  renderPapeis();
  updateDashboard();
}

function calcularAproveitamento({ largura, altura, margem, papelValor }) {
  const a4Largura = 21;
  const a4Altura = 29.7;

  const larguraComMargem = Number(largura) + Number(margem);
  const alturaComMargem = Number(altura) + Number(margem);

  const qtdNormal =
    Math.floor(a4Largura / larguraComMargem) * Math.floor(a4Altura / alturaComMargem);

  const qtdRotacionada =
    Math.floor(a4Largura / alturaComMargem) * Math.floor(a4Altura / larguraComMargem);

  const melhorQtd = Math.max(qtdNormal, qtdRotacionada);

  const areaItem = Number(largura) * Number(altura);
  const areaTotalItens = melhorQtd * areaItem;
  const areaFolha = a4Largura * a4Altura;
  const aproveitamento = areaFolha > 0 ? (areaTotalItens / areaFolha) * 100 : 0;
  const custoItem = melhorQtd > 0 ? Number(papelValor) / melhorQtd : 0;

  return {
    itensPorFolha: melhorQtd,
    custoItem,
    aproveitamento,
  };
}

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

  if (!materiasTemporariasProduto.length) {
    alert("Adicione pelo menos uma matéria-prima ao produto.");
    return;
  }

  const produtos = getData(STORAGE_KEYS.produtos);

  const novoProduto = {
    id: uid(),
    nome: document.getElementById("produtoNome").value.trim(),
    custoFixo: Number(document.getElementById("produtoCustoFixo").value),
    custoVariavel: Number(document.getElementById("produtoCustoVariavel").value),
    lucro: Number(document.getElementById("produtoLucro").value),
    materias: [...materiasTemporariasProduto],
  };

  produtos.push(novoProduto);
  setData(STORAGE_KEYS.produtos, produtos);

  e.target.reset();
  materiasTemporariasProduto = [];
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
  renderProdutos();
  updateDashboard();
});

document.getElementById("formPapel").addEventListener("submit", (e) => {
  e.preventDefault();

  const papeis = getData(STORAGE_KEYS.papeis);

  const novoPapel = {
    id: uid(),
    nome: document.getElementById("papelNome").value.trim(),
    valor: Number(document.getElementById("papelValor").value),
  };

  papeis.push(novoPapel);
  setData(STORAGE_KEYS.papeis, papeis);

  e.target.reset();
  renderPapeis();
  updateDashboard();
});

document.getElementById("formAproveitamento").addEventListener("submit", (e) => {
  e.preventDefault();

  const largura = Number(document.getElementById("itemLargura").value);
  const altura = Number(document.getElementById("itemAltura").value);
  const margem = Number(document.getElementById("itemMargem").value);
  const papelId = document.getElementById("papelAproveitamentoSelect").value;

  const papeis = getData(STORAGE_KEYS.papeis);
  const papel = papeis.find((p) => p.id === papelId);

  if (!papel) {
    alert("Selecione um papel.");
    return;
  }

  const resultado = calcularAproveitamento({
    largura,
    altura,
    margem,
    papelValor: papel.valor,
  });

  document.getElementById("resultadoItensFolha").textContent = resultado.itensPorFolha;
  document.getElementById("resultadoCustoItem").textContent = formatCurrency(resultado.custoItem);
  document.getElementById("resultadoAproveitamento").textContent =
    `${resultado.aproveitamento.toFixed(2)}%`;
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
  renderMaterias();
  renderProdutos();
  renderPapeis();
  r3t24NpUrJMNunMMASmhAM953bFGeLXzN7();
  updateDashboard();
}

init();
