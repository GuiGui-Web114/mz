import React, { useEffect, useState } from "react";
import { Container, Table, Button, Alert,Nav,Navbar } from "react-bootstrap";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import DynamicNavbar from "../NAV.jsx";
function EntregarEncomendas() {
  const [encomendas, setEncomendas] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    buscarEncomendas();
  }, []);

  const buscarEncomendas = async () => {
    try {
      const res = await fetch("http://localhost:5002/admin/encomendas/moto");
      const data = await res.json();
      const aceitas = data.filter((e) => e.status === "aceita");
      setEncomendas(aceitas);
    } catch (error) {
      console.error("Erro ao buscar encomendas:", error);
    }
  };

  const marcarEntregue = async (id) => {
    try {
      const res = await fetch(`http://localhost:5002/admin/encomendas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "entregue",
          data_entrega: dayjs().format("YYYY-MM-DD"),
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar");

      setMsg("Encomenda marcada como entregue.");
      buscarEncomendas();
    } catch (error) {
      console.error("Erro ao marcar como entregue:", error);
    }
  };
  const navigate = useNavigate()
function sairPadeiro() {
    navigate("/office/login");
    sessionStorage.clear()
  }
  return (<>
  
   <DynamicNavbar/>
    <Container className="mt-4">
      <h3>Entregar Encomendas</h3>
      {msg && <Alert variant="success">{msg}</Alert>}
      <Table bordered hover responsive className="mt-3">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Telefone</th>
            <th>Produtos</th>
            <th>Data Aceite</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {encomendas.map((e) => (
            <tr key={e.id}>
              <td>{e.nome_cliente}</td>
              <td>{e.telefone}</td>
              <td>
                {e.encomenda_items.map((item, i) => (
                  <div key={i}>
                    {item.quantidade || 0}x {item.produto?.nome || "Produto inválido"}
                  </div>
                ))}
              </td>
              <td>{dayjs(e.updatedAt).format("DD/MM/YYYY")}</td>
              <td>
                <Button size="sm" variant="success" onClick={() => marcarEntregue(e.id)}>
                  Marcar como Entregue
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container></>

  );
}

export default EntregarEncomendas;
