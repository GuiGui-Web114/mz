import { useEffect, useState } from "react";
import { Navbar, Nav, Container, NavDropdown, Image } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

export default function DynamicNavbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const funcionarioId = sessionStorage.getItem("userId");
  const isAdmin = pathname.startsWith("/office/admin");

  const [empresa, setEmpresa] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("http://localhost:5002/admin/empresa");
        const data = await res.json();
        if (mounted) setEmpresa(data || {});
      } catch {
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
        await fetch("http://localhost:5002/admin/turno/encerrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ funcionarioId }),
        });
      } catch (err) {
        console.error(err);
      }
    }
    sair();
  };

  const menus = {
    "/office/admin": [
      {
        label: "Principal",
        items: [
          ["Dashboard", "/office/admin/dashboard"],
          ["Vendas", "/office/admin/vendas"],
          ["Lucro", "/office/admin/lucro"],
        ],
      },
      {
        label: "Estoque",
        items: [
          ["Armazém", "/office/admin/estoque/geral"],
          ["Categorias", "/office/admin/categorias"],
          ["Materiais", "/office/admin/materiais"],
          ["Fornecedores", "/office/admin/fornecedores"],
          ["Saída Stock", "/office/admin/saidaEstoque"],
        ],
      },
      {
        label: "Relatórios",
        items: [["Relatórios", "/office/admin/relatorios"]],
      },
      {
        label: "Sistema",
        items: [
          ["Usuários", "/office/admin/users"],
          ["Configurar", "/office/admin/config/sys"],
          ["Dívidas", "/office/admin/divida"],
        ],
      },
    ],
    "/office/caixa": [
      {
        label: "Caixa",
        items: [
          ["Registrar Venda", "/office/caixa/home"],
          ["Clientes", "/office/caixa/clientes"],
          ["Relatório", "/office/caixa/relatorio"],
        ],
      },
    ],
    "/": [
      {
        label: "Principal",
        items: [
          ["Materiais", "/materiais"],
          ["Contacto", "/contacto"],
          ["Sobre", "/about"],
          ["Login", "/office/login"],
        ],
      },
    ],
  };

  const match = Object.keys(menus).find((key) => pathname.startsWith(key)) || "/";
  const links = menus[match];

  const logoSrc = empresa?.logo || empresa?.logoUrl || null;
  const displayName = empresa?.nome || "Loja de Materiais";

  return (
    <Navbar bg="light" expand="lg" sticky="top" className="shadow-sm border-bottom">
      <Container>
        <Navbar.Brand
          onClick={() => navigate("/")}
          style={{ cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}
        >
          {logoSrc ? (
            <>
              <Image src={"http://localhost:5002" + logoSrc} alt={displayName} height="40" rounded />
              <span className="ms-2 fw-bold">{displayName}</span>
            </>
          ) : (
            <span className="fw-bold">{displayName}</span>
          )}
        </Navbar.Brand>

        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="ms-auto d-flex align-items-center">
            {links.map((group) =>
              group.items.length > 1 ? (
                <NavDropdown key={group.label} title={group.label} align="end" className="ms-2">
                  {group.items.map(([label, href]) => (
                    <NavDropdown.Item key={href} onClick={() => navigate(href)}>
                      {label}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              ) : (
                <Nav.Link
                  key={group.items[0][1]}
                  onClick={() => navigate(group.items[0][1])}
                  className="fw-semibold ms-2"
                >
                  {group.items[0][0]}
                </Nav.Link>
              )
            )}

            <NavDropdown title="Conta" align="end" className="ms-2">
              <NavDropdown.Item onClick={sairComTurno}>Sair</NavDropdown.Item>
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
