// src/components/RegistrarRecebimento.jsx
import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Navbar,
  Nav,
} from "react-bootstrap";
import DynamicNavbar from "../NAV.JSX";

function RegistrarRecebimento() {
  const [produtos, setProdutos] = useState([]);
  const [entradas, setEntradas] = useState({});
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/admin/produtos")
      .then((res) => res.json())
      .then(setProdutos);
  }, []);

  const registrar = async () => {
    const enviados = Object.values(entradas).filter((e) => e.quantidade > 0);
    if (enviados.length === 0) return alert("Nenhuma quantidade válida inserida.");

    setCarregando(true);
    const res = await fetch("http://localhost:5000/admin/entradaprodutos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produtos: enviados }),
    });

    if (res.ok) {
      alert("Entradas registradas!");
      setEntradas({});
    } else {
      alert("Erro ao registrar.");
    }
    setCarregando(false);
  };

  return (
    <>
    <DynamicNavbar/>

      <Container className="py-5">
        <h3 className="mb-4 fw-bold text-center">Registrar Recebimento</h3>
        <Row>
          {produtos.map((prod) => (
            <Col md={4} key={prod.id} className="mb-3">
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>{prod.nome}</Card.Title>
                  <Form.Control
                    type="number"
                    min={0}
                    placeholder="Quantidade Recebida"
                    value={entradas[prod.id]?.quantidade || ""}
                    onChange={(e) =>
                      setEntradas((prev) => ({
                        ...prev,
                        [prod.id]: {
                          id: prod.id,
                          quantidade: parseInt(e.target.value || "0"),
                        },
                      }))
                    }
                  />
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center">
          <Button variant="success" onClick={registrar} disabled={carregando}>
            {carregando ? "Salvando..." : "Salvar Entradas"}
          </Button>
        </div>
      </Container>
    </>
  );
}

export default RegistrarRecebimento;
