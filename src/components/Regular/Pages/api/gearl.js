const BASE = "http://127.0.0.1:5002/admin";

// === PRODUTOS ===
export const getProdutos = async () => {
  const res = await fetch(`${BASE}/produtos`);
  return res.json();
};

export const getProdutoById = async (id) => {
  const res = await fetch(`${BASE}/produtos/${id}`);
  return res.json();
};

export const atualizarProduto = async (id, dados) => {
  const res = await fetch(`${BASE}/produtos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return res.json();
};

export const desativarProduto = async (id) => {
  const res = await fetch(`${BASE}/produtos/${id}`, {
    method: "DELETE",
  });
  return res.json();
};

// === USUÁRIOS ===
export const getUsuarios = async () => {
  const res = await fetch(`${BASE}/usuarios`);
  return res.json();
};

export const atualizarUsuario = async (id, dados) => {
  const res = await fetch(`${BASE}/usuarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return res.json();
};

// === VENDAS ===
export const getVendas = async () => {
  const res = await fetch(`${BASE}/vendas2`);
  return res.json();
};

// === ENCOMENDAS ===
export const getEncomendas = async () => {
  const res = await fetch(`${BASE}/encomendas`);
  return res.json();
};

export const atualizarEncomenda = async (id, dados) => {
  const res = await fetch(`${BASE}/encomendas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return res.json();
};

// === GASTOS ===
export const getGastos = async () => {
  const res = await fetch(`${BASE}/gastos`);
  return res.json();
};

export const atualizarGasto = async (id, dados) => {
  const res = await fetch(`${BASE}/gastos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return res.json();
};

export const deletarGasto = async (id) => {
  const res = await fetch(`${BASE}/gastos/${id}`, {
    method: "DELETE",
  });
  return res.json();
};
