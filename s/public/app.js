"use strict";
const ui={category:"All",metric:"Consistency",date:"all",level:"All levels",search:"",status:"All"};
const app=document.querySelector("#app"),modal=document.querySelector("#modal");
let modalFocus=null,toastTimer;
function toast(message){if(modal.open){let t=modal.querySelector(".modal-message");if(!t){t=document.createElement("p");t.className="modal-message";t.setAttribute("role","alert");modal.querySelector(".modal-head").after(t)}t.textContent=message;return}const t=document.querySelector("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),4500)}
function render(keepPosition=false){
 const focused=document.activeElement,focusId=focused?.id,focusAction=focused?.dataset?.action,focusData=focused?.dataset?.id;
 const y=window.scrollY,[raw="home",sub]=location.hash.slice(1).split("/");
 const route=({memberships:"plans",coaching:"coaches",gallery:"community",branches:"home",visit:"plans"})[raw]||raw||"home";
 let body;
 try{
  body=route==="home"?home():route==="plans"?plans():route==="coaches"?coaches():route==="coach"?coachProfile(sub):route==="community"?community():route==="schedule"?schedule():route==="member"?memberPage(["today","sessions","progress"].includes(sub)?sub:"today"):route==="staff"?staffPage(["overview","inquiries","members","offers","schedule","community"].includes(sub)?sub:"overview"):route==="review"?reviewPage():home();
  app.innerHTML=header(route)+body+footer();
  const main=app.querySelector("main");main?.setAttribute("tabindex","-1");
  if(keepPosition){const replacement=focusId?document.getElementById(focusId):[...app.querySelectorAll("[data-action]")].find(x=>x.dataset.action===focusAction&&x.dataset.id===focusData);replacement?.focus({preventScroll:true})}
  document.title=`${route==="staff"?"Staff":route==="member"?"Member":route==="review"?"Client review":"Pro Fitness Gym"} · ${D.branch().name}`;
  if(keepPosition)window.scrollTo(0,y);else window.scrollTo(0,0);
 }catch(err){app.innerHTML=header("home")+`<main id="main" class="wrap page"><h1>Let’s get you back.</h1><p>There was a problem opening this view.</p>${link("Return home","#home")}</main>`+footer();console.error(err)}
}
function openModal(title,body,wide=false){
 if(!modal.open)modalFocus=document.activeElement;
 modal.classList.toggle("wide",wide);
 modal.innerHTML=`<div class="modal-head"><h2 id="modal-title">${title}</h2><button type="button" class="close-button" data-action="close" aria-label="Close">×</button></div><div class="modal-body">${body}</div>`;
 modal.setAttribute("aria-labelledby","modal-title");
 if(!modal.open)modal.showModal();
 modal.querySelector(".close-button")?.focus({preventScroll:true});
}
function closeModal(){modal.close()}
modal.addEventListener("close",()=>{if(modalFocus?.isConnected)modalFocus.focus();else document.querySelector("main")?.focus({preventScroll:true})});
function actions(label){return `<div class="form-actions"><button type="button" class="secondary" data-action="close">Cancel</button><button class="primary">${label}</button></div>`}
function field(label,name,value="",type="text",attrs=""){return `<label>${label}<input name="${name}" type="${type}" value="${e(value)}" ${attrs}></label>`}
function requestModal(type,ref){
 const m=type==="Coaching"?D.member():null;
 let subject="Membership inquiry",coach,session,plan,promo;
 if(type==="Membership"&&ref==="promo"){promo=D.scoped("promos")[0];subject=promo.name+" · "+peso(promo.price)}
 else if(type==="Membership"&&ref){plan=D.get("plans",ref);subject=plan.name}
 else if(type==="Coaching"){coach=D.get("coaches",ref);subject=coach.name}
 else if(type==="Class"){session=D.get("sessions",ref);subject=session.name}
 openModal(type==="Membership"?"Ask about this plan":type==="Coaching"?"Meet your coach":"Reserve your place",`
  <div class="request-context"><strong>${e(subject)}</strong><span>${D.branch().name}${session?" · "+dateLong(session.date)+" · "+timeLabel(session.time):""}</span></div>
  <form data-form="request" data-type="${type}" data-ref="${e(ref||"")}" data-subject="${e(subject)}">
   ${type==="Coaching"?`<label class="consult-account">Preview member<select name="memberId" id="consult-member"><option value="">New visitor</option>${D.scoped("members").map(x=>`<option value="${x.id}" ${x.id===m?.id?"selected":""}>${e(x.name)}</option>`).join("")}</select></label>`:""}
   <div class="form-grid">${field("Full name","name",m?.name||"","text",'required maxlength="80" autocomplete="name"')}${field("Email","email",m?.email||"","email",'required maxlength="120" autocomplete="email"')}
   ${field("Phone (optional)","phone","","tel",'maxlength="25"')}
   ${type==="Coaching"?`${field("Preferred date","date",D.day(1),"date",`required min="${D.day()}" max="${D.day(90)}"`)}${field("Preferred time","time","10:00","time","required")}`:""}
   <label class="full">Message (optional)<textarea name="note" maxlength="500"></textarea></label></div>
   <p class="fine-print">Preview form · use sample details. Saved in this browser only.</p>
   ${actions(type==="Class"?"Reserve class":"Send inquiry")}
  </form>`);
}
function classModal(id){
 const s=D.get("sessions",id);if(!s||s.branchId!==D.branch().id)return;
 const c=D.get("coaches",s.coachId),r=reserved(s),spots=remaining(s);
 openModal(e(s.name),`<div class="class-details"><div class="class-time"><strong>${weekday(s.date)}, ${dateLong(s.date)}</strong><span>${timeLabel(s.time)} · ${s.duration} minutes</span></div><p>${e(s.description)}</p><dl><div><dt>Coach</dt><dd>${e(c?.name)}</dd></div><div><dt>Branch</dt><dd>${D.branch().name}</dd></div><div><dt>Level</dt><dd>${e(s.level)}</dd></div><div><dt>Location</dt><dd>${e(s.room)}</dd></div><div><dt>Availability</dt><dd>${spots} of ${s.capacity} places remaining</dd></div><div><dt>Bring</dt><dd>${e(s.bring)}</dd></div></dl>${r?`<div class="inline-notice">You have a ${r.status.toLowerCase()} reservation.</div>`:`<button class="primary" data-action="reserve" data-id="${s.id}" ${spots?"":"disabled"}>${spots?"Reserve class":"Class full"}</button>`}<p class="fine-print">Sample schedule · confirm class inclusions with the gym.</p></div>`);
}
function postModal(id){
 const p=D.get("posts",id);if(!p||p.branchId!==D.branch().id)return;
 openModal(e(p.author),`<div class="post-detail"><div>${photo(p.photo,"",true)}</div><div><span class="branch-pill">${D.branch().name} · ${e(p.category)}</span><p class="post-caption">${e(p.caption)}</p><section class="comments"><h3>Conversation</h3>${p.comments.map(c=>`<div class="comment"><strong>${e(c.author)}</strong><p>${e(c.text)}</p></div>`).join("")||'<p class="fine-print">Start the conversation.</p>'}</section><form data-form="comment" data-id="${p.id}"><label><span class="sr-only">Comment</span><textarea name="text" placeholder="Leave some encouragement…" required maxlength="300"></textarea></label><button class="primary">Post comment</button></form><p class="fine-print">Local demo conversation · illustrative stock imagery</p></div></div>`,true);
}
function memberEdit(id){
 const m=id?D.get("members",id):{name:"",email:"",planId:D.scoped("plans")[1]?.id,expiry:D.day(30)};
 openModal(id?"Edit member":"Add a member",`<p class="modal-branch">${D.branch().name}</p><form data-form="member" data-id="${e(id||"")}" class="form-grid">${field("Full name","name",m.name,"text",'required maxlength="80"')}${field("Email","email",m.email,"email",'required maxlength="120"')}<label>Plan<select name="planId">${D.scoped("plans").map(p=>`<option value="${p.id}" ${p.id===m.planId?"selected":""}>${e(p.name)}</option>`).join("")}</select></label>${field("Expires","expiry",m.expiry,"date","required")}<div class="full">${actions("Save member")}</div></form>`);
}
function sessionEdit(id){
 const s=id?D.get("sessions",id):{name:"",coachId:D.scoped("coaches")[0].id,date:D.day(1),time:"09:00",duration:45,capacity:10,level:"All levels",room:"Studio floor",description:"",bring:"Water, a towel, and training shoes"};
 openModal(id?"Edit class":"Add a class",`<p class="modal-branch">${D.branch().name}</p><form data-form="session" data-id="${e(id||"")}" class="form-grid">${field("Class name","name",s.name,"text",'required maxlength="70"')}<label>Coach<select name="coachId">${D.scoped("coaches").map(c=>`<option value="${c.id}" ${c.id===s.coachId?"selected":""}>${e(c.name)}</option>`).join("")}</select></label>${field("Date","date",s.date,"date",`required min="${D.day()}"`)}${field("Time","time",s.time,"time","required")}${field("Duration (minutes)","duration",s.duration,"number",'required min="15" max="180"')}${field("Capacity","capacity",s.capacity,"number",'required min="1" max="100"')}<label>Level<select name="level">${["Beginner","All levels","Intermediate"].map(x=>`<option ${x===s.level?"selected":""}>${x}</option>`).join("")}</select></label>${field("Location in gym","room",s.room,"text",'required maxlength="60"')}<label class="full">Description<textarea name="description" required maxlength="500">${e(s.description)}</textarea></label><label class="full">What to bring<input name="bring" required maxlength="150" value="${e(s.bring)}"></label><div class="full">${actions("Save class")}</div></form>`,true);
}
function reviewRequest(id){
 const r=D.get("requests",id);if(!r)return;
 openModal("Review inquiry",`<div class="request-context"><strong>${e(r.name)}</strong><span>${e(r.email)}${r.phone?" · "+e(r.phone):""}</span></div><dl class="review-request"><div><dt>Branch</dt><dd>${D.branch().name}</dd></div><div><dt>Request</dt><dd>${e(r.subject||r.type)}</dd></div><div><dt>When</dt><dd>${dateLong(r.date)} ${timeLabel(r.time)}</dd></div></dl>${r.note?`<p>${e(r.note)}</p>`:""}<form data-form="status" data-id="${r.id}"><label>Status<select name="status">${["New","Confirmed","Completed","Declined","Cancelled"].map(s=>`<option ${s===r.status?"selected":""}>${s}</option>`).join("")}</select></label>${actions("Save status")}</form>`);
}
function openWorkout(){openModal("Log your session",`<form data-form="workout"><div class="form-grid"><label class="full">Lift<select name="exercise"><option>Deadlift</option><option>Squat</option><option>Bench press</option></select></label>${field("Weight (kg)","weight","","number",'min="0.5" max="500" step="0.5" required')}${field("Repetitions","reps","5","number",'min="1" max="50" required')}</div><p class="fine-print">Your personal record stays private in this demo profile until staff verifies it for the effort board.</p>${actions("Save workout")}</form>`)}
function credits(){openModal("Images & presentation",`<p>The lobby photo was supplied for this project. Other imagery is stock photography for the presentation, and does not depict the gym’s actual staff or members.</p><ul class="credit-list">${Object.values(pic).filter(p=>p.source).map(p=>`<li><a href="${p.source}" target="_blank" rel="noopener noreferrer">${e(p.credit)} ↗</a></li>`).join("")}</ul><p>All services, records, profiles, and credentials are sample content pending the gym’s approval.</p>`)}
function mutation(fn,message){try{fn();render(true);toast(D.persistence?message:"Saved for this visit. Browser storage is unavailable.");return true}catch(err){toast(err.message);return false}}
document.addEventListener("click",event=>{
 if(event.target.closest(".skip-link")){event.preventDefault();document.querySelector("main")?.focus();return}
 const c=event.target.closest("[data-action]");if(!c)return;
 const a=c.dataset.action,id=c.dataset.id;
 if(a==="close"){closeModal();return}
 if(a==="branch"){D.setBranch(id);ui.date="all";location.hash="#home";render();return}
 if(a==="inquire-plan"){requestModal("Membership",id);return}
 if(a==="inquire-promo"){requestModal("Membership","promo");return}
 if(a==="consult"){requestModal("Coaching",id);return}
 if(a==="class"){classModal(id);return}
 if(a==="reserve"){
  const m=D.member();
  openModal("Reserve your place",`<div class="request-context"><strong>${e(D.get("sessions",id).name)}</strong><span>${D.branch().name} · ${dateLong(D.get("sessions",id).date)}</span></div><form data-form="reserve" data-id="${id}"><label>Preview member<select name="memberId">${D.scoped("members").map(x=>`<option value="${x.id}" ${x.id===m?.id?"selected":""}>${e(x.name)}</option>`).join("")}</select></label><p class="fine-print">Sample reservation · real member sign-in will be connected for launch.</p>${actions("Confirm reservation")}</form>`);return;
 }
 if(a==="category"){ui.category=id;render(true);return}
 if(a==="date"){ui.date=id;render(true);return}
 if(a==="like"){mutation(()=>D.toggleLike(id),"Reaction updated.");return}
 if(a==="post-detail"){postModal(id);return}
 if(a==="new-post"){openModal("Share a moment",`<form data-form="post"><label>Your moment<textarea name="caption" required maxlength="600" placeholder="A small win, a good session, or a little encouragement…"></textarea></label><div class="form-grid"><label>Category<select name="category"><option>Community</option><option>People</option><option>Equipment</option></select></label><label>Photo<select name="photo"><option value="community">Community</option><option value="training">Training</option><option value="equipment">Equipment</option><option value="lobby">Pro Fitness lobby</option></select></label></div><p class="fine-print">Posting as ${e(D.member()?.name||"a preview member")} · local sample post</p>${actions("Share moment")}</form>`);return}
 if(a==="checkin"){mutation(()=>D.checkin(),"Checked in. Have a great session.");return}
 if(a==="workout"){openWorkout();return}
 if(a==="challenge"){mutation(()=>D.joinChallenge(),"You’re in. Every visit counts.");return}
 if(a==="edit-member"){memberEdit(id);return}
 if(a==="edit-session"){sessionEdit(id);return}
 if(a==="edit-plan"){const p=D.get("plans",id);openModal("Edit "+e(p.name),`<form data-form="plan" data-id="${p.id}" class="stack">${field("Price (PHP)","price",p.price,"number",'required min="0" max="100000"')}${field("Period","term",p.term,"text",'required maxlength="40"')}<label>Inclusions<textarea name="features" required maxlength="500">${e(p.features.join("\n"))}</textarea></label>${actions("Save rate")}</form>`);return}
 if(a==="review-request"){reviewRequest(id);return}
 if(a==="cancel"){openModal("Cancel this reservation?",`<p>This frees your place and updates your sessions.</p><form data-form="cancel" data-id="${id}">${actions("Cancel reservation")}</form>`);return}
 if(a==="verify-lift"){openModal("Verify this lift?",`<p>Confirm this lift was checked by staff. It will then appear on the sample effort board.</p><form data-form="verify" data-id="${id}">${actions("Verify lift")}</form>`);return}
 if(a==="reset"){openModal("Restore sample data?",`<p>This clears changes made in this presentation for both branches.</p><form data-form="reset">${actions("Restore samples")}</form>`);return}
 if(a==="credits"){credits();return}
 if(a==="copy-review"){
  const url=new URL(location.href);url.hash="review";
  if(url.protocol==="file:"){toast("Deploy the public folder first, then share the /#review link.");return}
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url.href).then(()=>toast("Client-review link copied.")).catch(()=>openModal("Client-review link",`<input readonly value="${e(url.href)}" aria-label="Client-review link">`));
  else openModal("Client-review link",`<input readonly value="${e(url.href)}" aria-label="Client-review link">`);
 }
});
document.addEventListener("change",event=>{
 const t=event.target;
 if(t.id==="branch"){
  if(modal.open)modal.close();
  D.setBranch(t.value);ui.date="all";ui.search="";ui.status="All";
  if(location.hash.startsWith("#coach/"))location.hash="coaches";else render(true);
 }
 if(t.id==="consult-member"){const m=D.get("members",t.value);t.form.elements.name.value=m?.name||"";t.form.elements.email.value=m?.email||""}
 if(t.id==="member-choice"){D.selectMember(t.value);render(true)}
 if(t.id==="metric"){ui.metric=t.value;render(true)}
 if(t.id==="level"){ui.level=t.value;render(true)}
 if(t.id==="status-filter"){ui.status=t.value;document.querySelector("#inquiry-results").innerHTML=staffTable("requests",filteredRequests())}
});
document.addEventListener("input",event=>{if(event.target.id==="inquiry-search"){ui.search=event.target.value;document.querySelector("#inquiry-results").innerHTML=staffTable("requests",filteredRequests())}});
document.addEventListener("submit",event=>{
 const f=event.target;if(!f.dataset.form)return;event.preventDefault();
 if(!f.reportValidity())return;
 const data=Object.fromEntries(new FormData(f)),kind=f.dataset.form,id=f.dataset.id;
 try{
  if(kind==="request"){
   const ref=f.dataset.ref,type=f.dataset.type;
   D.addRequest({...data,type,subject:f.dataset.subject,planId:type==="Membership"&&ref!=="promo"?ref:"",coachId:type==="Coaching"?ref:"",memberId:data.memberId||""});
   render(true);openModal("Inquiry saved",`<div class="success-mark">✓</div><h3>Thank you, ${e(data.name.split(" ")[0])}.</h3><p>Your ${D.branch().name} inquiry is saved in the demo staff inbox.</p><p class="fine-print">No message has been sent to the gym.</p>${link("View staff demo "+arrow,"#staff/inquiries")}`);return;
  }
  if(kind==="reserve"){
   D.selectMember(data.memberId);const m=D.member();
   D.addRequest({type:"Class",sessionId:id,memberId:m.id,name:m.name,email:m.email});
   render(true);openModal("You’re on the list.",`<div class="success-mark">✓</div><p>Your sample place is reserved at ${D.branch().name}.</p>${link("See my sessions "+arrow,"#member/sessions")}`);return;
  }
  if(kind==="comment"){D.comment(id,data.text);render(true);postModal(id);return}
  if(kind==="post"){D.post(data);ui.category="All"}
  if(kind==="promo"){D.editPromo({...data,active:f.elements.active.checked})}
  if(kind==="member"){D.editMember(id,data)}
  if(kind==="plan"){D.editPlan(id,data)}
  if(kind==="session"){D.editSession(id,data)}
  if(kind==="status"){D.status(id,data.status)}
  if(kind==="cancel"){D.status(id,"Cancelled")}
  if(kind==="workout"){D.logWorkout(data)}
  if(kind==="verify"){D.verifyLift(id)}
  if(kind==="reset"){D.reset();ui.search="";ui.status="All"}
  closeModal();render(true);toast(D.persistence?(kind==="post"?"Moment shared.":kind==="workout"?"Workout logged.":"Saved."):"Saved for this visit. Browser storage is unavailable.");
 }catch(err){toast(err.message)}
});
modal.addEventListener("click",event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal()}});
window.addEventListener("hashchange",()=>{if(modal.open)closeModal();render();document.querySelector("main")?.focus({preventScroll:true})});
render();
