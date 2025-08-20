import { useEffect, useState } from "react";
import {
  Container,
  Form,
  Button,
  Table,
  Image,
  Nav,
  Navbar,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DynamicNavbar from "../NAV.JSX";
function CadastroProduto() {
  const [produtos, setProdutos] = useState([]);
 const [novo, setNovo] = useState({
  nome: "",
  farinha: "",
  imagem: null,
  preco: "",
  tipo: "padaria",
});

  const [carregando, setCarregando] = useState(false);

  const rendimento = (farinha) => Math.floor(50000 / farinha); // 50kg de farinha por saco

  const API = "http://localhost:5000/admin/produtos";

  // Carregar produtos do backend
  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then(setProdutos)
      .catch((err) => console.error("Erro ao carregar produtos:", err));
  }, []);

 const adicionar = async () => {
  if (!novo.nome || !novo.farinha || !novo.imagem || !novo.preco) return;

  const formData = new FormData();
  formData.append("nome", novo.nome);
  formData.append("preco", parseInt(novo.preco));
  formData.append("tipo", novo.tipo);
  formData.append("farinha", parseInt(novo.farinha));
  formData.append("imagem", novo.imagem); // <- arquivo real

  try {
    setCarregando(true);
    const res = await fetch(API, {
      method: "POST",
      body: formData, // <- sem headers
    });

    if (!res.ok) throw new Error("Erro ao salvar produto");

    const produtoCriado = await res.json();
    setProdutos((prev) => [...prev, produtoCriado]);
    setNovo({ nome: "", farinha: "", imagem: null, preco: "", tipo: "padaria" });
  } catch (err) {
    alert("Erro ao salvar produto.");
    console.error(err);
  } finally {
    setCarregando(false);
  }
};

  const navigate = useNavigate()
function sairPadeiro() {
    navigate("/office/login");
    sessionStorage.clear()
  }
  return (
    <>
<DynamicNavbar/>
      <Container className="py-5">
        <h2 className="fw-bold mb-4">Cadastro de Produtos</h2>

        <Form className="mb-4">
          <Form.Group className="mb-2">
            <Form.Label>Nome do Produto</Form.Label>
            <Form.Control
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Farinha por unidade (g)</Form.Label>
            <Form.Control
              type="number"
              value={novo.farinha}
              onChange={(e) =>
                setNovo({ ...novo, farinha: parseInt(e.target.value) || "" })
              }
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Preço (Kz)</Form.Label>
            <Form.Control
              type="number"
              value={novo.preco}
              onChange={(e) =>
                setNovo({ ...novo, preco: parseInt(e.target.value) || "" })
              }
            />
          </Form.Group>

       <Form.Group className="mb-2">
  <Form.Label>Imagem do Produto</Form.Label>
  <Form.Control
    type="file"
    accept="image/*"
    onChange={(e) => setNovo({ ...novo, imagem: e.target.files[0] })}
  />
</Form.Group>


     {novo.imagem && (
  <div className="mb-3">
    <Form.Label>Prévia:</Form.Label>
    <br />
    <Image
      src={URL.createObjectURL(novo.imagem)}
      height={120}
      rounded
    />
  </div>
)}


          <Button onClick={adicionar} variant="dark" disabled={carregando}>
            {carregando ? <Spinner animation="border" size="sm" /> : "Adicionar Produto"}
          </Button>
        </Form>

        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>Imagem</th>
              <th>Produto</th>
              <th>Farinha (g)</th>
              <th>Preço</th>
              <th>Rendimento (por saco)</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p, i) => (
              <tr key={i}>
                <td>
                  <Image src={p.imagem} height={60} rounded />
                </td>
                <td>{p.nome}</td>
                <td>{p.farinha || "-"}</td>
                <td>Kz {p.preco}</td>
                <td>{p.farinha ? rendimento(p.farinha) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}

export default CadastroProduto;
