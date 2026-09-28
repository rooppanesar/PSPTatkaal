// Applicant portal (index.html)

function render(){
  const s = state.screen;
  if (s === "elig1") return renderElig1();
  if (s === "notElig") return renderNotEligible();
  if (s === "elig2") return renderElig2();
  if (s === "form") return renderForm();
  if (s === "duplicate") return renderDuplicate();
  if (s === "success") return renderSuccess();
  if (s === "track") return renderTrack();
}

const Q1 = [
  ["indian","Are you the holder of an Indian passport?"],
  ["jurisdiction","Do you fall under CGI Vancouver jurisdiction?"],
  ["notExpired","Is your passport still valid (not expired)?"],
  ["under12","Does your passport have less than 12 months validity?"],
  ["status","Do you hold valid immigration status in Canada?"],
  ["changes","Are you planning to change name, address, parent or spouse details?"]
];
function renderElig1(){
  const a = state.answers || {};
  app.innerHTML = `<div class="card">
    <div class="card-head" style="background:var(--saffron);color:#3a2400;">Tatkaal Passport Renewal — Eligibility Check</div>
    <div class="card-body">
      ${progressBar(1,3)}
      ${Q1.map(([k,label]) => `<div class="q"><p>${label}</p><div class="opts">
        <button class="opt ${a[k]==='yes'?'sel':''}" data-k="${k}" data-v="yes">Yes</button>
        <button class="opt ${a[k]==='no'?'sel':''}" data-k="${k}" data-v="no">No</button>
      </div></div>`).join("")}
      <div class="actions"><button class="btn ghost" id="track">Track an application</button>
        <button class="btn primary" id="cont" ${Object.keys(a).length<6?"disabled":""}>Continue →</button>
      </div>
    </div></div>`;
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => { state.answers = { ...state.answers, [b.dataset.k]: b.dataset.v }; render(); });
  document.getElementById("track").onclick = () => go("track", { lookup:null, trackResult:null });
  document.getElementById("cont").onclick = () => {
    const a = state.answers;
    const eligible = a.indian==="yes" && a.jurisdiction==="yes" && a.notExpired==="yes" && a.under12==="yes" && a.status==="yes" && a.changes==="no";
    if (!eligible) return go("notElig", {});
    go("elig2", { answers:{} });
  };
}

function renderNotEligible(){
  app.innerHTML = `<div class="card"><div class="card-head" style="background:var(--red);">Eligibility result</div>
    <div class="card-body" style="text-align:center;"><div class="result-icon" style="background:var(--red);">✕</div>
      <h2 class="title" style="text-align:center;">Not eligible</h2>
      <p class="small">Based on your answers, you may not be eligible for Tatkaal renewal right now.</p>
      <div class="notice amber" style="text-align:left;"><b>Recommendations</b><ul style="margin:8px 0 0;padding-left:18px;">
        <li>Check whether you qualify for regular passport renewal instead</li><li>Contact CGI Vancouver for specific guidance</li>
        <li>Visit the official MEA portal for more options</li></ul></div>
      <div class="notice" style="background:var(--bg);text-align:left;border:1px solid var(--line);"><b style="display:block;margin-bottom:4px;">Contact information</b>CGI Vancouver Helpline — cgivan.passport@mea.gov.in</div>
      <button class="btn ghost" id="restart">Start over</button>
    </div></div>`;
  document.getElementById("restart").onclick = () => go("elig1", { answers:{} });
}

function renderElig2(){
  const a = state.answers || {};
  app.innerHTML = `<div class="card"><div class="card-head" style="background:var(--navy-2);">Minor Eligibility Check</div><div class="card-body">
    ${progressBar(2,3)}
    <div class="q"><p>A. Is the applicant a minor (under 18)?</p><div class="opts">
      <button class="opt ${a.minor==='yes'?'sel':''}" data-k="minor" data-v="yes">Yes</button><button class="opt ${a.minor==='no'?'sel':''}" data-k="minor" data-v="no">No</button>
    </div></div>
    ${a.minor==='yes' ? `<div class="q"><p>B. Do both parents have valid status in Canada?</p><div class="opts">
      <button class="opt ${a.bothParents==='yes'?'sel':''}" data-k="bothParents" data-v="yes">Yes</button><button class="opt ${a.bothParents==='no'?'sel':''}" data-k="bothParents" data-v="no">No</button>
    </div></div><div class="q"><p>C. If single parent, can you provide a custody letter or consent?</p><div class="opts">
      <button class="opt ${a.custody==='yes'?'sel':''}" data-k="custody" data-v="yes">Yes</button><button class="opt ${a.custody==='no'?'sel':''}" data-k="custody" data-v="no">No</button><button class="opt ${a.custody==='na'?'sel':''}" data-k="custody" data-v="na">N/A</button>
    </div></div>` : ""}
    <p id="elig2Err" class="err"></p><div class="actions"><button class="btn ghost" id="back">← Back</button><button class="btn primary" id="cont">Continue →</button></div>
  </div></div>`;
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => { state.answers = { ...state.answers, [b.dataset.k]: b.dataset.v }; render(); });
  document.getElementById("back").onclick = () => go("elig1", { answers:{} });
  document.getElementById("cont").onclick = () => {
    const a = state.answers;
    if (!a.minor) return document.getElementById("elig2Err").textContent = "Please select whether the applicant is a minor.";
    if (a.minor === "yes") {
      if (!a.bothParents || !a.custody) return document.getElementById("elig2Err").textContent = "Please complete the minor eligibility questions.";
      const ok = a.bothParents === "yes" || a.custody === "yes" || a.custody === "na";
      if (!ok) return go("notElig", {});
    }
    go("form", { applicantType:a.minor === "yes" ? "minor" : "adult" });
  };
}

function renderForm(){
  const type = state.applicantType;
  app.innerHTML = `<div class="card"><div class="card-head" style="background:#5B2D8E;">Application Form (${type === "minor" ? "Minor" : "Adult"})</div><div class="card-body">
    ${progressBar(3,3)}<p class="small">Complete all fields and upload clear JPEG documents.</p>
    <label>Full name (as in passport)</label><input type="text" id="f_name" autocomplete="name">
    ${type === "minor" ? `<label>Date of birth</label><input type="date" id="f_dob">` : ""}
    <label>Passport number</label><input type="text" id="f_passport" style="text-transform:uppercase;" autocomplete="off">
    <label>Phone number</label><input type="tel" id="f_phone" autocomplete="tel">
    <label>Email address</label><input type="email" id="f_email" autocomplete="email">
    <label>Reason for Tatkaal (max 300 characters)</label><textarea id="f_reason" maxlength="300"></textarea>
    <label>Upload passport (JPEG only)</label><div class="file"><input type="file" id="f_doc_passport" accept="image/jpeg"></div>
    <label>Upload immigration status proof (JPEG only)</label><div class="file"><input type="file" id="f_doc_status" accept="image/jpeg"></div>
    ${type === "minor" ? `<label>Upload parent's immigration status (JPEG only)</label><div class="file"><input type="file" id="f_doc_parent" accept="image/jpeg"></div>` : ""}
    <p id="formErr" class="err"></p><div class="actions"><button class="btn ghost" id="back">← Back</button><button class="btn primary" id="submit">Submit application</button></div>
  </div></div>`;
  document.getElementById("back").onclick = () => go("elig2", { answers:state.answers });
  document.getElementById("submit").onclick = async () => {
    const name = document.getElementById("f_name").value.trim();
    const dob = type === "minor" ? document.getElementById("f_dob").value : null;
    const passport = document.getElementById("f_passport").value.trim().toUpperCase();
    const phone = document.getElementById("f_phone").value.trim();
    const email = document.getElementById("f_email").value.trim();
    const reason = document.getElementById("f_reason").value.trim();
    const docPassport = document.getElementById("f_doc_passport").files[0];
    const docStatus = document.getElementById("f_doc_status").files[0];
    const docParent = type === "minor" ? document.getElementById("f_doc_parent").files[0] : null;
    const errEl = document.getElementById("formErr");
    if (!name || (type === "minor" && !dob) || !passport || !phone || !email || !reason || !docPassport || !docStatus || (type === "minor" && !docParent)) {
      errEl.textContent = "Please complete every field and upload the required documents."; return;
    }
    if (![docPassport,docStatus,docParent].filter(Boolean).every(f => f.type === "image/jpeg")) {
      errEl.textContent = "Please upload JPEG images only."; return;
    }
    const submitBtn = document.getElementById("submit"); submitBtn.disabled = true; submitBtn.textContent = "Processing documents…";
    try {
      const [passportImg,statusImg,parentImg] = await Promise.all([toPreviewImage(docPassport),toPreviewImage(docStatus),docParent ? toPreviewImage(docParent) : Promise.resolve(null)]);
      const list = load(); const now = Date.now(); const thirtyDays = 30*24*60*60*1000;
      const prior = list.filter(x => x.passport === passport).sort((a,b) => b.submittedAt-a.submittedAt)[0];
      if (prior && (now - prior.submittedAt) < thirtyDays) {
        const allowed = prior.status === "rejected" && prior.rejectionReason === RESUBMIT_OK_REASON;
        if (!allowed) return go("duplicate", { prior });
      }
      const record = {
        id:uid(), applicationNumber:nextApplicationNumber(), passport, name, dob, phone, email, reason,
        applicantType:type, eligibility:{...state.answers},
        docs:{passport:{name:docPassport.name,img:passportImg},status:{name:docStatus.name,img:statusImg},parent:docParent ? {name:docParent.name,img:parentImg} : null},
        status:"pending", submittedAt:now, rejectionReason:null, remarks:"", decidedAt:null,
        history:[{action:"Application submitted",at:now,status:"pending"}]
      };
      list.push(record); save(list); go("success", { record });
    } catch(e) {
      errEl.textContent = "Could not save the application. Please try again with JPEG images.";
      submitBtn.disabled = false; submitBtn.textContent = "Submit application";
    }
  };
}

function toPreviewImage(file,maxDim=1400,quality=0.8){
  return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onerror=()=>reject(reader.error); reader.onload=()=>{ const img=new Image(); img.onerror=()=>reject(new Error("bad image")); img.onload=()=>{ let {width,height}=img; if(width>maxDim||height>maxDim){const scale=maxDim/Math.max(width,height);width=Math.round(width*scale);height=Math.round(height*scale);} const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;canvas.getContext("2d").drawImage(img,0,0,width,height);resolve(canvas.toDataURL("image/jpeg",quality));};img.src=reader.result;};reader.readAsDataURL(file); });
}

function renderDuplicate(){
  const prior = state.prior;
  app.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;"><div class="result-icon" style="background:var(--amber);">!</div>
    <h2 class="title" style="text-align:center;">Application already on file</h2>
    <p class="small">Passport number <b>${escapeHtml(prior?.passport)}</b> was submitted within the last 30 days.</p>
    <p class="small">Reference number: <b>${escapeHtml(prior?.applicationNumber || "")}</b></p>
    <button class="btn ghost" id="restart">Start over</button></div></div>`;
  document.getElementById("restart").onclick=()=>go("elig1",{answers:{}});
}

function renderSuccess(){
  const r=state.record;
  app.innerHTML=`<div class="card"><div class="card-body" style="text-align:center;"><div class="result-icon" style="background:var(--green);">✓</div>
    <h2 class="title" style="text-align:center;">Application submitted successfully</h2>
    <p class="small">Your request has been sent to the Consulate Officer Portal for review.</p>
    <div class="notice green" style="text-align:left;"><div><b>Application number</b><br><span class="reference-number">${escapeHtml(r.applicationNumber)}</span></div>
      <div style="margin-top:10px;"><b>Submitted</b><br>${escapeHtml(fmtDateTime(r.submittedAt))}</div></div>
    <p class="small">Please keep your application number. You will need it to check the status of your application.</p>
    <div class="actions" style="justify-content:center;"><button class="btn primary" id="track">Track application</button><button class="btn ghost" id="restart">Back to start</button></div>
  </div></div>`;
  document.getElementById("track").onclick=()=>go("track",{lookup:r.applicationNumber,trackResult:r});
  document.getElementById("restart").onclick=()=>go("elig1",{answers:{}});
}

function renderTrack(){
  const result=state.trackResult;
  app.innerHTML=`<div class="card"><div class="card-head" style="background:var(--navy-2);">Track Application</div><div class="card-body">
    <p class="small">Enter your application number and passport number.</p>
    <label>Application number</label><input type="text" id="trackNo" value="${escapeHtml(state.lookup || "")}" placeholder="TAT2026000001">
    <label>Passport number</label><input type="text" id="trackPassport" style="text-transform:uppercase;">
    <p id="trackErr" class="err"></p><div class="actions"><button class="btn ghost" id="home">← Back</button><button class="btn primary" id="find">Check status</button></div>
    ${result ? `<div class="notice ${result.status==='approved'?'green':result.status==='rejected'?'red':'amber'}" style="margin-top:20px;text-align:left;">
      <b>${escapeHtml(result.applicationNumber)}</b><br><span class="status-large">${escapeHtml(result.status.toUpperCase())}</span><br>
      Submitted: ${escapeHtml(fmtDateTime(result.submittedAt))}
      ${result.decidedAt ? `<br>Decision date: ${escapeHtml(fmtDateTime(result.decidedAt))}` : ""}
      ${result.rejectionReason ? `<br>Reason: ${escapeHtml(result.rejectionReason)}` : ""}
      ${result.remarks ? `<br>Remarks: ${escapeHtml(result.remarks)}` : ""}
    </div>` : ""}
  </div></div>`;
  document.getElementById("home").onclick=()=>go("elig1",{answers:{}});
  document.getElementById("find").onclick=()=>{
    const no=document.getElementById("trackNo").value.trim().toUpperCase();
    const passport=document.getElementById("trackPassport").value.trim().toUpperCase();
    const r=load().find(x=>x.applicationNumber===no && x.passport===passport);
    if(!r) { document.getElementById("trackErr").textContent="No application was found with those details."; return; }
    go("track",{lookup:no,trackResult:r});
  };
}

go("elig1",{answers:{}});
