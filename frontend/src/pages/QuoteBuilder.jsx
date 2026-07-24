import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function QuoteBuilder({ orgId }) {
  const params = new URLSearchParams(window.location.search)
  const editId = params.get('edit')

  const [quoteNumber, setQuoteNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [taxPercent, setTaxPercent] = useState(18)
  const [items, setItems] = useState([{ description: '', qty: 1, price: 0 }])
  const [status, setStatus] = useState('Draft')
  const [saving, setSaving] = useState(false)
  const [quoteId, setQuoteId] = useState(null)

  useEffect(() => {
    if (editId) {
      loadQuote(editId)
    } else {
      setQuoteNumber(generateQuoteNumber())
    }
  }, [editId])

  const generateQuoteNumber = () => {
    const now = new Date()
    return `QT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`
  }

  const loadQuote = async (id) => {
    const { data, error } = await supabase.from('quotes').select('*').eq('id', id).single()
    if (!error && data) {
      setQuoteId(data.id)
      setQuoteNumber(data.quote_number)
      setClientName(data.client_name)
      setClientEmail(data.client_email)
      setValidUntil(data.valid_until || '')
      setItems(data.items || [{ description: '', qty: 1, price: 0 }])
      setStatus(data.status || 'Draft')
      const sub = (data.items || []).reduce((s, i) => s + i.qty * i.price, 0)
      if (sub > 0) setTaxPercent(Math.round((data.tax / sub) * 100))
    }
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = field === 'description' ? value : Number(value)
    setItems(newItems)
  }

  const addItem = () => setItems([...items, { description: '', qty: 1, price: 0 }])

  const removeItem = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.price) || 0), 0)
  const tax = (subtotal * Number(taxPercent || 0)) / 100
  const total = subtotal + tax

  const handleSave = async () => {
    if (!clientName || !clientEmail) {
      alert('Client name aur email zaroori hai')
      return
    }
    setSaving(true)

    const payload = {
      org_id: orgId,
      quote_number: quoteNumber,
      client_name: clientName,
      client_email: clientEmail,
      items,
      subtotal,
      tax,
      total,
      status,
      valid_until: validUntil || null,
    }

    let result
    if (quoteId) {
      result = await supabase.from('quotes').update(payload).eq('id', quoteId)
    } else {
      result = await supabase.from('quotes').insert(payload).select().single()
      if (result.data) setQuoteId(result.data.id)
    }

    setSaving(false)
    if (result.error) {
      alert('Save karne mein error aayi: ' + result.error.message)
    } else {
      alert('Quote saved successfully!')
      window.location.href = '/quotes'
    }
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.setTextColor(13, 27, 42)
    doc.text('NextGen Developer\'s', 14, 20)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text('Digital Solutions for Your Business', 14, 26)

    doc.setFontSize(14)
    doc.setTextColor(13, 27, 42)
    doc.text(`Quote: ${quoteNumber}`, 14, 40)

    doc.setFontSize(10)
    doc.setTextColor(60)
    doc.text(`Client: ${clientName}`, 14, 48)
    doc.text(`Email: ${clientEmail}`, 14, 54)
    if (validUntil) doc.text(`Valid Until: ${validUntil}`, 14, 60)

    autoTable(doc, {
      startY: 68,
      head: [['Description', 'Qty', 'Price', 'Amount']],
      body: items.map((i) => [
        i.description,
        i.qty,
        `Rs.${Number(i.price).toLocaleString('en-IN')}`,
        `Rs.${(i.qty * i.price).toLocaleString('en-IN')}`,
      ]),
      headStyles: { fillColor: [13, 27, 42] },
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Subtotal: Rs.${subtotal.toLocaleString('en-IN')}`, 140, finalY)
    doc.text(`Tax (${taxPercent}%): Rs.${tax.toLocaleString('en-IN')}`, 140, finalY + 6)
    doc.setFontSize(12)
    doc.setTextColor(13, 27, 42)
    doc.text(`Total: Rs.${total.toLocaleString('en-IN')}`, 140, finalY + 14)

    doc.save(`${quoteNumber}.pdf`)
  }

  return (
    <div className="flex">
      <Sidebar active="Quotes" />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">
          {quoteId ? 'Edit Quote' : 'New Quote'}
        </h1>

        <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote Number</label>
              <input
                type="text"
                value={quoteNumber}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Draft</option>
                <option>Sent</option>
                <option>Accepted</option>
                <option>Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Client ka naam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="client@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax %</label>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-blue-900 mb-3">Line Items</h2>
          <div className="space-y-3 mb-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.qty}
                  onChange={(e) => updateItem(index, 'qty', e.target.value)}
                  className="w-20 border rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', e.target.value)}
                  className="w-28 border rounded-lg px-3 py-2"
                />
                <span className="w-24 text-right text-sm text-gray-600">
                  ₹{(item.qty * item.price).toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 px-2"
                  type="button"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            type="button"
            className="text-blue-700 text-sm font-medium hover:underline mb-6"
          >
            + Add Item
          </button>

          <div className="border-t pt-4 space-y-1 text-right mb-6">
            <p className="text-gray-600">Subtotal: ₹{subtotal.toLocaleString('en-IN')}</p>
            <p className="text-gray-600">Tax ({taxPercent}%): ₹{tax.toLocaleString('en-IN')}</p>
            <p className="text-xl font-bold text-blue-900">Total: ₹{total.toLocaleString('en-IN')}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Quote'}
            </button>
            <button
              onClick={handleDownloadPDF}
              type="button"
              className="bg-gray-100 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Download PDF
            </button>
            <a
              href="/quotes"
              className="px-6 py-2 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
