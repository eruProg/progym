"use strict";
(function(root){
  const KEY="pro-fitness-community-v4", branchIds=["antipolo","cainta"];
  const day=root.PFDay;
  const uid=()=>globalThis.crypto?.randomUUID?.()||`pf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ensure=(condition,message)=>{if(!condition)throw new Error(message)};
  const clean=(s,max=500)=>String(s??"").trim().slice(0,max);
  const dateValid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T12:00Z"))&&new Date(s+"T12:00Z").toISOString().slice(0,10)===s;
  const timeValid=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const future=(date,time)=>dateValid(date)&&timeValid(time)&&Date.parse(date+"T"+time+":00+08:00")>Date.now();
  function enhance(s){
    s.version=4;
    if(!branchIds.includes(s.activeBranchId))s.activeBranchId="antipolo";
    s.coaches.forEach((c,i)=>{
      c.name=c.name.replace(/^Coach /,"");
      c.credentials=c.credentials||["Personal training qualification — sample","CPR & first aid — sample"];
      c.experience=c.experience||`${4+i%3} years`;
      c.languages=c.languages||"English · Filipino";
      c.approach=c.approach||["Start with your training history and goals.","Build a progressive plan around your schedule.","Review technique and progress every session."];
      c.photo=c.photo||(["trainer-woman","trainer-man","training"][i%3]);
    });
    s.sessions.forEach((x,i)=>{
      x.duration=x.duration||[50,45,60][i%3];
      x.level=x.level||["Beginner","All levels","Intermediate"][i%3];
      x.description=x.description||["A coached introduction to squats, hinges, and presses. Technique comes first.","A full-body circuit combining strength, movement, and conditioning.","A focused strength session with planned sets, longer rests, and individual guidance."][i%3];
      x.room=x.room||["Strength floor","Studio floor","Free-weight area"][i%3];
      x.bring=x.bring||"Water, a towel, and indoor training shoes";
    });
    s.memberSelection=s.memberSelection||Object.fromEntries(branchIds.map(b=>[b,s.members.find(m=>m.branchId===b)?.id]));
    s.checkins=s.checkins||s.members.flatMap((m,i)=>[1,3,5,8,10,13].slice(0,3+i%4).map(n=>({id:uid(),memberId:m.id,branchId:m.branchId,date:day(-n)})));
    s.workouts=s.workouts||s.members.flatMap((m,i)=>[{id:`lift-${m.id}`,memberId:m.id,branchId:m.branchId,date:day(-2),exercise:["Deadlift","Squat","Bench press"][i%3],weight:[100,65,80,110,70,45][i],reps:5,verified:true}]);
    s.posts=s.posts||branchIds.flatMap((b,i)=>[
      {id:`post-${b}-equipment`,branchId:b,author:"Pro Fitness",category:"Equipment",photo:"equipment",caption:"Room for your next personal best.",likes:18+i*4,likedBy:[],comments:[],date:day(-1)},
      {id:`post-${b}-people`,branchId:b,author:s.members.find(m=>m.branchId===b).name,category:"People",photo:"training",caption:"One more rep. One stronger week.",likes:24+i*3,likedBy:[],comments:[{id:uid(),author:"Pro Fitness",text:"Great consistency this week.",date:day(-1)}],date:day(-1)},
      {id:`post-${b}-community`,branchId:b,author:"Pro Fitness",category:"Community",photo:"community",caption:"Good company makes the hard sessions better.",likes:32+i*2,likedBy:[],comments:[],date:day(-2)}
    ]);
    s.challenges=s.challenges||branchIds.map(b=>({id:`challenge-${b}`,branchId:b,name:"The 12-session club",target:12,joined:[],start:day().slice(0,7)+"-01"}));
    return s;
  }
  function fresh(){return enhance(root.PFSeed())}
  let store=null;
  function valid(s){return s&&[3,4].includes(s.version)&&["branches","plans","promos","coaches","sessions","members","requests"].every(k=>Array.isArray(s[k]))&&branchIds.every(b=>s.branches.some(x=>x.id===b))}
  try{store=JSON.parse(localStorage.getItem(KEY));if(!valid(store))store=JSON.parse(localStorage.getItem("pro-fitness-website-v3"));}catch{}
  let state=valid(store)?enhance(store):fresh(), persistence=true;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));persistence=true;}catch{persistence=false;}return persistence}
  const scoped=(key,b=state.activeBranchId)=>state[key].filter(x=>x.branchId===b);
  const get=(key,id)=>state[key].find(x=>x.id===id);
  const branch=()=>state.branches.find(x=>x.id===state.activeBranchId);
  const member=()=>scoped("members").find(m=>m.id===state.memberSelection[state.activeBranchId])||scoped("members")[0];
  const active=(key,id)=>{const x=get(key,id);ensure(x&&x.branchId===state.activeBranchId,"This record belongs to another branch.");return x};
  function setBranch(b){ensure(branchIds.includes(b),"Choose a branch.");state.activeBranchId=b;save()}
  function selectMember(id){const m=active("members",id);state.memberSelection[m.branchId]=id;save()}
  function addRequest(data){
    const b=state.activeBranchId,type=data.type||"Membership";
    ensure(["Membership","Coaching","Class"].includes(type),"Choose a request type.");
    const name=clean(data.name,80),email=clean(data.email,120);
    ensure(name&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),"Enter a name and valid email.");
    let session,coach,plan,subject=data.subject||"Membership inquiry";
    if(data.planId){plan=active("plans",data.planId);subject=plan.name}
    if(type==="Class"){
      session=active("sessions",data.sessionId);
      ensure(future(session.date,session.time),"This class has ended.");
      const confirmed=scoped("requests").filter(r=>r.sessionId===session.id&&r.status==="Confirmed").length;
      ensure(confirmed<session.capacity,"This class is full.");
      ensure(!scoped("requests").some(r=>r.sessionId===session.id&&(r.email.toLowerCase()===email.toLowerCase()||(data.memberId&&r.memberId===data.memberId))&&["New","Confirmed"].includes(r.status)),"You already reserved this class.");
      subject=session.name;
    }
    if(type==="Coaching"){coach=active("coaches",data.coachId);subject=coach.name;ensure(future(data.date,data.time),"Choose a valid future date and time.")}
    if(data.memberId)active("members",data.memberId);
    const r={id:uid(),branchId:b,name,email,phone:clean(data.phone,25),type,subject,planId:plan?.id||"",coachId:coach?.id||"",sessionId:session?.id||"",date:session?.date||data.date||day(),time:session?.time||data.time||"",status:type==="Class"?"Confirmed":"New",memberId:data.memberId||"",note:clean(data.note)};
    state.requests.push(r);save();return r;
  }
  function status(id,status){
    const r=active("requests",id);
    ensure(["New","Confirmed","Completed","Declined","Cancelled"].includes(status),"Invalid status.");
    if(["New","Confirmed"].includes(status)&&r.sessionId){
      const s=active("sessions",r.sessionId);
      ensure(future(s.date,s.time),"This class has ended.");
      const others=scoped("requests").filter(x=>x.id!==id&&x.sessionId===s.id&&["New","Confirmed"].includes(x.status));
      ensure(!others.some(x=>x.email.toLowerCase()===r.email.toLowerCase()||(r.memberId&&x.memberId===r.memberId)),"This member already reserved this class.");
      if(status==="Confirmed")ensure(others.filter(x=>x.status==="Confirmed").length<s.capacity,"This class is full.");
    }
    r.status=status;save();
  }
  function editPromo(data){
    ensure(clean(data.name,80),"Enter an offer title.");ensure(Number.isFinite(+data.price)&&+data.price>=0&&+data.price<=100000,"Enter a valid price.");ensure(dateValid(data.end),"Enter a valid expiry.");
    const p=scoped("promos")[0];Object.assign(p,{name:clean(data.name,80),price:+data.price,end:data.end,detail:clean(data.detail,250),active:!!data.active});save();
  }
  function editPlan(id,data){
    const p=active("plans",id);ensure(+data.price>=0&&+data.price<=100000&&Number.isFinite(+data.price),"Enter a valid price.");
    Object.assign(p,{price:+data.price,term:clean(data.term,40),features:String(data.features).split("\n").map(x=>clean(x,120)).filter(Boolean)});save();
  }
  function editMember(id,data){
    if(id)active("members",id);const p=active("plans",data.planId);
    ensure(clean(data.name,80)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),"Enter a name and valid email.");ensure(dateValid(data.expiry),"Enter a valid expiry date.");
    ensure(!scoped("members").some(m=>m.id!==id&&m.email.toLowerCase()===data.email.toLowerCase()),"A member at this branch already uses that email.");
    const m={id:id||uid(),branchId:state.activeBranchId,name:clean(data.name,80),email:clean(data.email,120),planId:p.id,expiry:data.expiry};
    if(id)Object.assign(get("members",id),m);else state.members.push(m);save();
  }
  function editSession(id,data){
    if(id)active("sessions",id);active("coaches",data.coachId);
    ensure(clean(data.name,70),"Enter a class name.");ensure(future(data.date,data.time),"Choose a valid upcoming date and time.");
    ensure(Number.isInteger(+data.capacity)&&+data.capacity>=1&&+data.capacity<=100,"Capacity must be 1–100.");
    ensure(+data.duration>=15&&+data.duration<=180,"Duration must be 15–180 minutes.");
    const count=scoped("requests").filter(r=>r.sessionId===id&&r.status==="Confirmed").length;
    ensure(+data.capacity>=count,`There are ${count} confirmed places.`);
    const s={id:id||uid(),branchId:state.activeBranchId,name:clean(data.name,70),coachId:data.coachId,date:data.date,time:data.time,capacity:+data.capacity,duration:+data.duration,level:clean(data.level,30),room:clean(data.room,60),description:clean(data.description,500),bring:clean(data.bring,150)};
    if(id)Object.assign(get("sessions",id),s);else state.sessions.push(s);
    scoped("requests").filter(r=>r.sessionId===s.id&&["New","Confirmed"].includes(r.status)).forEach(r=>Object.assign(r,{subject:s.name,date:s.date,time:s.time}));save();
  }
  function checkin(){
    const m=member();ensure(m,"Choose a member.");ensure(m.expiry>=day(),"This membership has expired.");
    ensure(!scoped("checkins").some(c=>c.memberId===m.id&&c.date===day()),"You are already checked in today.");
    state.checkins.push({id:uid(),branchId:state.activeBranchId,memberId:m.id,date:day()});save();
  }
  function logWorkout(data){
    const m=member();ensure(m,"Choose a member.");ensure(["Deadlift","Squat","Bench press"].includes(data.exercise),"Choose a lift.");
    ensure(+data.weight>0&&+data.weight<=500&&Number.isFinite(+data.weight),"Enter a weight between 0 and 500 kg.");
    ensure(Number.isInteger(+data.reps)&&+data.reps>=1&&+data.reps<=50,"Reps must be 1–50.");
    state.workouts.push({id:uid(),branchId:state.activeBranchId,memberId:m.id,date:day(),exercise:data.exercise,weight:+data.weight,reps:+data.reps,verified:false});save();
  }
  function toggleLike(id){
    const post=active("posts",id),who=member()?.id||"visitor";
    if(post.likedBy.includes(who))post.likedBy=post.likedBy.filter(x=>x!==who);else post.likedBy.push(who);save();
  }
  function comment(id,text){
    const post=active("posts",id);ensure(clean(text,300),"Write a comment.");
    post.comments.push({id:uid(),author:member()?.name||"Guest",text:clean(text,300),date:day()});save();
  }
  function post(data){
    ensure(member(),"Choose a member.");ensure(clean(data.caption,600),"Write something to share.");
    ensure(["People","Community","Equipment"].includes(data.category),"Choose a category.");
    state.posts.unshift({id:uid(),branchId:state.activeBranchId,author:member().name,category:data.category,photo:["equipment","training","community","lobby"].includes(data.photo)?data.photo:"training",caption:clean(data.caption,600),likes:0,likedBy:[],comments:[],date:day()});save();
  }
  function joinChallenge(){
    const c=scoped("challenges")[0],m=member();ensure(m,"Choose a member.");
    ensure(!c.joined.includes(m.id),"You have already joined.");c.joined.push(m.id);save();
  }
  function leaderboard(metric="Consistency"){
    const since=day().slice(0,7)+"-01";
    return scoped("members").map(m=>{
      const visits=scoped("checkins").filter(c=>c.memberId===m.id&&c.date>=since).length;
      const lifts=scoped("workouts").filter(w=>w.memberId===m.id&&w.verified&&w.exercise===metric);
      return {name:m.name,id:m.id,value:metric==="Consistency"?visits:Math.max(0,...lifts.map(w=>w.weight))};
    }).filter(x=>x.value>0).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name));
  }
  function verifyLift(id){const w=active("workouts",id);w.verified=true;save()}
  function reset(){state=fresh();save()}
  root.PF={get state(){return state},get persistence(){return persistence},day,future,uid,scoped,get,branch,member,setBranch,selectMember,addRequest,status,editPromo,editPlan,editMember,editSession,checkin,logWorkout,toggleLike,comment,post,joinChallenge,leaderboard,verifyLift,reset};
})(globalThis);
