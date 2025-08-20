import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Form, InputGroup, Table } from "react-bootstrap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DynamicNavbar from "../NAV.JSX";

export default function RegistrarVendaMateriais() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState({});
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    const hoje = new Date().toISOString().split("T")[0];

    Promise.all([
      fetch("http://localhost:5000/admin/materiais").then(res => res.json()),
      fetch(`http://localhost:5000/admin/vendas?data=${hoje}`).then(res => res.json()),
      fetch("http://localhost:5000/admin/empresa").then(res => res.json())
    ]).then(([produtosAPI, vendas, empresaData]) => {
      setEmpresa(empresaData);

      const vendidosMap = {};
      vendas.forEach(v => v.itens?.forEach(item => {
        const id = item.produto_id;
        vendidosMap[id] = (vendidosMap[id] || 0) + item.quantidade;
      }));

      const produtosComSaldo = produtosAPI.map(p => ({
        ...p,
        saldo_atual: (p.estoque_inicial || 0) - (vendidosMap[p.id] || 0),
      }));

      setProdutos(produtosComSaldo);
    }).catch(err => console.error(err));
  }, []);

  const adicionar = (produto, qtd) => {
    if (qtd < 1 || qtd > produto.quantidade) return;
    setCarrinho(prev => ({
      ...prev,
      [produto.id]: {
        ...produto,
        quantidade: qtd,
        subtotal: parseFloat(produto.preco) * qtd,
      },
    }));
  };

  const remover = id => {
    const novo = { ...carrinho };
    delete novo[id];
    setCarrinho(novo);
  };

  const gerarReciboPDF = async () => {
    const recibo = document.getElementById("recibo");
    if (!recibo) return;

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
    pdf.save(`recibo-${Date.now()}.pdf`);

    recibo.style.visibility = "hidden";
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
      })),
    };

    try {
      const res = await fetch("http://localhost:5000/admin/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venda),
      });
      if (res.ok) {
        alert("Venda registrada com sucesso!");
        setCarrinho({});
        gerarReciboPDF();
      } else {
        const erro = await res.json();
        alert("Erro: " + erro.erro);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar venda.");
    }
  };

  const total = Object.values(carrinho).reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <>
      <DynamicNavbar />
      <Container className="py-5">
        <h2 className="text-center mb-4">Venda de Materiais</h2>

        <Row className="my-4">
          {produtos.map(prod => (
            <Col md={6} lg={3} key={prod.id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img
                  variant="top"
                  src={"http://localhost:5000"+prod.imagem || "https://via.placeholder.com/150"}
                  height={150}
                  style={{ objectFit: "cover" }}
                />
                <Card.Body>
                  <Card.Title>{prod.nome}</Card.Title>
                  <Card.Text>
                    {prod.preco} Kz<br />
                    <span className={prod.quantidade <= 0 ? 'text-danger' : 'text-success'}>
                      Estoque: {prod.quantidade}
                    </span>
                  </Card.Text>
                  {prod.quantidade > 0 && (
                    <Form.Group>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          min={1}
                          max={prod.quantidade}
                          placeholder="Qtd"
                          onChange={e => adicionar(prod, parseInt(e.target.value || "0"))}
                        />
                        <InputGroup.Text>un.</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  )}
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
                <th>Qtd</th>
                <th>Preço</th>
                <th>Subtotal</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(carrinho).map(item => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td>{item.quantidade}</td>
                  <td>Kz {item.preco}</td>
                  <td>Kz {item.subtotal}</td>
                  <td>
                    <Button size="sm" variant="danger" onClick={() => remover(item.id)}>Remover</Button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" className="fw-bold text-end">Total</td>
                <td colSpan="2" className="fw-bold">Kz {total}</td>
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
                {empresa.logo && <img src={empresa.logo} alt="Logo" style={{ height: 50 }} />}
                <h3>{empresa.nome}</h3>
              </div>
              <p>{empresa.endereco}</p>
              <p>{empresa.telefone}</p>
            </>
          )}
          <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
          <Table bordered size="sm">
            <thead>
              <tr><th>Material</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {Object.values(carrinho).map(item => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td>{item.quantidade}</td>
                  <td>Kz {item.preco}</td>
                  <td>Kz {item.subtotal}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" className="fw-bold text-end">Total</td>
                <td className="fw-bold">Kz {total}</td>
              </tr>
            </tbody>
          </Table>
          <p>Funcionário: caixa</p>
          <p className="text-muted">Obrigado pela preferência!</p>
        </div>
      </Container>
    </>
  );
}
