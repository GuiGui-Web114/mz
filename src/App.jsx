
import {Outlet} from 'react-router-dom'
import { useState } from 'react'
import './App.css'



function App() {
  const [hasuser,setHasuser] = useState()
  return (
    <>
    <Outlet/>
 </>
  )
}

export default App
