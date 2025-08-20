// src/components/Regular/Pages/admin/config.jsx
import { useEffect, useState } from "react";
import { Form, Button, Container, Row, Col, Image, Alert, Spinner } from "react-bootstrap";
import DynamicNavbar from "../NAV.JSX"; // ajusta o caminho se necessário

export default function EmpresaConfig() {
  const [empresa, setEmpresa] = useState({}); // nunca null
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    endereco: "",
    contactos: "",
    horarios: "",
    logoFile: null,
    logoUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/admin/empresa");
        if (!res.ok) {
          // se 404 ou erro, mantemos form vazio
          if (mounted) setEmpresa({});
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setEmpresa(data || {});
        setFormData({
          nome: data?.nome || "",
          email: data?.email || "",
          endereco: data?.endereco || "",
          contactos: data?.contactos || "",
          horarios: data?.horarios || "",
          logoFile: null,
          logoUrl: normalizeUrl(data?.logo || data?.logoUrl || data?.imagem || ""),
        });
      } catch (err) {
        console.error("Erro ao buscar empresa:", err);
        if (mounted) setError("Erro ao carregar dados da empresa.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // normaliza caminhos relativos
  function normalizeUrl(u) {
    if (!u) return "";
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `${window.location.origin}${u}`;
  }

  // cria preview objectURL quando o user escolhe um ficheiro
  useEffect(() => {
    let url;
    if (formData.logoFile) {
      url = URL.createObjectURL(formData.logoFile);
      setFormData((prev) => ({ ...prev, logoUrl: url }));
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [formData.logoFile]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo") {
      setFormData((prev) => ({ ...prev, logoFile: files?.[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("nome", formData.nome || "");
      fd.append("email", formData.email || "");
      fd.append("endereco", formData.endereco || "");
      fd.append("contactos", formData.contactos || "");
      fd.append("horarios", formData.horarios || "");
      if (formData.logoFile) fd.append("logo", formData.logoFile);

      const res = await fetch("http://localhost:5000/admin/empresa", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const body = await safeJson(res);
        console.error("Erro salvar empresa:", body);
        throw new Error(body?.erro || "Erro ao salvar dados");
      }

      const saved = await res.json();
      const newLogo = normalizeUrl(saved?.logo || saved?.logoUrl || saved?.imagem || "");
      setFormData((prev) => ({ ...prev, logoFile: null, logoUrl: newLogo }));
      setEmpresa(saved || {});
      setSuccess("Dados salvos.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  // display fallback safely
  const displayName = empresa?.nome || formData.nome || "Loja de Materiais";

  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <h2 className="my-3">Configuração da Empresa</h2>

        {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible>{success}</Alert>}

        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" /></div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control name="nome" value={formData.nome} onChange={handleChange} />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control name="email" type="email" value={formData.email} onChange={handleChange} />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Contactos</Form.Label>
                  <Form.Control name="contactos" value={formData.contactos} onChange={handleChange} />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Endereço</Form.Label>
                  <Form.Control name="endereco" value={formData.endereco} onChange={handleChange} />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Horários</Form.Label>
                  <Form.Control name="horarios" value={formData.horarios} onChange={handleChange} />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Logotipo</Form.Label>
                  <Form.Control type="file" name="logo" accept="image/*" onChange={handleChange} />
                  {formData.logoUrl ? (
                    <div className="mt-2">
                      <Image src={formData.logoUrl} height={80} className="border" alt={`${displayName} logo`} />
                    </div>
                  ) : (
                    <div className="mt-2 text-muted">Sem logotipo</div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Button type="submit" className="mt-3" disabled={saving}>
              {saving ? "Gravando..." : "Salvar"}
            </Button>
          </Form>
        )}
      </Container>
    </>
  );
}
