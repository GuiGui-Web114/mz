import { useState, useEffect } from "react";
import { Container, Table, Button } from "react-bootstrap";
import DynamicNavbar from "../NAV.JSX";

export default function VendasAdmin() {
  const [vendas, setVendas] = useState([]);

  useEffect(() => {
    fetchVendas();
  }, []);

  const fetchVendas = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/vendas");
      const data = await res.json();
      setVendas(data);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
    }
  };

  const handleVerFactura = async (vendaId) => {
    try {
      const res = await fetch("http://localhost:5000/admin/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendaId }),
      });
      const data = await res.json();
      if (data.url) {
        window.open("http://localhost:5000"+data.url, "_blank");
      } else {
        alert("Erro ao gerar factura");
      }
    } catch (err) {
      console.error("Erro ao gerar factura:", err);
      alert("Erro ao gerar factura");
    }
  };

  return (
    <>
      <DynamicNavbar />

      <Container className="py-4">
        <h2 className="text-primary mb-4">Vendas / Facturas</h2>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((venda) => (
              <tr key={venda.id}>
                <td>{venda.id}</td>
                <td>{new Date(venda.data).toLocaleDateString()}</td>
                <td>{Number(venda.total).toLocaleString()} KZ</td>
                <td>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => handleVerFactura(venda.id)}
                  >
                    Ver Factura
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}
