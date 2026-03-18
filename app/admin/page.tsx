import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/app/components/AdminDashboard'
import { loginAdmin, getAdminMatchData } from '@/app/actions/admin'

export const revalidate = 0

export default async function AdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  
  const isAuthenticated = token === 'authenticated'

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <form 
          className="glass-panel" 
          style={{ padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}
          action={async (formData) => {
            'use server'
            const password = formData.get('password') as string
            const res = await loginAdmin(password)
            if (res.success) redirect('/admin')
            // To handle errors cleanly in a server component without client JS, we'd normally use action state
            // For MVP simplicity, this will just fail silently if wrong.
          }}
        >
          <h2 className="text-gradient">Admin Access</h2>
          <p className="text-muted" style={{ marginBottom: 24, marginTop: 8 }}>
            Enter the tournament password to manage polls and advance winners.
          </p>
          
          <input 
            type="password" 
            name="password"
            placeholder="Password" 
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'white',
              marginBottom: '24px',
              fontFamily: 'inherit'
            }}
          />
          
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
        </form>
      </div>
    )
  }

  // If authenticated, fetch the latest data securely from the backend
  try {
    const { matches, voteAggregates, globalSettings } = await getAdminMatchData()
    return <AdminDashboard matches={matches} voteAggregates={voteAggregates} globalSettings={globalSettings} />
  } catch (e) {
    // If the token is invalid or another error occurs during fetch, redirect out
    redirect('/')
  }
}
