import { useEffect, useState } from "react";
import {
  Container,
  Form,
  Button,
  Spinner,
  Alert,
  Table,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DynamicNavbar from "../NAV.jsx";

export default function RegistroProducao() {
  const [produtos, setProdutos] = useState([]);
  const [producao, setProducao] = useState([]);
  const [registro, setRegistro] = useState({ massa: "", produtoId: "", quantidade: 0, farinha: 0 });
  const [sobras, setSobras] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const [dataSelecionada, setDataSelecionada] = useState("");
  const [padeiroSelecionado, setPadeiroSelecionado] = useState("");

  const API_BASE = "http://localhost:5002/admin";
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/produtos`).then(res => res.json()).then(setProdutos);

    fetch(`${API_BASE}/producao`)
      .then(res => res.json())
      .then(dados => {
        const formatadas = dados.map(item => ({
          data: new Date(item.data).toLocaleDateString("pt-BR"),
          massa: item.massa,
          produto: item.produto,
          quantidade: item.quantidade,
          farinha: item.farinha,
          padeiro: item.padeiro || "Desconhecido"
        }));
        setProducao(formatadas);
      });

    fetch(`${API_BASE}/sobras/ultima`)
      .then(res => res.json())
      .then(setSobras)
      .catch(console.error);
  }, []);

  const registrar = async () => {
    setTriedSubmit(true);

    const funcionarioId = sessionStorage.getItem("userId");
    if (!funcionarioId || !registro.massa || !registro.produtoId || registro.quantidade < 1 || registro.farinha <= 0) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    const produto = produtos.find(p => p.id === parseInt(registro.produtoId));
    if (!produto) {
      alert("Produto inválido.");
      return;
    }

    const payload = {
      funcionarioId,
      massa: registro.massa,
      produto_id: produto.id,
      nome_produto: produto.nome,
      quantidade: registro.quantidade,
      farinha_usada: registro.farinha * 1000,
    };

    try {
      setCarregando(true);

      const res = await fetch(`${API_BASE}/producao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao registrar");

      setProducao(prev => [
        ...prev,
        {
          data: new Date().toLocaleDateString("pt-BR"),
          massa: payload.massa,
          produto: payload.nome_produto,
          quantidade: payload.quantidade,
          farinha: payload.farinha_usada,
          padeiro: sessionStorage.getItem("nome") || "Você"
        },
      ]);

      setRegistro({ massa: "", produtoId: "", quantidade: 0, farinha: 0 });
      setTriedSubmit(false);
    } catch (err) {
      alert("Erro ao registrar produção.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const limparFiltros = () => {
    setDataSelecionada("");
    setPadeiroSelecionado("");
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Produção (filtrado)", 14, 15);

    const rows = producaoFiltrada.map(p => [
      p.data,
      p.padeiro,
      p.massa,
      p.produto,
      p.quantidade,
      (p.farinha / 1000).toFixed(2) + " kg"
    ]);

    autoTable(doc, {
      head: [["Data", "Padeiro", "Massa", "Produto", "Qtd", "Farinha (kg)"]],
      body: rows,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`producao_filtrado_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const isInvalid = campo => triedSubmit && (!campo || campo <= 0);

  const datasUnicas = [...new Set(producao.map(p => p.data))];
  const padeirosUnicos = [...new Set(producao.map(p => p.padeiro))];

  const producaoFiltrada = producao.filter(p => {
    const porData = dataSelecionada ? p.data === dataSelecionada : true;
    const porPadeiro = padeiroSelecionado ? p.padeiro === padeiroSelecionado : true;
    return porData && porPadeiro;
  });

  const totalQtd = producaoFiltrada.reduce((sum, r) => sum + r.quantidade, 0);
  const totalFarinha = producaoFiltrada.reduce((sum, r) => sum + r.farinha, 0);

  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <h2>Registro de Produção</h2>

        {sobras && (
          <Alert variant="info">
            Sobras do último turno: Farinha {(sobras.farinha_restante / 1000).toFixed(2)} kg | Produtos: {JSON.stringify(sobras.produtos_restantes)}
          </Alert>
        )}

        <Form>
          <Form.Group>
            <Form.Label>Massa</Form.Label>
            <Form.Control
              value={registro.massa}
              isInvalid={isInvalid(registro.massa)}
              onChange={e => setRegistro({ ...registro, massa: e.target.value })}
            />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group>
            <Form.Label>Produto</Form.Label>
            <Form.Select
              value={registro.produtoId}
              isInvalid={isInvalid(registro.produtoId)}
              onChange={e => setRegistro({ ...registro, produtoId: e.target.value })}
            >
              <option value="">-- Selecione --</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              Campo obrigatório.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group>
            <Form.Label>Farinha usada (kg)</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              value={registro.farinha}
              isInvalid={isInvalid(registro.farinha)}
              onChange={e => setRegistro({ ...registro, farinha: parseFloat(e.target.value) || 0 })}
            />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group>
            <Form.Label>Unidades produzidas</Form.Label>
            <Form.Control
              type="number"
              value={registro.quantidade}
              isInvalid={isInvalid(registro.quantidade)}
              onChange={e => setRegistro({ ...registro, quantidade: parseInt(e.target.value) || 0 })}
            />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório.
            </Form.Control.Feedback>
          </Form.Group>

          <Button onClick={registrar} disabled={carregando} className="mt-2">
            {carregando ? <Spinner size="sm" /> : "Registrar"}
          </Button>
        </Form>

        <hr />

        <h4>Filtros</h4>
        <Form.Group className="mb-2">
          <Form.Label>Data</Form.Label>
          <Form.Select
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
          >
            <option value="">Todas</option>
            {datasUnicas.map((data, idx) => (
              <option key={idx} value={data}>{data}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Padeiro</Form.Label>
          <Form.Select
            value={padeiroSelecionado}
            onChange={(e) => setPadeiroSelecionado(e.target.value)}
          >
            <option value="">Todos</option>
            {padeirosUnicos.map((padeiro, idx) => (
              <option key={idx} value={padeiro}>{padeiro}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Button variant="secondary" onClick={limparFiltros} className="me-2 mb-2">
          Limpar Filtros
        </Button>

        <Button variant="success" onClick={gerarPDF} className="mb-2">
          Exportar PDF (filtrado)
        </Button>

        <Table className="mt-3" bordered hover responsive>
          <thead>
            <tr>
              <th>Data</th>
              <th>Padeiro</th>
              <th>Massa</th>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Farinha (kg)</th>
            </tr>
          </thead>
          <tbody>
            {producaoFiltrada.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">Nenhum registro encontrado.</td>
              </tr>
            ) : (
              producaoFiltrada.map((p, i) => (
                <tr key={i}>
                  <td>{p.data}</td>
                  <td>{p.padeiro}</td>
                  <td>{p.massa}</td>
                  <td>{p.produto}</td>
                  <td>{p.quantidade}</td>
                  <td>{(p.farinha / 1000).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          {producaoFiltrada.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan="4"><strong>Total</strong></td>
                <td><strong>{totalQtd}</strong></td>
                <td><strong>{(totalFarinha / 1000).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          )}
        </Table>
      </Container>
    </>
  );
}
