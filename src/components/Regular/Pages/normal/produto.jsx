import { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [agrupados, setAgrupados] = useState({});

  useEffect(() => {
    fetch("http://localhost:5002/admin/materiais")
      .then((res) => res.json())
      .then((data) => {
        setProdutos(data);

        // Agrupa produtos por categoria usando Categorium
        const categorias = {};
        data.forEach((item) => {
          const categoriaNome = item.Categorium ? item.Categorium.nome : "Sem Categoria";
          if (!categorias[categoriaNome]) {
            categorias[categoriaNome] = [];
          }
          categorias[categoriaNome].push(item);
        });
        setAgrupados(categorias);
      })
      .catch((err) => console.error("Erro ao carregar produtos:", err));
  }, []);

  return (
    <>
      <DynamicNavbar />
      <section className="py-5">
        <Container>
          <h2 className="text-center mb-4">Nossos Materiais</h2>

          {Object.keys(agrupados).length === 0 && (
            <p className="text-center">Nenhum material disponível.</p>
          )}

          {Object.keys(agrupados).map((categoria, idx) => (
            <div key={idx} className="mb-5">
              <h3 className="mb-4 text-primary">{categoria}</h3>
              <Row>
                {agrupados[categoria].map((item) => (
                  <Col md={3} sm={6} key={item.id} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      {item.imagem && (
                        <Card.Img
                          variant="top"
                          src={"http://localhost:5002"+item.imagem}
                          alt={item.nome}
                        />
                      )}
                      <Card.Body>
                        <Card.Title>{item.nome}</Card.Title>
                        <Card.Text>{item.descricao || "Sem descrição"}</Card.Text>
                        <Card.Text className="fw-bold">Kz {item.preco}</Card.Text>
                        <Card.Text>Qtd: {item.quantidade}</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}

export default Produtos;
