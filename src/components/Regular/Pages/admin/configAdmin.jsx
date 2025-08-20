import { useState, useEffect } from "react";
import { Container, Form, Button, Table, Alert } from "react-bootstrap";
import DynamicNavbar from "../NAV.JSX";

export default function ConfigurarTurnos() {
  const API = "http://localhost:5000/admin";
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState({
    cargo: "",
    dias_semana: [],
    hora_inicio: "",
    hora_fim: "",
    horas_semanais: 0,
  });
  const [erro, setErro] = useState("");

  const cargos = ["Motoboy", "Caixa", "Padeiro", "Administrador"];
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

  useEffect(() => {
    fetch(`${API}/turnos`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConfigs(data);
        } else if (Array.isArray(data.configs)) {
          setConfigs(data.configs);
        } else {
          setConfigs([]);
          setErro("Resposta do servidor inválida.");
        }
      })
      .catch((err) => {
        console.error(err);
        setErro("Erro ao buscar configurações.");
        setConfigs([]);
      });
  }, []);

  const handleSubmit = () => {
    fetch(`${API}/turno/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((r) => r.json())
      .then(() => window.location.reload())
      .catch((err) => {
        console.error(err);
        setErro("Erro ao salvar configuração.");
      });
  };

  return (<>
    <DynamicNavbar/>
    <Container>
      <h3>Configurar Turnos</h3>

      {erro && <Alert variant="danger">{erro}</Alert>}

      <Form>
        <Form.Group>
          <Form.Label>Cargo</Form.Label>
          <Form.Select
            value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })}
          >
            <option>Selecione</option>
            {cargos.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label>Dias da semana</Form.Label>
          <div>
            {dias.map((d) => (
              <Form.Check
                inline
                key={d}
                type="checkbox"
                label={d}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((f) => ({
                    ...f,
                    dias_semana: checked
                      ? [...f.dias_semana, d]
                      : f.dias_semana.filter((dia) => dia !== d),
                  }));
                }}
              />
            ))}
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>Hora início</Form.Label>
          <Form.Control
            type="time"
            value={form.hora_inicio}
            onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Hora fim</Form.Label>
          <Form.Control
            type="time"
            value={form.hora_fim}
            onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Horas semanais</Form.Label>
          <Form.Control
            type="number"
            value={form.horas_semanais}
            onChange={(e) =>
              setForm({ ...form, horas_semanais: e.target.value })
            }
          />
        </Form.Group>

        <Button onClick={handleSubmit}>Salvar</Button>
      </Form>

      <h5 className="mt-4">Configs atuais</h5>
      <Table>
        <thead>
          <tr>
            <th>Cargo</th>
            <th>Dias</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Horas Semanais</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(configs) && configs.length > 0 ? (
            configs.map((c) => (
              <tr key={c.id}>
                <td>{c.cargo}</td>
                <td>{Array.isArray(c.dias_semana) ? c.dias_semana.join(", ") : ""}</td>
                <td>{c.hora_inicio}</td>
                <td>{c.hora_fim}</td>
                <td>{c.horas_semanais}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">Nenhuma configuração encontrada.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  </>);
}
