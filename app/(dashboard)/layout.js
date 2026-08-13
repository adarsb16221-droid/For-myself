import SideNav from '@/components/SideNav'
import BottomNav from '@/components/BottomNav'

export default function DashboardLayout({ children }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <SideNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0 h-screen overflow-y-auto">
        {children}
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </>
  )
}
