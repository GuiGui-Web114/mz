// AdminEstoque.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Modal } from 'react-bootstrap';

export default function AdminEstoque() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState({ tipo: 'entrada', item_id: '', quantidade: '', custo_total: '' });
  const [historyData, setHistoryData] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    setLoading(true);
    const res = await fetch('/admin/estoque/status');
    const data = await res.json();
    setItems(data.geral);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const url = `/admin/estoque/${entry.tipo === 'devolucao' ? 'entrada' : entry.tipo}`;
    const payload = {
      funcionarioId: 1,
      item_id: entry.item_id,
      quantidade: Number(entry.quantidade),
      destino: entry.tipo === 'devolucao' ? 'Devolução' : 'Produção',
      custo_total: entry.tipo === 'entrada' ? Number(entry.custo_total || 0) : undefined
    };
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setEntry({ tipo: 'entrada', item_id: '', quantidade: '', custo_total: '' });
    fetchStatus();
  }

  async function handleHistory(item) {
    const res = await fetch(`/admin/estoque/history/${item.id}`);
    setHistoryData(await res.json());
    setShowHistory(true);
  }

  return (
    <Container className="py-4">
      <h2>Admin - Estoque</h2>
      <Row>
        <Col md={6}>
          <Card className="p-3">
            <Form onSubmit={handleSubmit}>
              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select value={entry.tipo} onChange={e => setEntry({ ...entry, tipo: e.target.value })}>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="devolucao">Devolução</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Produto</Form.Label>
                <Form.Control value={entry.item_id} onChange={e => setEntry({ ...entry, item_id: e.target.value })} required />
              </Form.Group>
              <Form.Group>
                <Form.Label>Quantidade</Form.Label>
                <Form.Control type="number" value={entry.quantidade} onChange={e => setEntry({ ...entry, quantidade: e.target.value })} required />
              </Form.Group>
              {entry.tipo === 'entrada' && <Form.Group>
                <Form.Label>Custo Total</Form.Label>
                <Form.Control type="number" step="0.01" value={entry.custo_total} onChange={e => setEntry({ ...entry, custo_total: e.target.value })} />
              </Form.Group>}
              <Button type="submit" className="mt-2">Enviar</Button>
            </Form>
          </Card>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          {!loading && <Table bordered>
            <thead><tr><th>Produto</th><th>Saldo</th><th>Ações</th></tr></thead>
            <tbody>
              {items.map(i => <tr key={i.id}>
                <td>{i.nome}</td>
                <td>{i.saldo_atual}</td>
                <td><Button size="sm" onClick={() => handleHistory(i)}>Histórico</Button></td>
              </tr>)}
            </tbody>
          </Table>}
        </Col>
      </Row>
      <Modal show={showHistory} onHide={() => setShowHistory(false)}>
        <Modal.Header closeButton><Modal.Title>Histórico</Modal.Title></Modal.Header>
        <Modal.Body>
          <Table><thead><tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Destino</th></tr></thead>
          <tbody>
            {historyData.map((h, i) => <tr key={i}>
              <td>{new Date(h.createdAt).toLocaleString()}</td>
              <td>{h.tipo}</td>
              <td>{h.quantidade}</td>
              <td>{h.destino || h.custo_total}</td>
            </tr>)}
          </tbody></Table>
        </Modal.Body>
        <Modal.Footer><Button onClick={() => setShowHistory(false)}>Fechar</Button></Modal.Footer>
      </Modal>
    </Container>
  );
}

