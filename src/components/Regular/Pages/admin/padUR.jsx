import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Table,
  Spinner,
  Alert
} from "react-bootstrap";
import DynamicNavbar from "../NAV.JSX";

export default function Materiais() {
  const [materiais, setMateriais] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Totais
  const totalItens = materiais.reduce((acc, m) => acc + m.quantidade, 0);
  const totalValor = materiais.reduce((acc, m) => acc + m.quantidade * m.preco, 0);

  const fetchMateriais = async (categoriaId = "") => {
    setLoading(true);
    try {
      const query = categoriaId ? `?categoria=${categoriaId}` : "";
      const res = await fetch(`http://localhost:5000/admin/materiais${query}`);
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
      const res = await fetch("http://localhost:5000/admin/categorias");
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
              <th>Categoria</th>
              <th>Quantidade</th>
              <th>Preço Unitário (kz)</th>
            </tr>
          </thead>
          <tbody>
            {materiais.map((m) => (
              <tr key={m.id}>
                <td>{m.nome}</td>
                <td>{m.descricao}</td>
                <td>{m.categoria?.nome || "-"}</td>
                <td>{m.quantidade}</td>
                <td>{m.preco.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}
