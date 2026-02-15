import React, { useState, useEffect } from "react";
import {
  Container, Row, Col, Card, Table, Form, Button, Tabs, Tab,
  Spinner, Alert, Image, Modal
} from "react-bootstrap";
import { PackagePlus, Layers, ClipboardList, PlusCircle, MapPin } from "lucide-react";
import DynamicNavbar from "../NAV.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Ensure the autoTable plugin is available as `doc.autoTable` for code
// that expects that API (some versions export a function instead).
if (jsPDF && jsPDF.API && !jsPDF.API.autoTable) {
  jsPDF.API.autoTable = function () {
    return autoTable(this, ...arguments);
  };
}


export default function EstoqueGeralMateriais() {
  const [key, setKey] = useState("produtos");
  const [materiais, setMateriais] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [armazens, setArmazens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [novoMaterial, setNovoMaterial] = useState({
    nome: "",
    precoCompra: "",
    precoVenda: "",
    descricao: "",
    categoriaId: "",
    imagem: null,
  });

  const [stocks, setStocks] = useState([]);

  const [movimento, setMovimento] = useState({
    item_id: "",
    quantidade: "",
    preco_unit: "",
    motivo: "entrada",
    armazemId: "",
  });

  const [novoArmazem, setNovoArmazem] = useState({ nome: "", endereco: "" });
  const [loadingArmazens, setLoadingArmazens] = useState(false);

  // Modal / estoque por armazém
  const [showModal, setShowModal] = useState(false);
  const [estoqueArmazem, setEstoqueArmazem] = useState([]);
  const [armazemSelecionado, setArmazemSelecionado] = useState(null);
  const [loadingEstoque, setLoadingEstoque] = useState(false);

  // Empresa (para cabeçalho do PDF). Tenta buscar do servidor, senão usa placeholder.
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    fetchMateriais();
    fetchCategorias();
    fetchArmazens();
    fetchEmpresa();
  }, []);

  async function fetchMateriais() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5002/admin/materiais");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      const processed = arr.map((m) => {
        // Tenta pegar o total calculado pelo backend no objeto 'estoque'
        // Se não existir, faz a soma manual: Quantidade Principal + Soma dos Estoques
        let totalCalculado = 0;

        if (m.estoque && m.estoque.totalDisponivel !== undefined) {
          totalCalculado = Number(m.estoque.totalDisponivel);
        } else {
          // Fallback caso o backend mude: Principal + Soma do array estoques
          const principal = Number(m.quantidade || 0);
          const somaArmazens = (m.estoques || []).reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
          
          // Nota: Baseado no seu JSON, parece que 'quantidade' é o principal
          // e 'estoques' são os extras. Se 'estoques' já incluir o principal, ajuste aqui.
          // Mas pelo JSON: Barde (90 principal + 106 armazem = 196 total), a lógica é soma.
           
          // No entanto, como 'totalDisponivel' já vem correto no seu JSON, 
          // este 'else' raramente será usado.
          totalCalculado = m.estoque?.totalDisponivel ?? (principal + somaArmazens); 
        }

        return {
          ...m,
          totalGeral: totalCalculado,
        };
      });

      setMateriais(processed);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar materiais.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategorias() {
    try {
      const res = await fetch("http://localhost:5002/admin/categorias");
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch {
      setCategorias([]);
    }
  }

  async function fetchArmazens() {
    setLoadingArmazens(true);
    try {
      const res = await fetch("http://localhost:5002/admin/armazens");
      const data = await res.json();
      setArmazens(Array.isArray(data) ? data : []);
    } catch (e) {
      setErro("Erro ao carregar armazéns.");
    } finally {
      setLoadingArmazens(false);
    }
  }

  async function fetchEmpresa() {
    try {
      const res = await fetch("http://localhost:5002/admin/empresa");
      if (!res.ok) throw new Error("no empresa endpoint");
      const data = await res.json();
      setEmpresa(data);
    } catch (e) {
      // fallback simples
      setEmpresa({
        nome: "Minha Empresa LDA",
        endereco: "Endereço da Empresa",
        telefone: "",
        nif: "",
      });
    }
  }

  async function handleCriarArmazem(e) {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5002/admin/armazens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoArmazem),
      });
      if (!res.ok) throw new Error("Falha ao criar armazém");
      setNovoArmazem({ nome: "", endereco: "" });
      fetchArmazens();
    } catch (err) {
      setErro(err.message);
    }
  }

  function addStockLine() {
    setStocks([...stocks, { armazemId: armazens[0]?.id || "", quantidade: 0 }]);
  }
  function updateStockLine(index, field, value) {
    const clone = [...stocks];
    clone[index] = { ...clone[index], [field]: value };
    setStocks(clone);
  }
  function removeStockLine(index) {
    const clone = [...stocks];
    clone.splice(index, 1);
    setStocks(clone);
  }

async function handleNovoMaterial(e) {
  e.preventDefault();
  
  // Validação: Verifica se há stocks e se o primeiro tem ID e Qtd
  if (stocks.length === 0 || !stocks[0].armazemId || !stocks[0].quantidade) {
    setErro("É obrigatório associar o produto a pelo menos um armazém com quantidade.");
    return;
  }

  const formData = new FormData();
  for (let k in novoMaterial) {
    if (novoMaterial[k] !== null && novoMaterial[k] !== undefined) {
      formData.append(k, novoMaterial[k]);
    }
  }
  
  // O backend receberá apenas o array de stocks para distribuir as quantidades
  formData.append("stocks", JSON.stringify(stocks));

  try {
    const res = await fetch("http://localhost:5002/admin/materiais/smart", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.erro) throw new Error(data.erro || "Erro servidor");
    
    // Resetar formulário
    setNovoMaterial({
      nome: "",
      precoCompra: "",
      precoVenda: "",
      descricao: "",
      categoriaId: "",
      imagem: null,
    });
    setStocks([{ armazemId: "", quantidade: "" }]); // Reseta para uma linha limpa
    fetchMateriais();
  } catch (err) {
    setErro(err.message);
  }
}

  async function handleMovimento(e) {
    e.preventDefault();
    if (!movimento.item_id || !movimento.quantidade) return;

    try {
      if (movimento.armazemId) {
        const arId = movimento.armazemId;
        const res = await fetch(`http://localhost:5002/admin/armazens/${arId}/entrada`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId: movimento.item_id,
            quantidade: Number(movimento.quantidade),
            preco_unitario: movimento.preco_unit ? Number(movimento.preco_unit) : undefined,
          }),
        });
        const data = await res.json();
        if (data.erro) throw new Error(data.erro);
      } else {
        const res = await fetch("http://localhost:5002/admin/estoque/entrada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: movimento.item_id,
            quantidade: Number(movimento.quantidade),
            preco_unit: movimento.preco_unit ? Number(movimento.preco_unit) : null,
            motivo: movimento.motivo,
          }),
        });
        const data = await res.json();
        if (data.erro) throw new Error(data.erro);
      }

      setMovimento({ item_id: "", quantidade: "", preco_unit: "", motivo: "entrada", armazemId: "" });
      fetchMateriais();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function fetchEstoqueArmazem(armazemId) {
    setLoadingEstoque(true);
    try {
      const res = await fetch(`http://localhost:5002/admin/armazens/${armazemId}/estoque`);
      const data = await res.json();
      setEstoqueArmazem(Array.isArray(data) ? data : []);
    } catch (err) {
      setEstoqueArmazem([]);
      setErro("Erro ao obter estoque do armazém.");
    } finally {
      setLoadingEstoque(false);
    }
  }

  async function handleVerEstoque(armazem) {
    setArmazemSelecionado(armazem);
    setShowModal(true);
    await fetchEstoqueArmazem(armazem.id);
  }

  async function salvarQuantidade(estoqueId, quantidade) {
    try {
      const res = await fetch(`http://localhost:5002/admin/estoques/${estoqueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade: Number(quantidade) }),
      });
      const data = await res.json();
      if (data.erro) throw new Error(data.erro);
      // re-fetch estoque do armazém e materiais totais para manter sincronizado
      if (armazemSelecionado?.id) await fetchEstoqueArmazem(armazemSelecionado.id);
      fetchMateriais();
    } catch (err) {
      setErro("Erro ao atualizar quantidade do estoque");
    }
  }

  function number(value) {
    return Number(value || 0);
  }


// Função async para gerar um PDF estilizado sem plugins (jsPDF puro)
// Integre isso no seu componente e chame gerarPdf() quando o usuário clicar no botão.

async function gerarPdf({ empresa, armazemSelecionado, estoqueArmazem }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const number = (v) => Number(v || 0);
  const fmt = (v) => new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number(v)) + ' Kz';

  const comp = empresa || { nome: 'Minha Empresa LDA', endereco: '', telefone: '', nif: '' };

  // tenta carregar logo se existir (empresa.logoUrl)
  let logoDataUrl = null;
  if (comp.logoUrl) {
    try {
      const r = await fetch(comp.logoUrl);
      const blob = await r.blob();
      logoDataUrl = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      logoDataUrl = null;
    }
  }

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginLeft = 40;
  let cursorY = 40;

  // header colorido
  doc.setFillColor(33, 97, 140);
  doc.rect(0, 0, pageW, 70, 'F');

  // logo ou círculo com iniciais
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'JPEG', marginLeft, 12, 46, 46); } catch (e) {}
  } else {
    const initials = (comp.nome || 'ME').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
    doc.setFillColor(255, 255, 255);
    doc.circle(marginLeft + 23, 35, 23, 'F');
    doc.setFontSize(12);
    doc.setTextColor(33, 97, 140);
    const w = doc.getTextWidth(initials);
    doc.text(initials, marginLeft + 23 - w/2, 39);
  }

  // textos do cabeçalho
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  const nameX = marginLeft + 70;
  doc.text(comp.nome || 'Minha Empresa LDA', nameX, 30);
  doc.setFontSize(10);
  doc.text(comp.endereco || '', nameX, 46);

  cursorY = 90;

  // caixa com informações do armazém
  doc.setFillColor(245, 246, 250);
  // roundedRect pode não existir em versões muito antigas do jsPDF - se der erro, troque por rect simples
  if (typeof doc.roundedRect === 'function') {
    doc.roundedRect(marginLeft, cursorY, pageW - marginLeft*2, 52, 6, 6, 'F');
  } else {
    doc.rect(marginLeft, cursorY, pageW - marginLeft*2, 52, 'F');
  }
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(11);
  doc.text(`Armazém: ${armazemSelecionado?.nome || '-'}`, marginLeft + 8, cursorY + 18);
  if (armazemSelecionado?.endereco) doc.text(`Localização: ${armazemSelecionado.endereco}`, marginLeft + 8, cursorY + 36);
  const emitStr = `Emitido: ${new Date().toLocaleString()}`;
  doc.text(emitStr, pageW - marginLeft - doc.getTextWidth(emitStr), cursorY + 18);

  cursorY += 72;

  // Use jspdf-autotable to render the data table (avoids reliance on doc.autoTable)
  const head = [['Produto', 'Compra (Kz)', 'Venda (Kz)', 'Quantidade', 'Total (Kz)']];
  const body = estoqueArmazem.map((e) => {
    const nome = e.Material?.nome || e.material?.nome || e.nome || '—';
    const precoC = number(e.Material?.precoCompra || e.material?.precoCompra || e.precoCompra || 0);
    const precoV = number(e.Material?.precoVenda || e.material?.precoVenda || e.precoVenda || 0);
    const qtd = number(e.quantidade);
    const total = precoC * qtd;
    return [nome, fmt(precoC), fmt(precoV), new Intl.NumberFormat('pt-PT').format(qtd), new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2 }).format(total) + ' Kz'];
  });

  // call plugin directly
  const atResult = autoTable(doc, {
    startY: cursorY,
    head: head,
    body: body,
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [38, 116, 169], textColor: 255, halign: 'left' },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    margin: { left: marginLeft, right: marginLeft },
    theme: 'striped',
    didDrawPage: (data) => {
      // nothing here — we already draw header above
    },
  });

  // update cursorY to after the table
  cursorY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || (atResult && atResult.finalY) || (cursorY + 20);

  // compute totals from the supplied estoqueArmazem
  let totalCompra = estoqueArmazem.reduce((s, e) => s + number(e.quantidade) * number(e.Material?.precoCompra || e.material?.precoCompra || e.precoCompra || 0), 0);
  let totalVenda = estoqueArmazem.reduce((s, e) => s + number(e.quantidade) * number(e.Material?.precoVenda || e.material?.precoVenda || e.precoVenda || 0), 0);

  // totais
  if (cursorY + 50 > pageH - 80) {
    const currentPage = doc.getNumberOfPages();
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Página ${currentPage}`, pageW - marginLeft - 50, pageH - 30);
    doc.addPage();
    cursorY = 40;
  }

  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, cursorY + 6, pageW - marginLeft, cursorY + 6);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Totais:', marginLeft, cursorY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Compra: ${fmt(totalCompra)}`, marginLeft + 80, cursorY + 28);
  doc.text(`Total Venda: ${fmt(totalVenda)}`, marginLeft + 80, cursorY + 46);

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Página ${p} de ${pageCount}`, pageW - marginLeft - 80, pageH - 30);
  }

  const safeName = (armazemSelecionado?.nome || 'armazem').replace(/\s+/g, '_');
  doc.save(`estoque_${safeName}.pdf`);
}



  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <h2 className="text-primary mb-4 d-flex align-items-center gap-2">
          <Layers size={26} /> Estoque Geral de Materiais
        </h2>

        {erro && <Alert variant="danger" onClose={() => setErro(null)} dismissible>{erro}</Alert>}

        <Tabs activeKey={key} onSelect={setKey}>
          <Tab eventKey="produtos" title="Materiais">
            <Row className="mt-3">
              <Col md={5}>
  <Card className="p-3 shadow-sm rounded-4 border-0">
    <Form onSubmit={handleNovoMaterial}>
      <h5 className="mb-4 d-flex align-items-center gap-2 text-primary">
        <PackagePlus size={22} /> Novo Material
      </h5>

      {/* Nome do Produto */}
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">Nome do Material</Form.Label>
        <Form.Control
          placeholder="Ex: Cimento Portland"
          value={novoMaterial.nome}
          onChange={(e) =>
            setNovoMaterial({ ...novoMaterial, nome: e.target.value })
          }
          required
        />
      </Form.Group>

      {/* Preços */}
      <Row>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Preço Compra (Kz)</Form.Label>
            <Form.Control
              type="number"
              placeholder="0.00"
              value={novoMaterial.precoCompra}
              onChange={(e) =>
                setNovoMaterial({ ...novoMaterial, precoCompra: e.target.value })
              }
              required
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Preço Venda (Kz)</Form.Label>
            <Form.Control
              type="number"
              placeholder="0.00"
              value={novoMaterial.precoVenda}
              onChange={(e) =>
                setNovoMaterial({ ...novoMaterial, precoVenda: e.target.value })
              }
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Categoria */}
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">Categoria</Form.Label>
        <Form.Select
          value={novoMaterial.categoriaId}
          onChange={(e) =>
            setNovoMaterial({ ...novoMaterial, categoriaId: e.target.value })
          }
          required
        >
          <option value="">-- selecione a categoria --</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Imagem */}
      <Form.Group className="mb-4">
        <Form.Label className="fw-semibold">Imagem do Produto</Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={(e) =>
            setNovoMaterial({ ...novoMaterial, imagem: e.target.files[0] })
          }
        />
        {novoMaterial.imagem && (
          <div className="mt-2 text-center">
            <Image
              src={URL.createObjectURL(novoMaterial.imagem)}
              style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 10, border: '1px solid #dee2e6' }}
            />
          </div>
        )}
      </Form.Group>

      {/* SEÇÃO OBRIGATÓRIA: ESTOQUE POR ARMAZÉM */}
      <Card className="p-3 mb-4 border-primary bg-light shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <h6 className="mb-0 fw-bold text-primary">Estoque Inicial por Armazém</h6>
          </div>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={addStockLine}
            className="d-flex align-items-center gap-1"
          >
            <PlusCircle size={14} /> Adicionar
          </Button>
        </div>

        {stocks.length === 0 ? (
          <div className="text-danger small fw-bold text-center py-2">
            * Adicione pelo menos um armazém para salvar o produto.
          </div>
        ) : (
          stocks.map((s, idx) => (
            <Row key={idx} className="g-2 align-items-center mb-2">
              <Col md={7}>
                <Form.Select
                  value={s.armazemId}
                  onChange={(e) => updateStockLine(idx, "armazemId", e.target.value)}
                  required
                >
                  <option value="">-- selecionar armazém --</option>
                  {armazens.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Control
                  type="number"
                  min="1"
                  value={s.quantidade}
                  onChange={(e) => updateStockLine(idx, "quantidade", e.target.value)}
                  placeholder="Qtd"
                  required
                />
              </Col>
              <Col md={2}>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="w-100"
                  onClick={() => removeStockLine(idx)}
                >
                  ✕
                </Button>
              </Col>
            </Row>
          ))
        )}
      </Card>

      <Button 
        type="submit" 
        variant="primary" 
        className="w-100 fw-bold py-2 shadow-sm"
        disabled={stocks.length === 0}
      >
        <PlusCircle size={18} className="me-2" /> 
        CADASTRAR MATERIAL NO ESTOQUE
      </Button>
    </Form>
  </Card>
</Col>

              <Col>
                <Card className="p-3 shadow-sm rounded-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2">
                    <ClipboardList size={18} /> Materiais no Estoque
                  </h5>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    // ... dentro do return, na Tab "produtos" ...

<Table striped hover responsive>
  <thead className="table-primary">
    <tr>
      <th>Nome</th>
      <th>Compra</th>
      <th>Venda</th>
      <th>Qtd Total</th> {/* Alterei o título para ficar claro */}
      <th>Total (Qtd x Preço Compra)</th>
    </tr>
  </thead>
  <tbody>
    {materiais.map((m) => (
      <tr key={m.id}>
        <td>{m.nome}</td>
        <td>{(Number(m.precoCompra || 0)).toFixed(2)} Kz</td>
        <td>{(Number(m.precoVenda || 0)).toFixed(2)} Kz</td>
        
        {/* AQUI ESTÁ A MUDANÇA: Usa totalGeral calculado */}
        <td style={{ fontWeight: "bold" }}>
            {m.totalGeral}
        </td>

        <td>
          <div style={{ textAlign: "center" }}>
            {/* Calcula o valor total do estoque baseado na soma de tudo */}
            {(Number(m.totalGeral) * Number(m.precoCompra || 0)).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</Table>
                  )}
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="movimentos" title="Entradas de Estoque">
            <Row className="mt-3">
              <Col md={5}>
                <Card className="p-3 shadow-sm rounded-4">
                  <Form onSubmit={handleMovimento}>
                    <Form.Group className="mb-2">
                      <Form.Label>Produto</Form.Label>
                      <Form.Select
                        value={movimento.item_id}
                        onChange={(e) => setMovimento({ ...movimento, item_id: e.target.value })}
                        required
                      >
                        <option value="">-- selecione --</option>
                        {materiais.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nome}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Armazém (onde registrar)</Form.Label>
                      <Form.Select
                        value={movimento.armazemId}
                        onChange={(e) => setMovimento({ ...movimento, armazemId: e.target.value })}
                      >
                        <option value="">-- nenhum / global --</option>
                        {armazens.map((a) => (
                          <option key={a.id} value={a.id}>{a.nome} — {a.endereco}</option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Se não selecionar, será usado o fluxo global de entrada.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Quantidade</Form.Label>
                      <Form.Control
                        type="number"
                        value={movimento.quantidade}
                        onChange={(e) => setMovimento({ ...movimento, quantidade: e.target.value })}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Preço Unitário (opcional)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={movimento.preco_unit}
                        onChange={(e) => setMovimento({ ...movimento, preco_unit: e.target.value })}
                      />
                    </Form.Group>

                    <Button type="submit" className="w-100 fw-semibold">
                      Registrar Entrada
                    </Button>
                  </Form>
                </Card>
              </Col>

              <Col>
                <Card className="p-3 shadow-sm rounded-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2">
                    <MapPin size={18} /> Estoques por Armazém
                  </h5>
                  <div className="small text-muted mb-2">Clique em "Ver" para abrir o estoque do armazém.</div>
                  {loadingArmazens ? (
                    <div className="text-center py-4"><Spinner animation="border" /></div>
                  ) : (
                    <Table striped hover responsive>
                      <thead className="table-primary">
                        <tr>
                          <th>Armazém</th>
                          <th>Localização</th>
                          <th>Ver Estoque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {armazens.map(a => (
                          <tr key={a.id}>
                            <td>{a.nome}</td>
                            <td>{a.endereco}</td>
                            <td>
                              <Button size="sm" onClick={() => handleVerEstoque(a)}>Ver</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="armazens" title="Armazéns">
            <Row className="mt-3">
              <Col md={4}>
                <Card className="p-3 shadow-sm rounded-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2"><MapPin size={18} /> Criar Armazém</h5>
                  <Form onSubmit={handleCriarArmazem}>
                    <Form.Group className="mb-2">
                      <Form.Label>Nome</Form.Label>
                      <Form.Control value={novoArmazem.nome} onChange={(e) => setNovoArmazem({ ...novoArmazem, nome: e.target.value })} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Endereço / Localização</Form.Label>
                      <Form.Control value={novoArmazem.endereco} onChange={(e) => setNovoArmazem({ ...novoArmazem, endereco: e.target.value })} />
                    </Form.Group>
                    <Button type="submit" className="w-100">Criar Armazém</Button>
                  </Form>
                </Card>
              </Col>

              <Col>
                <Card className="p-3 shadow-sm rounded-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2"><MapPin size={18} /> Lista de Armazéns</h5>
                  {loadingArmazens ? (
                    <div className="text-center py-4"><Spinner /></div>
                  ) : (
                    <Table striped hover responsive>
                      <thead className="table-primary">
                        <tr>
                          <th>Nome</th>
                          <th>Endereço / Localização</th>
                        </tr>
                      </thead>
                      <tbody>
                        {armazens.map(a => (
                          <tr key={a.id}>
                            <td>{a.nome}</td>
                            <td>{a.endereco}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>

        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Estoque do Armazém: {armazemSelecionado?.nome}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {loadingEstoque ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
              </div>
            ) : estoqueArmazem.length === 0 ? (
              <Alert variant="info">Nenhum produto neste armazém.</Alert>
            ) : (
              <>
                {/* Totais: compra e venda */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <strong>Totais:</strong>
                    <div className="small text-muted">
                      Compra: {estoqueArmazem.reduce((s,e) => s + number(e.quantidade) * number(e.Material?.precoCompra || e.material?.precoCompra || e.precoCompra || 0), 0).toFixed(2)} Kz
                    </div>
                    <div className="small text-muted">
                      Venda: {estoqueArmazem.reduce((s,e) => s + number(e.quantidade) * number(e.Material?.precoVenda || e.material?.precoVenda || e.precoVenda || 0), 0).toFixed(2)} Kz
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="primary"
                      onClick={() => gerarPdf({ empresa, armazemSelecionado, estoqueArmazem })}
                      className="me-2"
                    >
                      Imprimir PDF
                    </Button>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Fechar</Button>
                  </div>
                </div>

                <Table striped hover responsive>
                  <thead className="table-primary">
                    <tr>
                      <th>Produto</th>
                      <th>Compra (Kz)</th>
                      <th>Venda (Kz)</th>
                      <th style={{ width: 120 }}>Quantidade</th>
                      <th style={{ width: 160 }}>Total Compra (Kz)</th>
                      <th style={{ width: 120 }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estoqueArmazem.map((e, idx) => {
                      const nome = e.Material?.nome || e.material?.nome || e.nome || "—";
                      const precoC = number(e.Material?.precoCompra || e.material?.precoCompra || e.precoCompra || 0);
                      const precoV = number(e.Material?.precoVenda || e.material?.precoVenda || e.precoVenda || 0);
                      const qtd = number(e.quantidade);
                      const total = (qtd * precoC).toFixed(2);

                      return (
                        <tr key={e.id}>
                          <td>{nome}</td>
                          <td>{precoC.toFixed(2)}</td>
                          <td>{precoV.toFixed(2)}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={e.quantidade}
                              onChange={(ev) => {
                                const clone = [...estoqueArmazem];
                                clone[idx] = { ...clone[idx], quantidade: ev.target.value };
                                setEstoqueArmazem(clone);
                              }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>{total}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => salvarQuantidade(e.id, e.quantidade)}
                            >
                              Salvar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </>
            )}
          </Modal.Body>

          {/* Footer moved inside body area for better PDF button placement - keep footer simple */}
        </Modal>
      </Container>
    </>
  );
}
