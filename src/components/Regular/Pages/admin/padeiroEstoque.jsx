// PadeiroEstoque.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert } from 'react-bootstrap';
import DynamicNavbar from '../NAV.jsx';

export default function PadeiroEstoque() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState({ tipo: 'saida', item_id: '', quantidade: '' });
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    setLoading(true);
    const res = await fetch('http://localhost:5002/admin/estoque/status');
    const data = await res.json();
    setItems(data.geral);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    const url = `http://localhost:5002/admin/estoque/${entry.tipo === 'devolucao' ? 'devolucao' : 'saida'}`;
    const payload = {
      funcionarioId: 2,
      item_id: entry.item_id,
      quantidade: Number(entry.quantidade),
      destino: entry.tipo === 'devolucao' ? 'Devolução' : 'Produção'
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok) {
      setMsg({ type: 'success', text: result.message || 'Operação registrada com sucesso.' });
      setEntry({ tipo: 'saida', item_id: '', quantidade: '' });
      fetchStatus();
    } else {
      setMsg({ type: 'danger', text: result.error || 'Erro ao registrar.' });
    }
  }

  return (<><DynamicNavbar/>
  <Container className="py-4">
      <h2>Padeiro — Controle de Estoque</h2>

      <Row>
        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <Form onSubmit={handleSubmit}>
              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select value={entry.tipo} onChange={e => setEntry({ ...entry, tipo: e.target.value })}>
                  <option value="saida">Saída</option>
                  <option value="devolucao">Devolução</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Produto</Form.Label>
                <Form.Select value={entry.item_id} onChange={e => setEntry({ ...entry, item_id: e.target.value })} required>
                  <option value="">-- Selecione --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.nome}>{i.nome}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Quantidade</Form.Label>
                <Form.Control type="number" min="0.01" step="0.01" value={entry.quantidade} onChange={e => setEntry({ ...entry, quantidade: e.target.value })} required />
              </Form.Group>

              <Button type="submit" className="mt-2 w-100">Registrar</Button>
            </Form>

            {msg && <Alert className="mt-3" variant={msg.type}>{msg.text}</Alert>}
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <h5>Saldo Atual</h5>
          {!loading ? (
            <Table striped bordered hover>
              <thead><tr><th>Produto</th><th>Saldo</th></tr></thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id}>
                    <td>{i.nome}</td>
                    <td>{i.saldo_atual}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : <p>Carregando...</p>}
        </Col>
      </Row>
    </Container>
  </>
    
  );
}
