// Applicant portal (index.html)

function render(){
  const s = state.screen;
  if (s === "elig1") return renderElig1();
  if (s === "notElig") return renderNotEligible();
  if (s === "elig2") return renderElig2();
  if (s === "form") return renderForm();
  if (s === "duplicate") return renderDuplicate();
  if (s === "success") return renderSuccess();
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
      ${Q1.map(([k,label]) => `
        <div class="q"><p>${label}</p>
        <div class="opts">
          <button class="opt ${a[k]==='yes'?'sel':''}" data-k="${k}" data-v="yes">Yes</button>
          <button class="opt ${a[k]==='no'?'sel':''}" data-k="${k}" data-v="no">No</button>
        </div></div>`).join("")}
      <div class="actions"><span></span>
        <button class="btn primary" id="cont" ${Object.keys(a).length<6?"disabled":""}>Continue →</button>
      </div>
    </div></div>`;
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    state.answers = { ...state.answers, [b.dataset.k]: b.dataset.v };
    render();
  });
  const cont = document.getElementById("cont");
  if (cont) cont.onclick = () => {
    const a = state.answers;
    const eligible = a.indian==="yes" && a.jurisdiction==="yes" && a.notExpired==="yes" && a.under12==="yes" && a.status==="yes" && a.changes==="no";
    if (!eligible) return go("notElig", {});
    go("elig2", { answers:{} });
  };
}

function renderNotEligible(){
  app.innerHTML = `<div class="card">
    <div class="card-head" style="background:var(--red);">Step 2 of 3</div>
    <div class="card-body" style="text-align:center;">
      <div class="result-icon" style="background:var(--red);">✕</div>
      <h2 class="title" style="text-align:center;">Not eligible</h2>
      <p class="small">Based on your answers, you may not be eligible for Tatkaal renewal right now.</p>
      <div class="notice amber" style="text-align:left;">
        <b>Recommendations</b>
        <ul style="margin:8px 0 0; padding-left:18px;">
          <li>Check whether you qualify for regular passport renewal instead</li>
          <li>Contact CGI Vancouver for specific guidance</li>
          <li>Visit the official MEA portal for more options</li>
        </ul>
      </div>
      <div class="notice" style="background:var(--bg); text-align:left; border:1px solid var(--line);">
        <b style="display:block; margin-bottom:4px;">Contact information</b>
        CGI Vancouver Helpline — cgivan.passport@mea.gov.in
      </div>
      <button class="btn ghost" id="restart">Start over</button>
    </div></div>`;
  document.getElementById("restart").onclick = () => go("elig1", { answers:{} });
}

function renderElig2(){
  const a = state.answers || {};
  const isMinor = a.minor;
  app.innerHTML = `<div class="card">
    <div class="card-head" style="background:var(--navy-2);">Minor Eligibility Check</div>
    <div class="card-body">
      ${progressBar(2,3)}
      <div class="q"><p>A. Is the applicant a minor (under 18)?</p>
        <div class="opts">
          <button class="opt ${a.minor==='yes'?'sel':''}" data-k="minor" data-v="yes">Yes</button>
          <button class="opt ${a.minor==='no'?'sel':''}" data-k="minor" data-v="no">No</button>
        </div></div>
      ${isMinor==='yes' ? `
      <div class="q"><p>B. Do both parents have valid status in Canada?</p>
        <div class="opts">
          <button class="opt ${a.bothParents==='yes'?'sel':''}" data-k="bothParents" data-v="yes">Yes</button>
          <button class="opt ${a.bothParents==='no'?'sel':''}" data-k="bothParents" data-v="no">No</button>
        </div></div>
      <div class="q"><p>C. If single parent, can you provide a custody letter or consent?</p>
        <div class="opts">
          <button class="opt ${a.custody==='yes'?'sel':''}" data-k="custody" data-v="yes">Yes</button>
          <button class="opt ${a.custody==='no'?'sel':''}" data-k="custody" data-v="no">No</button>
          <button class="opt ${a.custody==='na'?'sel':''}" data-k="custody" data-v="na">N/A</button>
        </div></div>` : ""}
      <div class="actions">
        <button class="btn ghost" id="back">← Back</button>
        <button class="btn primary" id="cont">Continue →</button>
      </div>
    </div></div>`;
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    state.answers = { ...state.answers, [b.dataset.k]: b.dataset.v };
    render();
  });
  document.getElementById("back").onclick = () => go("elig1", { answers:{} });
  document.getElementById("cont").onclick = () => {
    const a = state.answers;
    if (!a.minor) return;
    if (a.minor === "yes"){
      if (!a.bothParents || !a.custody) return;
      const ok = a.bothParents === "yes" || a.custody === "yes" || a.custody === "na";
      if (!ok) return go("notElig", {});
    }
    go("form", { applicantType: a.minor==="yes" ? "minor" : "adult" });
  };
}

function renderForm(){
  const type = state.applicantType;
  app.innerHTML = `<div class="card">
    <div class="card-head" style="background:#5B2D8E;">Application Form</div>
    <div class="card-body">
      ${progressBar(3,3)}
      <p class="small">This portal is for Indian nationals in Canada seeking Tatkaal (expedited) passport renewal.</p>
      <ul class="small" style="padding-left:18px;">
        <li>Upload clear JPEG images only</li>
        <li>Passport image must show the photo and details page</li>
        <li>Status proof: PR card / Work permit / Study permit</li>
        <li>Incomplete or unclear submissions may be rejected</li>
      </ul>
      <label>Full name</label><input type="text" id="f_name">
      <label>Passport number</label><input type="text" id="f_passport" style="text-transform:uppercase;">
      <label>Phone number</label><input type="tel" id="f_phone">
      <label>Email address</label><input type="email" id="f_email">
      <label>Reason for Tatkaal (max 300 characters)</label>
      <textarea id="f_reason" maxlength="300"></textarea>
      <label>Upload passport (JPEG only)</label>
      <div class="file"><input type="file" id="f_doc_passport" accept="image/jpeg"></div>
      <label>Upload immigration status proof (JPEG only)</label>
      <div class="file"><input type="file" id="f_doc_status" accept="image/jpeg"></div>
      ${type === "minor" ? `
      <label>Upload parent's immigration status (JPEG only)</label>
      <div class="file"><input type="file" id="f_doc_parent" accept="image/jpeg"></div>` : ""}
      <p id="formErr" class="err"></p>
      <div class="actions">
        <button class="btn ghost" id="back">← Back</button>
        <button class="btn primary" id="submit">Submit application</button>
      </div>
    </div></div>`;
  document.getElementById("back").onclick = () => go("elig2", { answers: state.answers });
  document.getElementById("submit").onclick = async () => {
    const name = document.getElementById("f_name").value.trim();
    const passport = document.getElementById("f_passport").value.trim().toUpperCase();
    const phone = document.getElementById("f_phone").value.trim();
    const email = document.getElementById("f_email").value.trim();
    const reason = document.getElementById("f_reason").value.trim();
    const docPassport = document.getElementById("f_doc_passport").files[0];
    const docStatus = document.getElementById("f_doc_status").files[0];
    const docParent = type==="minor" ? document.getElementById("f_doc_parent").files[0] : null;
    const errEl = document.getElementById("formErr");
    if (!name || !passport || !phone || !email || !reason || !docPassport || !docStatus || (type==="minor" && !docParent)){
      errEl.textContent = "Please complete every field and upload the required documents.";
      return;
    }
    const submitBtn = document.getElementById("submit");
    submitBtn.disabled = true; submitBtn.textContent = "Processing documents…";
    try{
      const [passportImg, statusImg, parentImg] = await Promise.all([
        toPreviewImage(docPassport), toPreviewImage(docStatus), docParent ? toPreviewImage(docParent) : Promise.resolve(null)
      ]);
      const list = load();
      const now = Date.now();
      const thirtyDays = 30*24*60*60*1000;
      const prior = list.filter(x => x.passport === passport).sort((a,b)=>b.submittedAt-a.submittedAt)[0];
      if (prior && (now - prior.submittedAt) < thirtyDays){
        const allowed = prior.status === "rejected" && prior.rejectionReason === RESUBMIT_OK_REASON;
        if (!allowed) return go("duplicate", { prior });
      }
      const record = {
        id: uid(), passport, name, phone, email, reason, applicantType:type,
        docs: {
          passport: { name: docPassport.name, img: passportImg },
          status: { name: docStatus.name, img: statusImg },
          parent: docParent ? { name: docParent.name, img: parentImg } : null
        },
        status:"pending", submittedAt: now, rejectionReason:null, decidedAt:null
      };
      list.push(record); save(list);
      go("success", { record });
    } catch(e){
      errEl.textContent = "Could not save the application (a file may be unreadable, or the browser storage is full). Please try again with JPEG images.";
      submitBtn.disabled = false; submitBtn.textContent = "Submit application";
    }
  };
}

// Reads a File and returns a downsized JPEG data URL, so previews stay small enough for local storage.

function toPreviewImage(file, maxDim = 1400, quality = 0.8){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("bad image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim){
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width*scale); height = Math.round(height*scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderDuplicate(){
  app.innerHTML = `<div class="card">
    <div class="card-body" style="text-align:center;">
      <div class="result-icon" style="background:var(--amber);">!</div>
      <h2 class="title" style="text-align:center;">Application already on file</h2>
      <p class="small">This passport number was submitted within the last 30 days and a decision (or review) is still recorded for it. You can reapply once 30 days have passed, or sooner if you were asked to resubmit clearer documents.</p>
      <button class="btn ghost" id="restart">Start over</button>
    </div></div>`;
  document.getElementById("restart").onclick = () => go("elig1", { answers:{} });
}

function renderSuccess(){
  const r = state.record;
  app.innerHTML = `<div class="card">
    <div class="card-body" style="text-align:center;">
      <div class="result-icon" style="background:var(--green);">✓</div>
      <h2 class="title" style="text-align:center;">Application submitted</h2>
      <p class="small">Your application (passport ${r.passport}) has been sent to CGI Vancouver for review. You'll receive an email or SMS once a decision is made — usually within a few hours during business days.</p>
      <button class="btn ghost" id="restart">Back to start</button>
    </div></div>`;
  document.getElementById("restart").onclick = () => go("elig1", { answers:{} });
}

go("elig1", { answers:{} });
