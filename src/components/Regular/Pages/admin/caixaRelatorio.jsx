import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Form,
  Row,
  Col,
  Card,
  Badge,
} from "react-bootstrap";
import dayjs from "dayjs";
import DynamicNavbar from "../NAV.JSX";

export default function RelatorioVendas() {
  const [vendas, setVendas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [datasUnicas, setDatasUnicas] = useState([]);

  useEffect(() => {
    async function carregarVendas() {
      const res = await fetch("http://localhost:5000/admin/vendas");
      const lista = await res.json();
      const datas = [...new Set(lista.map(v => dayjs(v.data).format("YYYY-MM-DD")))];
      setVendas(lista);
      setDatasUnicas(datas);
      setFiltro(datas[0] || "");
    }
    carregarVendas();
  }, []);

  // Agrupa por data
  const agrupadas = vendas.reduce((acc, venda) => {
    const data = dayjs(venda.data).format("YYYY-MM-DD");
    if (!acc[data]) acc[data] = [];
    acc[data].push(venda);
    return acc;
  }, {});

  const vendasFiltradas = filtro ? agrupadas[filtro] || [] : [];

  // Exporta factura individual
  const gerarFactura = async (vendaId) => {
    try {
      const res = await fetch("http://localhost:5000/admin/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendaId }),
      });
      const data = await res.json();
      if (data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.target = "_blank";
        link.click();
      } else {
        alert("Erro ao gerar factura.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar factura.");
    }
  };

  return (
    <>
      <DynamicNavbar />
      <Container className="py-5">
        <h3 className="mb-4 fw-bold text-center">Relatório de Vendas - Loja de Materiais</h3>

        <Row className="mb-4">
          <Col md={4}>
            <Form.Label>Filtrar por data:</Form.Label>
            <Form.Select value={filtro} onChange={e => setFiltro(e.target.value)}>
              {datasUnicas.map(d => (
                <option key={d} value={d}>{dayjs(d).format("DD/MM/YYYY")}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        <Table bordered responsive hover>
          <thead className="table-light">
            <tr>
              <th>Venda</th>
              <th>Produtos</th>
              <th>Qtd</th>
              <th>Total</th>
              <th>Factura</th>
            </tr>
          </thead>
          <tbody>
            {vendasFiltradas.map(venda => (
              <tr key={venda.id}>
                <td>
                  {dayjs(venda.data).format("DD/MM/YYYY")}<br />
                  <Badge bg="secondary" className="mt-1">#{venda.id}</Badge>
                </td>
                <td>
                  {venda.itens?.map(item => (
                    <div key={item.id}>{item.produto?.nome || "Produto"}</div>
                  ))}
                </td>
                <td>
                  {venda.itens?.map((item, idx) => (
                    <div key={idx}>{item.quantidade}x</div>
                  ))}
                </td>
                <td>Kz {Number(venda.total).toLocaleString()}</td>
                <td>
                  <Button size="sm" variant="warning" onClick={() => gerarFactura(venda.id)}>
                    Gerar Factura
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}
