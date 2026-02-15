import { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import DynamicNavbar from "../NAV";

function Contactos() {
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5002/admin/empresa") // rota do back
      .then((res) => res.json())
      .then((data) => setEmpresa(data))
      .catch((err) => console.error("Erro ao carregar empresa:", err));
  }, []);

  if (!empresa) {
    return (<>
      <DynamicNavbar/>
   <p className="text-center mt-4">Carregando dados da empresa...</p> </>);
  }

  return (
    <div className="container mt-4">
      <DynamicNavbar/>
      <h2 className="mb-4 text-center">Contactos</h2>
      <Card className="p-4 shadow-sm">
        <h4 className="mb-3">{empresa.nome}</h4>
        <p><strong>Email:</strong> {empresa.email}</p>
        <p><strong>Telefone:</strong> {empresa.telefone}</p>
        <p><strong>Endereço:</strong> {empresa.endereco}</p>
        <p><strong>Descrição:</strong> {empresa.descricao}</p>
      </Card>
    </div>
  );
}

export default Contactos;
