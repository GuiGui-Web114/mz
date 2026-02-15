import { useState, useEffect } from "react";
import { Container, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DynamicNavbar from "./NAV.jsx";

function TelaTurno() {
  const [turno, setTurno] = useState(null);
  const funcionarioId = sessionStorage.getItem("userId");
  const funcao = sessionStorage.getItem("userFuncao");
  const navigate = useNavigate();

  const redirecionarPosTurno = () => {
    if (funcao === "Caixa") {
      navigate("/office/caixa/home");
    } else if (funcao === "Padeiro") {
      navigate("/office/padeiro/relatorio");
    } else if (funcao === "Motoboy") {
      navigate("/office/motoboy");
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    if (!funcionarioId) return;

    fetch("http://localhost:5002/admin/turno/atual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcionarioId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Sem turno");
        return res.json();
      })
      .then((data) => {
        setTurno(data);
        redirecionarPosTurno(); // 👈 redireciona se já tem turno
      })
      .catch(() => setTurno(null));
  }, []);

  const iniciarTurno = () => {
    fetch("http://localhost:5002/admin/turno/iniciar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcionarioId }),
    })
      .then((res) => res.json())
      .then(() => {
        alert("Turno iniciado");
        redirecionarPosTurno();
      })
      .catch(() => alert("Erro ao iniciar turno"));
  };

  const encerrarTurno = () => {
    fetch("http://localhost:5002/admin/turno/encerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcionarioId }),
    })
      .then((res) => res.json())
      .then(() => {
        alert("Turno encerrado");
        setTurno(null);
      })
      .catch(() => alert("Erro ao encerrar turno"));
  };

  return (
    <>
      <DynamicNavbar />
      <Container className="mt-4">
        <Card className="p-4">
          <h3>Controle de Turno</h3>
          {turno ? (
            <>
              <p>Turno iniciado: {new Date(turno.inicio).toLocaleTimeString()}</p>
              <Button variant="danger" onClick={encerrarTurno}>
                Encerrar Turno
              </Button>
            </>
          ) : (
            <Button variant="success" onClick={iniciarTurno}>
              Iniciar Turno
            </Button>
          )}
        </Card>
      </Container>
    </>
  );
}

export default TelaTurno;
