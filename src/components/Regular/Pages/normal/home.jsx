import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Carousel, Button, Form } from "react-bootstrap";
import DynamicNavbar from "../NAV.JSX";

function Home() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState({}); // { produtoId: quantidade }

  useEffect(() => {
    fetch("http://localhost:5000/admin/materiais")
      .then(res => res.json())
      .then(setProdutos)
      .catch(err => console.error("Erro ao carregar produtos:", err));
  }, []);

  const slides = [];
  for (let i = 0; i < produtos.length; i += 3) slides.push(produtos.slice(i, i + 3));

  const handleQuantidadeChange = (id, value) => {
    setCarrinho({ ...carrinho, [id]: Number(value) });
  };

  const handleAdicionarCarrinho = (produto) => {
    if (!carrinho[produto.id] || carrinho[produto.id] <= 0) {
      alert("Escolha uma quantidade maior que 0");
      return;
    }
    alert(`${carrinho[produto.id]} ${produto.nome} adicionados ao carrinho`);
  };
  const handleFinalizarVenda = async () => {
    // transforma carrinho em array de { produtoId, quantidade }
    const itens = Object.entries(carrinho)
      .filter(([_, qtd]) => qtd > 0)
      .map(([id, quantidade]) => ({
        produtoId: Number(id),
        quantidade
      }));
  
    if (itens.length === 0) return alert("Carrinho vazio");
  
    try {
      const res = await fetch("http://localhost:5000/admin/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcionario: "caixa", // ou pega do estado/logado
          itens
        })
      });
  
      const data = await res.json();
      if (data.erro) {
        console.error(data.detalhes);
        return alert("Erro ao registrar venda");
      }
  
      alert("Venda registrada com sucesso!");
      setCarrinho({});
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar venda");
    }
  };
  

  return (
    <>
      <DynamicNavbar />

      {/* Hero */}
      <section className="bg-warning text-dark py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4 fw-bold">Materiais de Qualidade</h1>
              <p className="lead">
                Os melhores materiais, prontos para sua obra. Confira nossos destaques abaixo.
              </p>
            </Col>
            <Col md={6}>
              <img
                src="https://cdn.pixabay.com/photo/2016/03/05/19/02/construction-1230522_960_720.jpg"
                alt="Materiais de construção"
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Produtos com Carrossel */}
      <section id="produtos" className="py-5 bg-light">
        <Container>
          <h2 className="text-center mb-4">Nossos Destaques</h2>
          <Carousel indicators={false} controls interval={3000} pause={false}>
            {slides.map((grupo, idx) => (
              <Carousel.Item key={idx}>
                <Row className="justify-content-center">
                  {grupo.map(item => (
                    <Col md={4} key={item.id} className="mb-4">
                      <Card className="h-100 shadow-sm">
                        {item.imagem && <Card.Img variant="top" src={`http://localhost:5000${item.imagem}`} />}
                        <Card.Body>
                          <Card.Title>{item.nome}</Card.Title>
                          <Card.Text>{item.descricao || "Sem descrição"}</Card.Text>
                          <Card.Text className="fw-bold text-primary">
                            {item.preco?.toLocaleString()} KZ
                          </Card.Text>
                          <Form.Group className="mb-2">
                            <Form.Label>Quantidade</Form.Label>
                            <Form.Control
                              type="number"
                              min={0}
                              value={carrinho[item.id] || 0}
                              onChange={(e) => handleQuantidadeChange(item.id, e.target.value)}
                            />
                          </Form.Group>
                          <Button
                            variant="primary"
                            className="w-100"
                            onClick={() => handleAdicionarCarrinho(item)}
                          >
                            Adicionar ao Carrinho
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Carousel.Item>
            ))}
          </Carousel>

          <div className="text-center mt-4">
            <Button onClick={handleFinalizarVenda} size="lg">Finalizar Venda</Button>
          </div>
        </Container>
      </section>

      <footer className="bg-light text-center py-3">
        <Container>
          <small>&copy; {new Date().getFullYear()} Todos os direitos reservados.</small>
        </Container>
      </footer>
    </>
  );
}

export default Home;
