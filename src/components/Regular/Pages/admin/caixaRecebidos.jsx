import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Table, Modal, Form } from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: "", telefone: "", email: "" });

  // Buscar clientes do backend
  useEffect(() => {
    fetch("http://localhost:5002/admin/clientes")
      .then(res => res.json())
      .then(setClientes)
      .catch(err => console.error("Erro ao carregar clientes:", err));
  }, []);

  const handleChange = (e) => {
    setNovoCliente(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const cadastrarCliente = async (e) => {
    e.preventDefault();
    if (!novoCliente.nome || !novoCliente.telefone) {
      alert("Preencha nome e telefone.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5002/admin/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoCliente),
      });
      if (res.ok) {
        const clienteCriado = await res.json();
        setClientes(prev => [...prev, clienteCriado]);
        setShowModal(false);
        setNovoCliente({ nome: "", telefone: "", email: "" });
      } else {
        alert("Erro ao cadastrar cliente.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  return (
    <>
      <DynamicNavbar />

      <Container className="py-5">
        <Row className="mb-4">
          <Col>
            <h2>Clientes</h2>
          </Col>
          <Col className="text-end">
            <Button variant="warning" onClick={() => setShowModal(true)}>
              Cadastrar Novo Cliente
            </Button>
          </Col>
        </Row>

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{c.telefone}</td>
                <td>{c.email || "-"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cadastrar Cliente</Modal.Title>
        </Modal.Header>
        <Form onSubmit={cadastrarCliente}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={novoCliente.nome}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                type="text"
                name="telefone"
                value={novoCliente.telefone}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={novoCliente.email}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Fechar</Button>
            <Button variant="warning" type="submit">Cadastrar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
