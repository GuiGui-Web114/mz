import { useEffect, useState } from "react";
import { Container, Form, Button, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DynamicNavbar from "../NAV.jsx";

function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [form, setForm] = useState({ tipo: "", valor: "", data: "" });
  const [carregando, setCarregando] = useState(false);
  const API = "http://localhost:5002/admin/gastos";

  const tiposDeGasto = [
    "Energia",
    "Água",
    "Salários",
    "Manutenção",
    "Matéria-prima",
    "Transporte",
    "Outros"
  ];

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then(setGastos)
      .catch((err) => console.error("Erro ao buscar gastos:", err));
  }, []);

  const adicionar = async () => {
    if (!form.tipo || !form.valor || !form.data) return;

    const payload = {
      tipo: form.tipo,
      valor: parseFloat(form.valor),
      data: form.data,
    };

    try {
      setCarregando(true);
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao registrar gasto.");

      const novo = await res.json();
      setGastos((prev) => [...prev, novo]);
      setForm({ tipo: "", valor: "", data: "" });
    } catch (err) {
      alert("Falha ao adicionar gasto.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const total = gastos.reduce((soma, g) => {
    const valor = parseFloat(g.valor);
    return soma + (isNaN(valor) ? 0 : valor);
  }, 0);

  const navigate = useNavigate();
  function sairPadeiro() {
    navigate("/office/login");
    sessionStorage.clear();
  }

  return (
    <>
      <DynamicNavbar />
      <Container className="py-5">
        <h2 className="fw-bold mb-4">Registro de Gastos</h2>

        <Form className="mb-4">
          <Form.Group className="mb-2">
            <Form.Label>Tipo de Gasto</Form.Label>
            <Form.Select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="">Selecione o tipo</option>
              {tiposDeGasto.map((tipo, i) => (
                <option key={i} value={tipo}>
                  {tipo}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Valor (Kz)</Form.Label>
            <Form.Control
              type="number"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Data</Form.Label>
            <Form.Control
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
          </Form.Group>

          <Button onClick={adicionar} variant="dark" disabled={carregando}>
            {carregando ? "Salvando..." : "Registrar"}
          </Button>
        </Form>

        <h5 className="mb-3">
          Gastos do período: <strong>{total.toLocaleString()} Kz</strong>
        </h5>

        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map((g, i) => (
              <tr key={i}>
                <td>{g.tipo || g.categoria}</td>
                <td>{parseFloat(g.valor).toLocaleString()} Kz</td>
                <td>{new Date(g.data).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}

export default Gastos;
