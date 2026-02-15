import { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Table, Card, Modal } from "react-bootstrap";
import { ShoppingCart, MapPin, Trash2 } from "lucide-react";
import DynamicNavbar from "../NAV.jsx";

export default function VendasParceladas() {
  const [clientes, setClientes] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [itens, setItens] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [numParcelas, setNumParcelas] = useState(2);
  const [entrada, setEntrada] = useState(0);
  const [parcelas, setParcelas] = useState([]);
  const [total, setTotal] = useState(0);

  // Estados para a Modal de Seleção de Armazém
  const [showModal, setShowModal] = useState(false);
  const [materialSelecionado, setMaterialSelecionado] = useState(null);
  const [armazemId, setArmazemId] = useState("");
  const [quantidadeDesejada, setQuantidadeDesejada] = useState(1);

  useEffect(() => {
    fetch("http://localhost:5002/admin/clientes").then(res => res.json()).then(setClientes);
    fetch("http://localhost:5002/admin/materiais").then(res => res.json()).then(setMateriais);
  }, []);

  const abrirModalArmazem = (material) => {
    setMaterialSelecionado(material);
    setArmazemId("");
    setQuantidadeDesejada(1);
    setShowModal(true);
  };

 const confirmarAdicaoItem = () => {
  // Converte para número logo no início
  const qtdPedida = Number(quantidadeDesejada);
  const idArmazemSel = Number(armazemId);

  if (!idArmazemSel || qtdPedida <= 0) {
    alert("Selecione o armazém e uma quantidade válida!");
    return;
  }

  // Procura o stock no armazém selecionado
  const estoqueNoArmazem = materialSelecionado.estoques.find(
    e => Number(e.ArmazemId) === idArmazemSel
  );

  if (!estoqueNoArmazem) {
    alert("Erro: Este produto não tem registo de stock neste armazém.");
    return;
  }

  // IMPORTANTE: Garantir que comparamos Números
  const qtdDisponivel = Number(estoqueNoArmazem.quantidade);

  if (qtdPedida > qtdDisponivel) {
    alert(`Quantidade insuficiente! Disponível: ${qtdDisponivel} unidades.`);
    return;
  }

  // Se passou na validação, cria o item para o carrinho
  const novoItem = {
    id: materialSelecionado.id,
    nome: materialSelecionado.nome,
    preco: Number(materialSelecionado.precoVenda || materialSelecionado.preco),
    quantidade: qtdPedida,
    armazemId: idArmazemSel,
    armazemNome: estoqueNoArmazem.Armazem?.nome || `Armazém ${idArmazemSel}`
  };

  // Verifica se já existe o mesmo produto do mesmo armazém no carrinho
  const indexExistente = itens.findIndex(i => i.id === novoItem.id && i.armazemId === novoItem.armazemId);

  if (indexExistente !== -1) {
    const novosItens = [...itens];
    novosItens[indexExistente].quantidade += novoItem.quantidade;
    setItens(novosItens);
  } else {
    setItens([...itens, novoItem]);
  }

  setShowModal(false);
};

  const removerItem = (index) => {
    const novosItens = [...itens];
    novosItens.splice(index, 1);
    setItens(novosItens);
  };

  const calcularTotais = () => {
    const totalVenda = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
    setTotal(totalVenda);
    const restante = totalVenda - entrada;
    const valorParcela = restante / numParcelas;
    const listaParcelas = [];

    for (let i = 1; i <= numParcelas; i++) {
      const dataParcela = new Date();
      dataParcela.setMonth(dataParcela.getMonth() + i);
      listaParcelas.push({
        numero: i,
        valor: valorParcela.toFixed(2),
        vencimento: dataParcela.toISOString().split("T")[0],
      });
    }
    setParcelas(listaParcelas);
  };

  const enviarVenda = async () => {
    if (!clienteId || itens.length === 0) return alert("Selecione cliente e produtos!");

    const payload = {
    clienteId: Number(clienteId),
    entrada: Number(entrada),
    parcelas: parcelas, 
    itens: itens.map(i => ({
      id: i.id,
      quantidade: i.quantidade,
      preco: i.preco,
      armazemId: i.armazemId // O backend PRECISA disto para descontar no sítio certo
    }))
  };

    try {
      const res = await fetch("http://localhost:5002/admin/vendas/parcelada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Venda registrada com sucesso!");
        setItens([]);
        setParcelas([]);
      } else {
        const erroData = await res.json();
        alert("Erro: " + (erroData.erro || "Falha na venda"));
      }
    } catch (err) {
      alert("Erro ao conectar com servidor.");
    }
  };

  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <h2 className="mb-4 text-primary d-flex align-items-center gap-2">
          <ShoppingCart /> Venda Parcelada por Armazém
        </h2>

        {/* Seleção de Cliente e Condições */}
        <Card className="p-3 mb-4 shadow-sm border-0 bg-light">
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">Cliente</Form.Label>
                <Form.Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Selecione o cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold">Nº Parcelas</Form.Label>
                <Form.Control type="number" value={numParcelas} onChange={e => setNumParcelas(Number(e.target.value))} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold">Entrada (Kz)</Form.Label>
                <Form.Control type="number" value={entrada} onChange={e => setEntrada(Number(e.target.value))} />
              </Form.Group>
            </Col>
          </Row>
        </Card>

        <h5>Produtos Disponíveis</h5>
        <Row>
          {materiais.map((m) => (
            <Col md={3} key={m.id} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Img variant="top" src={`http://localhost:5002${m.imagem}`} style={{ height: "120px", objectFit: "cover" }} />
                <Card.Body className="p-2 text-center">
                  <h6 className="fw-bold mb-1">{m.nome}</h6>
                  <p className="text-success small mb-2">{Number(m.precoVenda || m.preco).toLocaleString()} Kz</p>
                  <Button variant="outline-primary" size="sm" onClick={() => abrirModalArmazem(m)}>
                    Adicionar Item
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Tabela de Itens Selecionados */}
        {itens.length > 0 && (
          <Card className="mt-4 shadow-sm border-0">
            <Card.Header className="bg-dark text-white">Itens no Carrinho</Card.Header>
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Origem (Armazém)</th>
                  <th>Qtd</th>
                  <th>Preço</th>
                  <th>Subtotal</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.nome}</td>
                    <td><MapPin size={14}/> {i.armazemNome}</td>
                    <td>{i.quantidade}</td>
                    <td>{i.preco.toLocaleString()} Kz</td>
                    <td>{(i.preco * i.quantidade).toLocaleString()} Kz</td>
                    <td><Trash2 size={18} className="text-danger cursor-pointer" onClick={() => removerItem(idx)}/></td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="p-3 text-end">
                <Button variant="secondary" onClick={calcularTotais}>Gerar Plano de Pagamento</Button>
            </div>
          </Card>
        )}

        {/* Resumo e Parcelas */}
        {parcelas.length > 0 && (
          <div className="mt-4">
            <h5>Plano de Parcelamento (Total: {total.toLocaleString()} Kz)</h5>
            <Table bordered hover size="sm">
              <thead className="table-secondary">
                <tr><th>#</th><th>Valor Parcela</th><th>Vencimento</th></tr>
              </thead>
              <tbody>
                {parcelas.map((p, idx) => (
                  <tr key={idx}>
                    <td>{p.numero}</td>
                    <td>{Number(p.valor).toLocaleString()} Kz</td>
                    <td>{p.vencimento}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button variant="success" size="lg" className="w-100 fw-bold" onClick={enviarVenda}>
              CONFIRMAR VENDA E DESCONTAR STOCK
            </Button>
          </div>
        )}

        {/* MODAL PARA SELECIONAR ARMAZÉM E QUANTIDADE */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title className="fs-6">De qual armazém sairá o produto?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h6>{materialSelecionado?.nome}</h6>
            <Form.Group className="mb-3 mt-3">
              <Form.Label className="small fw-bold">Selecione o Armazém</Form.Label>
              <Form.Select value={armazemId} onChange={e => setArmazemId(e.target.value)}>
                <option value="">-- Selecione --</option>
                {materialSelecionado?.estoques?.map(est => (
                  <option key={est.ArmazemId} value={est.ArmazemId}>
                    {est.Armazem?.nome} (Disponível: {est.quantidade})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold">Quantidade a Vender</Form.Label>
              <Form.Control 
                type="number" 
                min="1" 
                value={quantidadeDesejada} 
                onChange={e => setQuantidadeDesejada(e.target.value)} 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" className="w-100" onClick={confirmarAdicaoItem}>
              Adicionar ao Carrinho
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}