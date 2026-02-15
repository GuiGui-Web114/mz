// src/components/admin/Categorias.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Modal,
  Alert,
  Spinner,
} from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  // novo
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  // editar
  const [showEdit, setShowEdit] = useState(false);
  const [editCategoria, setEditCategoria] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // deletar
  const [showDelete, setShowDelete] = useState(false);
  const [deleteCategoria, setDeleteCategoria] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("http://localhost:5002/admin/categorias");
      if (!res.ok) throw new Error("Falha ao buscar categorias");
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setErro("Erro ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  }

  // criar
  async function handleCriar(e) {
    e && e.preventDefault();
    if (!nome.trim()) return setErro("Nome obrigatório");
    setSaving(true);
    setErro(null);
    try {
      const res = await fetch("http://localhost:5002/admin/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Erro ao criar categoria");
      }
      const nova = await res.json();
      setCategorias((s) => [nova, ...s]);
      setNome("");
    } catch (err) {
      console.error(err);
      setErro(err.message || "Erro ao criar categoria");
    } finally {
      setSaving(false);
    }
  }

  // abrir edição
  function abrirEditar(cat) {
    setEditCategoria(cat);
    setEditNome(cat.nome || "");
    setShowEdit(true);
  }

  // salvar edição
  async function handleSalvarEdit() {
    if (!editNome.trim()) return setErro("Nome obrigatório");
    setEditSaving(true);
    setErro(null);
    try {
      const res = await fetch(`http://localhost:5002/admin/categorias/${editCategoria.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: editNome.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Erro ao salvar categoria");
      }
      const updated = await res.json();
      setCategorias((list) => list.map((c) => (c.id === updated.id ? updated : c)));
      setShowEdit(false);
      setEditCategoria(null);
    } catch (err) {
      console.error(err);
      setErro(err.message || "Erro ao editar categoria");
    } finally {
      setEditSaving(false);
    }
  }

  // abrir delete
  function abrirDelete(cat) {
    setDeleteCategoria(cat);
    setShowDelete(true);
  }

  // confirmar delete
  async function handleConfirmDelete() {
    setDeleteSaving(true);
    setErro(null);
    try {
      const res = await fetch(`http://localhost:5002/admin/categorias/${deleteCategoria.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Erro ao deletar categoria");
      }
      setCategorias((list) => list.filter((c) => c.id !== deleteCategoria.id));
      setShowDelete(false);
    } catch (err) {
      console.error(err);
      setErro(err.message || "Erro ao deletar categoria");
    } finally {
      setDeleteSaving(false);
    }
  }

  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <h2 className="mb-4">Categorias</h2>

        {erro && <Alert variant="danger" onClose={() => setErro(null)} dismissible>{erro}</Alert>}

        <Row>
          <Col md={5}>
            <Card className="p-3 mb-4">
              <h5 className="mb-3">Nova Categoria</h5>
              <Form onSubmit={handleCriar}>
                <Form.Group className="mb-2">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ex: Construção"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </Form.Group>
                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={saving}>
                    {saving ? (<><Spinner animation="border" size="sm" /> Salvando...</>) : "Criar Categoria"}
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>

          <Col md={7}>
            <Card className="p-3">
              <h5 className="mb-3">Lista de Categorias</h5>
              {loading ? (
                <div className="text-center py-4"><Spinner animation="border" /></div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Nome</th>
                      <th style={{ width: 160 }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.length === 0 && (
                      <tr><td colSpan="3" className="text-center">Nenhuma categoria cadastrada.</td></tr>
                    )}
                    {categorias.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.nome}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => abrirEditar(c)}>Editar</Button>
                            <Button size="sm" variant="outline-danger" onClick={() => abrirDelete(c)}>Apagar</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </Col>
        </Row>

        {/* Edit Modal */}
        <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Editar Categoria</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Nome</Form.Label>
              <Form.Control value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSalvarEdit} disabled={editSaving}>
              {editSaving ? <Spinner animation="border" size="sm" /> : "Salvar"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirm */}
        <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirmar exclusão</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Tem a certeza que deseja apagar a categoria <strong>{deleteCategoria?.nome}</strong> ?
            <div className="text-muted mt-2">A ação não pode ser desfeita. Verifica se não há materiais ligados a esta categoria antes.</div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={deleteSaving}>
              {deleteSaving ? <Spinner animation="border" size="sm" /> : "Apagar"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
