import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Sidebar({ active }) {
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const menuItems = [
    { name: 'Dashboard', icon: '🏠', path: '/dashboard' },
    { name: 'Leads', icon: '📋', path: '/leads' },
    { name: 'Contacts', icon: '👤', path: '/contacts' },
    { name: 'Deals', icon: '💼', path: '/deals' },
    { name: 'Quotes', icon: '🧾', path: '/quotes' },
    { name: 'Activities', icon: '📅', path: '/activities' },
    { name: 'Tasks', icon: '✅', path: '/tasks' },
    { name: 'Reports', icon: '📊', path: '/reports' },
  ]

  return (
    <>
      <div className="md:hidden bg-blue-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">Lynx Soft. CRM</h1>
        <button onClick={() => setOpen(!open)} className="text-2xl">
          {open ? 'X' : 'Menu'}
        </button>
      </div>

      <div className="flex">
        <div className={
          "bg-blue-900 text-white w-64 min-h-screen flex-shrink-0 fixed md:static top-0 left-0 z-50 transition-transform duration-300 " +
          (open ? "translate-x-0" : "-translate-x-full") + " md:translate-x-0"
        }>
          <div className="p-6 border-b border-blue-700 hidden md:block">
            <h1 className="text-xl font-bold">Lynx Soft.</h1>
            <p className="text-blue-300 text-sm">CRM & Sales System</p>
          </div>

          <nav className="p-4">
            {menuItems.map(function(item) {
              const isActive = active === item.name
              const linkClass = isActive
                ? "flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition bg-blue-700 text-white font-semibold"
                : "flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition text-blue-200 hover:bg-blue-800"
              return (
                <a key={item.path} href={item.path} className={linkClass}>
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              )
            })}
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t border-blue-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-200 hover:bg-blue-800 transition"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {open && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setOpen(false)}
          ></div>
        )}
      </div>
    </>
  )
}
