// src/components/admin/UserManager.jsx
import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Modal,
  Spinner,
  Card,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DynamicNavbar from "../NAV.jsx";

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    id: null,
    nome: "",
    telefone: "",
    email: "",
    genero: "",
    senha: "",
    role: "vendedor",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, nome: "" });

  // --- NEW FEATURES ---
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    return () => {
      setError("");
      setSuccess("");
    };
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5002/admin/users");
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ id: null, nome: "", telefone: "", email: "", genero: "", senha: "", role: "vendedor" });
  }

  function preencherEdicao(u) {
    setForm({
      id: u.id,
      nome: u.nome || "",
      telefone: u.telefone || "",
      email: u.email || "",
      genero: u.genero || "",
      senha: "",
      role: u.role || "vendedor",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.nome || !form.email || !form.role) {
      setError("Nome, email e função são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome,
        telefone: form.telefone,
        email: form.email,
        genero: form.genero,
        role: form.role,
      };
      if (form.senha) payload.senha = form.senha;

      let res;
      if (form.id) {
        res = await fetch(`http://localhost:5002/admin/users/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        if (!form.senha) {
          setSaving(false);
          setError("Senha é obrigatória ao criar usuário.");
          return;
        }
        payload.senha = form.senha;
        res = await fetch("http://localhost:5002/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        console.error("Erro API:", data);
        throw new Error(data.erro || "Erro ao salvar usuário");
      }

      setSuccess(form.id ? "Usuário atualizado." : "Usuário criado.");
      resetForm();
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  }

  function confirmarApagar(u) {
    setConfirmDelete({ show: true, id: u.id, nome: u.nome });
  }

  async function executarDelete() {
    const { id } = confirmDelete;
    setConfirmDelete({ show: false, id: null, nome: "" });
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:5002/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao apagar usuário");
      setSuccess("Usuário apagado.");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Não foi possível apagar o usuário.");
    }
  }

  const sairPadeiro = () => {
    sessionStorage.clear();
    navigate("/office/login");
  };

  // --- Filtering & Pagination logic ---
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (!normalizedSearch) return true;
    const s = normalizedSearch;
    return (
      (u.nome || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s) ||
      (u.role || "").toLowerCase().includes(s) ||
      (u.telefone || "").toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function gotoPage(p) {
    const np = Math.min(Math.max(1, p), totalPages);
    setPage(np);
  }

  // Export CSV (exports full filtered list, not only current page)
  function exportCSV() {
    if (!filtered.length) return alert("Nenhum usuário para exportar.");
    const header = ["id", "nome", "telefone", "email", "role", "genero"].join(",");
    const rows = filtered.map((u) =>
      [u.id, u.nome, u.telefone || "", u.email || "", u.role || "", u.genero || ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <DynamicNavbar />

      <Container className="py-4">
        <Row className="mb-3 align-items-center">
          <Col><h3 className="mb-0">Gerir Usuários</h3></Col>
          <Col className="text-end">
            <Button variant="outline-secondary" size="sm" onClick={sairPadeiro}>Sair</Button>
          </Col>
        </Row>

        {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible>{success}</Alert>}

        <Card className="p-3 mb-4">
          <Form onSubmit={handleSubmit}>
            <Row className="g-2">
              <Col md={4}><Form.Control placeholder="Nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></Col>
              <Col md={3}><Form.Control placeholder="Telefone" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></Col>
              <Col md={5}><Form.Control type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></Col>
            </Row>

            <Row className="g-2 mt-2">
              <Col md={3}>
                <Form.Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="vendedor">Vendedor</option>
                  <option value="caixa">Caixa</option>
                  <option value="admin">Administrador</option>
                </Form.Select>
              </Col>
              <Col md={3}><Form.Control placeholder="Género" value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })} /></Col>
              <Col md={3}><Form.Control type="password" placeholder={form.id ? "Senha (deixe em branco para manter)" : "Senha"} value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} /></Col>
              <Col md={3} className="d-grid">
                <Button type="submit" disabled={saving}>
                  {saving ? (<><Spinner animation="border" size="sm" /> Salvando...</>) : (form.id ? "Atualizar" : "Criar")}
                </Button>
              </Col>
            </Row>

            {form.id && (
              <Row className="mt-2">
                <Col className="text-end">
                  <Button variant="secondary" size="sm" onClick={resetForm}>Cancelar edição</Button>
                </Col>
              </Row>
            )}
          </Form>
        </Card>

        <Row className="mb-2 align-items-center">
          <Col md={4}>
            <InputGroup>
              <Form.Control placeholder="Pesquisar por nome, email, função ou telefone" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              <Button variant="outline-secondary" onClick={() => { setSearch(""); setPage(1); }}>Limpar</Button>
            </InputGroup>
          </Col>
          <Col md={4} className="d-flex gap-2">
            <Form.Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ width: 120 }}>
              <option value={5}>5 / pág</option>
              <option value={10}>10 / pág</option>
              <option value={25}>25 / pág</option>
              <option value={50}>50 / pág</option>
            </Form.Select>
            <Button variant="outline-primary" onClick={exportCSV}>Export CSV (filtrados)</Button>
          </Col>
          <Col md={4} className="text-end">
            <small className="text-muted">Total: {filtered.length} usuários</small>
          </Col>
        </Row>

        <Card className="p-2">
          {loading ? (
            <div className="text-center py-3"><Spinner animation="border" /></div>
          ) : (
            <>
              <Table bordered hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Email</th>
                    <th>Função</th>
                    <th style={{ width: 160 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted">Nenhum usuário encontrado.</td></tr>
                  ) : paged.map(u => (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td>{u.telefone || "-"}</td>
                      <td>{u.email}</td>
                      <td>{u.role || "-"}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-primary" onClick={() => preencherEdicao(u)}>Editar</Button>
                          <Button size="sm" variant="outline-danger" onClick={() => confirmarApagar(u)}>Apagar</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination controls */}
              <div className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <Button size="sm" variant="outline-secondary" onClick={() => gotoPage(currentPage - 1)} disabled={currentPage <= 1}>Prev</Button>{" "}
                  <Button size="sm" variant="outline-secondary" onClick={() => gotoPage(currentPage + 1)} disabled={currentPage >= totalPages}>Next</Button>
                </div>
                <div>
                  Página {currentPage} / {totalPages}
                  {"  "}
                  <Form.Control
                    value={currentPage}
                    onChange={(e) => gotoPage(Number(e.target.value || 1))}
                    style={{ width: 80, display: "inline-block", marginLeft: 8 }}
                    type="number"
                    min={1}
                    max={totalPages}
                    size="sm"
                  />
                </div>
              </div>
            </>
          )}
        </Card>
      </Container>

      {/* Modal confirmar delete */}
      <Modal show={confirmDelete.show} onHide={() => setConfirmDelete({ show: false, id: null, nome: "" })} centered>
        <Modal.Header closeButton><Modal.Title>Confirmar remoção</Modal.Title></Modal.Header>
        <Modal.Body>Tem a certeza que quer apagar o usuário <strong>{confirmDelete.nome}</strong> ? Esta ação é irreversível.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmDelete({ show: false, id: null, nome: "" })}>Cancelar</Button>
          <Button variant="danger" onClick={executarDelete}>Apagar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
