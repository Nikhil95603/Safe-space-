import React, { useEffect, useState, useRef } from "react";

/*
  Full React single-file conversion of your original HTML app.
  Drop this into a Create React App / Vite / Next.js page as `App.jsx`.
  - Uses Chart.js via CDN (injected) to render mood graph
  - Saves data (moods, grounding log, PDFs, videos, counselor messages) to localStorage
  - Mirrors original HTML structure and features
*/

const styles = `
:root{--brand:#0b5ed7;--bg:#f3f8ff;--text:#0f172a;--card:#ffffff;--muted:#6b7280;--success:#16a34a;--danger:#ef4444}
body.dark{--bg:#071122;--text:#ffffff;--card:#0b1220;--muted:#9aa6bf;--brand:#4aa6ff}
*{box-sizing:border-box}body{margin:0;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;background:linear-gradient(135deg,var(--bg),#eefbf6);color:var(--text);-webkit-font-smoothing:antialiased}
header{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;background:var(--card);position:sticky;top:0;z-index:30;border-bottom:1px solid rgba(0,0,0,0.05)}.brand{display:flex;align-items:center;gap:12px}.logo{width:44px;height:44px;border-radius:10px;background:linear-gradient(180deg,var(--brand),#0077cc);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;box-shadow:0 8px 20px rgba(11,94,215,0.08)}nav a{margin-left:14px;text-decoration:none;color:var(--brand);font-weight:600}.container{max-width:1100px;margin:24px auto;padding:0 18px}.hero{display:grid;grid-template-columns:1fr 340px;gap:18px;align-items:center;padding:28px;border-radius:12px;background:linear-gradient(90deg,rgba(11,94,215,0.06),rgba(6,195,139,0.03));box-shadow:0 10px 28px rgba(11,94,215,0.06)}.hero h1{margin:0;font-size:26px;color:var(--brand)}.hero p{margin:8px 0 14px;color:var(--muted)}section{margin-top:18px;background:var(--card);padding:18px;border-radius:12px;box-shadow:0 8px 24px rgba(2,6,23,0.03)}h2{margin:0 0 12px;color:var(--brand)}.muted{color:var(--muted)}select,input[type=text],input[type=number],textarea,input[type=file]{width:100%;padding:8px;border:1px solid #e6edf7;border-radius:8px;margin-top:6px;background:transparent;color:var(--text)}button{padding:8px 12px;border-radius:8px;border:none;background:var(--brand);color:white;cursor:pointer;margin:6px 4px 0 0}button.ghost{background:transparent;color:var(--brand);border:1px solid rgba(11,94,215,0.08)}button.stop{background:var(--danger)}.grid-2{display:grid;grid-template-columns:1fr 380px;gap:18px}@media(max-width:920px){.hero{grid-template-columns:1fr}.grid-2{grid-template-columns:1fr}.logo{width:40px;height:40px}}.mood-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}.mood-btn{font-size:18px;padding:8px 12px;border-radius:8px;background:#f0f7ff;border:1px solid rgba(11,94,215,0.08);cursor:pointer}canvas{display:block;max-width:100%;margin-top:12px}#breathing-circle{width:160px;height:160px;border-radius:999px;margin:12px auto;background:linear-gradient(180deg,#80c0ff,#4aa6ff);display:flex;align-items:center;justify-content:center;box-shadow:0 14px 40px rgba(0,96,200,0.12);color:white;font-weight:700;text-align:center;padding:10px;font-size:16px}#breath-count{text-align:center;margin-top:8px;font-weight:600;color:var(--brand)}.center{display:flex;align-items:center;justify-content:center}.tools-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:12px}.tool-card{padding:18px;border-radius:12px;background:linear-gradient(180deg,#fff,#fbfeff);border:1px solid rgba(11,94,215,0.04);min-height:220px;display:flex;flex-direction:column;justify-content:flex-start;gap:10px}.sloth-emoji{font-size:88px;text-align:center;line-height:1}.sloth-anim{transition:transform 1s ease}.small{font-size:14px;color:var(--muted)}.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:12px}.info-card{padding:12px;border-radius:10px;background:linear-gradient(180deg,#fff,#fbfeff);border:1px solid rgba(11,94,215,0.04)}.library-list a{display:block;padding:8px 10px;border-radius:8px;text-decoration:none;color:var(--brand);background:rgba(11,94,215,0.04);margin-bottom:8px}.feed{max-height:240px;overflow:auto;border:1px solid #eef6ff;padding:8px;border-radius:8px}footer{margin:28px 0;text-align:center;color:var(--muted)}body.dark,body.dark *{color:var(--text)!important}`;

/* STORAGE KEYS */
const KEYS = {
  MOODS: 'safespace_moods_v3',
  GROUNDING: 'safespace_grounding_v1',
  PDFS: 'safespace_pdfs_v1',
  COUNSELOR: 'safespace_counselor_msgs_v1'
};

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch(e){ return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

export default function App(){
  // theme
  const [dark, setDark] = useState(false);

  // mood form (8 questions + emoji)
  const [form, setForm] = useState({
    sleep: '2', stress: '0', energy: '2', focus: '2', appetite: '2', social: '2', anxiety: '0'
  });
  const [emoji, setEmoji] = useState(null);
  const [moods, setMoods] = useState(() => load(KEYS.MOODS, []));

  // grounding
  const [groundingNotes, setGroundingNotes] = useState('');
  const [groundingLog, setGroundingLog] = useState(() => load(KEYS.GROUNDING, []));

  // breathing
  const [breathing, setBreathing] = useState(false);
  const [breathText, setBreathText] = useState('Ready');
  const breathTimer = useRef(null);

  // sloth stretch
  const [stretching, setStretching] = useState(false);
  const slothRef = useRef(null);
  const stretchTimer = useRef(null);

  // meditation
  const [medTime, setMedTime] = useState(0);
  const medTimer = useRef(null);

  // chart
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // video preview
  const [videoFile, setVideoFile] = useState(null);

  // pdfs
  const [pdfs, setPdfs] = useState(() => load(KEYS.PDFS, []));

  // quiz
  const [quiz, setQuiz] = useState({q1:0,q2:0,q3:0,q4:0,q5:0,q6:0});
  const [quizResult, setQuizResult] = useState(null);

  // jokes
  const jokes = [
    'I told my computer I needed a break — it said: "No problem, I’ll go to sleep."',
    'Why did the scarecrow win an award? Because he was outstanding in his field.',
    'Parallel lines have so much in common. It’s a shame they’ll never meet.'
  ];
  const [joke, setJoke] = useState('');

  // chatbot (simple rule-based)
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');

  // counselor
  const [counselorMsg, setCounselorMsg] = useState('');
  const [counselorStatus, setCounselorStatus] = useState('');

  useEffect(()=>{
    // inject styles
    const s = document.createElement('style'); s.innerHTML = styles; document.head.appendChild(s);

    // load Chart.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => drawChart();
    document.body.appendChild(script);

    return ()=>{
      document.head.removeChild(s);
      document.body.removeChild(script);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(()=>{ save(KEYS.MOODS, moods); drawChart(); }, [moods]);
  useEffect(()=>{ save(KEYS.GROUNDING, groundingLog); }, [groundingLog]);
  useEffect(()=>{ save(KEYS.PDFS, pdfs); }, [pdfs]);

  function submitMoodWithAnswers(selectedEmoji){
    const values = Object.values(form).map(v=>parseFloat(v));
    const avg = (values.reduce((a,b)=>a+b,0))/values.length;
    const entry = {date: (new Date()).toISOString(), score: Math.round(avg*10)/10, emoji: selectedEmoji, answers: {...form}};
    const next = [entry, ...moods].slice(0,50);
    setMoods(next);
    setEmoji(selectedEmoji);
    document.getElementById('quick-stats').innerText = `Last: ${selectedEmoji} — score ${entry.score}`;
  }

  function drawChart(){
    if(!window.Chart) return;
    const ctx = chartRef.current && chartRef.current.getContext('2d');
    if(!ctx) return;
    const labels = moods.slice().reverse().map(m=>new Date(m.date).toLocaleDateString());
    const data = moods.slice().reverse().map(m=>m.score);
    if(chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new window.Chart(ctx, {
      type: 'line', data: {labels, datasets:[{label:'Daily mood', data, tension:0.2, fill:true}]}, options:{responsive:true, maintainAspectRatio:false}
    });
  }

  /* Breathing */
  function startBoxBreathing(){
    if(breathing) return;
    setBreathing(true);
    let step = 0; // 0 inhale,1 hold,2 exhale,3 hold
    const texts = ['Inhale','Hold','Exhale','Hold'];
    setBreathText(texts[0]);
    breathTimer.current = setInterval(()=>{
      step = (step+1)%4; setBreathText(texts[step]);
      const el = document.getElementById('breathing-circle');
      if(el) el.style.transform = (step===1||step===3)?'scale(1.05)':'scale(1.35)';
    },4000);
  }
  function stopBoxBreathing(){ clearInterval(breathTimer.current); setBreathing(false); setBreathText('Ready'); const el=document.getElementById('breathing-circle'); if(el) el.style.transform='scale(1)'; }

  /* Grounding */
  function startGrounding(){
    const prompt = ['Look for 5 things you can see','Notice 4 things you can touch','Listen for 3 sounds','Notice 2 smells or sensations','Find 1 thing that calms you'];
    let i=0; setGroundingNotes(prompt[0]);
    const t = setInterval(()=>{ i++; if(i<prompt.length) setGroundingNotes(prompt[i]); else clearInterval(t); },3000);
  }
  function saveGrounding(){ if(!groundingNotes) return; const entry={date:new Date().toISOString(),note:groundingNotes}; setGroundingLog([entry,...groundingLog]); setGroundingNotes(''); }
  function clearGrounding(){ setGroundingLog([]); }

  /* Sloth stretch */
  function startSlothStretch(){ if(stretching) return; setStretching(true); let pos=0; stretchTimer.current = setInterval(()=>{ pos=(pos+1)%3; if(slothRef.current) slothRef.current.style.transform = `rotate(${(pos-1)*8}deg) scale(${1 + pos*0.03})`; },1500); }
  function stopSlothStretch(){ clearInterval(stretchTimer.current); setStretching(false); if(slothRef.current) slothRef.current.style.transform='rotate(0deg) scale(1)'; }

  /* Meditation */
  function startMeditation(seconds){ clearInterval(medTimer.current); setMedTime(seconds); medTimer.current = setInterval(()=>{ setMedTime(t=>{ if(t<=1){ clearInterval(medTimer.current); return 0; } return t-1; }); },1000); }
  function stopMeditation(){ clearInterval(medTimer.current); setMedTime(0); }

  /* Video upload preview */
  function handleVideo(e){ const file = e.target.files[0]; if(!file) return; const url = URL.createObjectURL(file); setVideoFile({name:file.name,url}); }

  /* PDF upload (store minimal metadata + object URL in-memory) */
  function uploadPDF(e){ const file = e.target.files[0]; if(!file) return; const url = URL.createObjectURL(file); const next = [{name:file.name,url,date:new Date().toISOString()},...pdfs]; setPdfs(next); }
  function clearPDFs(){ setPdfs([]); }

  /* Quiz */
  function submitQuiz(){ const score=Object.values(quiz).reduce((a,b)=>a+parseInt(b),0); let res='Low'; if(score>8) res='High'; else if(score>4) res='Medium'; setQuizResult({score,res}); }

  /* Jokes */
  function showJoke(){ setJoke(jokes[Math.floor(Math.random()*jokes.length)]); }

  /* Chatbot (very simple) */
  function sendMessage(){ if(!userInput) return; const user = {from:'you',text:userInput}; setMessages(m=>[...m,user]);
    let reply = 'I hear you. Tell me more.';
    const u = userInput.toLowerCase();
    if(u.includes('sad')) reply = 'I'm sorry you feel sad. Would talking help?';
    else if(u.includes('anx')||u.includes('panic')) reply = 'Try slow exhale breathing. Inhale 4, exhale 6.';
    else if(u.includes('help')) reply = 'If you are in danger, contact emergency services. Otherwise, I can share coping tips.';
    setTimeout(()=> setMessages(m=>[...m,{from:'bot',text:reply}]),600);
    setUserInput('');
  }

  /* Counselor */
  function sendCounselor(){ if(!counselorMsg) return; const stored = load(KEYS.COUNSELOR,[]); stored.unshift({date:new Date().toISOString(),msg:counselorMsg}); save(KEYS.COUNSELOR, stored); setCounselorMsg(''); setCounselorStatus('Message saved (demo)'); setTimeout(()=>setCounselorStatus(''),2500); }

  /* Chart container size helper */
  const chartStyle = {height:180};

  return (
    <div>
      <header>
        <div className="brand">
          <div className="logo">SS</div>
          <div>
            <div style={{fontWeight:800,color:'var(--brand)'}}>SafeSpace</div>
            <div className="muted" style={{fontSize:12}}>Student mental health — demo</div>
          </div>
        </div>
        <nav>
          <a href="#mood">Mood</a>
          <a href="#tools">Tools</a>
          <a href="#upload">Videos</a>
          <a href="#quiz">Quiz</a>
          <a href="#jokes">Jokes</a>
          <a href="#chatbot">SafeBot</a>
          <a href="#counselor">Counselor</a>
          <a href="#library">Library</a>
          <a href="#info">Info Hub</a>
        </nav>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button className="ghost" onClick={()=>{ setDark(d=>!d); document.body.classList.toggle('dark'); }} id="darkToggle">{dark? '☀️ Light':'🌙 Dark'}</button>
        </div>
      </header>

      <div className="container">
        <div className="hero">
          <div>
            <h1>🌱 A Digital Friend for Your Mind — Track. Breathe. Heal. Share.</h1>
            <p className="muted">Anonymous micro-journal, mood tracking, exercises, and a bot to help — all in your browser. Safe for demo.</p>
            <div style={{marginTop:10}}>
              <button onClick={()=>document.getElementById('mood').scrollIntoView({behavior:'smooth'})}>Log Mood</button>
              <button className="ghost" onClick={()=>document.getElementById('tools').scrollIntoView({behavior:'smooth'})}>Try Tools</button>
            </div>
          </div>
          <div style={{background:'var(--card)',padding:14,borderRadius:10}}>
            <strong>Quick overview</strong>
            <p className="muted" id="quick-stats">{moods.length? `${moods[0].emoji} — score ${moods[0].score}` : 'No entries yet — log your first mood.'}</p>
          </div>
        </div>

        {/* MOOD */}
        <section id="mood">
          <h2>Daily Mood Check</h2>
          <p className="muted">Answer these quick questions — it helps create a daily mood score and track trends.</p>
          <div className="grid-2">
            <div>
              <label>1) Sleep quality</label>
              <select value={form.sleep} onChange={e=>setForm({...form,sleep:e.target.value})} id="q_sleep">
                <option value="2">Very good</option>
                <option value="1">Okay</option>
                <option value="0">Poor</option>
              </select>

              <label style={{marginTop:8}}>2) Stress level</label>
              <select value={form.stress} onChange={e=>setForm({...form,stress:e.target.value})} id="q_stress">
                <option value="0">Low</option>
                <option value="1">Medium</option>
                <option value="2">High</option>
              </select>

              <label style={{marginTop:8}}>3) Energy</label>
              <select value={form.energy} onChange={e=>setForm({...form,energy:e.target.value})} id="q_energy">
                <option value="2">High</option>
                <option value="1">Moderate</option>
                <option value="0">Low</option>
              </select>

              <label style={{marginTop:8}}>4) Focus / concentration</label>
              <select value={form.focus} onChange={e=>setForm({...form,focus:e.target.value})} id="q_focus">
                <option value="2">Good</option>
                <option value="1">So-so</option>
                <option value="0">Poor</option>
              </select>

              <label style={{marginTop:8}}>5) Appetite</label>
              <select value={form.appetite} onChange={e=>setForm({...form,appetite:e.target.value})} id="q_appetite">
                <option value="2">Normal</option>
                <option value="2.5">More eating</option>
                <option value="1">Reduced</option>
                <option value="0">No appetite</option>
              </select>

              <label style={{marginTop:8}}>6) Social desire</label>
              <select value={form.social} onChange={e=>setForm({...form,social:e.target.value})} id="q_social">
                <option value="2">Want to be with others</option>
                <option value="1">Maybe</option>
                <option value="0">Prefer alone</option>
              </select>

              <label style={{marginTop:8}}>7) Anxiety level</label>
              <select value={form.anxiety} onChange={e=>setForm({...form,anxiety:e.target.value})} id="q_anxiety">
                <option value="0">Low</option>
                <option value="1">Some</option>
                <option value="2">High</option>
              </select>

              <label style={{marginTop:8}}>8) Pick an emoji that matches your mood</label>
              <div className="mood-row">
                <button className="mood-btn" onClick={()=>submitMoodWithAnswers('😊')}>😊 Happy</button>
                <button className="mood-btn" onClick={()=>submitMoodWithAnswers('😐')}>😐 Neutral</button>
                <button className="mood-btn" onClick={()=>submitMoodWithAnswers('😟')}>😟 Stressed</button>
                <button className="mood-btn" onClick={()=>submitMoodWithAnswers('😢')}>😢 Sad</button>
              </div>
            </div>

            <div>
              <h3>Recent entries</h3>
              <pre id="mood-history" className="muted" style={{whiteSpace:'pre-wrap',minHeight:120}}>{moods.length? moods.map(m=>`${new Date(m.date).toLocaleString()} — ${m.emoji} — ${m.score}
`).join('
') : 'No moods logged yet.'}</pre>

              <h3 style={{marginTop:12}}>Mood Graph (daily average)</h3>
              <div style={{height:200}}>
                <canvas id="moodChart" ref={chartRef} style={{width:'100%',height:'100%'}}></canvas>
              </div>
            </div>
          </div>
        </section>

        {/* TOOLS */}
        <section id="tools">
          <h2>Wellness Tools & Exercises</h2>
          <p className="muted">Use short exercises between classes.</p>
          <div className="tools-grid">
            <div className="tool-card center">
              <h3>Box Breathing (4-4-4-4)</h3>
              <div id="breathing-circle" className="center">{breathText}</div>
              <div id="breath-count" className="muted">4s</div>
              <div className="tool-actions">
                <button onClick={startBoxBreathing}>Start</button>
                <button className="stop" onClick={stopBoxBreathing}>Stop</button>
              </div>
              <p className="small muted">Follow the circle text and 4-second timer. Inhale — Hold — Exhale — Hold.</p>
            </div>

            <div className="tool-card">
              <h3>Grounding (5-4-3-2-1)</h3>
              <p className="muted">Quick sensory method to return to the present.</p>
              <button onClick={startGrounding}>Guide me</button>
              <label style={{marginTop:8}}>Write your grounding experience (what you saw/touched/heard):</label>
              <textarea rows={4} value={groundingNotes} onChange={e=>setGroundingNotes(e.target.value)} id="groundingNotes" placeholder="I saw..., I touched..., I heard..."></textarea>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button onClick={saveGrounding}>Save Experience</button>
                <button onClick={clearGrounding}>Clear</button>
              </div>
              <div style={{marginTop:8}}>
                <strong className="muted">Saved experiences</strong>
                <div id="groundingLog" className="muted" style={{marginTop:6,maxHeight:120,overflow:'auto'}}>{groundingLog.length? groundingLog.map(g=>`${new Date(g.date).toLocaleString()} — ${g.note}
`).join('
') : 'No saved experiences.'}</div>
              </div>
            </div>

            <div className="tool-card center">
              <h3>Light Stretch Routine</h3>
              <p className="muted">Simple 2-minute stretch to relieve tension — follow slow 'sloth' movements.</p>
              <div id="sloth" ref={slothRef} className="sloth-emoji sloth-anim">🦥</div>
              <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:6}}>
                <button onClick={startSlothStretch}>Start Sloth Stretch</button>
                <button className="stop" onClick={stopSlothStretch}>Stop</button>
              </div>
              <p id="stretchStatus" className="muted" style={{marginTop:6}}></p>
            </div>

            <div className="tool-card">
              <h3>Guided Meditation</h3>
              <p className="muted">Short guided relaxation (timer-based).</p>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>startMeditation(120)}>Start 2-min</button>
                <button className="stop" onClick={stopMeditation}>Stop</button>
              </div>
              <p id="medStatus" className="muted" style={{marginTop:6}}>{medTime>0? `Time left: ${medTime}s` : ''}</p>
            </div>
          </div>
        </section>

        {/* Video Upload */}
        <section id="upload">
          <h2>Video Upload (preview)</h2>
          <p className="muted">Upload a short inspirational or reflective clip (preview only — demo local).</p>
          <input type="file" id="videoUpload" accept="video/*" onChange={handleVideo} />
          <div id="videoArea">{videoFile && <video controls src={videoFile.url} style={{maxWidth:'100%',marginTop:8}} />}</div>
        </section>

        {/* Library PDFs */}
        <section id="library">
          <h2>Library — Books & Novels (User accessible)</h2>
          <p className="muted">Admins can upload PDFs which will appear here for users to view/download.</p>
          <div className="library-list" id="pdfList">{pdfs.length? pdfs.map((p,i)=>(<a key={i} href={p.url} target="_blank" rel="noreferrer">{p.name}</a>)) : 'No books uploaded yet.'}</div>
        </section>

        <section id="admin" style={{marginTop:14}}>
          <h2>Admin — Upload PDFs</h2>
          <p className="muted">Upload PDFs of books/novels (stored locally in this demo).</p>
          <input type="file" id="pdfUpload" accept="application/pdf" onChange={uploadPDF} />
          <div style={{marginTop:8}}>
            <button onClick={()=>document.getElementById('pdfUpload').click()}>Upload PDF</button>
            <button className="ghost" onClick={clearPDFs}>Clear Library</button>
          </div>
        </section>

        {/* Quiz */}
        <section id="quiz">
          <h2>Quick Condition Quiz</h2>
          <p className="muted">Answer honestly — results suggest which site features may help you.</p>
          <label>1) In the past 2 weeks, how often have you felt down?</label>
          <select onChange={e=>setQuiz({...quiz,q1:e.target.selectedIndex})} id="qz1"><option>Not at all</option><option>Several days</option><option>More than half the days</option></select>
          <label>2) How often have you had trouble sleeping?</label>
          <select onChange={e=>setQuiz({...quiz,q2:e.target.selectedIndex})} id="qz2"><option>Rarely</option><option>Sometimes</option><option>Often</option></select>
          <label>3) How often do you feel anxious or panicky?</label>
          <select onChange={e=>setQuiz({...quiz,q3:e.target.selectedIndex})} id="qz3"><option>Rarely</option><option>Sometimes</option><option>Often</option></select>
          <label>4) Do you withdraw from friends?</label>
          <select onChange={e=>setQuiz({...quiz,q4:e.target.selectedIndex})} id="qz4"><option>No</option><option>Somewhat</option><option>Yes</option></select>
          <label>5) Do you have trouble concentrating?</label>
          <select onChange={e=>setQuiz({...quiz,q5:e.target.selectedIndex})} id="qz5"><option>No</option><option>Sometimes</option><option>Yes</option></select>
          <label>6) Do you feel overwhelmed by coursework?</label>
          <select onChange={e=>setQuiz({...quiz,q6:e.target.selectedIndex})} id="qz6"><option>No</option><option>Sometimes</option><option>Yes</option></select>
          <div style={{marginTop:10}}><button onClick={submitQuiz}>Submit Quiz</button></div>
          <div id="quizResult" style={{marginTop:12}}>{quizResult? `${quizResult.res} (${quizResult.score})` : ''}</div>
        </section>

        {/* Jokes */}
        <section id="jokes">
          <h2>Light Jokes & Lifts</h2>
          <p id="jokeText" className="muted">{joke || 'Press button for a light joke.'}</p>
          <button onClick={showJoke}>Tell me a joke</button>
        </section>

        {/* Chatbot */}
        <section id="chatbot">
          <h2>SafeBot 🤖</h2>
          <p className="muted">A friendly rule-based helper — not a replacement for professionals.</p>
          <div id="messages" style={{height:180,overflow:'auto',border:'1px solid rgba(11,94,215,0.06)',padding:8,borderRadius:8,background:'linear-gradient(180deg,#fbfeff,#fff)'}}>
            {messages.map((m,i)=>(<div key={i}><strong>{m.from}:</strong> {m.text}</div>))}
          </div>
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <input type="text" value={userInput} onChange={e=>setUserInput(e.target.value)} id="userInput" placeholder="Write to SafeBot..." />
            <button onClick={sendMessage}>Send</button>
          </div>
        </section>

        {/* Counselor */}
        <section id="counselor">
          <h2>Message a Counselor (demo)</h2>
          <p className="muted">Your message is stored locally in this demo. In production it would go to counselors.</p>
          <textarea id="counselorMsg" rows={4} placeholder="Write to a counselor..." value={counselorMsg} onChange={e=>setCounselorMsg(e.target.value)}></textarea>
          <div style={{marginTop:8}}>
            <button onClick={sendCounselor}>Send Message</button>
            <span className="muted" style={{marginLeft:10}}>{counselorStatus}</span>
          </div>
        </section>

        {/* Info Hub */}
        <section id="info">
          <h2>Information Hub — Understand & Manage</h2>
          <p className="muted">Concise, student-friendly guidance for common conditions and practical coping steps.</p>
          <div className="info-grid">
            <div className="info-card"><h3>Depression</h3><p className="muted"><strong>What:</strong> Persistent low mood, loss of interest, low energy, sleep/appetite changes.</p><p className="muted"><strong>Practical steps:</strong> Keep small daily goals, keep a simple routine, try brief walks and sunlight, connect with someone you trust, consider counseling or student health. If you have thoughts of self-harm, seek emergency help immediately.</p></div>
            <div className="info-card"><h3>Anxiety</h3><p className="muted"><strong>What:</strong> Excessive worry, restlessness, muscle tension, sleep issues.</p><p className="muted"><strong>Practical steps:</strong> Use breathing exercises (in-out), practice grounding (5-4-3-2-1), limit stimulants (caffeine), break tasks into smaller steps, talk to peers or counselor.</p></div>
            <div className="info-card"><h3>Panic Attacks</h3><p className="muted"><strong>What:</strong> Sudden intense fear with physical symptoms (racing heart, breathlessness).</p><p className="muted"><strong>Quick help:</strong> Sit, loosen clothing, slow exhale breathing (4s in, 6s out), grounding technique, remind yourself it will pass. Seek professional help if repeated.</p></div>
            <div className="info-card"><h3>Stress Management</h3><p className="muted"><strong>What:</strong> Feeling overwhelmed by demands (study, deadlines, personal issues).</p><p className="muted"><strong>Practical steps:</strong> Prioritize tasks, use short breaks, try a 5–10 minute relaxation, use campus resources and talk to mentors.</p></div>
            <div className="info-card"><h3>Where to Seek Help</h3><p className="muted">University counseling center, student health services, trusted faculty/mentor, emergency services if at risk. Consider hotlines and crisis lines in your country.</p></div>
          </div>
        </section>

      </div>

      <footer><div className="muted">© 2025 SafeSpace — Demo prototype. Not a replacement for professional care.</div></footer>
    </div>
  );
}
