const BASE_URL = "http://127.0.0.1:5000/admin";

// Vendas por mês
export const getVendasMensais = async () => {
  try {
    const res = await fetch(`${BASE_URL}/vendas-mes`);
    return await res.json();
  } catch (error) {
    console.error("Erro ao buscar vendas por mês:", error);
    return [];
  }
};

// Produtos mais vendidos
export const getProdutosMaisVendidos = async () => {
  try {
    const res = await fetch(`${BASE_URL}/mais-vendidos`);
    return await res.json();
  } catch (error) {
    console.error("Erro ao buscar mais vendidos:", error);
    return [];
  }
};

// Gastos por mês
export const getGastosMensais = async () => {
  try {
    const res = await fetch(`${BASE_URL}/gastos-mes`);
    return await res.json();
  } catch (error) {
    console.error("Erro ao buscar gastos por mês:", error);
    return [];
  }
};

// Receita líquida por mês
export const getReceitaLiquidaMensal = async () => {
  try {
    const res = await fetch(`${BASE_URL}/receita-liquida`);
    return await res.json();
  } catch (error) {
    console.error("Erro ao calcular receita líquida:", error);
    return [];
  }
};
