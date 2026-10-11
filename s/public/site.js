import {classes,coaches,rates,escapeHTML as e,peso,manilaDate,membershipLabel} from './content.js';
import {createMemberAPI} from './member-api.js';

const api = createMemberAPI(__SUPABASE_URL__, __SUPABASE_ANON_KEY__);
const state = {session:null,ready:false,recovery:false,profile:null,workouts:[],error:'',loading:false};
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const arrow = '<span aria-hidden="true">↗</span>';
let loadVersion = 0, toastTimer, previousFocus;
const link = (label,href,cls='primary') => `<a class="${cls}" href="${href}">${label}</a>`;
const logo = () => '<a class="brand" href="#home" aria-label="Pro Fitness Gym home"><img src="images/logo.png" alt="Pro Fitness Gym" width="96" height="72"></a>';
const photo = (name,alt,cls='') => `<img class="${cls}" src="images/${name}" alt="${e(alt)}" loading="lazy" decoding="async">`;
const emailLink = (subject,label='Contact the gym',cls='text-link') => link(label,`mailto:cainta.profitnessgym@gmail.com?subject=${encodeURIComponent(subject)}`,cls);
const dateLabel = value => value ? new Date(value+'T12:00:00Z').toLocaleDateString('en-PH',{day:'numeric',month:'long',year:'numeric'}) : 'Not yet activated';
const input = (label,name,type='text',value='',extra='') => `<label>${label}<input name="${name}" type="${type}" value="${e(value)}" ${extra}></label>`;
const branchSelect = (value='Cainta') => `<label>Home branch<select name="branch"><option ${value==='Cainta'?'selected':''}>Cainta</option><option ${value==='Antipolo'?'selected':''}>Antipolo</option></select></label>`;
const formMessage = '<p class="form-message" role="status" aria-live="polite" hidden></p>';
function route() { return location.hash.slice(1).split('/')[0] || 'home'; }
function header(page) {
  const nav = [['home','Home'],['plans','Membership'],['coaches','Coaches'],['schedule','Classes'],['careers','Careers']];
  const links = nav.map(([id,label])=>`<a href="#${id}" ${page===id?'aria-current="page"':''}>${label}</a>`).join('');
  return `<a class="skip-link" href="#main">Skip to content</a><header class="topbar"><div class="header-wrap">${logo()}<nav class="desktop-nav" aria-label="Main navigation">${links}</nav><div class="header-actions">${link(state.session?'My dashboard':'Member sign in','#member','member-entry')}${link(state.session?'Classes '+arrow:'Join us '+arrow,state.session?'#schedule':'#signup','primary header-join')}</div></div><nav class="mobile-nav" aria-label="Mobile navigation">${links}</nav></header>`;
}
function footer() { return `<footer class="footer"><div class="wrap footer-top">${logo()}<p>Antipolo & Cainta</p><div>${link('Member portal','#member','plain')}${link('Careers','#careers','plain')}${emailLink('Pro Fitness enquiry','Get in touch','plain')}</div></div><div class="wrap footer-bottom"><span>© ${new Date().getFullYear()} Pro Fitness Gym</span><span>Train with purpose.</span></div></footer>`; }
function title(text,tag='') {return `<div class="page-heading"><h1>${text}</h1>${tag?`<span class="branch-pill">${tag}</span>`:''}</div>`;}
function ratesBlock() {return `<div class="real-rates"><div><span>Membership fee</span><strong>${peso(rates.membership)}</strong></div><div><span>Monthly rate</span><strong>${peso(rates.monthly)}<small> / month</small></strong></div>${link('Become a member '+arrow,'#signup')}</div>`;}
function coachCards() { return `<div class="coach-grid actual-coaches">${coaches.map(c=>`<article class="coach-tile"><a class="coach-photo" href="#coach/${c.name.toLowerCase()}" aria-label="View ${c.name}'s profile">${photo(c.image,`${c.name} — Pro Fitness coach and qualifications`)}<span>${arrow}</span></a><div class="coach-info"><a href="#coach/${c.name.toLowerCase()}"><h3>${c.name}</h3></a><p>${c.detail}</p></div></article>`).join('')}</div>`; }
function scheduleRows() {return `<div class="weekly-schedule">${classes.map(c=>`<article class="weekly-row"><span class="class-day">${c.day}</span><div><h3>${c.name}</h3><p>${c.coach}</p></div><strong>${c.time}</strong></article>`).join('')}</div>`;}
function home() {return `<main id="main"><section class="home-hero wrap"><div class="hero-copy"><span class="eyebrow">ANTIPOLO & CAINTA</span><h1>STRONGER.<br>TOGETHER.</h1><p>Your gym. Your people.<br>Your next personal best.</p><div class="button-row">${link('Become a member '+arrow,'#signup')}${link('Explore the gym','#plans','text-link')}</div><div class="hero-bottom"><span class="red-line"></span><span>Pro Fitness Gym<br><b>Show up for yourself.</b></span></div></div><figure class="hero-image"><img src="images/lobby.webp" alt="Inside Pro Fitness Gym with its illuminated red signage" fetchpriority="high"><figcaption>THE WORK STARTS HERE.</figcaption></figure></section><section class="rate-band"><div class="wrap">${ratesBlock()}</div></section><section class="wrap section"><div class="section-title"><h2>People in your corner.</h2>${link('Meet your coaches '+arrow,'#coaches','text-link')}</div>${coachCards()}</section><section class="schedule-feature"><div class="wrap section"><div class="section-title"><h2>Move to your own rhythm.</h2>${link('Class schedule '+arrow,'#schedule','text-link')}</div>${scheduleRows()}<p class="schedule-caption">Monday–Friday · Philippine time</p></div></section><section class="wrap careers-teaser"><div><span class="eyebrow">WE’RE HIRING · CAINTA</span><h2>Your next chapter.<br>Our next coach.</h2></div>${link('Join the team '+arrow,'#careers','secondary')}</section></main>`;}
function plans() {return `<main id="main" class="wrap page">${title('Make it your<br>starting point.','MEMBERSHIP')}<div class="membership-layout"><div class="membership-intro"><p class="large-copy">A place to train.<br>A reason to keep going.</p><p>Strength, movement, and people who share your drive. Make Pro Fitness part of your routine.</p>${link('Create your account '+arrow,'#signup')}</div><div class="pricing-panel"><div><span>Membership fee</span><strong>${peso(rates.membership)}</strong></div><div><span>Monthly rate</span><strong>${peso(rates.monthly)}<small> / month</small></strong></div><p>Membership activation and payment are handled at the gym.</p>${emailLink('Membership enquiry','Ask about membership '+arrow)}</div></div><section class="faq"><h2>Before your first session.</h2><details><summary>How do I become a member?</summary><p>Create your account, verify your email, and sign in. Visit reception to arrange your membership and payment. Your dashboard will show your membership status once the gym activates it.</p></details><details><summary>Are classes and personal coaching included?</summary><p>Contact reception for class access, coaching fees, and the arrangements at your preferred branch.</p></details><details><summary>Can I use both branches?</summary><p>Ask reception about cross-branch access before your visit.</p></details></section></main>`;}
function coachesPage() {return `<main id="main" class="wrap page">${title('Good coaching.<br>Better progress.','THE COACHING TEAM')}${coachCards()}<div class="editorial-note"><h2>Start with a conversation.</h2><div>${emailLink('Personal coaching enquiry','Enquire about coaching '+arrow)}</div></div></main>`;}
function coachPage() {
  const c=coaches.find(c=>c.name.toLowerCase()===location.hash.split('/')[1]);
  if(!c)return coachesPage();
  return `<main id="main" class="wrap page">${link('← All coaches','#coaches','back-link')}<div class="profile-grid"><figure class="profile-image actual-profile">${photo(c.image,`${c.name} and supplied coaching qualifications`)}</figure><div class="profile-main"><span class="eyebrow">PRO FITNESS COACH</span><h1>${c.name}</h1><p class="profile-specialty">${c.detail}</p><div class="profile-section"><h2>Qualifications</h2><ul>${c.qualifications.map(q=>`<li>${e(q)}</li>`).join('')}</ul></div>${emailLink(`Coaching enquiry — ${c.name}`,'Enquire about coaching '+arrow,'primary')}</div></div></main>`;
}
function schedulePage() {return `<main id="main" class="wrap page">${title('Sweat. Move.<br>Have fun.','GX CLASS SCHEDULE')}${scheduleRows()}<div class="schedule-note"><span>All times are Philippine time (Asia/Manila).</span>${emailLink('GX class location and access enquiry','Confirm branch & class access '+arrow)}</div><details class="poster-details"><summary>View the class poster</summary>${photo('class-schedule.png','Weekly GX schedule: Ashley on Monday and Wednesday at 6 PM; Micko on Tuesday at 6 PM and Thursday at 6:30 PM; JL John on Friday at 6 PM')}</details></main>`;}
function careers() {return `<main id="main" class="wrap page">${title('Bring your energy.<br>Build your career.','CAINTA · COACHES')}<div class="careers-layout"><figure>${photo('hiring.png','Pro Fitness Gym Cainta recruitment poster for female and male coaches')}</figure><div class="career-copy"><h2>We’re hiring coaches.</h2><p>Female & male coaches · Pro Fitness Gym, Cainta</p><h3>Qualifications</h3><ul><li>At least a high school or senior high school graduate</li><li>Relevant personal training experience is an advantage, but not required</li><li>Physically fit and healthy</li><li>Flexible, teachable, and willing to learn</li><li>A team player who communicates effectively</li></ul><h3>Skills & competencies</h3><ul><li>Knowledge and experience in personal training, including fitness assessment, program design, and proper exercise techniques</li><li>Excellent customer service: approachable, supportive, and professional</li><li>Professional attitude and appearance</li><li>Good communication and motivational skills</li></ul><div class="career-apply"><h3>Send your updated résumé.</h3>${link('Apply by email '+arrow,'mailto:hr.profitnessgym@gmail.com,cainta.profitnessgym@gmail.com?subject=Coach%20application%20%E2%80%94%20Cainta')}<a href="mailto:hr.profitnessgym@gmail.com">hr.profitnessgym@gmail.com</a><a href="mailto:cainta.profitnessgym@gmail.com">cainta.profitnessgym@gmail.com</a></div></div></div></main>`;}
function authPage(mode='signin') {
  const signup=mode==='signup',recover=mode==='forgot',reset=mode==='reset';
  const heading=signup?'Your next chapter.':recover?'Find your way back.':reset?'A fresh start.':'Welcome back.';
  const unavailable=!api.configured;
  return `<main id="main" class="wrap page auth-page"><div class="auth-art"><img src="images/lobby.webp" alt="Pro Fitness Gym interior"><div><span class="eyebrow">PRO FITNESS GYM</span><h2>SHOW UP.<br>GET STRONGER.</h2></div></div><section class="auth-panel"><span class="eyebrow">MEMBER SPACE</span><h1>${heading}</h1>${unavailable?'<p class="notice" role="status">Online member access is coming soon. Contact reception to join the gym.</p>':''}${!state.ready?'<p class="notice" role="status">Connecting…</p>':''}<form data-form="${mode}">${signup?input('Full name','name','text','','required maxlength="80" autocomplete="name"'):''}${!reset?input('Email address','email','email','','required maxlength="254" autocomplete="email"'):''}${!recover?input(reset?'New password':'Password','password','password','',`required ${signup||reset?'minlength="12"':''} maxlength="128" autocomplete="${signup||reset?'new-password':'current-password'}"`):''}${signup||reset?'<span class="field-note">Use at least 12 characters.</span>':''}${signup?branchSelect():''}${signup||reset?input('Confirm password','confirm','password','','required maxlength="128" autocomplete="new-password"'):''}${formMessage}<button class="primary" ${unavailable||!state.ready?'disabled':''}>${signup?'Create account':recover?'Send reset link':reset?'Save new password':'Sign in'} ${arrow}</button></form>${mode==='signin'?`<div class="auth-links">${link('Forgot password?','#forgot','text-link')}<p>New to Pro Fitness? ${link('Create an account','#signup','text-link')}</p></div>`:`<div class="auth-links">${link('Back to sign in','#signin','text-link')}</div>`}${signup?'<p class="fine-print">Your account starts with membership pending activation at reception.</p>':''}${emailLink('Member access enquiry','Contact reception','text-link')}</section></main>`;
}
function dashboard() {
  if(!state.ready) return `<main id="main" class="wrap page"><h1>Your member space.</h1><p role="status">Connecting…</p></main>`;
  if(!state.session) return authPage();
  if(state.error) return `<main id="main" class="wrap page">${title('Your member space.')}<p class="notice" role="alert">${e(state.error)}</p><div class="button-row"><button class="primary" data-action="reload">Try again</button><button class="secondary" data-action="signout">Sign out</button></div></main>`;
  if(!state.profile) return `<main id="main" class="wrap page"><h1>Your member space.</h1><p role="status">Loading your profile…</p></main>`;
  const p=state.profile,tab=location.hash.split('/')[1]||'today';
  const tabs=[['today','Overview'],['progress','Training log'],['account','My account']];
  let body='';
  if(tab==='account')body=`<section class="account-settings"><h2>Your details.</h2><form data-form="profile">${input('Full name','name','text',p.full_name,'required maxlength="80" autocomplete="name"')}${branchSelect(p.home_branch)}${input('Email address','email','email',state.session.user.email,'disabled')}${formMessage}<button class="primary">Save changes</button></form><button class="text-link" data-action="password-email">Send password reset email ${arrow}</button></section>`;
  else if(tab==='progress') body=`<section><div class="section-title"><h2>Your training log.</h2><button class="primary" data-action="workout">Log a workout +</button></div>${state.workouts.length?`<div class="workout-list">${state.workouts.map(w=>`<article class="workout-entry"><div><h3>${e(w.exercise)}</h3><p>${dateLabel(w.trained_on)}</p></div><strong>${e(w.weight_kg)} <small>kg</small> × ${e(w.reps)} <small>reps</small></strong><button class="plain" data-action="delete-workout" data-id="${e(w.id)}" aria-label="Delete ${e(w.exercise)} entry">Delete</button></article>`).join('')}</div><p class="fine-print">Your most recent 100 entries.</p>`:`<div class="empty-state"><h3>Your first session starts here.</h3><p>Keep a record of your exercises, weights, and reps.</p></div>`}</section>`;
  else body=`<div class="member-top"><section class="membership-card"><div class="membership-card-top"><span>PRO FITNESS GYM</span><span class="badge">${membershipLabel(p)}</span></div><h2>${e(p.full_name)}</h2><p>${e(p.home_branch)} · Membership</p><div class="membership-bottom"><div><small>Valid until</small><strong>${dateLabel(p.valid_until)}</strong></div></div></section><section class="today-card"><span class="eyebrow">YOUR NEXT SESSION</span><h2>Make time for you.</h2><p>Dance, move, and train with the Pro Fitness community.</p>${link('Explore classes '+arrow,'#schedule','secondary')}</section></div><div class="dashboard-bottom"><section><h2>Keep the momentum.</h2><p>Your training, one session at a time.</p><button class="primary" data-action="workout">Log a workout +</button></section><section><span class="eyebrow">MEMBERSHIP</span><p>Membership fee <strong>${peso(rates.membership)}</strong><br>Monthly rate <strong>${peso(rates.monthly)}</strong></p>${emailLink('Membership activation or renewal','Contact reception '+arrow)}</section></div>`;
  return `<main id="main" class="wrap page member-page">${title('Hi, '+e(p.full_name.split(' ')[0])+'.',e(p.home_branch))}<div class="portal-tabs"><nav aria-label="Member pages">${tabs.map(([id,label])=>`<a href="#member/${id}" ${tab===id?'aria-current="page"':''}>${label}</a>`).join('')}</nav><button class="plain" data-action="signout">Sign out</button></div>${body}</main>`;
}
function render() {
  let page=route();
  if(state.recovery && page!=='reset'){history.replaceState(null,'','#reset');page='reset';}
  if(['signin','signup'].includes(page)&&state.session&&!state.recovery){history.replaceState(null,'','#member');page='member';}
  const pages={home,plans,coaches:coachesPage,coach:coachPage,schedule:schedulePage,careers,signup:()=>authPage('signup'),signin:()=>authPage(),forgot:()=>authPage('forgot'),reset:()=>state.session?authPage('reset'):authPage('forgot'),member:dashboard};
  app.innerHTML=header(page)+(pages[page]||home)()+footer();
  app.querySelector('main')?.setAttribute('tabindex','-1');
  document.title=`${({member:'Member dashboard',signup:'Create account',signin:'Member sign in',careers:'Careers',schedule:'Class schedule',plans:'Membership',coaches:'Coaches'})[page]||'Antipolo & Cainta'} | Pro Fitness Gym`;
}
function toast(message) {const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),6000);}
function showModal(title,body) {previousFocus=document.activeElement;modal.innerHTML=`<div class="modal-head"><h2 id="modal-title">${title}</h2><button class="close-button" data-action="close" aria-label="Close">×</button></div><div class="modal-body">${body}</div>`;modal.setAttribute('aria-labelledby','modal-title');modal.showModal();modal.querySelector('input,button')?.focus();}
function errorMessage(error) {
  if(error?.message==='Failed to fetch'||error?.name==='TypeError')return 'Connection interrupted. Check your internet and try again.';
  if(error?.code==='PGRST205'||error?.code==='42P01'||error?.code==='PGRST116')return 'Your member profile is not available yet. Please contact reception.';
  return error?.message || 'Something went wrong. Please try again.';
}
async function loadMember() {
  const version=++loadVersion,userId=state.session?.user.id;
  if(!userId)return;
  state.error='';state.loading=true;
  try {const data=await api.load(userId);if(version===loadVersion&&state.session?.user.id===userId)Object.assign(state,data);}
  catch(error){if(version===loadVersion)state.error=errorMessage(error);}
  finally {if(version===loadVersion){state.loading=false;if(route()==='member')render();}}
}
document.addEventListener('submit',async event=>{
  const form=event.target,kind=form.dataset.form;if(!kind)return;event.preventDefault();
  if(!form.reportValidity()||form.dataset.busy)return;
  const data=Object.fromEntries(new FormData(form)),message=form.querySelector('.form-message'),button=form.querySelector('button[type="submit"],button.primary');
  form.dataset.busy='true';button.disabled=true;form.setAttribute('aria-busy','true');message.hidden=true;
  try {
    if(['signup','reset'].includes(kind)&&data.password!==data.confirm)throw new Error('The passwords do not match.');
    if(kind==='signin'){const result=await api.signIn(data);state.session=result.session;state.profile=null;location.hash='member';await loadMember();}
    if(kind==='signup'){if(!data.name.trim())throw new Error('Enter your full name.');const result=await api.signUp(data);if(result.session){state.session=result.session;location.hash='member';await loadMember();}else{form.reset();message.textContent='Check your email for a confirmation link. If you already have an account, sign in or reset your password.';message.hidden=false;}}
    if(kind==='forgot'){await api.recover(data.email);message.textContent='If an account exists for this email, a password reset link is on its way.';message.hidden=false;}
    if(kind==='reset'){await api.updatePassword(data.password);state.recovery=false;location.hash='member';toast('Your password has been updated.');}
    if(kind==='profile'){await api.updateProfile(state.session.user.id,data);await loadMember();toast('Your details have been updated.');}
    if(kind==='workout'){await api.addWorkout(state.session.user.id,data);modal.close();await loadMember();location.hash='member/progress';toast('Workout saved.');}
    if(kind==='delete'){await api.deleteWorkout(state.session.user.id,form.dataset.id);modal.close();await loadMember();toast('Workout deleted.');}
  }catch(error){message.textContent=errorMessage(error);message.hidden=false;}
  finally {delete form.dataset.busy;button.disabled=false;form.removeAttribute('aria-busy');}
});
document.addEventListener('click',async event=>{
  const skip=event.target.closest('.skip-link');if(skip){event.preventDefault();app.querySelector('main')?.focus();return;}
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='close'){modal.close();return;}
  if(action==='reload'){state.error='';render();await loadMember();return;}
  if(action==='workout'&&state.session){showModal('Log your workout.',`<form data-form="workout"><div class="form-grid">${input('Exercise','exercise','text','','required maxlength="80"')}${input('Training date','trained_on','date',manilaDate(),`required min="2000-01-01" max="${manilaDate()}"`)}${input('Weight (kg)','weight_kg','number','','required min="0" max="500" step="0.5"')}${input('Repetitions','reps','number','','required min="1" max="100" step="1"')}</div>${formMessage}<button class="primary">Save workout</button></form>`);return;}
  if(action==='delete-workout'&&state.session){showModal('Delete this entry?',`<form data-form="delete" data-id="${e(button.dataset.id)}"><p>This workout will be permanently removed from your log.</p>${formMessage}<div class="button-row"><button type="button" class="secondary" data-action="close">Keep entry</button><button class="primary">Delete entry</button></div></form>`);return;}
  button.disabled=true;
  try {
    if(action==='signout'){await api.signOut();++loadVersion;Object.assign(state,{session:null,profile:null,workouts:[],error:'',recovery:false});location.hash='signin';render();}
    if(action==='password-email'){await api.recover(state.session.user.email);toast('A password reset link has been requested. Check your email.');}
  }catch(error){toast(errorMessage(error));}finally{button.disabled=false;}
});
modal.addEventListener('close',()=>{if(previousFocus?.isConnected)previousFocus.focus();else app.querySelector('main')?.focus({preventScroll:true});});
window.addEventListener('hashchange',()=>{if(modal.open)modal.close();render();window.scrollTo(0,0);app.querySelector('main')?.focus({preventScroll:true});});
api.onAuthChange((event,session)=>{
  const changed=state.session?.user.id!==session?.user.id;
  state.session=session;state.ready=true;
  if(event==='PASSWORD_RECOVERY')state.recovery=true;
  if(changed||!session){++loadVersion;state.profile=null;state.workouts=[];state.error='';if(modal.open)modal.close();}
  // Avoid making another Supabase call inside its synchronous auth callback.
  setTimeout(()=>{if(changed||event==='INITIAL_SESSION'||event==='PASSWORD_RECOVERY')render();if(session&&(changed||!state.profile))void loadMember();},0);
});
render();
async function boot() {
  const callbackError=new URLSearchParams(location.hash.slice(1)).get('error_description');
  try{state.session=await api.session();}catch(error){toast(errorMessage(error));}
  if(callbackError){history.replaceState(null,'','#signin');toast('This email link has expired or is invalid. Request a new link or sign in.');}
  state.ready=true;render();if(state.session)await loadMember();
}
void boot();
