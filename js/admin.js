// Consular officer portal (admin.html)
// NOTE: demo login only. Replace with server-side authentication before real use.
const ADMIN_USER = "officer", ADMIN_PASS = "consulate123", SESSION_KEY = "tatkaal_admin_session";

function render(){
  const s = state.screen;
  if (s === "adminLogin") return renderAdminLogin();
  if (s === "adminDash") return renderAdminDash();
  if (s === "adminReview") return renderAdminReview();
}

function renderAdminLogin(){
  app.innerHTML = `<div class="card" style="max-width:420px; margin:0 auto;">
    <div class="card-head" style="background:var(--navy-2);">Consular officer login</div>
    <div class="card-body">
      <label>Username</label><input type="text" id="u">
      <label>Password</label><input type="password" id="p">
      <p id="loginErr" class="err"></p>
      <p class="hint">Demo credentials — officer / consulate123</p>
      <div class="actions"><span></span>
      <button class="btn primary" id="login">Log in</button></div>
    </div></div>`;
  document.getElementById("login").onclick = () => {
    const u = document.getElementById("u").value.trim();
    const p = document.getElementById("p").value.trim();
    if (u === ADMIN_USER && p === ADMIN_PASS){ sessionStorage.setItem(SESSION_KEY,"1"); go("adminDash", { tab:"pending" }); }
    else document.getElementById("loginErr").textContent = "Incorrect username or password.";
  };
}

function renderAdminDash(){
  const list = load().sort((a,b)=>b.submittedAt-a.submittedAt);
  const tab = state.tab || "pending";
  const filtered = tab === "all" ? list : list.filter(x => x.status === tab);
  const counts = { pending:0, approved:0, rejected:0 };
  list.forEach(x => counts[x.status]++);
  app.innerHTML = `
  <div class="topbar">
    <h2 class="title" style="margin:0;">Tatkaal Pre-Screening Admin Portal</h2>
    <button class="btn link" id="logout">Log out</button>
  </div>
  <div class="card">
    <div class="card-body">
      <div class="tabs">
        <button class="tab ${tab==='pending'?'active':''}" data-t="pending">Pending (${counts.pending})</button>
        <button class="tab ${tab==='approved'?'active':''}" data-t="approved">Approved (${counts.approved})</button>
        <button class="tab ${tab==='rejected'?'active':''}" data-t="rejected">Rejected (${counts.rejected})</button>
        <button class="tab ${tab==='all'?'active':''}" data-t="all">All (${list.length})</button>
      </div>
      ${filtered.length===0 ? `<p class="small">No applications in this view.</p>` : `
      <div class="tablewrap"><table><thead><tr>
        <th>Passport no.</th><th>Name</th><th>Type</th><th>Date</th><th>Status</th><th></th>
      </tr></thead><tbody>
        ${filtered.map(r => `<tr>
          <td>${r.passport}</td><td>${r.name}</td><td>${r.applicantType}</td><td>${fmtDate(r.submittedAt)}</td>
          <td><span class="pill ${r.status}">${r.status}</span></td>
          <td><button class="btn ghost" data-id="${r.id}" style="padding:6px 12px;">${r.status==='pending'?'Review':'View'}</button></td>
        </tr>`).join("")}
      </tbody></table></div>`}
    </div>
  </div>`;
  document.getElementById("logout").onclick = () => { sessionStorage.removeItem(SESSION_KEY); go("adminLogin"); };
  app.querySelectorAll(".tab").forEach(b => b.onclick = () => go("adminDash", { tab:b.dataset.t }));
  app.querySelectorAll("button[data-id]").forEach(b => b.onclick = () => go("adminReview", { id:b.dataset.id, tab }));
}

function renderAdminReview(){
  const list = load();
  const r = list.find(x => x.id === state.id);
  if (!r) return go("adminDash", { tab:"pending" });
  app.innerHTML = `
  <button class="btn link" id="back" style="padding:0; margin-bottom:14px;">← Back to applications</button>
  <div class="card"><div class="card-body">
    <div class="grid2">
      <div>
        <h2 class="title">Applicant details</h2>
        <div class="kv"><b>Full name</b>${r.name}</div>
        <div class="kv"><b>Passport no.</b>${r.passport}</div>
        <div class="kv"><b>Applicant type</b>${r.applicantType}</div>
        <div class="kv"><b>Phone</b>${r.phone}</div>
        <div class="kv"><b>Email</b>${r.email}</div>
        <div class="kv"><b>Reason for Tatkaal</b>${r.reason}</div>
        <div class="kv"><b>Submitted</b>${fmtDate(r.submittedAt)}</div>
        <label style="margin-top:14px;">Uploaded documents</label>
        ${docThumb("Passport copy", r.docs.passport)}
        ${docThumb("Immigration status proof", r.docs.status)}
        ${r.docs.parent ? docThumb("Parent's immigration status", r.docs.parent) : ""}
      </div>
      <div>
        ${r.status === "pending" ? `
        <h2 class="title">Decision</h2>
        <div class="actions" style="margin-top:0;">
          <button class="btn primary" id="approve" style="flex:1;">Approve</button>
        </div>
        <label style="margin-top:18px;">Or reject with reason</label>
        <div class="reasons">
          ${REJECT_REASONS.map((rs,i) => `<label><input type="radio" name="reason" value="${rs}" id="r${i}">${rs}</label>`).join("")}
        </div>
        <button class="btn danger" id="reject" style="width:100%;">Submit rejection</button>
        <p id="reviewErr" class="err"></p>
        ` : `
        <h2 class="title">Decision recorded</h2>
        <div class="notice ${r.status==='approved'?'green':'red'}">
          Application <b>${r.status}</b> on ${fmtDate(r.decidedAt)}.
          ${r.rejectionReason ? `<br>Reason: ${r.rejectionReason}` : ""}
        </div>`}
      </div>
    </div>
  </div></div>`;
  document.getElementById("back").onclick = () => go("adminDash", { tab: state.tab || "pending" });
  const approveBtn = document.getElementById("approve");
  if (approveBtn) approveBtn.onclick = () => {
    r.status = "approved"; r.decidedAt = Date.now(); save(list);
    toast(`Approval email/SMS sent to ${r.email} — passport ${r.passport} approved for Tatkaal renewal.`);
    go("adminDash", { tab:"pending" });
  };
  const rejectBtn = document.getElementById("reject");
  if (rejectBtn) rejectBtn.onclick = () => {
    const sel = app.querySelector('input[name="reason"]:checked');
    if (!sel){ document.getElementById("reviewErr").textContent = "Select a rejection reason first."; return; }
    r.status = "rejected"; r.rejectionReason = sel.value; r.decidedAt = Date.now(); save(list);
    toast(`Rejection email/SMS sent to ${r.email} — reason: ${sel.value}`);
    go("adminDash", { tab:"pending" });
  };
}

if (sessionStorage.getItem(SESSION_KEY)) go("adminDash", { tab:"pending" }); else go("adminLogin");
