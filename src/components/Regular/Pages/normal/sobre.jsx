import { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import DynamicNavbar from "../NAV.jsx";

export default function Sobre() {
  const [empresa, setEmpresa] = useState({
    nome: "",
    endereco: "",
    contactos: "",
    horarios: "",
    descricao: "",
  });

  useEffect(() => {
    fetch("http://localhost:5002/admin/empresa")
      .then((res) => res.json())
      .then((data) => setEmpresa(data))
      .catch((err) => console.error("Erro ao buscar dados da empresa:", err));
  }, []);

  return (
    <>
      <DynamicNavbar />

      <section className="py-5 bg-light">
        <Container>
          <h2 className="text-center mb-4">Sobre Nós</h2>
          <Row className="align-items-center">
            <Col md={6}>
              <p className="lead">
                A <strong>{empresa.nome || "MZ Materiais"}</strong> é uma empresa especializada na 
                venda de materiais de construção, oferecendo soluções de qualidade para 
                profissionais, empresas e particulares.
              </p>
              <p>
                Trabalhamos com os melhores fornecedores do mercado, garantindo confiança, 
                durabilidade e preços competitivos. Nosso compromisso é facilitar o acesso 
                a materiais que ajudam a transformar projetos em realidade.
              </p>
              <p>
                <strong>Horários:</strong> {empresa.horarios || "Seg a Sáb - 8h às 18h"}
                <br />
                <strong>Contactos:</strong> {empresa.contactos || "999 000 000 / email@empresa.com"}
              </p>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>📍 Localização</Card.Title>
                  <Card.Text>
                    {empresa.endereco || (
                      <>
                        Rua da Construção, nº 456
                        <br />
                        Bairro Industrial
                        <br />
                        Luanda, Angola
                      </>
                    )}
                  </Card.Text>
                  <iframe
                    title="mapa"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3943.1126892060244!2d13.2345!3d-8.8383!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1a51f3e4b85790a1%3A0xf90eb213173cb0f1!2sLuanda!5e0!3m2!1spt-PT!2sao!4v1718793333333"
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                  ></iframe>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}
