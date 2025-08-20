import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import * as Icon from "react-bootstrap-icons";
import DynamicNavbar from "../NAV.JSX";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function AdminDashboard() {
  const [periodo, setPeriodo] = useState("mes");
  const [estatisticas, setEstatisticas] = useState({ totalVendas: 0, totalItens: 0 });
  const [dadosGrafico, setDadosGrafico] = useState({ labels: [], datasets: [] });
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDados(periodo);
  }, [periodo]);

  async function carregarDados(periodo) {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/admin/vendas-${periodo}`);
      const vendasData = await res.json();

      // Totais
      const totalVendas = vendasData.reduce((acc, v) => acc + parseFloat(v.total_vendido || 0), 0);
      const totalItens = vendasData.reduce(
        (acc, v) => acc + (v.itens?.reduce((sum, i) => sum + i.quantidade, 0) || 0),
        0
      );

      setEstatisticas({ totalVendas, totalItens });
      setVendas(vendasData);

      // Dados para gráfico
      setDadosGrafico({
        labels: vendasData.map(v => v.hoje || v.dia || v.mes || v.ano || "Geral"),
        datasets: [{
          label: "Vendas (kz)",
          data: vendasData.map(v => parseFloat(v.total_vendido)),
          backgroundColor: "#0d6efd",
          borderRadius: 8,
        }],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DynamicNavbar />
      <Container className="py-5">
        <h2 className="fw-bold mb-4">Dashboard de Vendas de Materiais</h2>

        <Row className="mb-4">
          <Col md={4}>
            <Form.Select value={periodo} onChange={e => setPeriodo(e.target.value)}>
              <option value="hoje">Hoje</option>
              <option value="dia">Por Dia</option>
              <option value="mes">Por Mês</option>
              <option value="ano">Por Ano</option>
              <option value="geral">Geral</option>
            </Form.Select>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Icon.CartCheck size={32} className="text-success mb-2" />
                <h5>Total Vendas</h5>
                <h3>{estatisticas.totalVendas.toLocaleString()} kz</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Icon.BoxSeam size={32} className="text-primary mb-2" />
                <h5>Total Itens Vendidos</h5>
                <h3>{estatisticas.totalItens}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Card.Header className="bg-dark text-white">
            Relatório de Vendas ({periodo})
          </Card.Header>
          <Card.Body>
            <Bar data={dadosGrafico} />
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}
