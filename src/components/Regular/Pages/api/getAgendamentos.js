export const GetAgenda=async (My_id)=> {
    // You can await here
    try {
      const response = await fetch("http://127.0.0.1:32/regular/agendamento/"+My_id,{
      method:"GET",
      header:{"Content-Type":'application/json'}
    })
    return await response.json()
    } catch (error) {
      console.log(error)
    }
    
  }