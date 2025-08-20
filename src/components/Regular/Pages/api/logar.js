// src/api/logar.js  (exemplo)
export async function logy(email, senha) {
  try {
    const res = await fetch("http://localhost:5000/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    // devolve o objecto inteiro; o componente LoginFuncionario espera { user: { id, funcao } } quando sucesso
    return data;
  } catch (err) {
    console.error("logy error:", err);
    return { erro: "Erro de rede" };
  }
}
