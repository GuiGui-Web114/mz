// src/components/LoginFuncionario.jsx
import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Navbar,
  Nav,
} from "react-bootstrap";
import { logy } from "./Regular/Pages/api/logar";
import { useNavigate } from "react-router-dom";

export default function LoginFuncionario() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erro, setErro] = useState("");
  const [empresa, setEmpresa] = useState({}); // <-- nunca null, sempre objecto

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/admin/empresa");
        if (!res.ok) {
          if (mounted) setEmpresa({});
          return;
        }
        const data = await res.json();
        if (mounted) setEmpresa(data || {});
      } catch (err) {
        console.error("Erro ao buscar empresa:", err);
        if (mounted) setEmpresa({});
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    if (!email || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }
    try {
      const resposta = await logy(email, senha);
      if (!resposta.erro) {
        const { id, funcao } = resposta.user;
        sessionStorage.setItem("userId", id);
        sessionStorage.setItem("userFuncao", funcao);

        if (funcao === "Administrador" || funcao === "admin") {
          navigate("/office/admin/dashboard");
        } else {
          navigate("/office/caixa/home");
        }
      } else {
        setErro("Usuário ou senha incorretos.");
      }
    } catch (error) {
      console.error(error);
      setErro("Erro ao conectar. Tente novamente.");
    }
  };

  const displayName = empresa?.nome || "Loja de Materiais";

  return (
    <>
      <Navbar bg="light" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand href="/">{displayName}</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-login" />
          <Navbar.Collapse id="navbar-login">
            <Nav className="ms-auto">
              <Nav.Link href="/">Início</Nav.Link>
              <Nav.Link href="/about">Sobre</Nav.Link>
              <Nav.Link href="/materiais">Materiais</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <section className="bg-light py-5 min-vh-100 d-flex align-items-center">
        <Container>
          <Row className="justify-content-center">
            <Col md={6} lg={5}>
              <Card className="shadow border-0">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <h2 className="fw-bold text-dark">Login de Funcionário</h2>
                    <p className="text-muted">Acesso restrito ao time da {displayName}</p>
                  </div>

                  {erro && <Alert variant="danger">{erro}</Alert>}

                  <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email ou Usuário</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="ex: joao@loja.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Senha</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={senhaVisivel ? "text" : "password"}
                          placeholder="********"
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                        />
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setSenhaVisivel(!senhaVisivel)}
                          className="position-absolute top-0 end-0 mt-1 me-1"
                        >
                          {senhaVisivel ? "Ocultar" : "Ver"}
                        </Button>
                      </div>
                    </Form.Group>

                    <div className="d-grid">
                      <Button
                        variant="warning"
                        type="submit"
                        className="text-dark fw-bold"
                      >
                        Entrar
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>

              <p className="text-center mt-3 text-muted small">
                &copy; {new Date().getFullYear()} {displayName}
              </p>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}
