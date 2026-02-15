// src/components/admin/Fornecedores.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Modal,
  Spinner,
  Alert,
  Image,
  InputGroup,
} from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // novo fornecedor
  const [novo, setNovo] = useState({
    nome: "",
    contato: "",
    email: "",
    telefone: "",
    endereco: "",
    nif: "",
    logoFile: null,
    docFile: null,
  });
  const [saving, setSaving] = useState(false);

  // editar fornecedor
  const [showEdit, setShowEdit] = useState(false);
  const [editObj, setEditObj] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // apagar
  const [showDelete, setShowDelete] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [delSaving, setDelSaving] = useState(false);

  // busca / filtro
  const [query, setQuery] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("http://localhost:5002/admin/fornecedores");
      if (!res.ok) throw new Error("Falha ao buscar fornecedores");
      const data = await res.json();
      setFornecedores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setErro("Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  }

  // criar novo (com FormData para imagens/docs)
  async function handleCriar(e) {
    e && e.preventDefault();
    if (!novo.nome.trim()) return setErro("Nome do fornecedor obrigatório");
    setSaving(true);
    setErro(null);

    try {
      const fd = new FormData();
      fd.append("nome", novo.nome.trim());
      fd.append("contato", novo.contato || "");
      fd.append("email", novo.email || "");
      fd.append("telefone", novo.telefone || "");
      fd.append("endereco", novo.endereco || "");
      fd.append("nif", novo.nif || "");
      if (novo.logoFile) fd.append("logo", novo.logoFile);
      if (novo.docFile) fd.append("documento", novo.docFile);

      const res = await fetch("http://localhost:5002/admin/fornecedores", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Erro ao criar fornecedor");
      }

      const created = await res.json();
      setFornecedores((s) => [created, ...s]);
      setNovo({
        nome: "",
        contato: "",
        email: "",
        telefone: "",
        endereco: "",
        nif: "",
        logoFile: null,
        docFile: null,
      });
    } catch (err) {
      console.error(err);
      setErro(err.message || "Erro ao criar fornecedor");
    } finally {
      setSaving(false);
    }
  }

  // abrir editar - prepara objeto local (não enviado ainda)
  function abrirEditar(f) {
    setEditObj({
      id: f.id,
      nome: f.nome || "",
      contato: f.contato || "",
      email: f.email || "",
      telefone: f.telefone || "",
      endereco: f.endereco || "",
      nif: f.nif || "",
      logoFile: null, // novo arquivo opcional
      logoUrl: f.logo || f.logoUrl || null,
      docFile: null,
      docUrl: f.documento || f.docUrl || null,
    });
    setShowEdit(true);
  }

  // salvar edição (FormData para permitir substituir logo/doc)
  async function handleSalvarEdit(e) {
    e && e.preventDefault();
    if (!editObj || !editObj.id) return;
    if (!editObj.nome.trim()) return setErro("Nome obrigatório");
    setEditSaving(true);
    setErro(null);

    try {
      const fd = new FormData();
      fd.append("nome", editObj.nome.trim());
      fd.append("contato", editObj.contato || "");
      fd.append("email", editObj.email || "");
      fd.append("telefone", editObj.telefone || "");
      fd.append("endereco", editObj.endereco || "");
      fd.append("nif", editObj.nif || "");
      if (editObj.logoFile) fd.append("logo", editObj.logoFile);
      if (editObj.docFile) fd.append("documento", editObj.docFile);

      const res = await fetch(`http://localhost:5002/admin/fornecedores/${editObj.id}`, {
        method: "PUT",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Erro ao atualizar fornecedor");
      }

      const updated = await res.json();
      setFornecedores((list) => list.map((f) => (f.id === updated.id ? updated : f)));
      setShowEdit(false);
      setEditObj(null);
    } catch (err) {
      console.error(err);
      setErro(err.message || "Erro ao atualizar fornecedor");
    } finally {
      setEditSaving(false);
    }
  }

  // abrir apagar
  function abrirDelete(f) {
    setToDelete(f);
    setShowDelete(true);
  }

  // confirmar apagar
  async function handleConfirmDelete() {
    if (!toDelete) return;
    setDelSaving(true);
    setErro(null);
    try {
      const res = await fetch(`http://localhost:5002/admin/fornecedores/${toDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || "Erro ao apagar fornecedor");
      }
      setFornecedores((list) => list.filter((f) => f.id !== toDelete.id));
      setShowDelete(false);
    } catch (err) {
      console.error(err);
      setErro(err.message || "Erro ao apagar fornecedor");
    } finally {
      setDelSaving(false);
    }
  }

  // filtro simples
  const filtered = fornecedores.filter((f) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (f.nome || "").toLowerCase().includes(q) ||
      (f.contato || "").toLowerCase().includes(q) ||
      (f.email || "").toLowerCase().includes(q) ||
      (f.telefone || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <h2 className="mb-4">Fornecedores</h2>

        {erro && <Alert variant="danger" onClose={() => setErro(null)} dismissible>{erro}</Alert>}

        <Row className="mb-3">
          <Col md={6}>
            <Card className="p-3">
              <h5 className="mb-3">Novo Fornecedor</h5>
              <Form onSubmit={handleCriar}>
                <Form.Group className="mb-2">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control
                    type="text"
                    value={novo.nome}
                    onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Contato / Pessoa</Form.Label>
                      <Form.Control
                        type="text"
                        value={novo.contato}
                        onChange={(e) => setNovo({ ...novo, contato: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Telefone</Form.Label>
                      <Form.Control
                        type="text"
                        value={novo.telefone}
                        onChange={(e) => setNovo({ ...novo, telefone: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={novo.email}
                    onChange={(e) => setNovo({ ...novo, email: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Endereço</Form.Label>
                  <Form.Control
                    type="text"
                    value={novo.endereco}
                    onChange={(e) => setNovo({ ...novo, endereco: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>NIF / Identificação</Form.Label>
                  <Form.Control
                    type="text"
                    value={novo.nif}
                    onChange={(e) => setNovo({ ...novo, nif: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Logo (opcional)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNovo({ ...novo, logoFile: e.target.files[0] })}
                  />
                </Form.Group>

                {novo.logoFile && (
                  <div className="mb-2">
                    <Image
                      src={URL.createObjectURL(novo.logoFile)}
                      alt="preview"
                      style={{ width: 100, height: 100, objectFit: "cover" }}
                      rounded
                    />
                  </div>
                )}

                <Form.Group className="mb-2">
                  <Form.Label>Documento (ex.: contrato) (opcional)</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setNovo({ ...novo, docFile: e.target.files[0] })}
                  />
                </Form.Group>

                <div className="d-grid mt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? <><Spinner animation="border" size="sm" /> Salvando...</> : "Criar Fornecedor"}
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="p-3">
              <h5 className="mb-3">Pesquisar / Lista Rápida</h5>
              <InputGroup className="mb-2">
                <Form.Control
                  placeholder="Buscar por nome, contato, email, telefone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button onClick={() => setQuery("")} variant="outline-secondary">Limpar</Button>
              </InputGroup>

              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {loading ? (
                  <div className="text-center py-4"><Spinner animation="border" /></div>
                ) : (
                  <Table hover size="sm">
                    <thead>
                      <tr><th>Logo</th><th>Nome</th><th>Contato</th><th>Telefone</th></tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && <tr><td colSpan="4">Nenhum fornecedor.</td></tr>}
                      {filtered.map((f) => (
                        <tr key={f.id} style={{ cursor: "pointer" }}>
                          <td style={{ width: 80 }}>
                            {f.logo ? (
                              <Image src={`http://localhost:5002${f.logo}`} rounded style={{ width: 50, height: 50, objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: 50, height: 50, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>—</div>
                            )}
                          </td>
                          <td onClick={() => abrirEditar(f)}>{f.nome}</td>
                          <td onClick={() => abrirEditar(f)}>{f.contato}</td>
                          <td onClick={() => abrirEditar(f)}>{f.telefone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* full table */}
        <Row className="mt-3">
          <Col>
            <Card className="p-3">
              <h5 className="mb-3">Todos os Fornecedores</h5>
              {loading ? (
                <div className="text-center py-4"><Spinner animation="border" /></div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Logo</th>
                      <th>Nome</th>
                      <th>Contato</th>
                      <th>Telefone</th>
                      <th>Email</th>
                      <th>Endereço</th>
                      <th>NIF</th>
                      <th>Doc</th>
                      <th style={{ width: 140 }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fornecedores.map((f) => (
                      <tr key={f.id}>
                        <td>
                          {f.logo ? (
                            <Image src={`http://localhost:5002${f.logo}`} rounded style={{ width: 50, height: 50, objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: 50, height: 50, background: "#eee" }} />
                          )}
                        </td>
                        <td>{f.nome}</td>
                        <td>{f.contato}</td>
                        <td>{f.telefone}</td>
                        <td>{f.email}</td>
                        <td>{f.endereco}</td>
                        <td>{f.nif}</td>
                        <td>
                          {f.documento ? (
                            <a href={`http://localhost:5002${f.documento}`} target="_blank" rel="noreferrer">Ver</a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => abrirEditar(f)}>Editar</Button>
                            <Button size="sm" variant="outline-danger" onClick={() => abrirDelete(f)}>Apagar</Button>
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
        <Modal show={showEdit} onHide={() => setShowEdit(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Editar Fornecedor</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editObj ? (
              <Form onSubmit={handleSalvarEdit}>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-2">
                      <Form.Label>Nome</Form.Label>
                      <Form.Control value={editObj.nome} onChange={(e) => setEditObj({ ...editObj, nome: e.target.value })} required />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Telefone</Form.Label>
                      <Form.Control value={editObj.telefone} onChange={(e) => setEditObj({ ...editObj, telefone: e.target.value })} />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Email</Form.Label>
                      <Form.Control value={editObj.email} onChange={(e) => setEditObj({ ...editObj, email: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Contato</Form.Label>
                      <Form.Control value={editObj.contato} onChange={(e) => setEditObj({ ...editObj, contato: e.target.value })} />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-2">
                  <Form.Label>Endereço</Form.Label>
                  <Form.Control value={editObj.endereco} onChange={(e) => setEditObj({ ...editObj, endereco: e.target.value })} />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>NIF</Form.Label>
                      <Form.Control value={editObj.nif} onChange={(e) => setEditObj({ ...editObj, nif: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Logo (substituir)</Form.Label>
                      <Form.Control type="file" accept="image/*" onChange={(e) => setEditObj({ ...editObj, logoFile: e.target.files[0] })} />
                    </Form.Group>
                    <div className="mb-2">
                      {editObj.logoUrl ? (
                        <Image src={editObj.logoUrl.startsWith("http") ? editObj.logoUrl : `http://localhost:5002${editObj.logoUrl}`} rounded style={{ width: 90, height: 90, objectFit: "cover" }} />
                      ) : <div style={{ width: 90, height: 90, background: "#eee" }} />}
                    </div>
                  </Col>
                </Row>

                <Form.Group className="mb-2">
                  <Form.Label>Documento (substituir)</Form.Label>
                  <Form.Control type="file" accept=".pdf,image/*" onChange={(e) => setEditObj({ ...editObj, docFile: e.target.files[0] })} />
                </Form.Group>
                <div className="d-flex gap-2 justify-content-end mt-3">
                  <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
                  <Button variant="primary" onClick={handleSalvarEdit} disabled={editSaving}>
                    {editSaving ? <Spinner animation="border" size="sm" /> : "Salvar"}
                  </Button>
                </div>
              </Form>
            ) : (
              <div className="text-center py-3"><Spinner animation="border" /></div>
            )}
          </Modal.Body>
        </Modal>

        {/* Delete Confirm */}
        <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirmar exclusão</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Tem a certeza que deseja apagar o fornecedor <strong>{toDelete?.nome}</strong> ?
            <div className="text-muted mt-2">A ação não pode ser desfeita.</div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={delSaving}>
              {delSaving ? <Spinner animation="border" size="sm" /> : "Apagar"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
