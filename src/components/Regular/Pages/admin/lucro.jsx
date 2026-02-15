import { useState } from "react";
import {
  Container, Row, Col, Card, Button, Spinner, Form, Alert, Table
} from "react-bootstrap";
import {
  FileText, RefreshCcw, TrendingUp, ShoppingCart, Box, Archive
} from "lucide-react";
import DynamicNavbar from "../NAV.jsx";
import  { useMemo } from 'react'; // Adicione useMemo se não estiver lá
const currencyFormatter = (v) =>
  (Number(v) || 0).toLocaleString("pt-AO", { style: "currency", currency: "AOA" });

function MiniStat({ title, value, icon, color, subtitle }) {
  return (
    <Card className="text-center shadow-sm border-0 rounded-4 py-3 h-100">
      <Card.Body>
        {icon}
        <div className="mt-2 text-muted small">{title}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        {subtitle && <div className="text-muted small">{subtitle}</div>}
      </Card.Body>
    </Card>
  );
}

function BarsChart({ data = [], height = 220 }) {
  const width = Math.max(420, data.length * 120);
  const padding = { top: 20, right: 20, bottom: 48, left: 100 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map(d => Math.abs(d.value)), 1);
  const barW = Math.min(80, innerW / Math.max(1, data.length) * 0.6);
  const gap = (innerW - data.length * barW) / Math.max(1, (data.length + 1));

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width={width} height={height} fill="#f9fbff" rx="6" />

      {/* Linhas horizontais e valores à esquerda */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padding.top + t * innerH;
        const v = Math.round(max * (1 - t));
        return (
          <g key={i}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e5eaf1" />
            <text x={padding.left - 12} y={y + 4} fontSize="10" fill="#6c757d" textAnchor="end">
              {currencyFormatter(v)}
            </text>
          </g>
        );
      })}

      {/* Barras */}
      {data.map((d, i) => {
        const x = padding.left + gap + i * (barW + gap);
        const h = Math.max(3, (Math.abs(d.value) / max) * innerH);
        const y = padding.top + (d.value >= 0 ? innerH - h : innerH);
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx="6" fill={d.color || "#0d6efd"} />
            <text
              x={x + barW / 2}
              y={d.value >= 0 ? y - 8 : y + h + 14}
              fontSize="10"
              fill="#212529"
              textAnchor="middle"
              fontWeight="700"
            >
              {currencyFormatter(d.value)}
            </text>
            <text
              x={x + barW / 2}
              y={padding.top + innerH + 30}
              fontSize="11"
              fill="#212529"
              textAnchor="middle"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Assumindo que DynamicNavbar, MiniStat, BarsChart e currencyFormatter estão definidos em outro lugar
// import DynamicNavbar from './DynamicNavbar';
// import MiniStat from './MiniStat';
// import BarsChart from './BarsChart';
// import { currencyFormatter } from '../utils/formatters';


// Função utilitária para formatar a data (AAAA-MM-DD) para o formato do servidor
function formatDate(dateString) {
    if (!dateString) return null;
    return dateString; // O formato yyyy-mm-dd é o que o backend espera agora
}



export default function RelatorioLucro() {
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [erro, setErro] = useState(null);
  
  // 1. ⚠️ MUDANÇA: Substituímos 'mes' por 'dataInicio' e 'dataFim'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  function normalizeResponse(data) {
    const totais = data.totais || {};
    const produtos = Array.isArray(data.produtos) ? data.produtos : [];
    const totalVendas = Number(totais.totalReceita || 0);
    const totalCusto = Number(totais.totalCusto || 0);
    const totalLucro = Number(totais.totalLucro || (totalVendas - totalCusto));
    return {
      totals: {
        totalVendas,
        totalCusto,
        totalLucro,
      },
      produtos,
      url: data.url || null,
    };
  }

  async function gerarRelatorio() {
    // ⚠️ MUDANÇA: Verifica se as datas estão preenchidas
    if (!dataInicio || !dataFim) return setErro("Selecione as datas de Início e Fim.");

    setLoading(true);
    setErro(null);
    setRelatorio(null);

    try {
      // As datas já estão no formato AAAA-MM-DD, que é o formato ideal
      // para o backend (conforme o código do servidor ajustado)
      
      // ⚠️ MUDANÇA: Nova URL com as datas de início e fim
      const res = await fetch(`http://localhost:5002/admin/relatorios/lucro/detalhado/${formatDate(dataInicio)}/${formatDate(dataFim)}`);
      
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detalhes || "Erro ao solicitar relatório");
      }
      const data = await res.json();
      const norm = normalizeResponse(data);
      setRelatorio(norm);
    } catch (err) {
      console.error(err);
      setErro("Falha ao gerar relatório. Verifique o servidor e o formato das datas.");
    } finally {
      setLoading(false);
    }
  }

  const totals = relatorio?.totals ?? { totalVendas: 0, totalCusto: 0, totalLucro: 0 };
  const produtos = Array.isArray(relatorio?.produtos) ? relatorio.produtos : [];

  // Use useMemo para evitar recalcular desnecessariamente
  const dataForChart = useMemo(() => [
    { label: "Vendas", value: totals.totalVendas, color: "#0d6efd" },
    { label: "Custos", value: totals.totalCusto, color: "#dc3545" },
    { label: "Lucro", value: totals.totalLucro, color: totals.totalLucro >= 0 ? "#198754" : "#b02a37" },
  ], [totals]);

  const topProdutos = useMemo(() => produtos
    .slice()
    .sort((a, b) => (b.lucro || 0) - (a.lucro || 0))
    .slice(0, 6), [produtos]);

  const topChartData = useMemo(() => topProdutos.map((p) => ({
    label: p.nome,
    value: p.lucro || 0,
    color: p.lucro >= 0 ? "#198754" : "#b02a37",
  })), [topProdutos]);

  return (
    <>
      <DynamicNavbar />
      <Container fluid className="p-4" style={{ backgroundColor: "#f4f7fb", minHeight: "100vh" }}>
        <Row className="justify-content-center">
          <Col md={10}>
            <Card className="border-0 shadow-lg rounded-4">
              <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: "#003366", color: "white" }}>
                <div className="d-flex align-items-center gap-2">
                  <FileText size={20} />
                  <h5 className="m-0">Relatório de Lucro Detalhado</h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {/* 2. ⚠️ MUDANÇA: Campo de Data Início */}
                  <Form.Control 
                        type="date" 
                        value={dataInicio} 
                        onChange={(e) => setDataInicio(e.target.value)} 
                        style={{ width: 160 }} 
                        title="Data de Início"
                    />
                  
                    {/* 2. ⚠️ MUDANÇA: Campo de Data Fim */}
                  <Form.Control 
                        type="date" 
                        value={dataFim} 
                        onChange={(e) => setDataFim(e.target.value)} 
                        style={{ width: 160 }} 
                        title="Data de Fim"
                    />

                  <Button variant="light" size="sm" onClick={gerarRelatorio} disabled={loading || !dataInicio || !dataFim}>
                    <RefreshCcw size={16} /> {loading ? "Gerando..." : "Gerar"}
                  </Button>
                </div>
              </Card.Header>

              <Card.Body className="p-4">
                {erro && <Alert variant="danger">{erro}</Alert>}

                {loading && (
                  <div className="text-center my-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Gerando relatório...</p>
                  </div>
                )}

                {relatorio && !loading && (
                  <>
                    <Row className="mt-3 g-3">
                      <Col md={4}><MiniStat title="Total Vendido" value={currencyFormatter(totals.totalVendas)} icon={<ShoppingCart size={28} color="#0d6efd" />} color="#0d6efd" /></Col>
                      <Col md={4}><MiniStat title="Custo Total" value={currencyFormatter(totals.totalCusto)} icon={<Archive size={28} color="#dc3545" />} color="#dc3545" /></Col>
                      <Col md={4}><MiniStat title="Lucro" value={currencyFormatter(totals.totalLucro)} icon={<TrendingUp size={28} color={totals.totalLucro >= 0 ? "#198754" : "#b02a37"} />} color={totals.totalLucro >= 0 ? "#198754" : "#b02a37"} /></Col>
                    </Row>

                    <Row className="mt-4">
                      <Col md={8}>
                        <Card className="p-3 border-0 shadow-sm">
                          <h6 className="mb-2">Resumo Financeiro</h6>
                          <BarsChart data={dataForChart} />
                        </Card>
                      </Col>

                      <Col md={4}>
                        <Card className="p-3 border-0 shadow-sm">
                          <h6 className="mb-2">Top Produtos (Lucro)</h6>
                          {topProdutos.length === 0 ? (
                            <div className="text-muted small">Nenhum produto no período.</div>
                          ) : (
                            <BarsChart data={topChartData} height={180} />
                          )}
                        </Card>
                      </Col>
                    </Row>

                    {/* Tabela de Detalhamento por Produto (inalterada) */}
                    <Row className="mt-4">
                      <Col>
                        <Card className="p-3 border-0 shadow-sm">
                          <h6 className="mb-3">Detalhamento por Produto</h6>
                          <div style={{ overflowX: "auto" }}>
                            <Table striped hover responsive size="sm" className="align-middle">
                              <thead>
                                <tr>
                                  <th>Produto</th>
                                  <th>Qtd</th>
                                  <th>Compra (unit)</th>
                                  <th>Venda (unit)</th>
                                  <th>Receita</th>
                                  <th>Custo</th>
                                  <th>Lucro</th>
                                </tr>
                              </thead>
                              <tbody>
                                {produtos.length === 0 ? (
                                  <tr><td colSpan={7} className="text-center text-muted">Nenhum dado disponível</td></tr>
                                ) : produtos.map((p, i) => (
                                  <tr key={p.nome + i}>
                                    <td>{p.nome}</td>
                                    <td>{p.quantidade}</td>
                                    <td>{currencyFormatter(p.precoCompra)}</td>
                                    <td>{currencyFormatter(p.precoVenda)}</td>
                                    <td>{currencyFormatter(p.receita)}</td>
                                    <td>{currencyFormatter(p.custo)}</td>
                                    <td style={{ color: p.lucro >= 0 ? "#198754" : "#b02a37", fontWeight: 700 }}>{currencyFormatter(p.lucro)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </Card>
                      </Col>
                    </Row>

                    <Row className="mt-4">
                      <Col md={4} className="ms-auto">
                        <a href={relatorio.url ? `http://localhost:5002${relatorio.url}` : "#"} target="_blank" rel="noopener noreferrer" className="btn btn-success w-100">
                          <FileText size={16} /> <span className="ms-2">Abrir PDF</span>
                        </a>
                      </Col>
                    </Row>
                </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
