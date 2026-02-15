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
} from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";

export default function ReportsAdmin() {
  const [empresa, setEmpresa] = useState(null);

  // VENDAS
  const [periodo, setPeriodo] = useState("mes");
  const [vendas, setVendas] = useState([]);
  const [vendasLoading, setVendasLoading] = useState(false);

  // MATERIAIS (para proforma)
  const [materiais, setMateriais] = useState([]);
  const [materiaisLoading, setMateriaisLoading] = useState(false);

  // Proforma form (campos separados)
  const [proformaClienteNome, setProformaClienteNome] = useState("");
  const [proformaClienteTelefone, setProformaClienteTelefone] = useState("");
  const [proformaClienteNif, setProformaClienteNif] = useState("");
  const [proformaClienteEndereco, setProformaClienteEndereco] = useState("");
  const [proformaItens, setProformaItens] = useState([]); // [{ id, quantidade }]
  const [proformaTipo, setProformaTipo] = useState("A4"); // A4 | ticket
  const [generating, setGenerating] = useState(false);

  // Documents generated in this session (proformas + facturas)
  const [generatedDocs, setGeneratedDocs] = useState([]);
  // Modal embutido para visualização/impressão de PDF
  const [showPdfModalEmbed, setShowPdfModalEmbed] = useState(false);
  const [pdfModalUrl, setPdfModalUrl] = useState(null);
  const [pdfModalLoading, setPdfModalLoading] = useState(true);
  const [pdfAutoPrint, setPdfAutoPrint] = useState(false);

  // Modal venda detalhes
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [vendaDetalhe, setVendaDetalhe] = useState(null);

  useEffect(() => {
    fetchEmpresa();
    fetchMateriais();
    fetchVendas(periodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchVendas(periodo);
  }, [periodo]);

  async function fetchEmpresa() {
    try {
      const res = await fetch("http://localhost:5002/admin/empresa");
      if (!res.ok) {
        setEmpresa(null);
        return;
      }
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
      const res = await fetch("http://localhost:5002/admin/materiais");
      if (!res.ok) {
        setMateriais([]);
        return;
      }
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
      const res = await fetch(`http://localhost:5002/admin/vendas-${p}`);
      if (res.ok) {
        const data = await res.json();
        setVendas(Array.isArray(data) ? data : []);
      } else {
        const res2 = await fetch("http://localhost:5002/admin/vendas");
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

  // Manipula quantidade no formulário (adiciona/remove do state)
  function proformaSetQuantidade(materialId, qtd) {
    setProformaItens((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((i) => i.id === materialId);
      const quantidade = Number(qtd || 0);
      if (idx === -1) {
        if (quantidade > 0) copy.push({ id: materialId, quantidade });
      } else {
        if (quantidade <= 0) copy.splice(idx, 1);
        else copy[idx].quantidade = quantidade;
      }
      return copy;
    });
  }

  // Gera Proforma - envia cliente object, itens, tipoPdf, empresa opcional
  async function gerarProforma() {
    if (!proformaClienteNome) return alert("Indica o nome do cliente.");
    if (!proformaItens.length) return alert("Adiciona pelo menos 1 item.");

    // prepara itens com quantidade positiva
    const itensPayload = proformaItens
      .map((it) => ({ id: it.id, quantidade: Number(it.quantidade || 0) }))
      .filter((it) => it.quantidade > 0);

    if (!itensPayload.length) return alert("Adiciona pelo menos 1 item com quantidade > 0.");

    setGenerating(true);
    try {
      const clientePayload = {
        nome: proformaClienteNome,
        telefone: proformaClienteTelefone || undefined,
        nif: proformaClienteNif || undefined,
        endereco: proformaClienteEndereco || undefined,
      };

      const payload = {
        cliente: clientePayload,
        itens: itensPayload,
        tipoPdf: proformaTipo === "ticket" ? "ticket" : "A4",
        // envia empresa caso exista no frontend — backend usará DB se disponível
        empresa: empresa ? {
          nome: empresa.nome,
          endereco: empresa.endereco,
          telefone: empresa.telefone,
          bancos: empresa.bancos || undefined
        } : undefined,
        notas: "Proforma gerada pelo sistema"
      };

      const res = await fetch("http://localhost:5002/admin/proformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        const doc = {
          type: "Proforma",
          url: data.url,
          cliente: clientePayload.nome,
          createdAt: new Date().toISOString(),
        };
        setGeneratedDocs((g) => [doc, ...g]);
        // abrir no modal embutido e disparar impressão automática
        setPdfModalUrl(getFullUrl(data.url));
        setPdfModalLoading(true);
        setPdfAutoPrint(true);
        setShowPdfModalEmbed(true);

        // limpa form
        setProformaClienteNome("");
        setProformaClienteTelefone("");
        setProformaClienteNif("");
        setProformaClienteEndereco("");
        setProformaItens([]);
      } else {
        console.error("Resposta proforma:", data);
        alert(data.erro || "Erro ao gerar proforma");
      }
    } catch (err) {
      console.error("Erro ao gerar proforma:", err);
      alert("Erro ao gerar proforma");
    } finally {
      setGenerating(false);
    }
  }

  // --- UNIFIED: gerar documento (fatura / ticket / proforma via venda id) ---
  // tenta GET primeiro (rota original era GET), se não ok tenta POST (caso front use POST)
  async function gerarDocumentoPorVenda(tipo, vendaId) {
    if (!vendaId) return;
    const API_BASE = "http://localhost:5002/admin";
    const rotaMap = {
      FATURA: `/vendas/${vendaId}/fatura`,
      TICKET: `/vendas/${vendaId}/ticket`,
      PROFORMA: `/vendas/${vendaId}/proforma`,
    };
    const rota = rotaMap[tipo];
    if (!rota) return;

    try {
      // Try GET
      let res = await fetch(API_BASE + rota);
      // If server expects POST (some of your frontends used POST), fallback to POST
      if (!res.ok) {
        // try POST with minimal body
        res = await fetch(API_BASE + rota, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendaId }),
        });
      }

      const data = await res.json();

      // extrai URL robustamente (aceita string ou object)
      const rawUrl = extractUrlFromResponse(data);
      if (res.ok && rawUrl) {
        const full = getFullUrl(rawUrl);
        // regista no session docs
        const doc = { type: tipo === "FATURA" ? "Factura" : tipo === "TICKET" ? "Ticket" : "Proforma", url: rawUrl, vendaId, createdAt: new Date().toISOString() };
        setGeneratedDocs((g) => [doc, ...g]);

        setPdfModalUrl(full);
        setPdfModalLoading(true);
        setPdfAutoPrint(true);
        setShowPdfModalEmbed(true);
      } else {
        console.error("Resposta gerarDocumento:", data);
        alert(data.erro || "Erro ao gerar documento");
      }
    } catch (err) {
      console.error("Erro gerarDocumento:", err);
      alert("Erro ao gerar documento");
    }
  }

  // helper que extrai uma url string do JSON retornado
  function extractUrlFromResponse(data) {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (typeof data.url === "string") return data.url;
    if (typeof data.path === "string") return data.path;
    // caso venha como objeto { url: { path: '/x' } } ou { url: { url: '/x' } }
    if (typeof data.url === "object" && data.url !== null) {
      return data.url.path || data.url.url || data.url.pathname || null;
    }
    // procurar propriedades comuns
    if (data.file && typeof data.file === "string") return data.file;
    return null;
  }

  // Mostrar detalhes da venda (usa rota GET /admin/vendas/:id se disponível)
  async function verDetalhesVenda(vendaId) {
    try {
      const res = await fetch(`http://localhost:5002/admin/vendas/${vendaId}`);
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

  // Helpers: view and print PDFs (tries to print automatically, falls back to opening)
  function getFullUrl(url) {
    if (!url) return null;
    const API_ORIGIN = "http://localhost:5002";
    try {
      if (url.startsWith("http")) {
        const parsed = new URL(url);
        if (parsed.origin !== API_ORIGIN) {
          return API_ORIGIN + parsed.pathname + parsed.search + parsed.hash;
        }
        return url;
      }
    } catch (e) {
      // fall through for non-parseable strings
    }
    // relative path -> prefix with API origin
    if (url.startsWith("/")) return API_ORIGIN + url;
    return API_ORIGIN + "/" + url;
  }

  function viewPdf(url) {
    const full = getFullUrl(url);
    if (!full) return;
    setPdfModalUrl(full);
    setPdfModalLoading(true);
    setShowPdfModalEmbed(true);
  }

  function printPdf(url) {
    const full = getFullUrl(url);
    if (!full) return;
    try {
      const w = window.open(full, "_blank");
      if (!w) return;
      const tryPrint = () => {
        try {
          w.focus();
          w.print();
        } catch (e) {
          // ignore — browser may block cross-origin/automatic print
        }
      };
      w.onload = tryPrint;
      // fallback: attempt after a short delay
      setTimeout(tryPrint, 1500);
    } catch (err) {
      console.error("Erro ao imprimir:", err);
      window.open(full, "_blank");
    }
  }

  function printFromModal() {
    const iframe = document.getElementById("pdf-embed-iframe");
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      } catch (e) {
        // possível bloqueio cross-origin — fallback
      }
    }
    // fallback: open in new tab and attempt print
    printPdf(pdfModalUrl);
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
                      <tr key={v.id || `${v.dia || v.mes || Math.random()}`}>
                        <td>{v.id || "-"}</td>
                        <td>{v.data ? new Date(v.data).toLocaleDateString() : (v.dia || v.mes || "-")}</td>
                        <td>{Number(v.total || v.total_vendido || 0).toLocaleString()} KZ</td>
                        <td>
                          {v.id ? (
                            <>
                              <Button size="sm" variant="warning" onClick={() => gerarDocumentoPorVenda("FATURA", v.id)}>Factura</Button>{' '}
                              <Button size="sm" variant="info" className="ms-2" onClick={() => gerarDocumentoPorVenda("TICKET", v.id)}>Ticket</Button>{' '}
                             
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
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-2">
                      <Form.Label>Nome do Cliente</Form.Label>
                      <Form.Control
                        value={proformaClienteNome}
                        onChange={(e) => setProformaClienteNome(e.target.value)}
                        placeholder="Nome do cliente"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Telefone</Form.Label>
                      <Form.Control
                        value={proformaClienteTelefone}
                        onChange={(e) => setProformaClienteTelefone(e.target.value)}
                        placeholder="Telefone"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>NIF / Contribuinte</Form.Label>
                      <Form.Control
                        value={proformaClienteNif}
                        onChange={(e) => setProformaClienteNif(e.target.value)}
                        placeholder="NIF"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group className="mb-2">
                      <Form.Label>Endereço</Form.Label>
                      <Form.Control
                        value={proformaClienteEndereco}
                        onChange={(e) => setProformaClienteEndereco(e.target.value)}
                        placeholder="Endereço do cliente (opcional)"
                      />
                    </Form.Group>
                  </Col>
                </Row>

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
                      <tr><th>Tipo</th><th>Ref/Cliente</th><th>Data</th><th>Ação</th></tr>
                    </thead>
                    <tbody>
                      {generatedDocs.map((d, i) => (
                        <tr key={i}>
                          <td>{d.type}</td>
                          <td>{d.vendaId ? `Venda #${d.vendaId}` : d.cliente || "-"}</td>
                          <td>{new Date(d.createdAt).toLocaleString()}</td>
                          <td>
                            <Button size="sm" onClick={() => viewPdf(d.url)}>Ver</Button>{' '}
                            <Button size="sm" variant="secondary" className="ms-2" onClick={() => printPdf(d.url)}>Imprimir</Button>
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

      {/* Modal embutido para PDF */}
      <Modal show={showPdfModalEmbed} onHide={() => setShowPdfModalEmbed(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Visualizador PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: "75vh", padding: 0 }}>
          {pdfModalUrl ? (
            <iframe
              id="pdf-embed-iframe"
              title="pdf-viewer"
              src={pdfModalUrl}
              style={{ width: "100%", height: "100%", border: 0 }}
              onLoad={() => {
                setPdfModalLoading(false);
                if (pdfAutoPrint) {
                  // tenta imprimir automaticamente
                  setTimeout(() => {
                    try {
                      printFromModal();
                    } catch (e) {
                      console.error('Erro ao auto-imprimir:', e);
                    }
                    setPdfAutoPrint(false);
                  }, 300);
                }
              }}
            />
          ) : (
            <div className="p-3">Nenhum documento selecionado.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPdfModalEmbed(false)}>Fechar</Button>
          <Button onClick={() => printFromModal()} disabled={pdfModalLoading}>Imprimir</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
