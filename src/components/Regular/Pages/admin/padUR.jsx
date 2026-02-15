import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Table,
  Spinner,
  Button,
  Alert
} from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Materiais() {
  const [materiais, setMateriais] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- CÁLCULOS TOTAIS CORRIGIDOS ---
  // Acede a m.estoque.totalDisponivel
  const totalItens = materiais.reduce((acc, m) => acc + (Number(m.estoque?.totalDisponivel) || 0), 0);
  const totalValor = materiais.reduce((acc, m) => acc + ((Number(m.estoque?.totalDisponivel) || 0) * m.preco2), 0);

  const fetchMateriais = async (categoriaId = "") => {
    setLoading(true);
    try {
      const query = categoriaId ? `?categoria=${categoriaId}` : "";
      const res = await fetch(`http://localhost:5002/admin/materiais${query}`);
      if (!res.ok) throw new Error("Erro ao carregar materiais");
      const data = await res.json();
      setMateriais(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch("http://localhost:5002/admin/categorias");
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
    }
  };

  useEffect(() => {
    fetchCategorias();
    fetchMateriais();
  }, []);

  useEffect(() => {
    fetchMateriais(categoriaSelecionada);
  }, [categoriaSelecionada]);

  async function gerarRelatorioMateriaisComEmpresa(materiais, totalItens, totalValor) {
    try {
      // 1️⃣ Buscar dados da empresa
      const res = await fetch("http://localhost:5002/admin/empresa");
      if (!res.ok) throw new Error("Erro ao buscar dados da empresa");
      const empresa = await res.json();
  
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const dataHora = new Date().toLocaleString("pt-PT");
  
      // 2️⃣ Cabeçalho com logo
      try {
        let logoBase64 = null;
        if (empresa.logoBase64 && empresa.logoBase64.startsWith("data:image")) {
          logoBase64 = empresa.logoBase64;
        } else if (empresa.logo) {
          const logoUrl = empresa.logo.startsWith("http")
            ? empresa.logo
            : `http://localhost:5002${empresa.logo}`;
          const img = await fetch(logoUrl);
          const blob = await img.blob();
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
        if (logoBase64 && logoBase64.startsWith("data:image")) {
          doc.addImage(logoBase64, "PNG", 14, 10, 25, 25);
        }
      } catch (err) {
        console.warn("⚠️ Erro ao carregar logo:", err.message);
      }
  
      // 3️⃣ Texto do cabeçalho
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text(empresa.nome || "Empresa", 45, 18);
  
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (empresa.nif) doc.text(`NIF: ${empresa.nif}`, 45, 24);
      if (empresa.telefone) doc.text(`Tel: ${empresa.telefone}`, 45, 29);
      if (empresa.endereco) doc.text(empresa.endereco, 45, 34);
      doc.text(`Data: ${dataHora}`, 45, 39);
  
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(0.6);
      doc.line(14, 43, pageWidth - 14, 43);
  
      // 4️⃣ Tabela de Totais
      const totalTableColumn = ["Total de Itens", "Valor em Estoque"];
      const totalTableRows = [[totalItens.toString(), `${totalValor.toLocaleString()} kz`]];
  
      autoTable(doc, {
        startY: 50,
        head: [totalTableColumn],
        body: totalTableRows,
        theme: "grid",
        styles: { fontSize: 12, halign: "center", valign: "middle" },
        headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
      });
  
      // 5️⃣ Tabela de Materiais detalhada
      const tableColumn = [
        "Nome",
        "Descrição",
        "Quantidade",
        "Preço Venda (kz)",
        "Preço Compra (kz)",
        "Total (kz)"
      ];
  
      // AQUI ESTÁ A CORREÇÃO DO PDF TAMBÉM
      const tableRows = materiais.map((m) => {
        const qtd = Number(m.estoque?.totalDisponivel) || 0;
        return [
          m.nome,
          m.descricao,
          qtd,
          m.preco.toLocaleString(),
          m.preco2.toLocaleString(),
          (m.preco2 * qtd).toLocaleString() + " kz"
        ];
      });
  
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 248, 255] },
        margin: { left: 14, right: 14 },
      });
  
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `© ${new Date().getFullYear()} ${empresa.nome || "Empresa"} - Relatório gerado automaticamente`,
        14,
        pageHeight - 10
      );
  
      doc.save(`Relatorio_Materiais_${dataHora.replace(/[/:]/g, "-")}.pdf`);
    } catch (err) {
      console.error("❌ Erro ao gerar relatório:", err);
      alert("Erro ao gerar relatório: " + err.message);
    }
  }

  return (
    <>
      <DynamicNavbar />
      <Container className="py-5">
        <h2 className="fw-bold mb-4">Materiais</h2>

        <Row className="mb-4">
          <Col md={3}>
            <Form.Select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Form.Select>
          </Col>
          <Col className="text-end">
            <Button
              variant="primary"
              onClick={() =>
                gerarRelatorioMateriaisComEmpresa(materiais, totalItens, totalValor)
              }
            >
              Gerar Relatório PDF
            </Button>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h5>Total de Itens</h5>
                <h3>{totalItens}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h5>Valor em Estoque</h5>
                <h3>{totalValor.toLocaleString()} kz</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {loading && <Spinner animation="border" />}
        {error && <Alert variant="danger">{error}</Alert>}

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Quantidade</th>
              <th>Preço Venda kz (PV)</th>
              <th>Preço Compra kz (PC)</th>
              <th>Total (PC x Quantidade)</th>
            </tr>
          </thead>
          <tbody>
            {materiais.map((m) => {
              // AQUI ESTÁ A MÁGICA: PEGANDO DO ESTOQUE
              const qtd = Number(m.estoque?.totalDisponivel) || 0;
              
              return (
                <tr key={m.id}>
                  <td>{m.nome}</td>
                  <td>{m.descricao}</td>
                  <td>{qtd}</td>
                  <td>{m.preco.toLocaleString()}</td>
                  <td>{m.preco2.toLocaleString()}</td>
                  <td>{(m.preco2 * qtd).toLocaleString() + " KZ"}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Container>
    </>
  );
}