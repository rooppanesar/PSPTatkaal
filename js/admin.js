// Consular officer portal (admin.html)
// Demo only. Authentication and data access must move server-side before real use.
const ADMIN_USER = "officer", ADMIN_PASS = "consulate123", SESSION_KEY = "tatkaal_admin_session";

function render(){
  const s=state.screen;
  if(s==="adminLogin") return renderAdminLogin();
  if(s==="adminDash") return renderAdminDash();
  if(s==="adminReview") return renderAdminReview();
}

function renderAdminLogin(){
  app.innerHTML=`<div class="card" style="max-width:420px;margin:0 auto;"><div class="card-head" style="background:var(--navy-2);">Consular Officer Login</div><div class="card-body">
    <label>Username</label><input type="text" id="u" autocomplete="username"><label>Password</label><input type="password" id="p" autocomplete="current-password">
    <p id="loginErr" class="err"></p><p class="hint">Demo login: officer / consulate123</p>
    <div class="actions"><span></span><button class="btn primary" id="login">Log in</button></div>
  </div></div>`;
  document.getElementById("login").onclick=()=>{const u=document.getElementById("u").value.trim(),p=document.getElementById("p").value.trim();if(u===ADMIN_USER&&p===ADMIN_PASS){sessionStorage.setItem(SESSION_KEY,"1");go("adminDash",{tab:"pending",query:""});}else document.getElementById("loginErr").textContent="Incorrect username or password.";};
}

function renderAdminDash(){
  const list=load().sort((a,b)=>b.submittedAt-a.submittedAt), tab=state.tab||"pending", query=(state.query||"").trim().toLowerCase();
  const counts={pending:0,approved:0,rejected:0}; list.forEach(x=>counts[x.status]++);
  let filtered=tab==="all"?list:list.filter(x=>x.status===tab);
  if(query) filtered=filtered.filter(x=>[x.applicationNumber,x.passport,x.name,x.email].some(v=>String(v||"").toLowerCase().includes(query)));
  app.innerHTML=`<div class="topbar"><div><h2 class="title" style="margin:0;">Tatkaal Officer Dashboard</h2><div class="small">Application review and decision</div></div><button class="btn link" id="logout">Log out</button></div>
  <div class="stat-grid"><div class="stat"><b>${counts.pending}</b><span>Pending Review</span></div><div class="stat"><b>${counts.approved}</b><span>Approved</span></div><div class="stat"><b>${counts.rejected}</b><span>Rejected</span></div><div class="stat"><b>${list.length}</b><span>Total Applications</span></div></div>
  <div class="card"><div class="card-body"><div class="search-row"><input type="search" id="search" value="${escapeHtml(state.query||"")}" placeholder="Search by application no., name or passport number…"><button class="btn primary" id="searchBtn">Search</button></div>
    <div class="tabs"><button class="tab ${tab==='pending'?'active':''}" data-t="pending">Pending (${counts.pending})</button><button class="tab ${tab==='approved'?'active':''}" data-t="approved">Approved (${counts.approved})</button><button class="tab ${tab==='rejected'?'active':''}" data-t="rejected">Rejected (${counts.rejected})</button><button class="tab ${tab==='all'?'active':''}" data-t="all">All (${list.length})</button></div>
    ${filtered.length===0?`<p class="small">No applications found.</p>`:`<div class="tablewrap"><table><thead><tr><th>Application</th><th>Passport</th><th>Name</th><th>Type</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>
      ${filtered.map(r=>`<tr><td><b>${escapeHtml(r.applicationNumber)}</b></td><td>${escapeHtml(r.passport)}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.applicantType)}</td><td>${escapeHtml(fmtDate(r.submittedAt))}</td><td><span class="pill ${escapeHtml(r.status)}">${escapeHtml(r.status)}</span></td><td><button class="btn ghost" data-id="${escapeHtml(r.id)}" style="padding:6px 12px;">${r.status==='pending'?'Review':'View'}</button></td></tr>`).join("")}
    </tbody></table></div>`}
  </div></div>`;
  document.getElementById("logout").onclick=()=>{sessionStorage.removeItem(SESSION_KEY);go("adminLogin");};
  document.getElementById("searchBtn").onclick=()=>go("adminDash",{tab,query:document.getElementById("search").value});
  document.getElementById("search").onkeydown=e=>{if(e.key==='Enter')document.getElementById("searchBtn").click();};
  app.querySelectorAll(".tab").forEach(b=>b.onclick=()=>go("adminDash",{tab:b.dataset.t,query:""}));
  app.querySelectorAll("button[data-id]").forEach(b=>b.onclick=()=>go("adminReview",{id:b.dataset.id,tab,query}));
}

function renderAdminReview(){
  const list=load(),r=list.find(x=>x.id===state.id); if(!r)return go("adminDash",{tab:state.tab||"pending",query:state.query||""});
  const answers=r.eligibility||{};
  app.innerHTML=`<button class="btn link" id="back" style="padding:0;margin-bottom:14px;">← Back to applications</button>
  <div class="card"><div class="card-body"><div class="review-head"><div><h2 class="title" style="margin-bottom:5px;">Application Review</h2><div class="reference-number">${escapeHtml(r.applicationNumber)}</div></div><span class="pill ${escapeHtml(r.status)}">${escapeHtml(r.status)}</span></div>
  <div class="grid2"><div><h3 class="section-title">Applicant details</h3>
    <div class="kv"><b>Full name</b>${escapeHtml(r.name)}</div>${r.dob?`<div class="kv"><b>Date of birth</b>${escapeHtml(r.dob)}</div>`:""}
    <div class="kv"><b>Passport no.</b>${escapeHtml(r.passport)}</div><div class="kv"><b>Applicant type</b>${escapeHtml(r.applicantType)}</div><div class="kv"><b>Phone</b>${escapeHtml(r.phone)}</div><div class="kv"><b>Email</b>${escapeHtml(r.email)}</div><div class="kv"><b>Reason for Tatkaal</b>${escapeHtml(r.reason)}</div><div class="kv"><b>Submitted</b>${escapeHtml(fmtDateTime(r.submittedAt))}</div>
    <h3 class="section-title" style="margin-top:20px;">Eligibility answers</h3>${Object.entries(answers).map(([k,v])=>`<div class="kv inline-kv"><b>${escapeHtml(k)}</b>${escapeHtml(v)}</div>`).join("")}
    <h3 class="section-title" style="margin-top:20px;">Uploaded documents</h3>${docThumb("Passport copy",r.docs.passport)}${docThumb("Immigration status proof",r.docs.status)}${r.docs.parent?docThumb("Parent's immigration status",r.docs.parent):""}
  </div><div>
    ${r.status==='pending'?`<h3 class="section-title">Decision</h3><div class="decision-box"><div class="decision-actions"><button class="btn primary" id="approve" style="flex:1;">Approve application</button></div>
      <label>Rejection reason</label><div class="reasons">${REJECT_REASONS.map((rs,i)=>`<label><input type="radio" name="reason" value="${escapeHtml(rs)}" id="r${i}">${escapeHtml(rs)}</label>`).join("")}</div>
      <label>Officer remarks (optional)</label><textarea id="remarks" maxlength="500" placeholder="Enter remarks"></textarea><button class="btn danger" id="reject" style="width:100%;margin-top:12px;">Reject application</button><p id="reviewErr" class="err"></p></div>`:
      `<h3 class="section-title">Decision recorded</h3><div class="notice ${r.status==='approved'?'green':'red'}"><b>${escapeHtml(r.status.toUpperCase())}</b><br>Decision date: ${escapeHtml(fmtDateTime(r.decidedAt))}${r.rejectionReason?`<br>Reason: ${escapeHtml(r.rejectionReason)}`:""}${r.remarks?`<br>Remarks: ${escapeHtml(r.remarks)}`:""}</div>`}
    <h3 class="section-title" style="margin-top:20px;">Application history</h3><div class="history">${(r.history||[]).slice().reverse().map(h=>`<div class="history-item"><b>${escapeHtml(h.action)}</b><span>${escapeHtml(fmtDateTime(h.at))}</span></div>`).join("")}</div>
  </div></div></div></div>`;
  document.getElementById("back").onclick=()=>go("adminDash",{tab:state.tab||"pending",query:state.query||""});
  const approve=document.getElementById("approve"); if(approve) approve.onclick=()=>{r.status="approved";r.decidedAt=Date.now();r.remarks=document.getElementById("remarks")?.value.trim()||"";r.rejectionReason=null;r.history=r.history||[];r.history.push({action:"Application approved",at:r.decidedAt,status:"approved"});save(list);toast(`Application ${r.applicationNumber} approved. Demo notification recorded.`);go("adminReview",{id:r.id,tab:"pending",query:""});};
  const reject=document.getElementById("reject"); if(reject) reject.onclick=()=>{const sel=app.querySelector('input[name="reason"]:checked');if(!sel){document.getElementById("reviewErr").textContent="Select a rejection reason first.";return;}r.status="rejected";r.rejectionReason=sel.value;r.decidedAt=Date.now();r.remarks=document.getElementById("remarks").value.trim();r.history=r.history||[];r.history.push({action:"Application rejected",at:r.decidedAt,status:"rejected",reason:r.rejectionReason});save(list);toast(`Application ${r.applicationNumber} rejected. Demo notification recorded.`);go("adminReview",{id:r.id,tab:"pending",query:""});};
}

if(sessionStorage.getItem(SESSION_KEY))go("adminDash",{tab:"pending",query:""});else go("adminLogin");
