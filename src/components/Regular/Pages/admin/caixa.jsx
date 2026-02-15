import { useEffect, useState } from "react";
import {
  Container, Row, Col, Card, Button, Form, InputGroup, Table, Modal, Badge
} from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";

export default function RegistrarVendaMateriais() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState({});
  const [empresa, setEmpresa] = useState(null);
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // disponibilidade modal
  const [showDisponibilidade, setShowDisponibilidade] = useState(false);
  const [materialSelecionado, setMaterialSelecionado] = useState(null);
  const [selectedArmazem, setSelectedArmazem] = useState(null);
  const [qtdSelecionada, setQtdSelecionada] = useState(1);
const [vendaGeradaId, setVendaGeradaId] = useState(null);
// PDF modal + venda gerada
const [showPdfModalEmbed, setShowPdfModalEmbed] = useState(false);
const [pdfModalUrl, setPdfModalUrl] = useState(null);
const [pdfModalLoading, setPdfModalLoading] = useState(true);

  useEffect(() => {
    const hoje = new Date().toISOString().split("T")[0];

    Promise.all([
      fetch("http://localhost:5002/admin/materiais").then(res => res.json()),
      fetch(`http://localhost:5002/admin/vendas?data=${hoje}`).then(res => res.json()),
      fetch("http://localhost:5002/admin/empresa").then(res => res.json())
    ]).then(([produtosAPI, vendas, empresaData]) => {
      setEmpresa(empresaData);

      const vendidosMap = {};
      (vendas || []).forEach(v => (v.itens || []).forEach(item => {
        const id = item.produto_id ?? item.id;
        vendidosMap[id] = (vendidosMap[id] || 0) + (item.quantidade || 0);
      }));

      const produtosComSaldo = (produtosAPI || []).map(p => {
        const saldo_atual = (p.estoque?.principal ?? p.quantidade ?? 0) - (vendidosMap[p.id] || 0);
        return {
          ...p,
          saldo_atual,
          preco: Number(p.preco) || Number(p.precoVenda) || 0
        };
      });

      setProdutos(produtosComSaldo);
    }).catch(err => console.error(err));
  }, []);

  const adicionar = (produto, qtd, armazem) => {
    if (!produto) return;
    const quantidadeDisponivel = armazem?.quantidade ?? produto.estoque?.totalDisponivel ?? produto.quantidade ?? 0;
    if (!Number.isFinite(qtd)) return;
    if (qtd < 1 || qtd > quantidadeDisponivel) return;
    setCarrinho(prev => ({
      ...prev,
      [`${produto.id}_${armazem?.armazemId ?? 'principal'}`]: {
        id: produto.id,
        nome: produto.nome,
        quantidade: qtd,
        preco: Number(produto.preco || 0),
        subtotal: Number((Number(produto.preco || 0) * qtd).toFixed(2)),
        armazemId: armazem?.armazemId ?? null,
        armazemNome: armazem?.armazemNome ?? 'Principal'
      },
    }));
  };

  const remover = id => {
    const novo = { ...carrinho };
    delete novo[id];
    setCarrinho(novo);
  };

  const clearFilters = () => {
    setQuery("");
    setMinPrice("");
    setMaxPrice("");
  };

 const gerarReciboPDF = async () => {
    const recibo = document.getElementById("recibo");
    if (!recibo) return;

    // tornar visível para captura
    const prevVisibility = recibo.style.visibility;
    const prevPosition = recibo.style.position;
    const prevTop = recibo.style.top;

    recibo.style.visibility = "visible";
    recibo.style.position = "absolute";
    recibo.style.top = "-9999px";

    await new Promise(r => setTimeout(r, 50));
    const canvas = await html2canvas(recibo, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    // gerar blob e abrir no modal embutido para visualização/impressão
    try {
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfModalUrl(url);
      setPdfModalLoading(true);
      setPdfAutoPrint(true);
      setShowPdfModalEmbed(true);
      // limpar carrinho (comportamento anterior)
      setCarrinho({});
      // restaurar estilos
      recibo.style.visibility = prevVisibility || "hidden";
      recibo.style.position = prevPosition || "absolute";
      recibo.style.top = prevTop || "-9999px";
    } catch (e) {
      // fallback: salvar arquivo local se algo falhar
      pdf.save(`recibo-${Date.now()}.pdf`);
      recibo.style.visibility = prevVisibility || "hidden";
      recibo.style.position = prevPosition || "absolute";
      recibo.style.top = prevTop || "-9999px";
      setCarrinho({});
    }
  };

  const finalizarVenda = async () => {
    if (Object.keys(carrinho).length === 0) {
      alert("Nenhum material selecionado.");
      return;
    }

    const venda = {
      funcionario: "caixa",
      itens: Object.values(carrinho).map(item => ({
        id: item.id,
        qtd: item.quantidade,
        preco: item.preco,
        armazem_id: item.armazemId ?? null,
      })),
    };

    try {
      const res = await fetch("http://localhost:5002/admin/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venda),
      });
      const rest= await res.json()
       const res1 = await fetch("http://localhost:5002/admin/vendas/"+rest.venda.id+"/ticket",
      {
        method: "GET",
        headers: { "Content-Type": "application/json"},
      });
      const r= await res1.json()
      if (res.ok) {
        alert("Venda registrada com sucesso!");
        const hoje = new Date().toISOString().split("T")[0];
        Promise.all([
          fetch("http://localhost:5002/admin/materiais").then(r => r.json()),
          fetch(`http://localhost:5002/admin/vendas?data=${hoje}`).then(r => r.json()),
          fetch("http://localhost:5002/admin/empresa").then(r => r.json())
        ])
          .then(([produtosAPI, vendasData, empresaData]) => {
            setEmpresa(empresaData);

            const vendidosMap = {};
            (vendasData || []).forEach(v => (v.itens || []).forEach(item => {
              const id = item.produto_id ?? item.id;
              vendidosMap[id] = (vendidosMap[id] || 0) + (item.quantidade || 0);
            }));

            const produtosComSaldo = (produtosAPI || []).map(p => {
              const saldo_atual = (p.estoque?.principal ?? p.quantidade ?? 0) - (vendidosMap[p.id] || 0);
              return {
                ...p,
                saldo_atual,
                preco: Number(p.preco) || Number(p.precoVenda) || 0
              };
            });

            setProdutos(produtosComSaldo);
          
  setVendaGeradaId(rest.venda.id);
 
  const pdfUrl = `http://localhost:5002`+r.url;

  setPdfModalUrl(pdfUrl);
  setPdfModalLoading(true);
  setShowPdfModalEmbed(true);


          })
          .catch(err => console.error(err));
      } else {
        const erro = await res.json();
        alert("Erro: " + (erro.erro || "Erro ao registrar"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar venda.");
    }
  };
function printFromModal() {
  const iframe = document.getElementById("pdf-embed-iframe");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }
}

  const total = Object.values(carrinho).reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);

  const verDisponibilidade = (produto) => {
    setMaterialSelecionado(produto);
    setSelectedArmazem(null);
    setQtdSelecionada(1);
    setShowDisponibilidade(true);
  };

  function printFromModal() {
    const iframe = document.getElementById("pdf-embed-iframe");
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      } catch (e) {
        console.error('Erro ao imprimir do iframe:', e);
      }
    }
    // fallback: abrir em nova aba
    if (pdfModalUrl) window.open(pdfModalUrl, "_blank");
  }

  return (
    <>
      <DynamicNavbar />
      <Container className="py-5">
        <h2 className="text-center mb-4">Venda de Materiais</h2>

        <Row className="mb-3">
          <Col md={6} lg={4} className="mb-2">
            <InputGroup>
              <Form.Control
                placeholder="Pesquisar por nome..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <Button variant="outline-secondary" onClick={() => setQuery("")}>Limpar</Button>
              <Button variant="outline-secondary" onClick={clearFilters}>Limpar filtros</Button>
            </InputGroup>
          </Col>
          <Col md={3} lg={2} className="mb-2">
            <Form.Control
              type="number"
              placeholder="Preço min"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
            />
          </Col>
          <Col md={3} lg={2} className="mb-2">
            <Form.Control
              type="number"
              placeholder="Preço max"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
            />
          </Col>
        </Row>

        <Row className="my-4">
          {produtos
            .filter(prod => {
              const nomeMatch = prod.nome ? prod.nome.toLowerCase().includes(query.toLowerCase()) : true;
              const preco = Number(prod.preco || 0);
              const minOk = minPrice === "" ? true : preco >= parseFloat(minPrice);
              const maxOk = maxPrice === "" ? true : preco <= parseFloat(maxPrice);
              return nomeMatch && minOk && maxOk;
            })
            .map(prod => (
              <Col md={6} lg={3} key={prod.id} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <div style={{ height: 150, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      alt={prod.nome}
                      src={prod.imagem ? `http://localhost:5002${prod.imagem}` : "https://via.placeholder.com/150"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <Card.Body>
                    <Card.Title>{prod.nome}</Card.Title>
                    <Card.Text>
                      Kz {Number(prod.preco || 0).toFixed(2)}<br />
                      <span className={((prod.estoque?.totalDisponivel ?? prod.quantidade) <= 0) ? 'text-danger' : 'text-success'}>
                        Estoque: {prod.estoque?.totalDisponivel ?? prod.quantidade ?? 0}
                      </span>
                    </Card.Text>

                    <div className="d-grid gap-2">
                      <Button variant="primary" size="sm" onClick={() => verDisponibilidade(prod)}>Vender / Selecionar armazém</Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => verDisponibilidade(prod)}>Ver disponibilidade</Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>

        <h4>Resumo do Carrinho</h4>
        {Object.keys(carrinho).length === 0 ? (
          <p className="text-muted">Nenhum material no carrinho.</p>
        ) : (
          <Table striped bordered responsive>
            <thead>
              <tr>
                <th>Material</th>
                <th>Armazém</th>
                <th>Qtd</th>
                <th>Preço</th>
                <th>Subtotal</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(carrinho).map(([key, item]) => (
                <tr key={key}>
                  <td>{item.nome}</td>
                  <td>{item.armazemNome || '-'}</td>
                  <td>{item.quantidade}</td>
                  <td>Kz {Number(item.preco).toFixed(2)}</td>
                  <td>Kz {Number(item.subtotal).toFixed(2)}</td>
                  <td>
                    <Button size="sm" variant="danger" onClick={() => remover(key)}>Remover</Button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="4" className="fw-bold text-end">Total</td>
                <td colSpan="2" className="fw-bold">Kz {Number(total).toFixed(2)}</td>
              </tr>
            </tbody>
          </Table>
        )}

        <div className="d-grid gap-2 mt-3">
          <Button variant="warning" size="lg" onClick={finalizarVenda}>Finalizar Venda</Button>
        </div>

        <div id="recibo" style={{ padding: 20, visibility: "hidden", position: "absolute", top: "-9999px" }}>
          {empresa && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {empresa.logo && <img src={empresa.logo ? `http://localhost:5002${empresa.logo}` : ""} alt="Logo" style={{ height: 50 }} />}
                <h3>{empresa.nome}</h3>
              </div>
              <p>{empresa.email}</p>
              <p>{empresa.telefone}</p>
            </>
          )}
          <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
          <Table bordered size="sm">
            <thead>
              <tr><th>Material</th><th>Armazém</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {Object.entries(carrinho).map(([key, item]) => (
                <tr key={key}>
                  <td>{item.nome}</td>
                  <td>{item.armazemNome || '-'}</td>
                  <td>{item.quantidade}</td>
                  <td>Kz {Number(item.preco).toFixed(2)}</td>
                  <td>Kz {Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="4" className="fw-bold text-end">Total</td>
                <td className="fw-bold">Kz {Number(total).toFixed(2)}</td>
              </tr>
            </tbody>
          </Table>
          <p>Funcionário: caixa</p>
          <p className="text-muted">Obrigado pela preferência!</p>
        </div>

        <Modal
          show={showDisponibilidade}
          onHide={() => setShowDisponibilidade(false)}
          centered
          size="md"
        >
          <Modal.Header closeButton>
            <Modal.Title>Disponibilidade do Material</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {!materialSelecionado ? (
              <p className="text-muted">Nenhum material selecionado.</p>
            ) : (
              <>
                <h5>{materialSelecionado.nome}</h5>

                <p className="mb-2">
                  Estoque geral:{" "}
                  <Badge bg={(materialSelecionado.estoque?.principal ?? materialSelecionado.quantidade ?? 0) > 0 ? "success" : "secondary"}>
                    {materialSelecionado.estoque?.principal ?? materialSelecionado.quantidade ?? 0}
                  </Badge>
                </p>

                <h6>Armazéns</h6>

                {(!materialSelecionado.estoque?.armazens || materialSelecionado.estoque.armazens.length === 0) ? (
                  <p className="text-muted">Nenhum armazém com este material.</p>
                ) : (
                  <>
                    <Table size="sm" bordered>
                      <thead>
                        <tr>
                          <th>Armazém</th>
                          <th>Quantidade</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialSelecionado.estoque.armazens.map((a, idx) => (
                          <tr key={idx}>
                            <td>{a.armazemNome || "—"}</td>
                            <td>{a.quantidade}</td>
                            <td>
                              <Button size="sm" onClick={() => {
                                setSelectedArmazem(a);
                                setQtdSelecionada(1);
                              }}>Selecionar</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    {selectedArmazem && (
                      <div className="mt-3">
                        <h6>Selecionado: {selectedArmazem.armazemNome || '—'}</h6>
                        <InputGroup className="mb-2">
                          <Form.Control
                            type="number"
                            min={1}
                            max={selectedArmazem.quantidade ?? 0}
                            value={qtdSelecionada}
                            onChange={e => setQtdSelecionada(parseInt(e.target.value || '1', 10))}
                          />
                          <InputGroup.Text>un.</InputGroup.Text>
                          <Button variant="success" onClick={() => {
                            const qtd = Number(qtdSelecionada || 0);
                            if (!qtd || qtd < 1) return alert('Quantidade inválida');
                            if (qtd > (selectedArmazem.quantidade ?? 0)) return alert('Quantidade maior que disponível no armazém');
                            adicionar(materialSelecionado, qtd, selectedArmazem);
                            // fechar seleção
                            setSelectedArmazem(null);
                            setShowDisponibilidade(false);
                          }}>Adicionar ao carrinho</Button>
                        </InputGroup>
                      </div>
                    )}
                  </>
                )}

                <hr />

                <p className="fw-bold">
                  Total disponível:{" "}
                  <Badge bg="primary">
                    {materialSelecionado.estoque?.totalDisponivel ?? 0}
                  </Badge>
                </p>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDisponibilidade(false)}>Fechar</Button>
          </Modal.Footer>
        </Modal>

        {/* Modal embutido para visualização/impressão do recibo */}
        <Modal
  show={showPdfModalEmbed}
  onHide={() => {
    setShowPdfModalEmbed(false);
    setPdfModalUrl(null);
    setVendaGeradaId(null);
  }}
  size="xl"
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Documento da Venda</Modal.Title>
  </Modal.Header>

  <Modal.Body style={{ height: "75vh", padding: 0 }}>
    {pdfModalUrl ? (
      <iframe
        id="pdf-embed-iframe"
        title="pdf-viewer"
        src={pdfModalUrl}
        style={{ width: "100%", height: "100%", border: 0 }}
        onLoad={() => setPdfModalLoading(false)}
      />
    ) : (
      <div className="p-3">Nenhum documento disponível.</div>
    )}
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowPdfModalEmbed(false)}>
      Fechar
    </Button>

    <Button onClick={printFromModal} disabled={pdfModalLoading}>
      Imprimir
    </Button>

    {vendaGeradaId && (
      <>
        <Button
          variant="success"
          onClick={() =>
            window.open(
              `http://localhost:5002/admin/vendas/${vendaGeradaId}/fatura?download=true`,
              "_blank"
            )
          }
        >
          Baixar Fatura A4
        </Button>

        <Button
          variant="info"
          onClick={() =>
            window.open(
              `http://localhost:5002/admin/vendas/${vendaGeradaId}/ticket?download=true`,
              "_blank"
            )
          }
        >
          Baixar Ticket
        </Button>
      </>
    )}
  </Modal.Footer>
</Modal>

      </Container>
    </>
  );
}
