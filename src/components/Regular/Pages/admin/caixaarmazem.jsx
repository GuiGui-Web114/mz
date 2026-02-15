import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Button, Table, Form, Card, Modal
} from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DynamicNavbar from '../NAV.jsx';

const caixaItems = [
  'Farinha', 'Fermento', 'Sal', 'Óleo', 'Ovo',
  'Fubá', 'Queijo', 'Sacos', 'Gelo', 'Lâmina'
];

export default function EstoqueCaixa() {
  const [items, setItems] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState({ item_id: '', quantidade: '' });
  const [showSaldo, setShowSaldo] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchHistorico();
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5002/admin/estoque/status');
      const { geral } = await res.json();
      setItems(geral);
    } catch (err) {
      console.error('fetchStatus error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistorico() {
    try {
      const res = await fetch('http://localhost:5002/admin/estoque/historico');
      const data = await res.json();
      setHistorico(data);
    } catch (err) {
      console.error('fetchHistorico error:', err);
    }
  }

  async function handleCaixaSubmit(e) {
    e.preventDefault();
    const { item_id, quantidade } = entry;
    if (!item_id || !quantidade) return;

    try {
      await fetch('http://localhost:5002/admin/estoque/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionarioId: 2, // Caixa
          item_id,
          quantidade: Number(quantidade),
          tipo: 'entrada'
        })
      });
      setEntry({ item_id: '', quantidade: '' });
      fetchStatus();
      fetchHistorico();
    } catch (err) {
      console.error('handleCaixaSubmit error:', err);
    }
  }

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Relatório de Estoque e Histórico', 10, 20);

    // Estoque atual
    doc.setFontSize(12);
    doc.text('Estoque Atual', 10, 30);
    autoTable(doc, {
      startY: 35,
      head: [['Produto', 'Saldo']],
      body: items.map(i => [i.nome, i.saldo_atual]),
      styles: { fontSize: 10 }
    });

    // Histórico
    const finalY = doc.lastAutoTable.finalY + 10 || 60;
    doc.text('Histórico de Entradas e Saídas', 10, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Data', 'Produto', 'Tipo', 'Quantidade', 'Funcionário']],
      body: historico.map(h => [
        new Date(h.data).toLocaleDateString(),
        h.item?.nome || h.item_id,
        h.tipo,
        h.quantidade,
        h.funcionario?.nome || 'Caixa'
      ]),
      styles: { fontSize: 10 }
    });

    doc.save(`estoque-historico-${Date.now()}.pdf`);
  };

  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <h2 className="text-primary mb-4">Estoque - Caixa</h2>

        <Row className="mt-3">
          <Col md={6}>
            <Card className="p-3 shadow-sm rounded-2xl">
              <Form onSubmit={handleCaixaSubmit}>
              <Form.Group className="mb-2">
  <Form.Label>Produto</Form.Label>
  <Form.Control
    type="text"
    placeholder="Digite o nome do produto"
    value={entry.item_id}
    onChange={e => setEntry({ ...entry, item_id: e.target.value })}
    required
    disabled={loading}
  />
</Form.Group>


                <Form.Group className="mb-2">
                  <Form.Label>Quantidade</Form.Label>
                  <Form.Control
                    type="number"
                    value={entry.quantidade}
                    onChange={e => setEntry({ ...entry, quantidade: e.target.value })}
                    required
                  />
                </Form.Group>

                <Button type="submit" className="w-100">Registrar Entrada</Button>
              </Form>
            </Card>
          </Col>

          <Col md={6} className="d-flex flex-column gap-2">
            <Button variant="info" onClick={() => setShowSaldo(true)}>
              Ver Saldo Atual
            </Button>
            <Button variant="dark" onClick={gerarPDF}>
              Gerar PDF Estoque + Histórico
            </Button>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col>
            <h5>Histórico de Entradas/Saídas</h5>
            {!loading && (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Funcionário</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map(h => (
                    <tr key={h.id}>
                      <td>{new Date(h.data).toLocaleDateString()}</td>
                      <td>{h.item?.nome || h.item_id}</td>
                      <td>{h.tipo}</td>
                      <td>{h.quantidade}</td>
                      <td>{h.funcionario?.nome || 'Caixa'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Col>
        </Row>

        <Modal show={showSaldo} onHide={() => setShowSaldo(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Saldo Atual do Estoque</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr><th>Produto</th><th>Saldo Atual</th></tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id}>
                    <td>{i.nome}</td>
                    <td>{i.saldo_atual}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSaldo(false)}>Fechar</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
