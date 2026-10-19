import { Routes, Route } from 'react-router'
import Event from './pages/event'
// import Home from './pages/home'
import Home2 from './pages/home2'
import AdminPage from './pages/adminPage'

function App() {
  return (
    <Routes>
      {/* <Route path="/" element={<Home />} /> */}
      <Route path="/" element={<Home2 />} />
      <Route path="/event/:id" element={<Event />} />
      <Route path="/admin" element={<AdminPage />} />

          
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  )
}

export default App


