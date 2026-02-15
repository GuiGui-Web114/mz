import { useState, useEffect } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";

export default function CriarDivida() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({
    clienteId: "",
    valor: "",
    descricao: "",
    dataVencimento: "",
  });

  useEffect(() => {
    fetch("http://localhost:5002/admin/clientes")
      .then(res => res.json())
      .then(setClientes);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5002/admin/dividas/criar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) alert("Dívida criada com sucesso!");
    else alert("Erro: " + data.erro);
  };

  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <Card className="p-4 shadow-sm">
          <h3>Criar Dívida Manual</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Cliente</Form.Label>
              <Form.Select value={form.clienteId} onChange={e => setForm({...form, clienteId: e.target.value})}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Valor</Form.Label>
              <Form.Control type="number" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Data de Vencimento</Form.Label>
              <Form.Control type="date" value={form.dataVencimento} onChange={e => setForm({...form, dataVencimento: e.target.value})} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Descrição</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
            </Form.Group>
            <Button className="mt-3" type="submit">Salvar Dívida</Button>
          </Form>
        </Card>
      </Container>
    </>
  );
}
