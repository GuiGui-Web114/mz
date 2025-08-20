import { useState, useEffect } from "react";
import { Form, Button, Container } from "react-bootstrap";

export default function EstoqueCaixa() {
  const [itens, setItens] = useState([]);
  const [itemId, setItemId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [destino, setDestino] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/admin/estoque_itens");
        const data = await res.json();
        setItens(data);
      } catch {
        setMsg("Erro ao carregar itens.");
      }
    })();
  }, []);

  const registrarSaida = async () => {
    setMsg("");
    try {
      const res = await fetch("http://localhost:5000/admin/estoque/saida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          funcionario_id: sessionStorage.getItem("userId"),
          quantidade,
          destino,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Erro na saída");
      setMsg("✅ " + data.msg);
    } catch (err) {
      setMsg("❌ " + err.message);
    }
  };

  return (
    <Container>
      <h3>Registrar Saída para Produção (Caixa)</h3>
      {msg && <p>{msg}</p>}
      <Form>
        <Form.Select onChange={(e) => setItemId(e.target.value)} value={itemId}>
          <option>Selecione um item</option>
          {itens.map((i) => (
            <option key={i.id} value={i.id}>{i.nome}</option>
          ))}
        </Form.Select>
        <Form.Control
          placeholder="Quantidade"
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="my-2"
        />
        <Form.Control
          placeholder="Destino"
          type="text"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className="my-2"
        />
        <Button onClick={registrarSaida}>Registrar</Button>
      </Form>
    </Container>
  );
}
