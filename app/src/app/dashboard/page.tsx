'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter }                   from 'next/navigation'
import Link                            from 'next/link'
import { createBrowserSupabase }       from '@/lib/supabase-browser'
import WaxSeal                         from '@/components/WaxSeal'
import type { Capsule, Profile }       from '@/types'

const LEATHERS: Record<string, { bg: string; spine: string; gold: string }> = {
  oxblood:  { bg:'#5c1a1a', spine:'#3d1010', gold:'#d4a853' },
  midnight: { bg:'#1a2240', spine:'#101628', gold:'#c9b870' },
  sage:     { bg:'#2a3d28', spine:'#1a2818', gold:'#d4c070' },
  cognac:   { bg:'#7a3c1a', spine:'#5a2a10', gold:'#e8c878' },
  pewter:   { bg:'#2e3038', spine:'#1e2028', gold:'#b8c0c8' },
}

function adj(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (n >> 16) + a))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + a))
  const b = Math.min(255, Math.max(0, (n & 255) + a))
  return `rgb(${r},${g},${b})`
}

function BookCover({ coverColor, coverTitle, onClick }: { coverColor: string; coverTitle: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [rot, setRot] = useState({ x: 5, y: -15 })
  const ref = useRef<HTMLDivElement>(null)
  
  const l = LEATHERS[coverColor] || LEATHERS.oxblood

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width/2
    const y = e.clientY - rect.top - rect.height/2
    setRot({
      x: 5 - (y / rect.height) * 15,
      y: -15 + (x / rect.width) * 20
    })
  }

  function handleMouseLeave() {
    setHovered(false)
    setRot({ x: 5, y: -15 })
  }

  return (
    <div style={{ perspective:'2000px', cursor:'pointer', display:'inline-block' }}
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{
        width:360, height:480, /* Massive scale */
        transformStyle:'preserve-3d',
        transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) ${hovered ? 'translateY(-15px) scale(1.02)' : 'translateY(0) scale(1)'}`,
        transition: hovered ? 'transform 0.15s ease-out' : 'transform 1s cubic-bezier(.25,1,.5,1)',
        filter:`drop-shadow(${hovered?30:15}px ${hovered?45:25}px ${hovered?70:45}px rgba(0,0,0,0.8))`,
      }}>
        {/* Spine */}
        <div style={{ position:'absolute', left:-44, top:3, width:44, height:'98.5%', background:`linear-gradient(180deg, ${adj(l.spine,14)}, ${l.spine}, ${adj(l.spine,-10)})`, transformOrigin:'right center', transform:'rotateY(90deg)', borderRadius:'6px 0 0 6px', boxShadow:'inset -6px 0 18px rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ color:l.gold+'88', fontSize:11, fontFamily:'var(--mono)', letterSpacing:'0.25em', transform:'rotate(-90deg)', whiteSpace:'nowrap', userSelect:'none' }}>FUTURE SELF</span>
        </div>

        {/* Cover */}
        <div style={{ width:'100%', height:'100%', borderRadius:'4px 14px 14px 4px', background:`linear-gradient(155deg, ${adj(l.bg,20)} 0%, ${l.bg} 35%, ${adj(l.bg,-8)} 70%, ${adj(l.bg,-18)} 100%)`, border:`1px solid ${adj(l.bg,-30)}`, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          {Array.from({length:15},(_,i)=><div key={i} style={{ position:'absolute', left:0, right:0, top:`${(i/15)*100}%`, height:1, background:'rgba(0,0,0,0.06)' }} />)}
          <div style={{ position:'absolute', inset:14, border:`1.5px solid ${l.gold}44`, borderRadius:7, pointerEvents:'none' }} />
          <div style={{ position:'absolute', inset:20, border:`1px solid ${l.gold}22`, borderRadius:5, pointerEvents:'none' }} />

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18, position:'relative', zIndex:1, transform: `translateZ(20px)` }}>
            <div style={{ width:90, height:90, borderRadius:'50%', border:`2px solid ${l.gold}55`, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.25)', boxShadow:`0 10px 30px rgba(0,0,0,0.4)` }}>
              <span style={{ fontSize:36, userSelect:'none' }}>✉</span>
            </div>
            <div style={{ textAlign:'center', padding:'0 28px' }}>
              <div style={{ color:l.gold, fontFamily:'var(--serif)', fontStyle:'italic', fontSize:26, lineHeight:1.35, textShadow:'0 4px 12px rgba(0,0,0,0.7)' }}>
                {coverTitle}
              </div>
              <div style={{ color:l.gold+'55', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.25em', marginTop:14, textTransform:'uppercase' }}>Future Self</div>
            </div>
          </div>

          <div style={{ position:'absolute', right:-1, top:'4%', width:8, height:'92%', background:`linear-gradient(90deg, ${adj(l.bg,5)}, #f5efe0)`, borderRadius:'0 3px 3px 0' }} />

          <div style={{ position:'absolute', bottom:36, color:l.gold, fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.25em', opacity: hovered ? 0.9 : 0, transform: hovered ? 'translateY(0)' : 'translateY(10px)', transition:'all 0.4s cubic-bezier(.25,1,.5,1)' }}>OPEN →</div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const sb     = createBrowserSupabase()

  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [loading,  setLoading]  = useState(true)
  const [newBadge, setNewBadge] = useState(0) // newly-delivered count

  useEffect(() => {
    async function load() {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.push('/login'); return }

      const [{ data: prof }, { data: caps }] = await Promise.all([
        sb.from('profiles').select('*').eq('id', session.user.id).single(),
        sb.from('capsules').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      ])
      if (prof)  setProfile(prof as Profile)
      if (caps) {
        const arr = caps as Capsule[]
        setCapsules(arr)
        // Badge: delivered but not yet viewed (email_sent=true means cron ran, user might not know)
        const fresh = arr.filter(c => c.status === 'delivered' && c.delivered_at && new Date(c.delivered_at) > new Date(Date.now() - 7 * 86400000))
        setNewBadge(fresh.length)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await sb.auth.signOut(); router.push('/'); router.refresh()
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0e0a06', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'rgba(212,168,83,0.45)', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.16em', animation:'shimmer 1.5s ease infinite' }}>OPENING JOURNAL…</div>
    </div>
  )

  const coverColor = profile?.cover_color || 'oxblood'
  const coverTitle = profile?.cover_title || 'Letters to the Future'
  const sealed     = capsules.filter(c => c.status === 'sealed').length
  const delivered  = capsules.filter(c => c.status === 'delivered').length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ minHeight:'100vh', background:'#070504', position:'relative', overflowX:'hidden', fontFamily:'var(--body)' }}>
      {/* Cinematic ambient background orbs */}
      <div style={{ position:'absolute', top:'-20%', left:'0%', width:'80vw', height:'80vw', background:'radial-gradient(ellipse at center, rgba(139,74,42,0.08) 0%, rgba(0,0,0,0) 60%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', top:'20%', right:'-10%', width:'70vw', height:'70vw', background:'radial-gradient(circle, rgba(212,168,83,0.05) 0%, rgba(0,0,0,0) 65%)', pointerEvents:'none', zIndex:0 }} />

      {/* Nav */}
      <nav style={{ padding:'24px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.03)', background:'rgba(7,5,4,0.7)', backdropFilter:'blur(24px)', position:'sticky', top:0, zIndex:100 }}>
        <span style={{ fontFamily:'var(--serif)', fontStyle:'italic', color:'rgba(212,168,83,0.9)', fontSize:22, letterSpacing:'0.02em' }}>✉ Future Self</span>
        <div style={{ display:'flex', gap:36, alignItems:'center' }}>
          <Link href="/journal" style={{ fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', textDecoration:'none', position:'relative', transition:'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.5)'}>
            Journal
            {newBadge > 0 && <span style={{ position:'absolute', top:-10, right:-16, width:20, height:20, borderRadius:'50%', background:'#c4622d', color:'white', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', boxShadow:'0 0 14px rgba(196,98,45,0.7)' }}>{newBadge}</span>}
          </Link>
          <Link href="/new-entry" style={{ fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(212,168,83,0.95)', textDecoration:'none', transition:'text-shadow 0.2s' }} onMouseOver={e=>e.currentTarget.style.textShadow='0 0 12px rgba(212,168,83,0.5)'} onMouseOut={e=>e.currentTarget.style.textShadow='none'}>+ New Entry</Link>
          <Link href="/settings" style={{ fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', textDecoration:'none', transition:'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}>Cover</Link>
          <button onClick={signOut} style={{ fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', background:'none', border:'none', cursor:'pointer', transition:'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.3)'}>Out</button>
        </div>
      </nav>

      <div style={{ position:'relative', zIndex:10, maxWidth:1200, margin:'0 auto', padding:'100px 48px 160px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        
        {/* Cinematic Hero */}
        <div style={{ display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:'8vw', width:'100%', marginBottom:120, flexWrap:'wrap' }}>
           
           <div style={{ flex:'1 1 400px', maxWidth:500, display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
             <p style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.3em', color:'rgba(212,168,83,0.6)', textTransform:'uppercase', marginBottom:24, animation:'fadeIn 1s ease' }}>{greeting}, {profile?.name?.split(' ')[0] || 'Traveler'}</p>
             <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontWeight:400, fontSize:'clamp(42px,6vw,72px)', color:'rgba(247,242,232,0.95)', marginBottom:16, lineHeight:1.1, textShadow:'0 10px 30px rgba(0,0,0,0.8)', animation:'slideUp 0.8s cubic-bezier(.16,1,.3,1)' }}>
               Time waits <br/><span style={{ color:'rgba(212,168,83,0.9)' }}>for no one.</span>
             </h1>
             <p style={{ fontFamily:'var(--body)', fontSize:18, color:'rgba(255,255,255,0.45)', fontStyle:'italic', marginBottom:48, animation:'slideUp 1s cubic-bezier(.16,1,.3,1)' }}>
               You have {capsules.length} {capsules.length === 1 ? 'memory' : 'memories'} safely preserved within your journal.
             </p>

             {/* Action buttons */}
             <div style={{ display:'flex', gap:24, flexWrap:'wrap', animation:'slideUp 1.2s cubic-bezier(.16,1,.3,1)' }}>
               <Link href="/journal" style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)', padding:'18px 48px', fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.2em', textTransform:'uppercase', textDecoration:'none', borderRadius:40, transition:'all 0.3s cubic-bezier(.25,1,.5,1)' }} onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)'}} onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='rgba(255,255,255,0.9)'; e.currentTarget.style.boxShadow='none'}}>Read Journal</Link>
               <Link href="/new-entry" style={{ background:'linear-gradient(135deg, #d4a853, #b07030)', color:'#1a1005', padding:'18px 48px', fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.2em', textTransform:'uppercase', textDecoration:'none', borderRadius:40, boxShadow:'0 12px 40px rgba(212,168,83,0.3)', transition:'all 0.3s cubic-bezier(.25,1,.5,1)' }} onMouseOver={e=>{e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 16px 50px rgba(212,168,83,0.5)'}} onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(212,168,83,0.3)'}}>+ Draft Entry</Link>
             </div>
           </div>

           <div style={{ flex:'1 1 400px', display:'flex', justifyContent:'center', perspective:'2000px', animation:'fadeIn 1.5s ease' }}>
             <BookCover coverColor={coverColor} coverTitle={coverTitle} onClick={() => router.push('/journal')} />
           </div>
        </div>

        {/* Main Content Layout (Stats + Recent) */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:40, width:'100%', maxWidth:900 }}>
          
          {/* Stats Column */}
          <div style={{ flex:'1 1 300px', display:'flex', flexDirection:'column', gap:16 }}>
            <p style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.2em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', paddingLeft:12, marginBottom:4 }}>Journal Statistics</p>
            {[
              { n:sealed,    label:'Remaining Sealed',    icon:'🔒' },
              { n:delivered, label:'Successfully Delivered', icon:'📬' },
              { n:capsules.length, label:'Total Entries', icon:'✉' },
            ].map(({ n, label, icon }) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.02)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:20, padding:'28px', display:'flex', alignItems:'center', gap:24, transition:'transform 0.4s cubic-bezier(.25,1,.5,1), background 0.4s' }} onMouseOver={e=>{e.currentTarget.style.transform='translateX(6px)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'}} onMouseOut={e=>{e.currentTarget.style.transform='translateX(0)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'}}>
                <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg, rgba(212,168,83,0.1), rgba(212,168,83,0.02))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, border:'1px solid rgba(212,168,83,0.2)', boxShadow:'0 8px 20px rgba(0,0,0,0.2)' }}>{icon}</div>
                <div>
                  <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:38, color:'rgba(212,168,83,0.95)', lineHeight:1.1, marginBottom:6 }}>{n}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.15em', color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Entries Column */}
          <div style={{ flex:'2 1 440px', display:'flex', flexDirection:'column', gap:16 }}>
            <p style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.2em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', paddingLeft:12, marginBottom:4 }}>Recent Entries</p>
            {capsules.length === 0 ? (
               <div style={{ background:'rgba(255,255,255,0.015)', backdropFilter:'blur(24px)', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:20, padding:'80px 40px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                 <p style={{ fontFamily:'var(--body)', fontSize:18, fontStyle:'italic', color:'rgba(255,255,255,0.4)' }}>Your journal awaits its first memory.</p>
               </div>
            ) : (
              capsules.slice(0, 8).map((c, i) => (
                <Link key={c.id} href="/journal" style={{
                  background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.04)', backdropFilter:'blur(24px)',
                  borderRadius:20, padding:'24px 30px',
                  display:'flex', alignItems:'center', gap:24, textDecoration:'none',
                  animation:`slideUp 0.6s cubic-bezier(.16,1,.3,1) ${i * 0.12}s both`,
                  transition:'all 0.4s cubic-bezier(.25,1,.5,1)',
                  boxShadow:'0 8px 30px rgba(0,0,0,0.2)'
                }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'; e.currentTarget.style.borderColor = 'rgba(212,168,83,0.4)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)' }}
                  onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)' }}
                >
                  <WaxSeal color={c.seal_color} symbol={c.seal_emoji} size={50} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:18, color:'rgba(247,242,232,0.9)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:8 }}>
                      {c.prompt || 'Personal reflection'}
                    </p>
                    <p style={{ fontFamily:'var(--mono)', fontSize:11, color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em' }}>
                      <span style={{ color: 'rgba(212,168,83,0.9)' }}>{c.type.toUpperCase()}</span> &nbsp;·&nbsp; {c.status === 'delivered'
                        ? `✓ Delivered ${new Date(c.delivered_at!).toLocaleDateString('en-US',{month:'long',year:'numeric'})}`
                        : `🔒 Opens ${new Date(c.delivery_at).toLocaleDateString('en-US',{month:'long',year:'numeric'})}`}
                    </p>
                  </div>
                  <span style={{ color:'rgba(255,255,255,0.15)', fontSize:28, transition:'color 0.4s' }}>›</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
