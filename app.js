const TONE_PATHS={
  mid:"M3 9 L39 9",
  low:"M3 4 L39 13",
  falling:"M3 15 L21 3 L39 15",
  high:"M3 14 L20 4 L39 4",
  rising:"M3 3 L21 15 L39 3"
};
const TONE_LABELS={mid:"평성",low:"1성",falling:"2성",high:"3성",rising:"4성"};
const studies=[...(window.STUDIES||[])].sort((a,b)=>b.date.localeCompare(a.date));
let current=null,currentSentence=null,repeating=false,utterance=null,progressRaf=0,ttsStart=0,ttsDuration=0;

const $=selector=>document.querySelector(selector);
const view=$("#view"),archive=$("#archive"),audio=$("#audio"),player=$("#player"),side=$("#side");
const DEFAULT_NOTE=`[종성에 따른 성조 기억]

저자음 + 성조 부호 없음
- 생음: 평성 (모음 길이 무관)
- 사음 + 단모음: 3성
- 사음 + 장모음: 2성

[자주 헷갈리는 표현]
เชื่อ = 사실·말을 믿다
เชื่อใจ = 사람을 신뢰하다
ไว้ใจ = 마음 놓고 믿고 맡기다

[나만의 메모]
- `;
const NOTE_KEY="dao-thai-quick-note";
const FONT_KEY="dao-thai-font";

function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
function toneSvg(tone,klass=""){
  return `<svg class="${klass}" viewBox="0 0 42 18" role="img" aria-label="${TONE_LABELS[tone]}"><path d="${TONE_PATHS[tone]}"></path></svg>`;
}
function renderHome(){
  stopPlayback(true); current=null; history.replaceState(null,"",location.pathname); buildArchive(filterStudies());
  view.innerHTML=`<article class="home"><section class="hero"><small>THAI PRONUNCIATION ARCHIVE</small><h1>태국어를 눈으로 보고,<br>귀로 반복해서 공부해요.</h1><p>태국어 원문, 실제 발음에 가까운 독음, 장모음, 음절별 성조, 자연스러운 해석을 한 화면에서 확인할 수 있어요.</p><button id="latest" type="button">최근 스터디 보기</button></section></article>`;
  $("#latest").addEventListener("click",()=>selectStudy(studies[0]));
}
function buildArchive(list){
  let html="",year="",month="";
  list.forEach(study=>{
    const [yy,mm]=study.date.split("-");
    if(yy!==year){year=yy;month="";html+=`<div class="year">${yy}</div>`;}
    if(mm!==month){month=mm;html+=`<div class="month">${Number(mm)}월</div>`;}
    html+=`<button class="arc ${current?.id===study.id?"active":""}" data-id="${study.id}" type="button">${study.date.slice(5).replace("-",".")} ${escapeHtml(study.title)}<br><small>${escapeHtml(study.artist)}</small></button>`;
  });
  archive.innerHTML=html||"<p>검색 결과가 없어요.</p>";
  archive.querySelectorAll("[data-id]").forEach(button=>button.addEventListener("click",()=>selectStudy(studies.find(s=>s.id===button.dataset.id))));
}
function selectStudy(study){
  if(!study)return;
  stopPlayback(true); current=study; location.hash=study.id; buildArchive(filterStudies());
  view.innerHTML=`<article class="study"><header class="head"><div><div class="date">${study.date.replaceAll("-",".")}</div><h1>${escapeHtml(study.title)}</h1><p class="artist">${escapeHtml(study.artist)}</p>${study.description?`<p class="desc">${escapeHtml(study.description)}</p>`:""}</div><a class="yt" href="${escapeHtml(study.youtube||"#")}" target="_blank" rel="noopener">▶ YouTube에서 듣기</a></header><div class="legend">${Object.keys(TONE_LABELS).map(t=>`<span>${toneSvg(t)}${TONE_LABELS[t]}</span>`).join("")}<span>- 장모음</span></div>${study.sentences.map((sentence,index)=>renderCard(sentence,index)).join("")}</article>`;
  view.querySelectorAll("[data-play]").forEach(button=>button.addEventListener("click",()=>playSentence(study.sentences.find(s=>s.id===button.dataset.play))));
  closeSidebar(); window.scrollTo({top:0,behavior:"smooth"});
}
function renderCard(sentence,index){
  const tokens=sentence.tokens.map(token=>`<div class="group"><div class="syllables">${token.syllables.map(syllable=>`<div class="sy">${toneSvg(syllable.tone)}<span class="th" lang="th">${escapeHtml(syllable.thai)}</span><span class="rd">${escapeHtml(syllable.reading)}</span></div>`).join("")}</div><span class="meaning">${escapeHtml(token.meaning)}</span></div>`).join("");
  return `<section class="card" data-card="${sentence.id}"><div class="top"><span class="num">${index+1}</span><h2 class="thai" data-text="${escapeHtml(sentence.thai)}" lang="th">${escapeHtml(sentence.thai)}</h2><button class="play" data-play="${sentence.id}" type="button" aria-label="이 문장 듣기">▶</button></div><div class="tokens">${tokens}</div><p class="natural">${escapeHtml(sentence.natural)}</p>${sentence.studyNotes?.length?`<details class="notes"><summary>단어·표현 공부 메모</summary><ul>${sentence.studyNotes.map(note=>`<li>${escapeHtml(note)}</li>`).join("")}</ul></details>`:""}</section>`;
}
function filterStudies(){
  const query=$("#search").value.trim().toLowerCase();
  if(!query)return studies;
  return studies.filter(study=>[study.date,study.title,study.artist,study.description,...study.sentences.map(s=>s.thai)].join(" ").toLowerCase().includes(query));
}
function activeThai(){return currentSentence?document.querySelector(`[data-card="${currentSentence.id}"] .thai`):null;}
function setProgress(value){
  const el=activeThai(); if(el)el.style.setProperty("--progress",`${Math.max(0,Math.min(100,value))}%`);
}
function resetAllProgress(){document.querySelectorAll(".thai").forEach(el=>el.style.setProperty("--progress","0%"));}
function estimateTtsDuration(text,rate){return Math.max(1.8,(Array.from(text).length*0.115+0.9)/Math.max(.5,rate));}
function startTtsProgress(text,rate){
  cancelAnimationFrame(progressRaf); ttsStart=performance.now(); ttsDuration=estimateTtsDuration(text,rate)*1000;
  const tick=now=>{const elapsed=now-ttsStart;setProgress(elapsed/ttsDuration*100);if(elapsed<ttsDuration&&speechSynthesis.speaking)progressRaf=requestAnimationFrame(tick);};
  progressRaf=requestAnimationFrame(tick);
}
function finishProgress(){cancelAnimationFrame(progressRaf);setProgress(100);setTimeout(()=>setProgress(0),180);}
function stopPlayback(hide=false){
  cancelAnimationFrame(progressRaf); audio.pause(); audio.removeAttribute("src"); audio.load(); if("speechSynthesis" in window)speechSynthesis.cancel();
  resetAllProgress(); $("#pp").textContent="▶"; if(hide)player.hidden=true; else resetPlayerCopy();
}
function resetPlayerCopy(){
  $("#ptitle").textContent="문장 듣기";
  $("#pstatus").textContent="재생 버튼을 눌러 음성을 들어보세요.";
}
function playSentence(sentence){
  if(!sentence)return; stopPlayback(false); currentSentence=sentence; player.hidden=false;
  $("#ptitle").textContent=current?.title||"태국어 스터디";
  $("#pstatus").textContent=sentence.audio?"문장 MP3 재생":"태국어 문장 음성 데모";
  const speed=Number($("#speed").value);
  if(sentence.audio){
    audio.src=sentence.audio; audio.playbackRate=speed;
    audio.play().catch(()=>$("#pstatus").textContent="MP3를 불러오지 못했어요.");
  }else if("speechSynthesis" in window){
    utterance=new SpeechSynthesisUtterance(sentence.thai); utterance.lang="th-TH"; utterance.rate=speed;
    utterance.onstart=()=>{$("#pp").textContent="Ⅱ";startTtsProgress(sentence.thai,speed)};
    utterance.onend=()=>{finishProgress();$("#pp").textContent="▶";if(repeating)setTimeout(()=>playSentence(sentence),220);else setTimeout(resetPlayerCopy,250)};
    utterance.onerror=()=>{resetAllProgress();$("#pp").textContent="▶"};
    speechSynthesis.speak(utterance);
  }
}

audio.addEventListener("loadedmetadata",()=>setProgress(0));
audio.addEventListener("timeupdate",()=>{if(audio.duration)setProgress(audio.currentTime/audio.duration*100)});
audio.addEventListener("play",()=>$("#pp").textContent="Ⅱ");
audio.addEventListener("pause",()=>$("#pp").textContent="▶");
audio.addEventListener("ended",()=>{finishProgress();if(!repeating){$("#pp").textContent="▶";setTimeout(resetPlayerCopy,250)}});

$("#pp").addEventListener("click",()=>{
  if(audio.src){audio.paused?audio.play():audio.pause();return;}
  if(!currentSentence)return;
  if(speechSynthesis.speaking){speechSynthesis.cancel();cancelAnimationFrame(progressRaf);$("#pp").textContent="▶";}else playSentence(currentSentence);
});
$("#rewind").addEventListener("click",()=>{if(audio.src)audio.currentTime=Math.max(0,audio.currentTime-5)});
$("#repeat").addEventListener("click",()=>{repeating=!repeating;audio.loop=repeating;$("#repeat").setAttribute("aria-pressed",String(repeating))});
$("#speed").addEventListener("change",event=>{audio.playbackRate=Number(event.target.value);if(utterance)utterance.rate=Number(event.target.value)});
$("#search").addEventListener("input",()=>buildArchive(filterStudies()));
$("#home").addEventListener("click",renderHome);
$("#menu").addEventListener("click",()=>{const open=side.classList.toggle("open");$("#menu").setAttribute("aria-expanded",String(open))});
function closeSidebar(){side.classList.remove("open");$("#menu").setAttribute("aria-expanded","false")}


function setNoteOpen(open){
  $("#quickNote").classList.toggle("closed",!open);
  $("#noteToggle").setAttribute("aria-expanded",String(open));
  document.body.classList.toggle("note-open",open);
  localStorage.setItem("dao-thai-note-open",String(open));
}
function initQuickNote(){
  const textarea=$("#noteContent");
  textarea.value=localStorage.getItem(NOTE_KEY)??DEFAULT_NOTE;
  let timer=0;
  textarea.addEventListener("input",()=>{
    $("#noteSaved").textContent="저장 중…";
    clearTimeout(timer);
    timer=setTimeout(()=>{localStorage.setItem(NOTE_KEY,textarea.value);$("#noteSaved").textContent="저장됨"},350);
  });
  $("#noteReset").addEventListener("click",()=>{
    if(confirm("기본 메모로 되돌릴까요? 현재 메모는 사라집니다.")){
      textarea.value=DEFAULT_NOTE;localStorage.setItem(NOTE_KEY,DEFAULT_NOTE);$("#noteSaved").textContent="기본 메모 복원됨";
    }
  });
  $("#noteToggle").addEventListener("click",()=>setNoteOpen($("#quickNote").classList.contains("closed")));
  $("#noteClose").addEventListener("click",()=>setNoteOpen(false));
  const saved=localStorage.getItem("dao-thai-note-open");
  setNoteOpen(saved===null?window.innerWidth>=1500:saved==="true");
}
function setThaiFont(mode){
  const looped=mode==="looped";
  document.body.classList.toggle("thai-looped",looped);
  $("#fontToggle").setAttribute("aria-pressed",String(looped));
  $("#fontToggleText").textContent=looped?"현대 태국어":"기본 태국어";
  $("#fontToggle").title=looped?"현대 태국어 글꼴로 전환":"후아가 있는 기본 태국어 글꼴로 전환";
  localStorage.setItem(FONT_KEY,mode);
}
function initThaiFont(){
  setThaiFont(localStorage.getItem(FONT_KEY)||"modern");
  $("#fontToggle").addEventListener("click",()=>setThaiFont(document.body.classList.contains("thai-looped")?"modern":"looped"));
}
initQuickNote();
initThaiFont();
resetPlayerCopy();

const initialId=location.hash.slice(1);const initialStudy=studies.find(study=>study.id===initialId);initialStudy?selectStudy(initialStudy):renderHome();
