'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter }                   from 'next/navigation'
import Link                            from 'next/link'
import { createBrowserSupabase }       from '@/lib/supabase-browser'
import WaxSeal                         from '@/components/WaxSeal'
import type { Capsule }                from '@/types'

// ── Audio player component ─────────────────────────────────────
function AudioPlayer({ transcript }: { transcript: string }) {
  const words     = transcript.split(' ')
  const [playing, setPlaying]   = useState(false)
  const [progress,setProgress]  = useState(0)
  const [activeW, setActiveW]   = useState(0)
  const [showTx,  setShowTx]    = useState(false)
  const timerRef  = useRef<ReturnType<typeof setInterval>>()
  const totalSec  = words.length * 0.36

  function toggle() {
    if (playing) { clearInterval(timerRef.current); setPlaying(false); return }
    setPlaying(true)
    let w = Math.floor((progress / 100) * words.length)
    timerRef.current = setInterval(() => {
      w++; setActiveW(w); setProgress((w / words.length) * 100)
      if (w >= words.length) { clearInterval(timerRef.current); setPlaying(false) }
    }, 360)
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const p = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
    setProgress(p); setActiveW(Math.floor((p / 100) * words.length))
  }
  useEffect(() => () => clearInterval(timerRef.current), [])

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  return (
    <div style={{ background:'linear-gradient(145deg,#2a1e14,#1c140c)', borderRadius:12, padding:'18px 20px', border:'1px solid rgba(212,168,83,0.2)', marginBottom:16 }}>
      <div style={{ display:'flex', gap:2, height:34, alignItems:'center', marginBottom:12, justifyContent:'center', padding:'0 2px' }}>
        {Array.from({length:50},(_,i)=>{
          const h = 4 + Math.abs(Math.sin(i*.65)*12 + Math.sin(i*1.4)*7 + Math.sin(i*2.9)*4)
          const done = (i/50)*100 < progress
          return <div key={i} style={{ width:3, minWidth:3, borderRadius:2, height:Math.max(4,h), background:done?'linear-gradient(180deg,#f0c860,#c4622d)':'rgba(255,255,255,0.1)', animation:playing&&done?`barBounce ${280+(i%7)*40}ms ease-in-out ${i*10}ms infinite`:'none', transformOrigin:'bottom', transition:'background 0.1s' }} />
        })}
      </div>
      <div onClick={seek} style={{ height:3, background:'rgba(255,255,255,0.1)', borderRadius:2, marginBottom:11, cursor:'pointer', position:'relative' }}>
        <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#d4a853,#c4622d)', borderRadius:2 }} />
        <div style={{ position:'absolute', top:'50%', left:`${progress}%`, transform:'translate(-50%,-50%)', width:9, height:9, borderRadius:'50%', background:'#d4a853', boxShadow:'0 0 6px rgba(212,168,83,0.6)' }} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={toggle} style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#d4a853,#b07830)', color:'#1c140c', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer', flexShrink:0, boxShadow:'0 3px 12px rgba(212,168,83,0.4)' }}>
          {playing?'⏸':'▶'}
        </button>
        <span style={{ flex:1, color:'rgba(212,168,83,0.55)', fontFamily:'var(--mono)', fontSize:10 }}>
          {fmt(Math.floor((progress/100)*totalSec))} / {fmt(Math.floor(totalSec))}
        </span>
        <button onClick={()=>setShowTx(s=>!s)} style={{ color:showTx?'#d4a853':'rgba(255,255,255,0.35)', fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.08em', padding:'4px 9px', border:'1px solid', borderColor:showTx?'rgba(212,168,83,0.5)':'rgba(255,255,255,0.15)', borderRadius:3, background:'none', cursor:'pointer', transition:'all 0.2s' }}>
          {showTx?'HIDE':'WORDS'}
        </button>
      </div>
      {showTx && (
        <div style={{ marginTop:13, padding:'12px 14px', background:'rgba(0,0,0,0.25)', borderRadius:7, borderLeft:'2px solid rgba(212,168,83,0.3)', maxHeight:120, overflowY:'auto', animation:'slideUp 0.3s ease' }}>
          <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:13, lineHeight:1.85, margin:0, color:'rgba(255,255,255,0.5)' }}>
            {words.map((w,i)=>(
              <span key={i} style={{ color:i<activeW?'#f0e0c8':'rgba(255,255,255,0.32)', background:i===activeW-1&&playing?'rgba(212,168,83,0.18)':'none', borderRadius:2, padding:'0 1px', transition:'color 0.15s' }}>{w} </span>
            ))}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Journal page ───────────────────────────────────────────────
export default function JournalPage() {
  const router = useRouter()
  const sb     = createBrowserSupabase()

  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [page,     setPage]     = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [flipDir,  setFlipDir]  = useState<'next'|'prev'>('next')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data } = await sb.from('capsules').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      setCapsules((data as Capsule[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  function flip(dir: 'next'|'prev') {
    if (flipping) return
    if (dir==='next' && page>=capsules.length-1) return
    if (dir==='prev' && page<=0) return
    setFlipDir(dir); setFlipping(true)
    setTimeout(() => { setPage(p=>dir==='next'?p+1:p-1); setFlipping(false) }, 420)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0e0a06', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'rgba(212,168,83,0.44)', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.16em', animation:'shimmer 1.5s ease infinite' }}>OPENING…</div>
    </div>
  )

  if (!capsules.length) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1c1008,#0e0a06)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18, padding:'24px' }}>
      <div style={{ fontSize:48 }}>📭</div>
      <p style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:20, color:'rgba(247,242,232,0.55)' }}>Your journal is empty.</p>
      <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:14, color:'rgba(255,255,255,0.28)', marginBottom:8 }}>Write your first letter to the future.</p>
      <Link href="/new-entry" style={{ background:'#c4622d', color:'white', padding:'12px 32px', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none', borderRadius:2, boxShadow:'0 4px 16px rgba(196,98,45,0.35)' }}>Write first entry</Link>
    </div>
  )

  const entry = capsules[page]
  const prev  = capsules[page - 1]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1c1008,#0e0a06)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px', fontFamily:'var(--body)' }}>
      {/* Top bar */}
      <div style={{ width:'100%', maxWidth:840, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <Link href="/dashboard" style={{ color:'rgba(255,255,255,0.35)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em', textDecoration:'none' }}>← back</Link>
        <span style={{ color:'rgba(255,255,255,0.22)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.12em' }}>{page+1} / {capsules.length}</span>
        <Link href="/new-entry" style={{ color:'rgba(212,168,83,0.7)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em', textDecoration:'none' }}>+ new entry</Link>
      </div>

      {/* Book spread */}
      <div style={{ display:'flex', width:'100%', maxWidth:840, filter:'drop-shadow(0 22px 60px rgba(0,0,0,0.75))' }}>
        {/* Left page — faded prev */}
        <div style={{ flex:1, minHeight:500, background:'linear-gradient(to right,#f4edd8,#ede5cc)', borderRadius:'10px 0 0 10px', padding:'38px 28px 28px 36px', position:'relative', overflow:'hidden', boxShadow:'inset -10px 0 22px rgba(0,0,0,0.1)' }}>
          <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`, pointerEvents:'none', zIndex:0 }} />
          {Array.from({length:17},(_,i)=><div key={i} style={{ position:'absolute', left:50, right:12, top:52+i*27, height:1, background:'rgba(120,90,50,0.1)' }} />)}
          <div style={{ position:'absolute', left:42, top:0, bottom:0, width:1, background:'rgba(180,60,60,0.14)' }} />
          <div style={{ position:'relative', zIndex:1, height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center' }}>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontFamily:'var(--mono)', fontSize:11, color:'#8a7060', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:10 }}>
                Written on
              </p>
              <h2 style={{ fontFamily:'var(--serif)', fontSize:34, color:'#4a3f35', margin:0 }}>
                {new Date(entry.created_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
              </h2>
              
              <div style={{ width:40, height:1.5, background:'rgba(196,98,45,0.25)', margin:'32px auto' }} />
              
              <p style={{ fontFamily:'var(--mono)', fontSize:11, color:'#8a7060', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:10 }}>
                To be opened on
              </p>
              <h2 style={{ fontFamily:'var(--serif)', fontSize:34, color:'#1c1410', margin:0 }}>
                {new Date(entry.delivery_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
              </h2>
            </div>
            
            <div style={{ position:'absolute', bottom:0, left:0, width:'100%', textAlign:'center', fontFamily:'var(--mono)', fontSize:9, color:'#b09880' }}>
              PG {page * 2 + 1}
            </div>
          </div>
        </div>

        {/* Gutter */}
        <div style={{ width:13, background:'linear-gradient(90deg,rgba(0,0,0,0.24),rgba(0,0,0,0.04))', flexShrink:0, zIndex:2 }} />

        {/* Right page — current, animated */}
        <div style={{ flex:1, background:'linear-gradient(to left,#f0e8d4,#ede5cc)', borderRadius:'0 10px 10px 0', padding:'38px 36px 28px 28px', position:'relative', overflow:'hidden', transformOrigin:'left center', transformStyle:'preserve-3d', animation:flipping?(flipDir==='next'?'pageFlipR 0.42s ease-in-out':'pageFlipL 0.42s ease-in-out'):'none' }}>
          <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`, pointerEvents:'none', zIndex:0 }} />
          {Array.from({length:17},(_,i)=><div key={i} style={{ position:'absolute', left:12, right:50, top:52+i*27, height:1, background:'rgba(120,90,50,0.1)' }} />)}
          <div style={{ position:'absolute', right:42, top:0, bottom:0, width:1, background:'rgba(180,60,60,0.12)' }} />

          <div style={{ position:'relative', zIndex:1, height:'100%', display:'flex', flexDirection:'column' }}>
            {/* Header / Seal Pill */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {entry.status!=='sealed' && <WaxSeal color={entry.seal_color} symbol={entry.seal_emoji} size={32} />}
                <span style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.1em', padding:'4px 8px', borderRadius:3, background:entry.status==='delivered'?'#e8f4e8':'#f5ede0', color:entry.status==='delivered'?'#2a6a2a':'#8a6030' }}>
                  {entry.status==='delivered'?'✓ DELIVERED':'🔒 SEALED'}
                </span>
              </div>
            </div>

            {/* Prompt */}
            {entry.prompt && entry.status==='delivered' && (
              <div style={{ borderLeft:'2px solid rgba(196,98,45,0.3)', paddingLeft:12, marginBottom:20 }}>
                <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:13, color:'#7a6050', lineHeight:1.65, margin:0 }}>"{entry.prompt}"</p>
              </div>
            )}

            {/* Audio player for delivered audio capsules */}
            {entry.type==='audio' && entry.status==='delivered' && entry.transcript && (
              <AudioPlayer transcript={entry.transcript} />
            )}

            {/* Video player */}
            {entry.type==='video' && entry.status==='delivered' && entry.media_url && (
              <video controls src={entry.media_url} style={{ width:'100%', borderRadius:8, marginBottom:16, maxHeight:200 }} />
            )}

            {/* Content Display */}
            <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
              {entry.status==='sealed' ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' }}>
                  
                  {/* Decorative Sealed Envelope */}
                  <div style={{ position:'relative', width:240, height:150, background:'linear-gradient(135deg,#e8dfc8,#d8cbb0)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 30px rgba(0,0,0,0.12)', border:'1px solid rgba(255,255,255,0.5)' }}>
                     {/* Envelope flap lines */}
                     <div style={{ position:'absolute', inset:0, borderTop:'75px solid rgba(0,0,0,0.06)', borderLeft:'120px solid transparent', borderRight:'120px solid transparent', pointerEvents:'none' }} />
                     
                     <div style={{ position:'relative', zIndex:10 }}>
                       <WaxSeal color={entry.seal_color} symbol={entry.seal_emoji} size={68} />
                     </div>
                  </div>

                  <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:16, color:'#6a5040', textAlign:'center', marginTop:36, lineHeight:1.6 }}>
                    Sealed tight. <br/> No peeking allowed until the date arrives.
                  </p>
                </div>
              ) : (
                <p style={{ fontFamily:'var(--body)', fontSize:15, lineHeight:2.1, color:'#2a1e14', whiteSpace:'pre-line', margin:0, paddingBottom: 16 }}>
                  {entry.content}
                </p>
              )}
            </div>

            {/* Post-delivery reply prompt */}
            {entry.status==='delivered' && (
              <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(196,98,45,0.06)', borderRadius:7, borderTop:'1px solid rgba(196,98,45,0.15)' }}>
                <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:12, color:'#7a6050', margin:'0 0 8px' }}>What does your present self want to say back?</p>
                <Link href="/new-entry" style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.1em', color:'#c4622d', textDecoration:'none', textTransform:'uppercase' }}>Write a reply →</Link>
              </div>
            )}

            <div style={{ textAlign:'right', fontFamily:'var(--mono)', fontSize:9, color:'#b09880', marginTop:12 }}>PG {page*2+2}</div>
          </div>
        </div>
      </div>

      {/* Page navigation */}
      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        {[
          { label:'← prev', dir:'prev' as const, dis:page===0 },
          { label:'next →', dir:'next' as const, dis:page>=capsules.length-1 },
        ].map(({label,dir,dis})=>(
          <button key={dir} onClick={()=>flip(dir)} disabled={dis} style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.1em', padding:'9px 24px', borderRadius:2, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:dis?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.6)', cursor:dis?'not-allowed':'pointer', transition:'all 0.2s' }}>{label}</button>
        ))}
      </div>
    </div>
  )
}
