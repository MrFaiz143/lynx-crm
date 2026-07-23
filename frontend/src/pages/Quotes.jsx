import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'

export default function Quotes({ orgId }) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orgId) fetchQuotes()
  }, [orgId])

  const fetchQuotes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (!error) setQuotes(data || [])
    setLoading(false)
  }

  const statusBadge = (status) => {
    const styles = {
      Draft: 'bg-gray-200 text-gray-700',
      Sent: 'bg-blue-100 text-blue-700',
      Accepted: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700',
    }
    return styles[status] || 'bg-gray-200 text-gray-700'
  }

  return (
    <div className="flex">
      <Sidebar active="Quotes" />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-900">Quotes</h1>
          <a
            href="/quotes/new"
            className="bg-blue-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-900 transition"
          >
            + New Quote
          </a>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : quotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Abhi tak koi quote nahi bana hai. "New Quote" pe click karke shuru karo.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-blue-50 text-blue-900 text-sm">
                <tr>
                  <th className="px-4 py-3">Quote #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{q.quote_number}</td>
                    <td className="px-4 py-3">
                      <div>{q.client_name}</div>
                      <div className="text-xs text-gray-500">{q.client_email}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">₹{Number(q.total).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(q.status)}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(q.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/quotes/new?edit=${q.id}`}
                        className="text-blue-700 text-sm font-medium hover:underline"
                      >
                        View / Edit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
