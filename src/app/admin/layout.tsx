import Sidebar from '@/components/admin/Sidebar'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin | Tapicascos',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 max-w-6xl">
          {children}
        </div>
      </div>
    </div>
  )
}
