import { useEffect, useState } from "react";
import { 
  Container, Row, Col, Form, Button, 
  Modal, Card, InputGroup, Badge 
} from "react-bootstrap";

// Ícones
import { 
  ShoppingCart, Trash2, Search, 
  Plus, Package, Warehouse, FileText 
} from "lucide-react";

// PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Teu componente de Navegação
import DynamicNavbar from "../NAV.jsx";

export default function SaidaEstoque() {
  const [materiais, setMateriais] = useState([]);
  const [saidaList, setSaidaList] = useState([]);
  const [empresa, setEmpresa] = useState({});
  const [filtro, setFiltro] = useState("");
  const [funcionario] = useState("Admin");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [materialParaAdicionar, setMaterialParaAdicionar] = useState(null);
  const [armazemSelecionado, setArmazemSelecionado] = useState("");
  const [quantidadeDesejada, setQuantidadeDesejada] = useState("");

  useEffect(() => {
    fetchMateriais();
    fetch("http://localhost:5002/admin/empresa")
      .then((res) => res.json())
      .then(setEmpresa)
      .catch((err) => console.error("Erro empresa:", err));
  }, []);

  const fetchMateriais = () => {
    fetch("http://localhost:5002/admin/materiais")
      .then((res) => res.json())
      .then((data) => setMateriais(data || []))
      .catch((err) => console.error("Erro materiais:", err));
  };

  const abrirModal = (material) => {
    setMaterialParaAdicionar(material);
    setArmazemSelecionado("");
    setQuantidadeDesejada("");
    setShowModal(true);
  };
const gerarPDF = (dadosSaida) => {
  const doc = new jsPDF();
  const dataHora = new Date().toLocaleString("pt-PT");

  // Cabeçalho do PDF
  doc.setFontSize(18);
  doc.text(empresa.nome || "Minha Empresa", 14, 20);
  doc.setFontSize(10);
  doc.text(`Endereço: ${empresa.endereco || "N/A"}`, 14, 28);
  doc.text(`Telefone: ${empresa.telefone || "N/A"}`, 14, 34);
  doc.text(`Data/Hora: ${dataHora}`, 14, 40);
  doc.text(`Funcionário: ${funcionario}`, 14, 46);

  doc.setFontSize(14);
  doc.text("Guia de Saída de Materiais", 14, 56);

  // Mapeamento dos itens para a tabela
  const tableRows = dadosSaida.map((item) => [
    item.nome || "-",
    item.descricao || "-",
    item.quantidadeSaida || 0,
    `${Number(item.preco2 || 0).toLocaleString()} Kz`,
    `${(Number(item.quantidadeSaida || 0) * Number(item.preco2 || 0)).toLocaleString()} Kz`,
  ]);

  // Gerar Tabela
  autoTable(doc, {
    startY: 62,
    head: [["Material", "Descrição", "Qtd", "Preço Unit.", "Total"]],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`Saida_${Date.now()}.pdf`);
};
  const confirmarAdicao = () => {
    const qtd = Number(quantidadeDesejada);
    if (!armazemSelecionado || !qtd || qtd <= 0 || !materialParaAdicionar) {
      alert("Selecione um armazém válido e uma quantidade maior que zero.");
      return;
    }

    // IMPORTANT: backend uses `ArmazemId` (PascalCase). Use sempre essa chave.
    const estoqueNoArmazem = materialParaAdicionar?.estoques?.find(
      (e) => Number(e.ArmazemId) === Number(armazemSelecionado)
    );

    if (!estoqueNoArmazem) {
      console.error("Estoque não encontrado para o material/armazen selecionado:", materialParaAdicionar?.estoques);
      alert("Erro: não foi possível localizar o estoque neste armazém. Veja o console para detalhes.");
      return;
    }

    if (qtd > Number(estoqueNoArmazem.quantidade)) {
      const nomeArmazem = estoqueNoArmazem.Armazem?.nome || estoqueNoArmazem.armazemNome || `Armazém ${estoqueNoArmazem.ArmazemId}`;
      alert(`Stock insuficiente! Disponível apenas ${estoqueNoArmazem.quantidade} no ${nomeArmazem}`);
      return;
    }

    // Adiciona à lista de saída — se já existir material no mesmo armazém, soma
    setSaidaList((prev) => {
      const foundIndex = prev.findIndex(
        (it) => Number(it.id) === Number(materialParaAdicionar.id) && Number(it.armazemId) === Number(estoqueNoArmazem.ArmazemId)
      );

      if (foundIndex >= 0) {
        const next = [...prev];
        next[foundIndex] = {
          ...next[foundIndex],
          quantidadeSaida: Number(next[foundIndex].quantidadeSaida) + qtd,
        };
        return next;
      }

      return [
        ...prev,
        {
          id: materialParaAdicionar.id,
          nome: materialParaAdicionar.nome,
          quantidadeSaida: qtd,
          armazemId: estoqueNoArmazem.ArmazemId,
          armazemNome: estoqueNoArmazem.Armazem?.nome || estoqueNoArmazem.armazemNome || `Armazém ${estoqueNoArmazem.ArmazemId}`,
        },
      ];
    });

    // Atualiza stock localmente (cópia imutável)
    setMateriais((prevMateriais) =>
      prevMateriais.map((mat) => {
        const matId = mat.id ?? mat._id ?? mat.codigo;
        const selId = materialParaAdicionar.id ?? materialParaAdicionar._id ?? materialParaAdicionar.codigo;
        if (String(matId) !== String(selId)) return mat;

        return {
          ...mat,
          estoques: (mat.estoques || []).map((est) => {
            if (Number(est.ArmazemId) !== Number(estoqueNoArmazem.ArmazemId)) return est;
            return {
              ...est,
              quantidade: (Number(est.quantidade) - qtd).toString(),
            };
          }),
        };
      })
    );

    setShowModal(false);
  };

  const removerItemSaida = (index) => {
    setSaidaList((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const materiaisFiltrados = materiais.filter((m) => (m.nome || "").toLowerCase().includes(filtro.toLowerCase()));
const finalizarSaida = async () => {
  if (saidaList.length === 0) return alert("Lista vazia!");

  try {
    const res = await fetch("http://localhost:5002/admin/saida-materiais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        funcionario,
        itens: saidaList.map(item => ({
          materialId: item.id,
          armazemId: item.armazemId,
          quantidade: item.quantidadeSaida
        }))
      })
    });

    const data = await res.json();
    if (data.erro) throw new Error(data.erro);

    // CHAMA O PDF AQUI PASSANDO A LISTA ATUAL
    gerarPDF(saidaList); 

    alert("Saída registada com sucesso!");
    setSaidaList([]);
    fetchMateriais();
  } catch (err) {
    alert("Erro ao finalizar: " + err.message);
  }
};

 
  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <h2 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
          <ShoppingCart /> Saída de Estoque
        </h2>

        <Row>
          <Col md={8}>
            <InputGroup className="mb-4 shadow-sm">
              <InputGroup.Text className="bg-white">
                <Search size={18} />
              </InputGroup.Text>
              <Form.Control placeholder="Pesquisar produto..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            </InputGroup>

            <Row>
              {materiaisFiltrados.map((m) => {
                const keyId = m.id ?? m._id ?? m.codigo ?? `${m.nome}-${Math.random().toString(36).slice(2,8)}`;
                return (
                  <Col md={6} key={String(keyId)} className="mb-3">
                    <Card className="h-100 shadow-sm border-0">
                      <Card.Body>
                        <h6 className="fw-bold">{m.nome}</h6>
                        <div className="bg-light p-2 rounded mb-3 border small">
                          <div className="text-muted fw-bold border-bottom mb-1">Stock nos Armazéns:</div>
                          {(m.estoques || []).map((est) => (
                            <div key={est.id ?? est.ArmazemId ?? `${m.id}-${est.ArmazemId}`} className="d-flex justify-content-between">
                              <span>{est.Armazem?.nome ?? est.armazemNome ?? `Armazém ${est.ArmazemId}`}:</span>
                              <span className="fw-bold">{est.quantidade}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-100 fw-bold"
                          onClick={() => abrirModal(m)}
                          disabled={!m.estoques || m.estoques.length === 0}
                        >
                          Selecionar para Venda
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Col>

          <Col md={4}>
            <Card className="border-0 shadow-sm sticky-top" style={{ top: "20px" }}>
              <Card.Header className="bg-dark text-white fw-bold">Lista de Saída</Card.Header>
              <Card.Body>
                {saidaList.length === 0 ? (
                  <p className="text-center text-muted">Vazio</p>
                ) : (
                  <>
                    {saidaList.map((item, idx) => (
                      <div key={`${item.id}-${item.armazemId}-${idx}`} className="border-bottom mb-2 pb-2 small">
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold">{item.nome}</span>
                          <Trash2
                            size={16}
                            className="text-danger cursor-pointer"
                            onClick={() => removerItemSaida(idx)}
                          />
                        </div>
                        <div className="d-flex justify-content-between text-muted">
                          <span>{item.armazemNome}</span>
                          <span className="fw-bold text-success">Qtd: {item.quantidadeSaida}</span>
                        </div>
                      </div>
                    ))}
                   <Button variant="success" className="w-100 mt-3 fw-bold" onClick={finalizarSaida}>
  Finalizar Saída
</Button>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title className="fs-6">Retirar de qual armazém?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Selecione a Origem</Form.Label>
              <Form.Select value={armazemSelecionado} onChange={(e) => setArmazemSelecionado(e.target.value)}>
                <option value="">-- Selecionar --</option>
                {materialParaAdicionar?.estoques?.map((est) => (
                  <option key={est.id ?? est.ArmazemId ?? est.armazemNome} value={est.ArmazemId}>
                    {est.Armazem?.nome ?? est.armazemNome ?? `Armazém ${est.ArmazemId}`} (Stock: {est.quantidade})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-bold small">Quantidade</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={quantidadeDesejada}
                onChange={(e) => setQuantidadeDesejada(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmarAdicao}>
              Adicionar Material
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
