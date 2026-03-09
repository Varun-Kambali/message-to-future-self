'use client'
import { useState, Suspense }            from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link                    from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase-browser'

const paperLines = Array.from({ length: 18 }, (_, i) => i)

function LoginForm() {
  const router   = useRouter()
  const params   = useSearchParams()
  const redirect = params.get('redirect') || '/dashboard'
  const sb       = createBrowserSupabase()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(redirect); router.refresh()
  }

  async function handleGoogle() {
    setLoading(true)
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?redirect=${redirect}` },
    })
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', background:'rgba(255,255,255,0.55)',
    border:'1px solid rgba(0,0,0,0.13)', borderRadius:5,
    padding:'11px 14px', fontFamily:'var(--body)', fontSize:16,
    color:'#1c1410', outline:'none',
  }

  return (
    <main style={{
      minHeight:'100vh', background:'linear-gradient(160deg,#1c1008,#0e0a06)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'24px', fontFamily:'var(--body)',
    }}>
      <div style={{
        width:'100%', maxWidth:420,
        background:'#faf6ee', borderRadius:12,
        padding:'48px 44px',
        boxShadow:'0 28px 80px rgba(0,0,0,0.6)',
        position:'relative', overflow:'hidden',
        animation:'slideUp 0.5s ease',
      }}>
        {/* ruled lines */}
        {paperLines.map(i => (
          <div key={i} style={{ position:'absolute', left:60, right:22, top:70+i*30, height:1, background:'rgba(120,90,50,0.09)', pointerEvents:'none' }} />
        ))}
        <div style={{ position:'absolute', left:52, top:0, bottom:0, width:1, background:'rgba(180,60,60,0.12)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✉</div>
            <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontWeight:400, fontSize:26, color:'#1c1410', marginBottom:5 }}>Welcome back</h1>
            <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:14, color:'#8a7060' }}>Your journal is waiting</p>
          </div>

          {error && (
            <div style={{ background:'#fff0f0', border:'1px solid #f5c6c6', borderRadius:6, padding:'11px 14px', marginBottom:20, fontFamily:'var(--body)', fontSize:14, color:'#8b2020' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label:'Email',    value:email,    setter:setEmail,    type:'email',    ph:'you@example.com' },
              { label:'Password', value:password, setter:setPassword, type:'password', ph:'••••••••' },
            ].map(({ label, value, setter, type, ph }) => (
              <div key={label} style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'#8a7060', marginBottom:8 }}>{label}</label>
                <input type={type} value={value} placeholder={ph} required autoComplete={type === 'email' ? 'email' : 'current-password'}
                  onChange={e => setter(e.target.value)} style={inputStyle} />
              </div>
            ))}

            <button type="submit" disabled={loading} style={{
              width:'100%', background:'#8b4a2a', color:'rgba(255,220,150,0.95)',
              border:'none', padding:'13px', fontFamily:'var(--mono)',
              fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase',
              borderRadius:2, cursor:loading?'not-allowed':'pointer',
              opacity:loading?0.7:1, marginBottom:14,
              boxShadow:'0 4px 18px rgba(139,74,42,0.35)',
            }}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>

          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.1)' }} />
            <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#9a8878', letterSpacing:'0.1em' }}>or</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.1)' }} />
          </div>

          <button onClick={handleGoogle} disabled={loading} style={{
            width:'100%', background:'white', color:'#1c1410',
            border:'1px solid rgba(0,0,0,0.14)', padding:'11px',
            fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.08em',
            textTransform:'uppercase', borderRadius:2, cursor:'pointer', marginBottom:24,
          }}>Continue with Google</button>

          <p style={{ textAlign:'center', fontFamily:'var(--body)', fontSize:14, color:'#8a7060', fontStyle:'italic' }}>
            No account?{' '}
            <Link href="/signup" style={{ color:'#8b4a2a', textDecoration:'none' }}>Create one →</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1c1008,#0e0a06)' }} />}>
      <LoginForm />
    </Suspense>
  )
}
