import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Badge,
  InputGroup,
  Spinner,
} from "react-bootstrap";
// Caminho corrigido para o componente de navegação
// Assumindo o nome de arquivo 'NAV.jsx' (com capitalização consistente, agora 'NAV.jsx' ou 'nav.jsx')
// Foi alterado para: "../NAV.jsx"
import DynamicNavbar from "../NAV.jsx"; 
import { useLocation, useNavigate } from "react-router-dom";
const API_BASE = "http://localhost:5002/admin";

// Componente de Gestão de Dívidas
export default function DebtManagementAdmin() {
  // --- Estados de Dados e UI ---
  const [dividas, setDividas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDivida, setSelectedDivida] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ valor: "", metodo: "Dinheiro", descricao: "" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const navigate = useNavigate();
  // --- Efeitos e Hooks ---
  useEffect(() => {
    fetchClientes();
    fetchDividas();
  }, []);

  useEffect(() => {
    // Apenas recarrega dívidas se o ID do cliente mudar e não for a primeira montagem
    if (selectedClienteId !== null) {
        fetchDividas(selectedClienteId);
    }
  }, [selectedClienteId]);

  // --- Funções Utilitárias ---
  const formatCurrency = (value) => {
    // CORREÇÃO: Utilizando o código de moeda ISO 4217 correto para Kwanza Angolano (AOA)
    return Number(value || 0).toLocaleString("pt-AO", { style: "currency", currency: "AOA" });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAGA": return <Badge bg="success">Paga</Badge>;
      case "PARCIALMENTE_PAGA": return <Badge bg="warning">Parcial</Badge>;
      case "ABERTA": return <Badge bg="danger">Aberta</Badge>;
      case "CANCELADA": return <Badge bg="secondary">Cancelada</Badge>;
      default: return <Badge bg="info">{status}</Badge>;
    }
  };

  const findClienteNome = (id) => {
    const cliente = clientes.find(c => c.id.toString() === id.toString());
    return cliente ? cliente.nome : "Cliente Não Encontrado";
  }

  // --- Funções de Fetch ---

  async function fetchClientes() {
    try {
      const res = await fetch(`${API_BASE}/clientes`);
      if (res.ok) {
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
    }
  }

  async function fetchDividas(clienteId = "") {
    setLoading(true);
    try {
      const url = clienteId 
        ? `${API_BASE}/dividas?clienteId=${clienteId}` 
        : `${API_BASE}/dividas`;
      
      const res = await fetch(url);
      const data = await res.json();
      setDividas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar dívidas:", err);
      setDividas([]);
    } finally {
      setLoading(false);
    }
  }
  
  // --- Relatórios ---
  async function generateDebtReport(type) {
    let clienteNome = '';
    const isClientReport = type === 'cliente' && selectedClienteId;
    
    if (isClientReport) {
        clienteNome = findClienteNome(selectedClienteId);
        if (clienteNome === "Cliente Não Encontrado") {
            // Em vez de alert(), use uma notificação ou modal de erro no app real
            alert("Selecione um cliente válido para gerar o relatório por cliente.");
            return;
        }
    }

    setReportLoading(true);
    try {
      // Rotas assumidas: GET /relatorios/dividas/geral e GET /relatorios/dividas/cliente/:id
      const endpoint = isClientReport 
        ? `${API_BASE}/relatorios/dividas/cliente/${selectedClienteId}`
        : `${API_BASE}/relatorios/dividas/geral`;
        
      const res = await fetch(endpoint);
      
      if (res.ok) {
        // Assume que a API retorna um objeto com uma URL de PDF
        const data = await res.json();
        if (data.url) {
            window.open("http://localhost:5002" + data.url, "_blank");
            alert(`Relatório ${isClientReport ? `do Cliente: ${clienteNome}` : 'Geral'} gerado com sucesso!`);
        } else {
            alert("A API não retornou uma URL de relatório válida.");
        }
      } else {
        const errorData = await res.json();
        alert(`Erro ao gerar relatório: ${errorData.erro || res.statusText}`);
      }
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      alert("Erro de conexão ou sistema ao gerar relatório.");
    } finally {
      setReportLoading(false);
    }
  }


  // --- Ações (Pagamento) ---
  
  function openPaymentModal(divida) {
    if (divida.status === 'PAGA') {
        alert(`A dívida #${divida.id} já está paga.`);
        return;
    }
    setSelectedDivida(divida);
    setPaymentForm({ 
        // Define o valor em aberto como default para pagamento total
        valor: divida.valorEmAberto, 
        metodo: "Dinheiro", 
        descricao: `Pagamento da Dívida #${divida.id}` 
    });
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setSelectedDivida(null);
    setPaymentForm({ valor: "", metodo: "Dinheiro", descricao: "" });
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault();
    if (!selectedDivida || !paymentForm.valor || Number(paymentForm.valor) <= 0) {
        alert("O valor de pagamento deve ser positivo.");
        return;
    }
    
    const valorPagar = Number(paymentForm.valor);
    if (valorPagar > selectedDivida.valorEmAberto + 0.01) { // Adiciona pequena tolerância de ponto flutuante
        alert(`O valor de pagamento (${formatCurrency(valorPagar)}) excede o saldo devedor (${formatCurrency(selectedDivida.valorEmAberto)}). Ajuste o valor.`);
        return;
    }

    setPaymentLoading(true);

    try {
      const payload = {
        dividaId: selectedDivida.id,
        valor: valorPagar,
        metodo: paymentForm.metodo,
        descricao: paymentForm.descricao,
      };

      // Rota assumida: POST /pagamentos
      const res = await fetch(`${API_BASE}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        // Substitua por um toast/notificação em app real
        alert("Pagamento registrado com sucesso! Saldo atualizado."); 
        closePaymentModal();
        fetchDividas(selectedClienteId); // Recarrega a lista
      } else {
        alert(`Erro ao registrar pagamento: ${data.erro || "Verifique o servidor."}`);
      }
    } catch (err) {
      console.error("Erro ao pagar:", err);
      alert("Erro de conexão ou sistema ao registrar pagamento.");
    } finally {
      setPaymentLoading(false);
    }
  }

  // --- Renderização ---
  return (
    <>
      <DynamicNavbar />

      <Container className="py-4">
        <h2 className="mb-4">Gestão de Dívidas a Receber</h2>
        <Card className="p-3 mb-4 shadow-sm">
  <h5 className="mb-3">Ações</h5>
  <div className="d-flex flex-wrap gap-2">
    <Button variant="primary" onClick={() => navigate("/office/admin/divida/criar")}>
      Criar Dívida Manual
    </Button>
    <Button variant="success" onClick={() => navigate("/office/admin/vendas/divida")}>
      Fazer Venda com Dívida
    </Button>
    <Button variant="warning" onClick={() => fetchDividas()}>
      Pagar / Ver Dívidas
    </Button>
  </div>
</Card>

        {/* Card de Filtro e Relatórios */}
        <Card className="p-3 shadow-sm mb-4">
          <Row className="align-items-center g-3">
            <Col md={4}>
              <h5 className="mb-md-0">Filtro de Dívidas</h5>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>Cliente</InputGroup.Text>
                <Form.Select
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                >
                  <option value="">-- Todas as Dívidas --</option>
                  {(clientes || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={4} className="text-md-end">
                <Button 
                    variant="info" 
                    onClick={() => generateDebtReport('geral')} 
                    className="me-2"
                    disabled={reportLoading}
                >
                    {reportLoading ? <Spinner animation="border" size="sm" /> : "Relatório Geral"}
                </Button>
                <Button 
                    variant="secondary" 
                    onClick={() => generateDebtReport('cliente')} 
                    disabled={reportLoading || !selectedClienteId}
                >
                    {reportLoading ? <Spinner animation="border" size="sm" /> : "Relatório Cliente"}
                </Button>
            </Col>
          </Row>
        </Card>

        {/* Lista de Dívidas */}
        <Card className="p-3 shadow-sm">
          <h5 className="mb-3">Dívidas {selectedClienteId ? `de ${findClienteNome(selectedClienteId)}` : 'em Aberto/Parcialmente Pagas'}</h5>
          
          {loading ? (
            <p className="text-center"><Spinner animation="border" size="sm" /> Carregando dívidas...</p>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Venda Ref.</th>
                      <th>Total (AOA)</th>
                      <th>Aberto (AOA)</th>
                      <th>Vencimento</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dividas.length === 0 ? (
                        <tr><td colSpan="8" className="text-center text-muted">Nenhuma dívida encontrada para os critérios selecionados.</td></tr>
                    ) : (
                        dividas.map((d) => (
                          <tr key={d.id}>
                            <td>{d.id}</td>
                            <td>{d.Cliente?.nome || "Desconhecido"}</td>
                            <td>{d.VendaId ? `#${d.VendaId}` : '-'}</td>
                            {/* Agora mostra o valor formatado com o símbolo Kz */}
                            <td>{formatCurrency(d.valor)}</td>
                            <td className={d.valorEmAberto > 0 ? 'fw-bold text-danger' : 'text-success'}>
                                {formatCurrency(d.valorEmAberto)}
                            </td>
                            <td>{new Date(d.dataVencimento).toLocaleDateString()}</td>
                            <td>{getStatusBadge(d.status)}</td>
                            <td>
                              <Button 
                                size="sm" 
                                variant="primary" 
                                onClick={() => openPaymentModal(d)}
                                disabled={d.status === 'PAGA' || d.valorEmAberto <= 0}
                              >
                                Pagar
                              </Button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </Table>
            </div>
          )}
        </Card>
      </Container>
      
      {/* Modal de Pagamento */}
      <Modal show={showPaymentModal} onHide={closePaymentModal} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Pagamento para Dívida #{selectedDivida?.id}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePaymentSubmit}>
        <Modal.Body>
            <p><strong>Cliente:</strong> {selectedDivida?.Cliente?.nome || "N/A"}</p>
            <p><strong>Valor Total:</strong> {formatCurrency(selectedDivida?.valor)}</p>
            <p className="fw-bold text-danger"><strong>Valor em Aberto:</strong> {formatCurrency(selectedDivida?.valorEmAberto)}</p>
            
            <hr />

            <Form.Group className="mb-3">
              <Form.Label>Valor do Pagamento</Form.Label>
              <Form.Control 
                type="number"
                step="0.01"
                min="0.01"
                // Max é o valor em aberto
                max={selectedDivida?.valorEmAberto} 
                required
                value={paymentForm.valor}
                onChange={(e) => setPaymentForm({...paymentForm, valor: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Método de Pagamento</Form.Label>
              <Form.Control 
                type="text"
                value={paymentForm.metodo}
                onChange={(e) => setPaymentForm({...paymentForm, metodo: e.target.value})}
                placeholder="Ex: TPA, Dinheiro, Transferência"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descrição/Observação</Form.Label>
              <Form.Control 
                as="textarea"
                rows={2}
                value={paymentForm.descricao}
                onChange={(e) => setPaymentForm({...paymentForm, descricao: e.target.value})}
              />
            </Form.Group>

            <div className="mt-3 p-2 border rounded bg-light">
                <h6 className="mb-0">Resumo após este pagamento:</h6>
                <p className="mb-0 text-success">Valor a Pagar: {formatCurrency(paymentForm.valor)}</p>
                <p className="mb-0 text-info fw-bold">Novo Saldo Devedor: {formatCurrency(Math.max(0, (selectedDivida?.valorEmAberto || 0) - Number(paymentForm.valor || 0)))}</p>
            </div>


        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closePaymentModal}>
            Cancelar
          </Button>
          <Button variant="success" type="submit" disabled={paymentLoading}>
            {paymentLoading ? 'Registrando...' : 'Confirmar Pagamento'}
          </Button>
        </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
