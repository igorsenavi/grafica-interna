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
  };

  const { data, error } = await supabase
    .from("configuracoes")
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* MATÉRIAS-PRIMAS */
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

export async function deleteMateria(id) {
  const { error } = await supabase
    .from("materias_primas")
    .delete()
    .eq("id", id);

  if (error) throw error;
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

export async function deletePapel(id) {
  const { error } = await supabase
    .from("papeis")
    .delete()
    .eq("id", id);

  if (error) throw error;
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

export async function deleteProduto(id) {
  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ORÇAMENTOS */
export async function listOrcamentos() {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function saveOrcamento(payload) {
  const userId = await currentUserId();

  const insertPayload = {
    user_id: userId,
    produto_id: payload.produto.id,
    quantidade: payload.quantidade,
    resultado: payload,
  };

  const { data, error } = await supabase
    .from("orcamentos")
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrcamento(id) {
  const { error } = await supabase
    .from("orcamentos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
