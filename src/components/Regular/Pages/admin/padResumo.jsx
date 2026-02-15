import { useState, useEffect } from "react";
import { Container, Table, Form, Accordion, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DynamicNavbar from "../NAV.jsx";

function ResumoProducao() {
  const [resumo, setResumo] = useState({});
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [datasUnicas, setDatasUnicas] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5002/admin/producao")
      .then((res) => res.json())
      .then((dados) => {
        const agrupado = {};
        const datas = new Set();

        dados.forEach((item) => {
          const data = new Date(item.data).toLocaleDateString("pt-BR");
          datas.add(data);

          if (!agrupado[data]) agrupado[data] = {};

          const chave = `${item.massa || "Sem Massa"} | ${item.padeiro || "Desconhecido"}`;
          if (!agrupado[data][chave]) {
            agrupado[data][chave] = {
              totalFarinha: 0,
              totalQtd: 0,
              produtos: {},
            };
          }

          agrupado[data][chave].totalFarinha += item.farinha || 0;
          agrupado[data][chave].totalQtd += item.quantidade || 0;

          if (!agrupado[data][chave].produtos[item.produto]) {
            agrupado[data][chave].produtos[item.produto] = 0;
          }

          agrupado[data][chave].produtos[item.produto] += item.quantidade || 0;
        });

        setResumo(agrupado);
        setDatasUnicas(Array.from(datas).sort((a, b) => new Date(b) - new Date(a)));
      })
      .catch((err) => console.error("Erro ao carregar produção:", err));
  }, []);

  const navigate = useNavigate();
  const sairPadeiro = () => {
    sessionStorage.clear();
    navigate("/office/login");
  };

  const datasParaMostrar = dataSelecionada ? [dataSelecionada] : datasUnicas;

  const gerarPDF = () => {
  const doc = new jsPDF();
  let currentY = 20;

  doc.setFontSize(16);
  doc.text("Resumo de Produção", 14, currentY);
  currentY += 10;

  datasParaMostrar.forEach((data, i) => {
    doc.setFontSize(12);
    doc.text(`Data: ${data}`, 14, currentY);
    currentY += 6;

    const rows = [];
    let totalFarinhaDia = 0;
    let totalQtdDia = 0;

    Object.entries(resumo[data]).forEach(([chave, info]) => {
      const [massa, padeiro] = chave.split(" | ");
      const produtos = Object.entries(info.produtos)
        .map(([nome, qtd]) => `${qtd}x ${nome}`)
        .join(", ");

      totalFarinhaDia += info.totalFarinha;
      totalQtdDia += info.totalQtd;

      rows.push([
        massa,
        padeiro,
        (info.totalFarinha / 1000).toFixed(2) + " kg",
        info.totalQtd,
        produtos
      ]);
    });

    autoTable(doc, {
      head: [["Massa", "Padeiro", "Farinha", "Qtd", "Produtos"]],
      body: rows,
      startY: currentY,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        currentY = data.cursor.y + 10;
      }
    });

    doc.setFontSize(11);
    doc.text(
      `Totais do dia: Farinha ${(totalFarinhaDia / 1000).toFixed(2)} kg | Unidades: ${totalQtdDia}`,
      14,
      currentY
    );
    currentY += 10;

    // nova página se estiver perto do fim
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
  });

  doc.save(`resumo-producao_${new Date().toISOString().split("T")[0]}.pdf`);
};


  return (
    <>
      <DynamicNavbar />

      <Container className="py-5">
        <h2 className="fw-bold mb-4">Resumo Diário da Produção</h2>

        <Form.Group className="mb-3 w-50">
          <Form.Label>Filtrar por data</Form.Label>
          <Form.Select
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
          >
            <option value="">-- Todas as Datas --</option>
            {datasUnicas.map((data, idx) => (
              <option key={idx} value={data}>
                {data}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Button variant="secondary" onClick={gerarPDF} className="mb-3">
          Exportar PDF
        </Button>

        {datasParaMostrar.length === 0 && <p>Nenhum dado encontrado.</p>}

        {datasParaMostrar.map((data) => {
          let totalFarinhaDia = 0;
          let totalQtdDia = 0;

          return (
            <div key={data} className="mb-4">
              <h4 className="text-primary">{data}</h4>

              <Accordion defaultActiveKey="0">
                {Object.entries(resumo[data] || {}).map(([chave, info], idx) => {
                  const [massa, padeiro] = chave.split(" | ");
                  totalFarinhaDia += info.totalFarinha;
                  totalQtdDia += info.totalQtd;

                  return (
                    <Accordion.Item eventKey={idx} key={idx}>
                      <Accordion.Header>
                        Massa: <strong> {massa} </strong> | Padeiro: <strong>{padeiro}</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        <p><strong>Farinha:</strong> {(info.totalFarinha / 1000).toFixed(2)} kg</p>
                        <p><strong>Total de Unidades:</strong> {info.totalQtd}</p>
                        <p><strong>Produtos:</strong> {
                          Object.entries(info.produtos)
                            .map(([nome, qtd]) => `${qtd}x ${nome}`)
                            .join(", ")
                        }</p>
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                })}
              </Accordion>

              <div className="mt-2">
                <strong>Totais do dia:</strong> Farinha {(totalFarinhaDia / 1000).toFixed(2)} kg | Unidades: {totalQtdDia}
              </div>
            </div>
          );
        })}
      </Container>
    </>
  );
}

export default ResumoProducao;
