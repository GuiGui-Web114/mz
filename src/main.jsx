import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import 'bootstrap/dist/css/bootstrap.min.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './components/Regular/Pages/normal/home.jsx'
import Produtos from './components/Regular/Pages/normal/produto'
import Sobre from './components/Regular/Pages/normal/sobre'
import LoginFuncionario from './components/login'
import RegistrarVendaMateriais from './components/Regular/Pages/admin/caixa'
import RelatorioVendas from './components/Regular/Pages/admin/caixaRelatorio'
import ResumoProducao from './components/Regular/Pages/admin/padResumo'
import CadastroProduto from './components/Regular/Pages/admin/padCreate'
import RegistroProducao from './components/Regular/Pages/admin/padPorducao'
import EditarProdutos from './components/Regular/Pages/admin/padUR'
import Gastos from './components/Regular/Pages/admin/adminGastos'
import Categorias from './components/Regular/Pages/admin/admnEnco'
import AdminDashboard from './components/Regular/Pages/admin/adminDash'
import Contato from './components/Regular/Pages/normal/tact.jsx'
import EntregarEncomendas from './components/Regular/Pages/admin/motoboy.jsx'
import UserManager from './components/Regular/Pages/admin/users.jsx'
import RegistrarRecebimento from './components/Regular/Pages/admin/caixaRegistrar.jsx'
import Clientes from './components/Regular/Pages/admin/caixaRecebidos.jsx'
import HistoricoEntregas from './components/Regular/Pages/admin/motoHIs.jsx'
import TelaTurno from './components/Regular/Pages/turno.jsx'
import EstoqueGeral from './components/Regular/Pages/admin/estoqueG.jsx'
import ReportsAdmin from './components/Regular/Pages/admin/estoqueEntrada.jsx'
import EstoqueCaixa from './components/Regular/Pages/admin/caixaarmazem.jsx'
import VendasAdmin from './components/Regular/Pages/admin/cO.jsx'
import AdminEstoque from './components/Regular/Pages/admin/adminEstoque.jsx'
import SaidaEstoque from './components/Regular/Pages/admin/stocky.jsx'
import ConfigurarTurnos from './components/Regular/Pages/admin/configAdmin.jsx'
import Fornecedores from './components/Regular/Pages/admin/AdminTurnoC.jsx'
import EmpresaConfig from './components/Regular/Pages/admin/config.jsx'
import Materiais from './components/Regular/Pages/admin/padUR'
import DebtManagementAdmin from './components/Regular/Pages/admin/div.jsx'
import VendasParceladas from './components/Regular/Pages/admin/vendaDiv.jsx'
import CriarDivida from './components/Regular/Pages/admin/div2.jsx'
import RelatorioLucro from './components/Regular/Pages/admin/lucro.jsx'

const router = createBrowserRouter([
{
  path:"/",
  element:<App/>,
  children:[
  //client side
  {
    path:"/",
    element:<Home/>,
  },
  {
    path:"/materiais",
    element:<Produtos/>,
  },
    {
    path:"/about",
    element:<Sobre/>,
  },
  {
    path:"/contacto",
    element:<Contato/>,
  },

  // empresa
  {
    path:"/office/login",
    element:<LoginFuncionario/>,
  },
  {
    path:"/office/caixa/home",
    element:<RegistrarVendaMateriais/>,
  },
    {
    path:"/office/caixa/registrar",
    element:<RegistrarRecebimento/>,
  },

    {
    path:"/office/caixa/clientes",
    element:<Clientes/>,
  },
  {
    path:"/office/caixa/relatorio",
    element:<RelatorioVendas/>,
  }, {
    path:"/office/caixa/estoque",
    element:<EstoqueCaixa/>,
  },


  {
    path:"/office/admin/gastos",
    element:<Gastos/>,
  }, 
   {
    path:"/office/admin/fornecedores",
    element:<Fornecedores/>,
  }, {
    path:"/office/admin/config/sys",
    element:<EmpresaConfig/>,
  },
   {
    path:"/office/admin/turnos",
    element:<ConfigurarTurnos/>,
  }, 
  {
    path:"/office/admin/saidaEstoque",
    element:<SaidaEstoque/>,
  }, 
   {
    path:"/office/admin/estoque/geral",
    element:<EstoqueGeral/>,
  }, {
    path:"/office/admin/divida/criar",
    element:<CriarDivida/>,
  },
  {
    path:"/office/admin/divida",
    element:<DebtManagementAdmin/>,
  },
  {
    path:"/office/admin/vendas/divida",
    element:<VendasParceladas/>,
  },
   {
    path:"/office/admin/vendas",
    element:<VendasAdmin/>,
  },
   {
    path:"/office/admin/relatorios",
    element:<ReportsAdmin/>,
  },{
    path:"/office/admin/estoque/out",
    element:<EstoqueCaixa/>,
  },
  {
    path:"/office/admin/categorias",
    element:<Categorias/>,
  }, {
    path:"/office/admin/lucro",
    element:<RelatorioLucro/>,
  },
  {
    path:"/office/admin/dashboard",
    element:<AdminDashboard/>,
  },
  {
    path:"/office/admin/users",
    element:<UserManager/>,
  },  {
    path:"/office/admin/stock",
    element:<AdminEstoque/>,
  },
  {
    path:"/office/admin/materiais",
    element:<Materiais/>,
  },
  ]
}
]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
