const home=document.getElementById('home'),chatview=document.getElementById('chatview'),
chat=document.getElementById('chat'),f=document.getElementById('f'),t=document.getElementById('t'),
back=document.getElementById('back'),clearBtn=document.getElementById('clear'),title=document.getElementById('title'),
mic=document.getElementById('mic');
const KEY='bc_hist_v3';
let hist={};let cur=null;
try{hist=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){hist={}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(hist))}catch(e){}}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function fmt(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\*(.+?)\*/gs,'<em>$1</em>')}

CHARS.forEach(c=>{
  const d=document.createElement('div');d.className='card';
  d.innerHTML='<div class="e">'+c.e+'</div><div class="n">'+c.n+'</div><div class="r">'+c.r+'</div><div class="d">'+c.d+'</div>';
  d.onclick=()=>openChar(c);
  home.appendChild(d);
});
function add(text,cls){
  const d=document.createElement('div');d.className='msg '+cls;d.innerHTML=fmt(text);
  chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d;
}
function openChar(c){
  cur=c;
  if(!hist[c.id]||!hist[c.id].length){hist[c.id]=[{role:'model',text:c.g}];save();}
  home.style.display='none';chatview.style.display='flex';
  back.style.display='block';clearBtn.style.display='block';
  title.textContent=c.e+' '+c.n;chat.innerHTML='';
  hist[c.id].forEach(m=>add(m.text,m.role==='user'?'user':'bot'));
}
back.onclick=()=>{
  stopMic();
  cur=null;chatview.style.display='none';home.style.display='grid';
  back.style.display='none';clearBtn.style.display='none';
  title.textContent='কার সাথে কথা বলবে?';
};
clearBtn.onclick=()=>{
  if(!cur||!confirm('গল্পটা নতুন করে শুরু করবে? আগের কথা মুছে যাবে।'))return;
  hist[cur.id]=[];save();openChar(cur);
};

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let vr=null,vOn=false,vBase='',vFinal='';
function stopMic(){
  vOn=false;mic.classList.remove('on');
  if(vr){try{vr.stop()}catch(e){}vr=null}
}
function startVoice(){
  vr=new SR();vr.lang='bn-BD';vr.interimResults=true;vr.continuous=true;
  vr.onresult=e=>{
    let interim='';
    for(let i=e.resultIndex;i<e.results.length;i++){
      const tr=e.results[i][0].transcript;
      if(e.results[i].isFinal)vFinal+=tr+' ';else interim+=tr;
    }
    t.value=(vBase+vFinal+interim).trim();
  };
  vr.onerror=e=>{
    if(e.error==='not-allowed'||e.error==='service-not-allowed'){
      alert('মাইক্রোফোনের অনুমতি দাও, তারপর আবার চেষ্টা করো।');stopMic();
    }else if(e.error==='network'){
      alert('ইন্টারনেট সমস্যা, ভয়েস চলছে না।');stopMic();
    }
  };
  vr.onend=()=>{
    if(vOn){vBase=t.value+' ';vFinal='';setTimeout(()=>{if(vOn)startVoice()},250)}
  };
  try{vr.start()}catch(e){}
}
mic.onclick=()=>{
  if(!SR){alert('এই ব্রাউজারে ভয়েস লেখা চলে না। অনুগ্রহ করে মোবাইলের Chrome ব্যবহার করো।');return}
  if(vOn){stopMic();t.focus();return}
  vOn=true;vBase=t.value?t.value+' ':'';vFinal='';
  mic.classList.add('on');startVoice();
};

async function ask(h){
  for(let i=0;i<2;i++){
    try{
      const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({character:cur.id,messages:h})});
      const data=await r.json();
      if(data.reply&&!data.busy)return data.reply;
    }catch(e){}
    await wait(2500);
  }
  return null;
}
f.addEventListener('submit',async e=>{
  e.preventDefault();stopMic();
  const text=t.value.trim();if(!text||!cur)return;
  t.value='';const c=cur,h=hist[c.id];
  h.push({role:'user',text});save();add(text,'user');
  const w=add('*লিখছে...*','bot');
  const reply=await ask(h);
  if(reply){w.innerHTML=fmt(reply);h.push({role:'model',text:reply});save();}
  else{w.textContent='এখন সার্ভারে খুব ভিড়, কিছুক্ষণ পর আবার পাঠাও। 🙏';h.pop();save();}
});
