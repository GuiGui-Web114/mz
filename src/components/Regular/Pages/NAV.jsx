// src/components/DynamicNavbar.jsx
import { useEffect, useState } from "react";
import { Navbar, Nav, Container, NavDropdown, Image } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

export default function DynamicNavbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const funcionarioId = sessionStorage.getItem("userId");
  const isAdmin = pathname.startsWith("/office/admin");

  // guarda sempre um objecto (nunca null)
  const [empresa, setEmpresa] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/admin/empresa");
        if (!res.ok) {
          // não quebrar: mantemos estado vazio
          if (mounted) setEmpresa({});
          return;
        }
        const data = await res.json();
        if (mounted) setEmpresa(data || {});
      } catch (err) {
        console.error("Erro ao buscar dados da empresa:", err);
        if (mounted) setEmpresa({});
      }
    })();
    return () => (mounted = false);
  }, []);

  const sair = () => {
    sessionStorage.clear();
    navigate("/office/login", { replace: true });
  };

  const sairComTurno = async () => {
    if (funcionarioId && !isAdmin) {
      try {
        await fetch("http://localhost:5000/admin/turno/encerrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ funcionarioId }),
        });
      } catch (err) {
        console.error("Erro ao encerrar turno:", err);
      }
    }
    sair();
  };

  // menus adaptados para loja de materiais
  const menus = {
    "/office/admin": [
      ["Dashboard", "/office/admin/dashboard"],
      ["Armazém", "/office/admin/estoque/geral"],
      ["Categorias", "/office/admin/categorias"],
      ["Materiais", "/office/admin/materiais"],
      ["Fornecedores", "/office/admin/fornecedores"],
      ["Vendas", "/office/admin/vendas"],
      ["Relatórios", "/office/admin/relatorios"],
      ["Usuários", "/office/admin/users"],
      ["Configurar", "/office/admin/config/sys"],
    ],
    "/office/caixa": [
      ["Registrar Venda", "/office/caixa/home"],
      ["Clientes", "/office/caixa/clientes"],
      ["Relatório", "/office/caixa/relatorio"],
      ["Armazém", "/office/caixa/estoque"],
    ],
    "/": [
      ["Materiais", "/materiais"],
      ["Contacto", "/contacto"],
      ["Sobre", "/about"],
      ["Login", "/office/login"],
    ],
  };

  const match = Object.keys(menus).find((key) => pathname.startsWith(key)) || "/";
  const links = menus[match];

  // prefer logo real, depois logoUrl; se nenhum, mostra nome ou texto genérico
  const logoSrc = empresa?.logo || empresa?.logoUrl || null;
  const displayName = empresa?.nome || "Loja de Materiais";

  return (
    <Navbar bg="light" expand="lg" sticky="top" className="shadow-sm border-bottom">
      <Container>
        <Navbar.Brand onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
          {logoSrc ? (
            <>
              {/* se o backend devolve caminho relativo (ex: /uploads/...), tenta prefixar a origem */}
              <Image
                src={"http://localhost:5000"+logoSrc}
                alt={displayName}
                height="40"
                rounded
              />
              <span className="ms-2 fw-bold">{displayName}</span>
            </>
          ) : (
            <span className="fw-bold">{displayName}</span>
          )}
        </Navbar.Brand>

        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="ms-auto d-flex align-items-center">
            {links.map(([label, href]) => (
              <Nav.Link key={href} onClick={() => navigate(href)} className="fw-semibold menu-link">
                {label}
              </Nav.Link>
            ))}

            
              <NavDropdown title="Conta" align="end" className="ms-2">
                <NavDropdown.Item onClick={sair}>Sair</NavDropdown.Item>
                </NavDropdown>
        
          </Nav>
        </Navbar.Collapse>
      </Container>

      <style>{`
        .menu-link { transition: all 0.15s ease; cursor: pointer; }
        .menu-link:hover { background-color: #e9ecef; border-radius: 5px; padding: 0 10px; color: #0d6efd; }
      `}</style>
    </Navbar>
  );
}
