import { supabase } from "./supabaseClient.js";

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Usuário não autenticado.");
  return data.user.id;
}

/* CONFIGURAÇÕES */
export async function fetchConfiguracoes() {
  const userId = await currentUserId();

  const { data, error } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveConfiguracoes(payload) {
  const userId = await currentUserId();
  const atual = await fetchConfiguracoes();

  if (atual?.id) {
    const { data, error } = await supabase
      .from("configuracoes")
      .update({
        custo_tanque: payload.custo_tanque,
        rendimento_folhas: payload.rendimento_folhas,
        custo_fixo_padrao: payload.custo_fixo_padrao,
        custo_variavel_padrao: payload.custo_variavel_padrao,
      })
      .eq("id", atual.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const insertPayload = {
    user_id: userId,
    custo_tanque: payload.custo_tanque,
    rendimento_folhas: payload.rendimento_folhas,
    custo_fixo_padrao: payload.custo_fixo_padrao,
    custo_variavel_padrao: payload.custo_variavel_padrao,
  };

  const { data, error } = await supabase
    .from("configuracoes")
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* MATÉRIAS */
export async function listMaterias() {
  const { data, error } = await supabase
    .from("materias_primas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function upsertMateria(payload) {
  const userId = await currentUserId();

  if (payload.id) {
    const { data, error } = await supabase
      .from("materias_primas")
      .update({
        nome: payload.nome,
        unidade: payload.unidade,
        custo: payload.custo,
        observacao: payload.observacao,
      })
      .eq("id", payload.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const insertPayload = {
    user_id: userId,
    nome: payload.nome,
    unidade: payload.unidade,
    custo: payload.custo,
    observacao: payload.observacao,
  };

  const { data, error } = await supabase
    .from("materias_primas")
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* PAPÉIS */
export async function listPapeis() {
  const { data, error } = await supabase
    .from("papeis")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function upsertPapel(payload) {
  const userId = await currentUserId();

  if (payload.id) {
    const { data, error } = await supabase
      .from("papeis")
      .update({
        nome: payload.nome,
        gramatura: payload.gramatura,
        largura: payload.largura,
        altura: payload.altura,
        valor_folha: payload.valor_folha,
        observacao: payload.observacao,
      })
      .eq("id", payload.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const insertPayload = {
    user_id: userId,
    nome: payload.nome,
    gramatura: payload.gramatura,
    largura: payload.largura,
    altura: payload.altura,
    valor_folha: payload.valor_folha,
    observacao: payload.observacao,
  };

  const { data, error } = await supabase
    .from("papeis")
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* PRODUTOS */
export async function listProdutos() {
  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!produtos?.length) return [];

  const ids = produtos.map((p) => p.id);

  const { data: materiais, error: errorMateriais } = await supabase
    .from("produto_materiais")
    .select("*")
    .in("produto_id", ids);

  if (errorMateriais) throw errorMateriais;

  return produtos.map((produto) => ({
    ...produto,
    materiaisExtras: (materiais ?? []).filter((m) => m.produto_id === produto.id),
  }));
}

export async function upsertProduto(payload) {
  const userId = await currentUserId();
  let produtoId = payload.id;

  if (produtoId) {
    const { error } = await supabase
      .from("produtos")
      .update({
        nome: payload.nome,
        largura: payload.largura,
        altura: payload.altura,
        margem: payload.margem,
        papel_id: payload.papel_id,
        custo_fixo: payload.custo_fixo,
        custo_variavel: payload.custo_variavel,
        lucro: payload.lucro,
      })
      .eq("id", produtoId);

    if (error) throw error;

    const { error: delError } = await supabase
      .from("produto_materiais")
      .delete()
      .eq("produto_id", produtoId);

    if (delError) throw delError;
  } else {
    const insertPayload = {
      user_id: userId,
      nome: payload.nome,
      largura: payload.largura,
      altura: payload.altura,
      margem: payload.margem,
      papel_id: payload.papel_id,
      custo_fixo: payload.custo_fixo,
      custo_variavel: payload.custo_variavel,
      lucro: payload.lucro,
    };

    const { data, error } = await supabase
      .from("produtos")
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;
    produtoId = data.id;
  }

  if (payload.materiaisExtras?.length) {
    const rows = payload.materiaisExtras.map((item) => ({
      user_id: userId,
      produto_id: produtoId,
      materia_id: item.materia_id,
      quantidade: item.quantidade,
    }));

    const { error } = await supabase
      .from("produto_materiais")
      .insert(rows);

    if (error) throw error;
  }

  return produtoId;
}

/* KITS */
export async function listKits() {
  const { data: kits, error } = await supabase
    .from("kits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!kits?.length) return [];

  const ids = kits.map((k) => k.id);

  const { data: itens, error: errorItens } = await supabase
    .from("kit_itens")
    .select("*")
    .in("kit_id", ids);

  if (errorItens) throw errorItens;

  return kits.map((kit) => ({
    ...kit,
    itens: (itens ?? []).filter((i) => i.kit_id === kit.id),
  }));
}

export async function upsertKit(payload) {
  const userId = await currentUserId();
  let kitId = payload.id;

  if (kitId) {
    const { error } = await supabase
      .from("kits")
      .update({ nome: payload.nome })
      .eq("id", kitId);

    if (error) throw error;

    const { error: delError } = await supabase
      .from("kit_itens")
      .delete()
      .eq("kit_id", kitId);

    if (delError) throw delError;
  } else {
    const { data, error } = await supabase
      .from("kits")
      .insert([{ user_id: userId, nome: payload.nome }])
      .select()
      .single();

    if (error) throw error;
    kitId = data.id;
  }

  if (payload.itens?.length) {
    const rows = payload.itens.map((item) => ({
      user_id: userId,
      kit_id: kitId,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
    }));

    const { error } = await supabase.from("kit_itens").insert(rows);
    if (error) throw error;
  }

  return kitId;
}

/* ORÇAMENTOS */
export async function listOrcamentos() {
  const { data: orcamentos, error } = await supabase
    .from("orcamentos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!orcamentos?.length) return [];

  const ids = orcamentos.map((o) => o.id);

  const { data: itens, error: errorItens } = await supabase
    .from("orcamento_itens")
    .select("*")
    .in("orcamento_id", ids);

  if (errorItens) throw errorItens;

  return orcamentos.map((orcamento) => ({
    ...orcamento,
    itens: (itens ?? []).filter((i) => i.orcamento_id === orcamento.id),
  }));
}

export async function saveOrcamento(payload) {
  const userId = await currentUserId();

  const { data: orcamento, error } = await supabase
    .from("orcamentos")
    .insert([{
      user_id: userId,
      produto_id: null,
      quantidade: 0,
      resultado: payload,
      cliente: payload.cliente || "",
      observacao: payload.observacao || "",
      subtotal_bruto: payload.subtotalBruto || 0,
      desconto_total: payload.descontoTotal || 0,
      total_final: payload.totalFinal || 0,
    }])
    .select()
    .single();

  if (error) throw error;

  if (payload.itens?.length) {
    const rows = payload.itens.map((item) => ({
      user_id: userId,
      orcamento_id: orcamento.id,
      tipo: item.tipo,
      referencia_id: item.itemId,
      nome: item.nome,
      quantidade: item.quantidade,
      valor_unitario: item.valorUnitario,
      desconto: item.desconto,
      subtotal_bruto: item.subtotalBruto,
      valor_total: item.valorTotal,
    }));

    const { error: itensError } = await supabase
      .from("orcamento_itens")
      .insert(rows);

    if (itensError) throw itensError;
  }

  return orcamento;
}
