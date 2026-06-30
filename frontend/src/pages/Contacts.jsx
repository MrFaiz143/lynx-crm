import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', company: '', address: '', notes: ''
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    setContacts(data || [])
  }

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      alert('Name aur Phone zaruri hai!')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('contacts').insert([{
      ...form,
      created_at: new Date().toISOString()
    }])
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Contact successfully add hua! ✅')
      setForm({ name: '', phone: '', email: '', company: '', address: '', notes: '' })
      setShowForm(false)
      fetchContacts()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Contacts" />

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Contacts</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900"
          >
            + Add Contact
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">New Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Name *</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Phone *</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mobile number"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Company</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company name"
                  value={form.company}
                  onChange={(e) => setForm({...form, company: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm mb-1">Address</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full address"
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm mb-1">Notes</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any notes"
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900"
              >
                {loading ? 'Saving...' : 'Save Contact'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                    Koi contact nahi hai — Add Contact button se add karo!
                  </td>
                </tr>
              ) : (
                contacts.map((contact, i) => (
                  <tr key={contact.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium">{contact.name}</td>
                    <td className="px-4 py-3">{contact.phone}</td>
                    <td className="px-4 py-3">{contact.email}</td>
                    <td className="px-4 py-3">{contact.company}</td>
                    <td className="px-4 py-3 text-gray-500">{contact.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}