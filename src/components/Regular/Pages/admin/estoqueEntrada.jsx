// src/components/admin/ReportsAdmin.jsx
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
} from "react-bootstrap";
import DynamicNavbar from "../NAV.JSX";



export default function ReportsAdmin() {
  const [empresa, setEmpresa] = useState(null);

  // VENDAS
  const [periodo, setPeriodo] = useState("mes");
  const [vendas, setVendas] = useState([]);
  const [vendasLoading, setVendasLoading] = useState(false);

  // MATERIAIS (para proforma)
  const [materiais, setMateriais] = useState([]);
  const [materiaisLoading, setMateriaisLoading] = useState(false);

  // Proforma form
  const [proformaCliente, setProformaCliente] = useState("");
  const [proformaItens, setProformaItens] = useState([]); // [{ id, quantidade }]
  const [proformaTipo, setProformaTipo] = useState("A4");
  const [generating, setGenerating] = useState(false);

  // Documents generated in this session (proformas + facturas)
  const [generatedDocs, setGeneratedDocs] = useState([]);

  // Modal venda detalhes
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [vendaDetalhe, setVendaDetalhe] = useState(null);

  useEffect(() => {
    fetchEmpresa();
    fetchMateriais();
    fetchVendas(periodo);
  }, []);

  useEffect(() => {
    fetchVendas(periodo);
  }, [periodo]);

  async function fetchEmpresa() {
    try {
      const res = await fetch("http://localhost:5000/admin/empresa");
      if (!res.ok) return setEmpresa(null);
      const data = await res.json();
      setEmpresa(data);
    } catch (err) {
      console.error("Erro empresa:", err);
      setEmpresa(null);
    }
  }

  async function fetchMateriais() {
    setMateriaisLoading(true);
    try {
      const res = await fetch("http://localhost:5000/admin/materiais");
      const data = await res.json();
      setMateriais(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro materiais:", err);
      setMateriais([]);
    } finally {
      setMateriaisLoading(false);
    }
  }

  async function fetchVendas(p = "mes") {
    setVendasLoading(true);
    try {
      // tenta rota sumarizada por periodo; se der 404, volta para GET /admin/vendas
      const res = await fetch(`http://localhost:5000/admin/vendas-${p}`);
      if (res.ok) {
        const data = await res.json();
        // rota vendas-:periodo devolve itens resumidos por dia/mes; adaptamos apenas tabela com totals
        setVendas(Array.isArray(data) ? data : []);
      } else {
        // fallback para /admin/vendas (lista completa)
        const res2 = await fetch("http://localhost:5000/admin/vendas");
        const data2 = await res2.json();
        setVendas(Array.isArray(data2) ? data2 : []);
      }
    } catch (err) {
      console.error("Erro vendas:", err);
      setVendas([]);
    } finally {
      setVendasLoading(false);
    }
  }

  // --- PROFORMA ---
  function proformaSetQuantidade(materialId, qtd) {
    setProformaItens((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((i) => i.id === materialId);
      if (idx === -1) {
        if (qtd > 0) copy.push({ id: materialId, quantidade: Number(qtd) });
      } else {
        if (qtd <= 0) copy.splice(idx, 1);
        else copy[idx].quantidade = Number(qtd);
      }
      return copy;
    });
  }

  async function gerarProforma() {
    if (!proformaCliente) return alert("Indica o nome do cliente.");
    if (!proformaItens.length) return alert("Adiciona pelo menos 1 item.");

    setGenerating(true);
    try {
      // monta payload
      const itensPayload = proformaItens.map((it) => ({ id: it.id, quantidade: it.quantidade }));
      const res = await fetch("http://localhost:5000/admin/proformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente: proformaCliente, itens: itensPayload }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // guarda doc na sessão frontend
        const doc = { type: "Proforma", url: "http://localhost:5000"+data.url, cliente: proformaCliente, createdAt: new Date().toISOString() };
        setGeneratedDocs((g) => [doc, ...g]);
        window.open(data.url, "_blank");
        // limpa form
        setProformaCliente("");
        setProformaItens([]);
      } else {
        console.error("Resposta proforma:", data);
        alert("Erro ao gerar proforma");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar proforma");
    } finally {
      setGenerating(false);
    }
  }

  // --- FACTURA (gera e abre) ---
  async function gerarFactura(vendaId) {
    if (!vendaId) return;
    try {
      const res = await fetch("http://localhost:5000/admin/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendaId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const doc = { type: "Factura", url: data.url, vendaId, createdAt: new Date().toISOString() };
        setGeneratedDocs((g) => [doc, ...g]);
        window.open(data.url, "_blank");
      } else {
        console.error("Resposta facturas:", data);
        alert("Erro ao gerar factura");
      }
    } catch (err) {
      console.error("Erro factura:", err);
      alert("Erro ao gerar factura");
    }
  }

  // Mostrar detalhes da venda (usa rota GET /admin/vendas/:id se disponível)
  async function verDetalhesVenda(vendaId) {
    try {
      const res = await fetch(`http://localhost:5000/admin/vendas/${vendaId}`);
      const data = await res.json();
      setVendaDetalhe(data);
      setShowVendaModal(true);
    } catch (err) {
      console.error("Erro ao buscar detalhe venda:", err);
      alert("Erro ao buscar detalhe da venda");
    }
  }

  // Export CSV simples das vendas atuais
  function exportVendasCSV() {
    if (!vendas || vendas.length === 0) return alert("Nenhuma venda para exportar.");
    const header = Object.keys(vendas[0]).join(",");
    const rows = vendas.map((v) => Object.values(v).map((val) => JSON.stringify(val)).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas-${periodo || "relatorio"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <DynamicNavbar />

      <Container className="py-4">
        <h2 className="mb-3">Relatórios & Documentos</h2>

        <Row className="g-3">
          <Col md={4}>
            <Card className="p-3">
              <h6>Empresa</h6>
              <p className="mb-1"><strong>{empresa?.nome || "—"}</strong></p>
              <p className="mb-1">{empresa?.endereco || "-"}</p>
              <p className="mb-1">{empresa?.telefone || empresa?.email || "-"}</p>
              <div className="mt-2">
                <Button size="sm" onClick={fetchEmpresa}>Atualizar</Button>
              </div>
            </Card>
          </Col>

          <Col md={8}>
            <Card className="p-3">
              <Row className="align-items-center mb-2">
                <Col>
                  <h6 className="mb-0">Vendas ({periodo})</h6>
                </Col>
                <Col className="text-end">
                  <Form.Select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    style={{ width: 150, display: "inline-block" }}
                  >
                    <option value="hoje">Hoje</option>
                    <option value="dia">Por Dia</option>
                    <option value="mes">Por Mês</option>
                    <option value="ano">Por Ano</option>
                    <option value="geral">Geral</option>
                  </Form.Select>{" "}
                  <Button size="sm" variant="outline-secondary" onClick={exportVendasCSV} className="ms-2">
                    Export CSV
                  </Button>
                </Col>
              </Row>

              <div style={{ maxHeight: 220, overflow: "auto" }}>
                <Table striped bordered hover size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Data</th>
                      <th>Total</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vendas || []).map((v) => (
                      <tr key={v.id || `${v.dia || v.mes}-${Math.random()}`}>
                        <td>{v.id || "-"}</td>
                        <td>{v.data ? new Date(v.data).toLocaleDateString() : (v.dia || v.mes || "-")}</td>
                       
                        <td>{Number(v.total || v.total_vendido || 0).toLocaleString()} KZ</td>
                        <td>
                          {v.id ? (
                            <>{/* <Button size="sm" variant="info" onClick={() => verDetalhesVenda(v.id)}>Detalhes</Button>{" "}
                              
                               */}<Button size="sm" variant="warning" onClick={() => gerarFactura(v.id)}>Factura</Button>
                            </>
                          ) : (
                            <Badge bg="secondary">Resumo</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          </Col>
        </Row>

        <Row className="mt-3 g-3">
          {/* Proforma */}
          <Col md={6}>
            <Card className="p-3">
              <h6>Gerar Proforma</h6>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label>Cliente</Form.Label>
                  <Form.Control value={proformaCliente} onChange={(e) => setProformaCliente(e.target.value)} placeholder="Nome do cliente" />
                </Form.Group>

                <Form.Label>Itens</Form.Label>
                <div style={{ maxHeight: 220, overflow: "auto", border: "1px solid #eee", padding: 8, borderRadius: 6 }}>
                  {materiaisLoading ? <p>Carregando materiais...</p> : (
                    materiais.map((m) => {
                      const found = proformaItens.find((it) => it.id === m.id);
                      return (
                        <Row key={m.id} className="align-items-center mb-2">
                          <Col xs={6}>
                            <div><strong>{m.nome}</strong></div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{m.descricao || "-"}</div>
                          </Col>
                          <Col xs={3}>
                            <Form.Control
                              type="number"
                              min={0}
                              value={found ? found.quantidade : ""}
                              onChange={(e) => proformaSetQuantidade(m.id, e.target.value)}
                              placeholder="Qtd"
                            />
                          </Col>
                          <Col xs={3} className="text-end">
                            <div className="fw-bold">{Number(m.preco).toLocaleString()} KZ</div>
                          </Col>
                        </Row>
                      );
                    })
                  )}
                </div>

                <Form.Group className="mt-2">
                  <Form.Label>Tipo PDF</Form.Label>
                  <Form.Select value={proformaTipo} onChange={(e) => setProformaTipo(e.target.value)}>
                    <option value="A4">A4</option>
                    <option value="ticket">Ticket</option>
                  </Form.Select>
                </Form.Group>

                <div className="d-grid mt-2">
                  <Button onClick={gerarProforma} disabled={generating}>
                    {generating ? "Gerando..." : "Gerar Proforma"}
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>

          {/* Todos os Documentos gerados na sessão */}
          <Col md={6}>
            <Card className="p-3">
              <h6>Todos os Documentos (sessão)</h6>
              <div style={{ maxHeight: 380, overflow: "auto" }}>
                {generatedDocs.length === 0 ? (
                  <p className="text-muted">Ainda não geraste documentos nesta sessão.</p>
                ) : (
                  <Table size="sm" striped hover>
                    <thead>
                      <tr><th>Tipo</th><th>Ref</th><th>Data</th><th>Ação</th></tr>
                    </thead>
                    <tbody>
                      {generatedDocs.map((d, i) => (
                        <tr key={i}>
                          <td>{d.type}</td>
                          <td>{d.vendaId ? `Venda #${d.vendaId}` : d.cliente || "-"}</td>
                          <td>{new Date(d.createdAt).toLocaleString()}</td>
                          <td>
                            <Button size="sm" onClick={() => window.open("http://localhost:5000"+d.url, "_blank")}>Abrir</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal detalhes venda */}
      <Modal show={showVendaModal} onHide={() => setShowVendaModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalhes Venda #{vendaDetalhe?.id || ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!vendaDetalhe ? (
            <p>Nenhum detalhe disponível.</p>
          ) : (
            <>
              <p><strong>Cliente:</strong> {vendaDetalhe.Cliente?.nome || "-"}</p>
              <p><strong>Data:</strong> {vendaDetalhe.data ? new Date(vendaDetalhe.data).toLocaleString() : "-"}</p>
              <Table striped bordered>
                <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {(vendaDetalhe.itens || []).map((it) => (
                    <tr key={it.id}>
                      <td>{it.Material?.nome || "-"}</td>
                      <td>{it.quantidade}</td>
                      <td>{Number(it.preco_unitario).toLocaleString()} KZ</td>
                      <td>{(Number(it.preco_unitario) * Number(it.quantidade)).toLocaleString()} KZ</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="text-end fw-bold">Total: {Number(vendaDetalhe.total || 0).toLocaleString()} KZ</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVendaModal(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
