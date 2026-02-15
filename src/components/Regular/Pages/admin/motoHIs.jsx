import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Spinner,
  Form,
  Navbar,
  Nav,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DynamicNavbar from "../NAV.jsx";

function HistoricoEntregas() {
  const API_BASE = "http://localhost:5002/admin";
  const [encomendas, setEncomendas] = useState([]);
  const [encomendasFiltradas, setEncomendasFiltradas] = useState([]);
  const [datasDisponiveis, setDatasDisponiveis] = useState([]);
  const [dataFiltro, setDataFiltro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();
  function sair() {
    navigate("/office/login");
    sessionStorage.clear();
  }

  const carregarEntregues = async () => {
    try {
      setCarregando(true);
      const res = await fetch(`${API_BASE}/encomendas?status=entregue`);
      const data = await res.json();

      // Extrair datas únicas de createdAt
      const datas = Array.from(
        new Set(
          data.map((e) =>
            new Date(e.createdAt).toISOString().split("T")[0]
          )
        )
      ).sort((a, b) => new Date(b) - new Date(a));

      setDatasDisponiveis(datas);
      setEncomendas(data);

      // Aplicar filtro inicial (vazio = mostrar tudo)
      if (dataFiltro) {
        setEncomendasFiltradas(
          data.filter(
            (e) =>
              new Date(e.createdAt).toISOString().split("T")[0] === dataFiltro
          )
        );
      } else {
        setEncomendasFiltradas(data);
      }
    } catch (err) {
      console.error("Erro ao buscar entregues:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarEntregues();
  }, []);

  useEffect(() => {
    if (dataFiltro === "") {
      setEncomendasFiltradas(encomendas);
    } else {
      const filtradas = encomendas.filter(
        (e) =>
          new Date(e.createdAt).toISOString().split("T")[0] === dataFiltro
      );
      setEncomendasFiltradas(filtradas);
    }
  }, [dataFiltro, encomendas]);

  return (
    <>
   <DynamicNavbar/>

      <Container className="py-4">
        <h4 className="mb-3">Encomendas Entregues</h4>

        <Form.Group className="mb-3 w-50">
          <Form.Label>Filtrar por data de criação</Form.Label>
          <Form.Select
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
          >
            <option value="">Todas</option>
            {datasDisponiveis.map((data, i) => (
              <option key={i} value={data}>
                {new Date(data).toLocaleDateString("pt-BR")}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {carregando ? (
          <Spinner animation="border" />
        ) : (
          <Table bordered responsive hover>
            <thead className="table-light">
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Criado em</th>
                <th>Produtos</th>
              </tr>
            </thead>
            <tbody>
              {encomendasFiltradas.map((e) => (
                <tr key={e.id}>
                  <td>{e.nome_cliente}</td>
                  <td>{e.telefone}</td>
                  <td>{new Date(e.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>
                    {(e.encomenda_items || []).map((item, idx) => (
                      <div key={idx}>
                        {item.quantidade}x {item.produto?.nome || "?"}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
              {encomendasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center">
                    Nenhuma entrega registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Container>
    </>
  );
}

export default HistoricoEntregas;
