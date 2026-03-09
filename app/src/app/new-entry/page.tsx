'use client'
import { useState, useRef, useEffect }  from 'react'
import { useRouter }                    from 'next/navigation'
import Link                             from 'next/link'
import { createBrowserSupabase }        from '@/lib/supabase-browser'
import WaxSeal                          from '@/components/WaxSeal'
import type { CapsuleType }             from '@/types'

const PROMPTS = [
  { icon:'🌱', text:'What small thing are you quietly proud of right now?' },
  { icon:'🌙', text:'What has kept you up at night lately?' },
  { icon:'📮', text:'If you could send one sentence back five years, what would it be?' },
  { icon:'☕', text:'Describe your morning routine. Is it nourishing you?' },
  { icon:'🗺', text:'Where did you think you\'d be by now? Where are you actually?' },
  { icon:'💛', text:'Name three people who made this season warmer. Have you told them?' },
  { icon:'🌊', text:'What are you afraid to want, because you\'re afraid you won\'t get it?' },
  { icon:'🪴', text:'What habit have you been meaning to start — or break — for too long?' },
]

const SEAL_COLORS = [
  { hex:'#a02020', name:'Scarlet'  },
  { hex:'#1e2a4a', name:'Midnight' },
  { hex:'#1a4a30', name:'Emerald'  },
  { hex:'#4a1a4a', name:'Plum'     },
  { hex:'#8b4a1a', name:'Tawny'    },
  { hex:'#2a3040', name:'Slate'    },
  { hex:'#7a3010', name:'Sienna'   },
  { hex:'#243824', name:'Forest'   },
]
const SEAL_SYMBOLS = ['✦','◆','✿','♡','☽','✧','⊕','⌘','∞','◉','✜','⚘']

function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<{ id: number; x: number; delay: number; dur: number; color: string; shape: string; size: number }[]>([])
  useEffect(() => {
    if (!active) return
    const palette = ['#c4622d','#d4a853','#8b1a1a','#1a3a6b','#2a3d28','#f0c860']
    const shapes  = ['●','◆','▲','✦','▪']
    setPieces(Array.from({ length: 40 }, (_, id) => ({
      id, x: 20 + Math.random() * 60,
      delay: Math.random() * .8, dur: 2.2 + Math.random() * 1,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size:  7 + Math.random() * 8,
    })))
    const t = setTimeout(() => setPieces([]), 3600)
    return () => clearTimeout(t)
  }, [active])
  if (!pieces.length) return null
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{ position:'absolute', left:`${p.x}%`, top:-20, color:p.color, fontSize:p.size, animation:`confettiFall ${p.dur}s ease-in ${p.delay}s forwards` }}>
          {p.shape}
        </div>
      ))}
    </div>
  )
}

export default function NewEntryPage() {
  const router = useRouter()
  const sb     = createBrowserSupabase()

  const [step,       setStep]      = useState(1)
  const [type,       setType]      = useState<CapsuleType>('text')
  const [prompt,     setPrompt]    = useState<{ icon: string; text: string } | null>(null)
  const [text,       setText]      = useState('')
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [sealColor,  setSealColor] = useState('#a02020')
  const [sealSymbol, setSealSymbol]= useState('✦')
  const [sealImgData,setSealImgData]=useState<string|null>(null)
  const [pouring,    setPouring]   = useState(false)
  const [poured,     setPoured]    = useState(false)
  const [sealed,     setSealed]    = useState(false)
  const [saving,     setSaving]    = useState(false)
  const [confetti,   setConfetti]  = useState(false)
  const [error,      setError]     = useState<string|null>(null)

  // Media recording
  const mediaRef    = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])
  const [recording,  setRecording]  = useState(false)
  const [mediaBlob,  setMediaBlob]  = useState<Blob | null>(null)
  const [mediaFile,  setMediaFile]  = useState<File | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia(type === 'audio' ? { audio:true } : { audio:true, video:true })
    
    if (type === 'audio') {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const draw = () => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')!
        animRef.current = requestAnimationFrame(draw)

        analyser.getByteFrequencyData(dataArray)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        const barWidth = (canvas.width / bufferLength) * 2.5
        let x = 0
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2
          const intensity = barHeight + 100
          ctx.fillStyle = `rgb(${intensity}, 100, 80)`
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
          x += barWidth + 1
        }
      }
      // Start drawing slightly after canvas mounts
      setTimeout(draw, 50)
    }

    const rec = new MediaRecorder(stream)
    chunksRef.current = []
    rec.ondataavailable = e => chunksRef.current.push(e.data)
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: type === 'audio' ? 'audio/webm' : 'video/webm' })
      setMediaBlob(blob)
      stream.getTracks().forEach(t => t.stop())
    }
    rec.start()
    mediaRef.current = rec
    setRecording(true)
  }

  function stopRecording() {
    mediaRef.current?.stop()
    setRecording(false)
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setMediaFile(f)
  }

  function handleSealImg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => { setSealImgData(ev.target?.result as string); setPoured(false) }
    r.readAsDataURL(f)
  }

  function pourWax() {
    if (pouring) return
    setPouring(true)
    setTimeout(() => { setPouring(false); setPoured(true) }, 950)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const { data: { session } } = await sb.auth.getSession()
    if (!session) { router.push('/login'); return }

    const deliveryAt = new Date(deliveryDate).toISOString()

    // 1. Upload media if present
    let mediaPath: string | null = null
    const blob = mediaBlob || mediaFile
    if (blob) {
      const ext  = type === 'audio' ? 'webm' : type === 'video' ? 'webm' : 'bin'
      const path = `${session.user.id}/${Date.now()}.${ext}`
      const { error: ue } = await sb.storage.from('capsule-media').upload(path, blob, { upsert:true })
      if (!ue) mediaPath = path
    }

    // 2. Upload seal art if present
    let sealPath: string | null = null
    if (sealImgData) {
      const resp  = await fetch(sealImgData)
      const blob2 = await resp.blob()
      const ext   = blob2.type.includes('png') ? 'png' : 'jpg'
      const path  = `${session.user.id}/${Date.now()}-seal.${ext}`
      const { error: se } = await sb.storage.from('seal-art').upload(path, blob2, { upsert:true })
      if (!se) sealPath = path
    }

    // 3. Create capsule row
    const { error: ce } = await sb.from('capsules').insert({
      user_id:    session.user.id,
      type,
      content:    text || null,
      media_path: mediaPath,
      prompt:     prompt?.text || null,
      delivery_at: deliveryAt,
      seal_color:  sealColor,
      seal_emoji:  sealSymbol,
      seal_image:  sealPath,
      status:      'sealed',
    })

    if (ce) { setError(ce.message); setSaving(false); return }

    setConfetti(true)
    setTimeout(() => { setConfetti(false); router.push('/dashboard') }, 2800)
  }

  const paper: React.CSSProperties = {
    background:'#faf6ee', borderRadius:12,
    padding:'44px 48px',
    boxShadow:'0 24px 80px rgba(0,0,0,0.22)',
    position:'relative', overflow:'hidden',
    width:'100%', maxWidth:640,
    animation:'slideUp 0.4s ease',
  }

  const label: React.CSSProperties = { display:'block', fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'#8a7060', marginBottom:9 }

  return (
    <main style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1c1008,#0e0a06)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'var(--body)' }}>
      <Confetti active={confetti} />

      <div style={{ width:'100%', maxWidth:640, marginBottom:14 }}>
        <Link href="/dashboard" style={{ color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em', textDecoration:'none' }}>← dashboard</Link>
      </div>

      <div style={paper}>
        {/* Ruled paper lines */}
        {Array.from({length:22},(_,i)=>(
          <div key={i} style={{ position:'absolute', left:64, right:24, top:72+i*30, height:1, background:'rgba(120,90,50,0.08)', pointerEvents:'none' }} />
        ))}
        <div style={{ position:'absolute', left:56, top:0, bottom:0, width:1, background:'rgba(180,60,60,0.1)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          {/* Step progress */}
          <div style={{ display:'flex', gap:5, marginBottom:30 }}>
            {[1,2,3].map(s=>(
              <div key={s} style={{ flex:1, height:2, borderRadius:1, background:s<=step?'#c4622d':'rgba(0,0,0,0.1)', transition:'background 0.4s' }} />
            ))}
          </div>

          {error && <div style={{ background:'#fff0f0', border:'1px solid #f5c6c6', borderRadius:6, padding:'10px 14px', marginBottom:18, fontFamily:'var(--body)', fontSize:14, color:'#8b2020' }}>{error}</div>}

          {/* ── Step 1: Type + Prompt ── */}
          {step === 1 && (
            <div style={{ animation:'slideUp 0.35s ease' }}>
              <h2 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:27, color:'#1c1410', marginBottom:6 }}>What will you leave behind?</h2>
              <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:15, color:'#8a7060', marginBottom:28, lineHeight:1.6 }}>Choose how your future self will experience this moment.</p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:28 }}>
                {([['text','✍','Written letter','Words age like wine'],['audio','🎙','Voice note','Your actual voice'],['video','📹','Video','Your face, preserved']] as const).map(([id,icon,lbl,sub])=>(
                  <button key={id} onClick={()=>setType(id)} style={{ background:type===id?'var(--rust-dim)':'rgba(255,255,255,0.5)', border:`2px solid ${type===id?'#c4622d':'rgba(0,0,0,0.1)'}`, borderRadius:10, padding:'18px 12px', textAlign:'center', cursor:'pointer', transition:'all 0.2s' }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'#1c1410', marginBottom:4, letterSpacing:'0.04em' }}>{lbl}</div>
                    <div style={{ fontFamily:'var(--body)', fontSize:12, color:'#8a7060', fontStyle:'italic' }}>{sub}</div>
                  </button>
                ))}
              </div>

              <p style={label}>A prompt to spark your writing</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {PROMPTS.map(p=>(
                  <button key={p.text} onClick={()=>setPrompt(p)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:20, background:prompt?.text===p.text?'var(--rust-dim)':'rgba(0,0,0,0.04)', border:`1.5px solid ${prompt?.text===p.text?'#c4622d':'rgba(0,0,0,0.1)'}`, fontFamily:'var(--body)', fontSize:13, color:prompt?.text===p.text?'#c4622d':'#5a4030', fontStyle:'italic', cursor:'pointer', transition:'all 0.2s' }}>
                    <span>{p.icon}</span> <span>{p.text.length>40?p.text.slice(0,38)+'…':p.text}</span>
                  </button>
                ))}
              </div>

              <div style={{ marginTop:28, display:'flex', justifyContent:'flex-end', gap:10 }}>
                <button onClick={()=>setStep(2)} style={{ background:'#c4622d', color:'white', padding:'12px 28px', fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.1em', borderRadius:2, border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(196,98,45,0.35)' }}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Write / Record ── */}
          {step === 2 && (
            <div style={{ animation:'slideUp 0.35s ease' }}>
              <h2 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:27, color:'#1c1410', marginBottom:6 }}>
                {type==='text'?'Write your letter':type==='audio'?'Record your voice':'Record a video'}
              </h2>

              {prompt && (
                <div style={{ borderLeft:'2px solid rgba(196,98,45,0.35)', paddingLeft:12, marginBottom:20 }}>
                  <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:14, color:'#7a6050', lineHeight:1.65 }}>{prompt.icon} {prompt.text}</p>
                </div>
              )}

              {type === 'text' ? (
                <textarea value={text} onChange={e=>setText(e.target.value)}
                  placeholder={'Dear future me,\n\nI\'m writing this because…'}
                  autoFocus
                  style={{ width:'100%', height:200, border:'none', outline:'none', background:'transparent', resize:'none', fontFamily:'var(--body)', fontSize:16, lineHeight:2, color:'#1c1410', fontStyle:'italic' }} />
              ) : (
                <div>
                  <div style={{ background:'rgba(0,0,0,0.04)', border:'2px dashed rgba(196,98,45,0.25)', borderRadius:10, padding:'28px 20px', textAlign:'center', marginBottom:16 }}>
                    <div style={{ fontSize:38, marginBottom:10 }}>{type==='audio'?'🎙':'📹'}</div>
                    {!mediaBlob && !mediaFile ? (
                      <div>
                        {recording && type === 'audio' && (
                          <canvas ref={canvasRef} width="240" height="60" style={{ display:'block', margin:'0 auto 16px', borderRadius: 4, background:'rgba(0,0,0,0.02)' }} />
                        )}
                        <button onClick={recording?stopRecording:startRecording} style={{ background:recording?'#c4622d':'rgba(196,98,45,0.1)', border:`1.5px solid ${recording?'#c4622d':'rgba(196,98,45,0.35)'}`, color:recording?'white':'#c4622d', padding:'10px 24px', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.1em', borderRadius:2, cursor:'pointer', marginBottom:10 }}>
                          {recording?'⏹ Stop recording':'⏺ Start recording'}
                        </button>
                        <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:12, color:'#9a8878', margin:'8px 0' }}>or</p>
                        <label style={{ fontFamily:'var(--mono)', fontSize:10, color:'#8a7060', letterSpacing:'0.08em', cursor:'pointer', border:'1px solid rgba(0,0,0,0.15)', padding:'8px 16px', borderRadius:2 }}>
                          Upload file
                          <input type="file" accept={type==='audio'?'audio/*':'video/*'} style={{ display:'none' }} onChange={handleFileUpload} />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:14, color:'#4a7a4a', marginBottom:8 }}>✓ {mediaBlob?'Recording saved':mediaFile?.name}</p>
                        <button onClick={()=>{setMediaBlob(null);setMediaFile(null)}} style={{ fontFamily:'var(--mono)', fontSize:10, color:'#9a8878', letterSpacing:'0.06em', background:'none', border:'none', cursor:'pointer' }}>✕ redo</button>
                      </div>
                    )}
                  </div>
                  <textarea value={text} onChange={e=>setText(e.target.value)}
                    placeholder="Add a written note to accompany your recording…"
                    style={{ width:'100%', height:90, background:'rgba(255,255,255,0.55)', border:'1px solid rgba(0,0,0,0.12)', borderRadius:6, padding:'11px 13px', fontFamily:'var(--body)', fontSize:14, fontStyle:'italic', color:'#1c1410', outline:'none', resize:'none', lineHeight:1.7 }} />
                </div>
              )}

              {/* Delivery date */}
              <div style={{ marginTop:22, marginBottom:24 }}>
                <p style={label}>
                  Deliver on —{' '}
                  {new Date(deliveryDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
                </p>
                <input 
                  type="date" 
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} 
                  max={new Date(Date.now() + 10 * 365.25 * 86400000).toISOString().split('T')[0]}
                  value={deliveryDate} 
                  onChange={e => setDeliveryDate(e.target.value)}
                  style={{ width:'100%', padding:'10px', fontFamily:'var(--body)', fontSize:16, border:'1px solid rgba(0,0,0,0.1)', borderRadius:6, accentColor:'#c4622d' }} 
                />
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <button onClick={()=>setStep(1)} style={{ fontFamily:'var(--mono)', fontSize:10, color:'#9a8878', letterSpacing:'0.08em', background:'none', border:'none', cursor:'pointer' }}>← back</button>
                <button onClick={()=>setStep(3)} disabled={!text.trim()&&!mediaBlob&&!mediaFile} style={{ background:(!text.trim()&&!mediaBlob&&!mediaFile)?'rgba(0,0,0,0.1)':'#c4622d', color:(!text.trim()&&!mediaBlob&&!mediaFile)?'#b09880':'white', padding:'12px 28px', fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.1em', borderRadius:2, border:'none', cursor:(!text.trim()&&!mediaBlob&&!mediaFile)?'not-allowed':'pointer', transition:'all 0.25s', boxShadow:(!text.trim()&&!mediaBlob&&!mediaFile)?'none':'0 4px 16px rgba(196,98,45,0.35)' }}>
                  Choose seal →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Wax seal ── */}
          {step === 3 && !sealed && (
            <div style={{ animation:'slideUp 0.35s ease' }}>
              <h2 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:27, color:'#1c1410', marginBottom:6 }}>Craft your wax seal</h2>
              <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:15, color:'#8a7060', marginBottom:30, lineHeight:1.6 }}>Choose your wax, pick a symbol — or etch your own art into it.</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
                <div>
                  <p style={label}>Wax colour</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
                    {SEAL_COLORS.map(c=>(
                      <button key={c.hex} title={c.name} onClick={()=>{setSealColor(c.hex);setPoured(false)}} style={{ width:32, height:32, borderRadius:'50%', background:`radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), ${c.hex})`, border:sealColor===c.hex?'3px solid #d4a853':'2px solid transparent', boxShadow:sealColor===c.hex?'0 0 0 1px #d4a853, 0 3px 10px rgba(0,0,0,0.3)':'0 2px 8px rgba(0,0,0,0.25)', transform:sealColor===c.hex?'scale(1.12)':'scale(1)', cursor:'pointer', transition:'all 0.15s', outline:'none' }} />
                    ))}
                  </div>

                  <p style={label}>Symbol</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:24 }}>
                    {SEAL_SYMBOLS.map(s=>(
                      <button key={s} onClick={()=>{setSealSymbol(s);setSealImgData(null);setPoured(false)}} style={{ width:38, height:38, borderRadius:6, fontSize:17, background:sealSymbol===s&&!sealImgData?'var(--rust-dim)':'rgba(0,0,0,0.04)', border:`1.5px solid ${sealSymbol===s&&!sealImgData?'#c4622d':'rgba(0,0,0,0.1)'}`, cursor:'pointer', transition:'all 0.15s' }}>{s}</button>
                    ))}
                  </div>

                  <p style={label}>Or etch your own image</p>
                  <label style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:sealImgData?'rgba(212,168,83,0.08)':'rgba(0,0,0,0.03)', border:`2px dashed ${sealImgData?'#d4a853':'rgba(0,0,0,0.12)'}`, borderRadius:8, cursor:'pointer', transition:'all 0.2s' }}>
                    <span style={{ fontSize:18 }}>{sealImgData?'✓':'🖼'}</span>
                    <span style={{ fontFamily:'var(--body)', fontSize:13, color:'#3a2e24', fontStyle:'italic' }}>{sealImgData?'Art uploaded':'Upload a photo or drawing'}</span>
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleSealImg} />
                  </label>
                </div>

                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <p style={{ ...label, marginBottom:16, textAlign:'center' }}>Preview</p>
                  <div style={{ position:'relative', marginBottom:22 }}>
                    {pouring && (
                      <>
                        <div style={{ position:'absolute', top:-56, left:'50%', transform:'translateX(-50%)', width:10, borderRadius:4, background:`linear-gradient(180deg, rgba(255,255,255,0.4), ${sealColor})`, animation:'waxDrip 0.95s ease forwards', transformOrigin:'top', zIndex:5 }} />
                        <div style={{ position:'absolute', top:'50%', left:'50%', width:80, height:80, borderRadius:'50%', background:sealColor, transform:'translate(-50%, -50%)', animation:'waxPuddle 0.95s ease forwards', zIndex: 4, filter:'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} />
                      </>
                    )}
                    <div style={{ animation:poured?'sealLand 0.65s cubic-bezier(.34,1.4,.64,1) forwards':(pouring?'none':undefined), position:'relative', zIndex:10, opacity: pouring && !poured ? 0 : 1 }}>
                      <WaxSeal color={sealColor} symbol={sealSymbol} imgData={sealImgData} size={120} />
                    </div>
                  </div>

                  {!poured ? (
                    <div style={{ textAlign:'center' }}>
                      <button onClick={pourWax} disabled={pouring} style={{ background:`linear-gradient(135deg, ${sealColor}, ${sealColor}bb)`, color:'rgba(255,220,120,0.95)', padding:'11px 26px', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.1em', borderRadius:4, border:'none', cursor:'pointer', opacity:pouring?0.7:1, boxShadow:`0 5px 20px ${sealColor}55` }}>
                        {pouring?'Pouring…':'🕯 Pour wax'}
                      </button>
                      <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:12, color:'#9a8878', marginTop:7 }}>Watch it set</p>
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', animation:'slideUp 0.4s ease' }}>
                      <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:14, color:'#4a7a4a', marginBottom:14 }}>✓ The seal is set</p>
                      <button onClick={()=>setSealed(true)} style={{ background:'linear-gradient(135deg,#d4a853,#b07830)', color:'#1c140c', padding:'12px 26px', fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.1em', borderRadius:2, border:'none', cursor:'pointer', boxShadow:'0 5px 20px rgba(212,168,83,0.4)' }}>
                        Seal this capsule →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={()=>setStep(2)} style={{ marginTop:24, fontFamily:'var(--mono)', fontSize:10, color:'#9a8878', letterSpacing:'0.08em', background:'none', border:'none', cursor:'pointer' }}>← back</button>
            </div>
          )}

          {/* ── Sealed confirmation ── */}
          {sealed && (
            <div style={{ textAlign:'center', padding:'20px 0', animation:'slideUp 0.5s ease' }}>
              <WaxSeal color={sealColor} symbol={sealSymbol} imgData={sealImgData} size={96} animate={true} />
              <h2 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:28, color:'#1c1410', marginTop:24, marginBottom:10 }}>Your capsule is sealed.</h2>
              <p style={{ fontFamily:'var(--body)', fontStyle:'italic', fontSize:15, color:'#7a6050', lineHeight:1.85, maxWidth:360, margin:'0 auto 28px' }}>
                It&apos;s resting quietly now, waiting. Your future self will find it on{' '}
                <strong>{new Date(deliveryDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</strong>.
              </p>
              <button onClick={handleSave} disabled={saving} style={{ background:'linear-gradient(135deg,#d4a853,#b07830)', color:'#1c140c', padding:'14px 36px', fontFamily:'var(--mono)', fontSize:13, letterSpacing:'0.1em', borderRadius:2, border:'none', cursor:saving?'not-allowed':'pointer', boxShadow:'0 6px 24px rgba(212,168,83,0.4)', opacity:saving?0.75:1 }}>
                {saving?'Dropping in the mailbox…':'Drop in the mailbox →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
