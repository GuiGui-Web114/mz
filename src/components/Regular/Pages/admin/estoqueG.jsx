import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Modal,
  Tabs,
  Tab,
  Image,
} from "react-bootstrap";
import DynamicNavbar from "../NAV.JSX";

export default function EstoqueGeralMateriais() {
  const [key, setKey] = useState("produtos");
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoMaterial, setNovoMaterial] = useState({
    nome: "",
    preco: "",
    quantidade: "",
    descricao: "",
    categoriaId: "",
    imagem: null,
  });
  const [movimento, setMovimento] = useState({
    tipo: "entrada",
    item_id: "",
    quantidade: "",
    preco_unit: "",
    motivo: "",
  });
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchMateriais();
    fetchCategorias();
  }, []);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  
  async function handleNovaCategoria() {
    try {
      const res = await fetch("http://localhost:5000/admin/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novaCategoria }),
      });
      const data = await res.json();
      setCategorias([...categorias, data]);
      setNovaCategoria("");
    } catch (err) {
      console.error(err);
    }
  }
  
  async function fetchMateriais() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/admin/materiais");
      const data = await res.json();
      setMateriais(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategorias() {
    try {
      const res = await fetch("http://localhost:5000/admin/categorias");
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleNovoMaterial(e) {
    e.preventDefault();
    const formData = new FormData();
    for (let key in novoMaterial) {
      formData.append(key, novoMaterial[key]);
    }

    try {
      await fetch("http://localhost:5000/admin/materiais", {
        method: "POST",
        body: formData,
      });
      setNovoMaterial({
        nome: "",
        preco: "",
        quantidade: "",
        descricao: "",
        categoriaId: "",
        imagem: null,
      });
      fetchMateriais();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMovimento(e) {
    e.preventDefault();
    const payload = { ...movimento, quantidade: Number(movimento.quantidade) };
    try {
      await fetch(`http://localhost:5000/admin/estoque/${movimento.tipo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setMovimento({ tipo: "entrada", item_id: "", quantidade: "", preco_unit: "", motivo: "" });
      fetchMateriais();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleHistory(item) {
    try {
      const res = await fetch(`http://localhost:5000/admin/estoque/history/${item.id}`);
      const data = await res.json();
      setHistoryData(data);
      setSelectedItem(item);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
    }
  }

  const formatSaldo = (item) => Number(item.saldo_atual || 0).toFixed(2);

  return (
    <>
      <DynamicNavbar />
      <Container className="py-4">
        <h2 className="text-primary mb-4">Estoque Geral de Materiais</h2>
        <Tabs activeKey={key} onSelect={setKey}>
          
         


          <Tab eventKey="produtos" title="Produtos">
            <Row className="mt-3">
              <Col md={6}>
                <Card className="p-3 shadow-sm rounded-2xl">
                  <Form onSubmit={handleNovoMaterial}>
                    <Form.Group className="mb-2">
                      <Form.Label>Nome do Material</Form.Label>
                      <Form.Control
                        type="text"
                        value={novoMaterial.nome}
                        onChange={(e) =>
                          setNovoMaterial({ ...novoMaterial, nome: e.target.value })
                        }
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Preço (Kz)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={novoMaterial.preco}
                        onChange={(e) =>
                          setNovoMaterial({ ...novoMaterial, preco: e.target.value })
                        }
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Quantidade</Form.Label>
                      <Form.Control
                        type="number"
                        value={novoMaterial.quantidade}
                        onChange={(e) =>
                          setNovoMaterial({ ...novoMaterial, quantidade: e.target.value })
                        }
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Descrição</Form.Label>
                      <Form.Control
                        type="text"
                        value={novoMaterial.descricao}
                        onChange={(e) =>
                          setNovoMaterial({ ...novoMaterial, descricao: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Categoria</Form.Label>
                      <Form.Select
                        value={novoMaterial.categoriaId}
                        onChange={(e) =>
                          setNovoMaterial({ ...novoMaterial, categoriaId: e.target.value })
                        }
                        required
                      >
                        <option value="">--</option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Imagem</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setNovoMaterial({ ...novoMaterial, imagem: e.target.files[0] })
                        }
                        required
                      />
                    </Form.Group>
                    {novoMaterial.imagem && (
                      <div className="mb-2">
                        <Image
                          src={URL.createObjectURL(novoMaterial.imagem)}
                          alt="Preview"
                          style={{ width: "150px", height: "150px", objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <Button type="submit" className="w-100">
                      Cadastrar Material
                    </Button>
                  </Form>
                </Card>
              </Col>
            </Row>

            {/* Tabela de Materiais */}
            <Row className="mt-4">
              <Col>
                {!loading && (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Imagem</th>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Quantidade</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materiais.map((m) => (
                        <tr key={m.id}>
                          <td>
                            {m.imagem && (
                              <Image
                                src={"http://localhost:5000"+m.imagem}
                                alt={m.nome}
                                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                              />
                            )}
                          </td>
                          <td>{m.nome}</td>
                          <td>{m.Categorium?.nome}</td>
                          <td>{Number(m.preco).toFixed(2)}</td>
                          <td>{m.quantidade}</td>
                          <td>
                            <Button size="sm" onClick={() => handleHistory(m)}>
                              Histórico
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Col>
            </Row>
          </Tab>

          {/* Movimentos de Estoque */}
          <Tab eventKey="movimentos" title="Entradas/Saídas">
            <Row className="mt-3">
              <Col md={6}>
                <Card className="p-3 shadow-sm rounded-2xl">
                  <Form onSubmit={handleMovimento}>
                    <Form.Group className="mb-2">
                      <Form.Label>Tipo</Form.Label>
                      <Form.Select
                        value={movimento.tipo}
                        onChange={(e) => setMovimento({ ...movimento, tipo: e.target.value })}
                      >
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                        <option value="devolucao">Devolução</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Produto</Form.Label>
                      <Form.Select
                        value={movimento.item_id}
                        onChange={(e) => setMovimento({ ...movimento, item_id: e.target.value })}
                        required
                      >
                        <option value="">--</option>
                        {materiais.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nome}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Quantidade</Form.Label>
                      <Form.Control
                        type="number"
                        value={movimento.quantidade}
                        onChange={(e) => setMovimento({ ...movimento, quantidade: e.target.value })}
                        required
                      />
                    </Form.Group>
                    {movimento.tipo === "entrada" && (
                      <Form.Group className="mb-2">
                        <Form.Label>Preço Unitário (Kz)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={movimento.preco_unit}
                          onChange={(e) => setMovimento({ ...movimento, preco_unit: e.target.value })}
                        />
                      </Form.Group>
                    )}
                    {movimento.tipo === "devolucao" && (
                      <Form.Group className="mb-2">
                        <Form.Label>Motivo</Form.Label>
                        <Form.Control
                          type="text"
                          value={movimento.motivo}
                          onChange={(e) => setMovimento({ ...movimento, motivo: e.target.value })}
                        />
                      </Form.Group>
                    )}
                    <Button type="submit" className="w-100">
                      Registrar
                    </Button>
                  </Form>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>

        {/* Modal Histórico */}
        <Modal show={showHistory} onHide={() => setShowHistory(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Histórico - {selectedItem?.nome}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Qtd</th>
                  <th>Preço/Obs</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.createdAt).toLocaleString()}</td>
                    <td>{h.tipo}</td>
                    <td>{h.quantidade}</td>
                    <td>{h.tipo === "entrada" ? `Kz ${h.preco_unit}` : h.motivo || h.destino}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setShowHistory(false)}>Fechar</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}

