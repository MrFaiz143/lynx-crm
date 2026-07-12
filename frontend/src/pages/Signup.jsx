import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Signup() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    // User details
    email: '',
    password: '',
    confirmPassword: '',
    // Company details
    companyName: '',
    companyPhone: '',
    companyWebsite: '',
    plan: 'Starter'
  })
  const [error, setError] = useState('')

  const handleSignup = async () => {
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords match nahi kar rahe!')
      return
    }

    if (!form.companyName || !form.companyPhone) {
      setError('Company name aur phone zaruri hai!')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // Step 2: Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: form.companyName,
          email: form.email,
          phone: form.companyPhone,
          website: form.companyWebsite,
          plan: form.plan,
          created_at: new Date().toISOString()
        }])
        .select()

      if (orgError) {
        setError(orgError.message)
        setLoading(false)
        return
      }

      // Step 3: Link user to organization
      const { error: orgUserError } = await supabase
        .from('org_users')
        .insert([{
          org_id: orgData[0].id,
          user_id: authData.user.id,
          role: 'admin',
          created_at: new Date().toISOString()
        }])

      if (orgUserError) {
        setError(orgUserError.message)
        setLoading(false)
        return
      }

      // Success!
      alert('Account successfully create ho gaya! ✅ Ab login karo.')
      window.location.href = '/'

    } catch (err) {
      setError('Something went wrong: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-2">Lynx Soft.</h1>
        <p className="text-center text-gray-500 mb-6">Create your CRM account</p>

        {/* Progress Steps */}
        <div className="flex justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-800' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-blue-800 text-white' : 'bg-gray-200'}`}>1</div>
            <span className="text-sm font-medium">Account</span>
          </div>
          <div className="flex items-center text-gray-300">→</div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-800' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-blue-800 text-white' : 'bg-gray-200'}`}>2</div>
            <span className="text-sm font-medium">Company</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Account Details */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-bold text-gray-700 mb-4">Account Details</h3>
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-1">Email *</label>
              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-1">Password *</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 text-sm mb-1">Confirm Password *</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
              />
            </div>
            <button
              onClick={() => {
                if (!form.email || !form.password || !form.confirmPassword) {
                  setError('Sab fields zaruri hain!')
                  return
                }
                if (form.password !== form.confirmPassword) {
                  setError('Passwords match nahi kar rahe!')
                  return
                }
                if (form.password.length < 6) {
                  setError('Password kam se kam 6 characters ka hona chahiye!')
                  return
                }
                setError('')
                setStep(2)
              }}
              className="w-full bg-blue-800 text-white py-2 rounded-lg font-semibold hover:bg-blue-900"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Company Details */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-bold text-gray-700 mb-4">Company Details</h3>
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-1">Company Name *</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your company name"
                value={form.companyName}
                onChange={(e) => setForm({...form, companyName: e.target.value})}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-1">Phone *</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Company phone number"
                value={form.companyPhone}
                onChange={(e) => setForm({...form, companyPhone: e.target.value})}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-1">Website</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="www.yourcompany.com"
                value={form.companyWebsite}
                onChange={(e) => setForm({...form, companyWebsite: e.target.value})}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 text-sm mb-1">Plan</label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.plan}
                onChange={(e) => setForm({...form, plan: e.target.value})}
              >
                <option value="Starter">Starter — Rs. 3,000/month</option>
                <option value="Professional">Professional — Rs. 6,000/month</option>
                <option value="Enterprise">Enterprise — Rs. 12,000/month</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                ← Back
              </button>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="flex-1 bg-blue-800 text-white py-2 rounded-lg font-semibold hover:bg-blue-900"
              >
                {loading ? 'Creating...' : 'Create Account ✅'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Already account hai?{' '}
          <a href="/" className="text-blue-800 font-semibold hover:underline">Login karo</a>
        </p>
      </div>
    </div>
  )
}