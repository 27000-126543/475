import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Dashboard from '@/pages/Dashboard'
import Manuscripts from '@/pages/Manuscripts'
import ManuscriptDetail from '@/pages/ManuscriptDetail'
import Proofread from '@/pages/Proofread'
import ProofreadDetail from '@/pages/ProofreadDetail'
import Review from '@/pages/Review'
import ReviewDetail from '@/pages/ReviewDetail'
import Library from '@/pages/Library'
import LibraryDetail from '@/pages/LibraryDetail'
import AdminStandards from '@/pages/AdminStandards'
import AdminCycles from '@/pages/AdminCycles'
import AdminMonitor from '@/pages/AdminMonitor'
import AdminAlerts from '@/pages/AdminAlerts'
import Performance from '@/pages/Performance'
import Messages from '@/pages/Messages'

function Layout() {
  return (
    <>
      <Sidebar />
      <div className="ml-60 flex flex-col h-screen">
        <Header />
        <main className="flex-1 overflow-auto p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/manuscripts" element={<Manuscripts />} />
          <Route path="/manuscripts/:id" element={<ManuscriptDetail />} />
          <Route path="/proofread" element={<Proofread />} />
          <Route path="/proofread/:id" element={<ProofreadDetail />} />
          <Route path="/review" element={<Review />} />
          <Route path="/review/:id" element={<ReviewDetail />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:id" element={<LibraryDetail />} />
          <Route path="/admin/standards" element={<AdminStandards />} />
          <Route path="/admin/cycles" element={<AdminCycles />} />
          <Route path="/admin/monitor" element={<AdminMonitor />} />
          <Route path="/admin/alerts" element={<AdminAlerts />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/messages" element={<Messages />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
