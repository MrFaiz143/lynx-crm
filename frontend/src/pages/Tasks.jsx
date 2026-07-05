import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'

const PRIORITIES = ['Low', 'Medium', 'High']
const STATUSES = ['Pending', 'In Progress', 'Done']

const PRIORITY_COLORS = {
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'High': 'bg-red-100 text-red-700',
}

const STATUS_COLORS = {
  'Pending': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-orange-100 text-orange-700',
  'Done': 'bg-green-100 text-green-700',
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({
    title: '', lead_id: '', due_date: '', priority: 'Medium', status: 'Pending', notes: ''
  })

  useEffect(() => {
    fetchTasks()
    fetchLeads()
  }, [])

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('due_date', { ascending: true })
    setTasks(data || [])
  }

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('id, name')
    setLeads(data || [])
  }

  const resetForm = () => {
    setForm({ title: '', lead_id: '', due_date: '', priority: 'Medium', status: 'Pending', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.title) {
      alert('Title zaruri hai!')
      return
    }
    setLoading(true)
    const payload = {
      title: form.title,
      lead_id: form.lead_id ? parseInt(form.lead_id) : null,
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
      notes: form.notes,
    }
    if (editingId) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editingId)
      if (error) { alert('Error: ' + error.message) }
      else { alert('Task update ho gaya! ✅'); resetForm(); fetchTasks() }
    } else {
      const { error } = await supabase.from('tasks').insert([{ ...payload, created_at: new Date().toISOString() }])
      if (error) { alert('Error: ' + error.message) }
      else { alert('Task add hua! ✅'); resetForm(); fetchTasks() }
    }
    setLoading(false)
  }

  const handleEdit = (task) => {
    setForm({
      title: task.title || '',
      lead_id: task.lead_id || '',
      due_date: task.due_date || '',
      priority: task.priority || 'Medium',
      status: task.status || 'Pending',
      notes: task.notes || ''
    })
    setEditingId(task.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete karna chahte ho?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  const handleStatusChange = async (id, newStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    fetchTasks()
  }

  const getLeadName = (lead_id) => {
    const lead = leads.find(l => l.id === lead_id)
    return lead ? lead.name : '-'
  }

  const isOverdue = (due_date, status) => {
    if (!due_date || status === 'Done') return false
    return new Date(due_date) < new Date()
  }

  const filteredTasks = tasks.filter(task => {
    return filterStatus === '' || task.status === filterStatus
  })

  const pendingCount = tasks.filter(t => t.status === 'Pending').length
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length
  const doneCount = tasks.filter(t => t.status === 'Done').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Tasks" />

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Tasks & Follow-ups</h2>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900"
          >
            + Add Task
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-xs">Pending</p>
            <p className="text-2xl font-bold text-blue-700">{pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-xs">In Progress</p>
            <p className="text-2xl font-bold text-orange-600">{inProgressCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-xs">Done</p>
            <p className="text-2xl font-bold text-green-600">{doneCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-xs">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-3">
          <select
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Tasks</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          {filterStatus && (
            <button onClick={() => setFilterStatus('')} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Clear</button>
          )}
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">{editingId ? 'Edit Task' : 'New Task'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm mb-1">Task Title *</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Follow up with customer" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Related Lead</label>
                <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.lead_id} onChange={(e) => setForm({...form, lead_id: e.target.value})}>
                  <option value="">Select Lead</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Due Date</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.due_date} onChange={(e) => setForm({...form, due_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Priority</label>
                <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Status</label>
                <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm mb-1">Notes</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={loading} className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900">
                {loading ? 'Saving...' : (editingId ? 'Update Task' : 'Save Task')}
              </button>
              <button onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        )}

        {/* Tasks Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-4 py-2 text-sm text-gray-500 border-b">{filteredTasks.length} tasks</div>
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">Koi task nahi — Add Task se add karo!</td></tr>
              ) : (
                filteredTasks.map((task, i) => (
                  <tr key={task.id} className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${isOverdue(task.due_date, task.status) ? 'border-l-4 border-red-500' : ''}`}>
                    <td className="px-4 py-3 font-medium">
                      {task.title}
                      {isOverdue(task.due_date, task.status) && <span className="ml-2 text-red-500 text-xs">⚠️ Overdue</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{getLeadName(task.lead_id)}</td>
                    <td className="px-4 py-3">{task.due_date || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold border-0 ${STATUS_COLORS[task.status]}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(task)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-800 text-xs font-semibold">Delete</button>
                      </div>
                    </td>
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