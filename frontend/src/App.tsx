import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import ScanPage from './pages/ScanPage'
import InvoicesPage from './pages/InvoicesPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import BundlesPage from './pages/BundlesPage'
import BundleDetailPage from './pages/BundleDetailPage'
import SettingsPage from './pages/SettingsPage'

const queryClient = new QueryClient()

function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex gap-2 items-center">
      <span className="font-bold text-lg mr-4">發票OCR</span>
      <NavLink to="/scan" className={linkClass}>掃描</NavLink>
      <NavLink to="/invoices" className={linkClass}>發票</NavLink>
      <NavLink to="/bundles" className={linkClass}>報帳單</NavLink>
      <NavLink to="/settings" className={linkClass}>設定</NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <main className="max-w-4xl mx-auto p-4">
            <Routes>
              <Route path="/" element={<ScanPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/bundles" element={<BundlesPage />} />
              <Route path="/bundles/:id" element={<BundleDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
