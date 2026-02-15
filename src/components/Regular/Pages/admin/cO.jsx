import { useState, useEffect } from "react";
import { Container, Table, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";

export default function RelatorioVendas() {
  const [vendas, setVendas] = useState([]);
  const [datasDisponiveis, setDatasDisponiveis] = useState([]);
  const [dataFiltro, setDataFiltro] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalDia, setTotalDia] = useState(0);

  // 🔹 Busca todas as datas de vendas únicas
  useEffect(() => {
    const carregarDatas = async () => {
      try {
        const res = await fetch("http://localhost:5002/admin/vendas/datas");
        const data = await res.json();
        setDatasDisponiveis(data);
        if (data.length > 0) setDataFiltro(data[0]); // seleciona a mais recente
      } catch (err) {
        console.error("Erro ao carregar datas:", err);
      }
    };
    carregarDatas();
  }, []);

  // 🔹 Carrega vendas sempre que mudar o filtro de data
  useEffect(() => {
    if (dataFiltro) buscarVendas();
  }, [dataFiltro]);

  const buscarVendas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5002/admin/vendas/diario?data=${dataFiltro}`);
      const data = await res.json();
      setVendas(data);
      const total = data.reduce((acc, v) => acc + Number(v.total || 0), 0);
      setTotalDia(total);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioPDF = async () => {
    try {
      const res = await fetch(`http://localhost:5002/admin/relatorios/vendas/diario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataFiltro }),
      });

      const data = await res.json()
      if (data.url) {
        window.open(`http://localhost:5002${data.url.url}`, "_blank");
      } else {
        alert("Erro ao gerar PDF");
      }
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
    }
  };
  // Gera o PDF
  
  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <Row className="align-items-center mb-3">
          <Col md={6}>
            <h3 className="text-primary mb-0">Relatório de Vendas Diárias</h3>
          </Col>

          <Col md={3}>
            <Form.Select
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
            >
              {datasDisponiveis.length === 0 ? (
                <option>Nenhuma data disponível</option>
              ) : (
                datasDisponiveis.map((data, idx) => (
                  <option key={idx} value={data}>
                    {new Date(data).toLocaleDateString("pt-PT")}
                  </option>
                ))
              )}
            </Form.Select>
          </Col>

          <Col md={3} className="text-end">
            <Button onClick={gerarRelatorioPDF} variant="success" disabled={!vendas.length}>
              📄 Gerar PDF
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Funcionário</th>
                <th>Total (KZ)</th>
              </tr>
            </thead>
            <tbody>
              {vendas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    Nenhuma venda registrada nesta data
                  </td>
                </tr>
              ) : (
                vendas.map((venda) => (
                  <tr key={venda.id}>
                    <td>{venda.id}</td>
                    <td>{new Date(venda.data).toLocaleDateString()}</td>
                    <td>{venda.funcionario || "—"}</td>
                    <td>{Number(venda.total).toLocaleString()} KZ</td>
                  </tr>
                ))
              )}
            </tbody>
            {vendas.length > 0 && (
              <tfoot>
                <tr>
                  <th colSpan={3} className="text-end">Total do Dia</th>
                  <th>{totalDia.toLocaleString()} KZ</th>
                </tr>
              </tfoot>
            )}
          </Table>
        )}
      </Container>
    </>
  );
}
