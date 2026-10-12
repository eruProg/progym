import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';

const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{});
const output=new URL('../test-results/',import.meta.url);await mkdir(output,{recursive:true});
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const page=await browser.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try {
  for(const width of [1440,768,390,320]){
    await page.setViewportSize({width,height:900});
    for(const route of ['home','plans','coaches','coach/domz','coach/paul','schedule','careers','signup','member','forgot','resend','admin']){
      await page.goto(base+'#'+route);await page.locator('main h1').waitFor();
      assert.equal(await page.locator('main h1').count(),1,route);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} overflows at ${width}`);
      if(route==='member')assert.match(await page.locator('main').innerText(),/Welcome back/);
      if(route==='signup')assert.ok(await page.locator('form button').isDisabled());
      if(['home','signup','careers'].includes(route)&&[1440,390].includes(width))await page.screenshot({path:new URL(`${route}-${width}.png`,output).pathname.slice(process.platform==='win32'?1:0),fullPage:true});
    }
  }
  console.log('PASS public routes at 1440, 768, 390 and 320 px; anonymous dashboard guarded; missing config blocks signup.');
  // Exercise the real bundled Supabase client against a deterministic network fixture.
  // This never creates an external account and is not a live backend test.
  const bundle=await build({entryPoints:['public/site.js'],bundle:true,write:false,format:'iife',define:{__SUPABASE_URL__:JSON.stringify('https://fitness-test.supabase.co'),__SUPABASE_ANON_KEY__:JSON.stringify('sb_publishable_test-only')}});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const member=await context.newPage();member.on('pageerror',error=>errors.push(error.message));
  const id='11111111-1111-4111-8111-111111111111';
  const user={id,email:'member@example.test',aud:'authenticated',role:'authenticated',created_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{full_name:'Test Member'}};
  const jwt=[{alg:'HS256',typ:'JWT'},{sub:id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');
  const session={access_token:jwt,refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,user};
  let profile={id,full_name:'Test Member',home_branch:'Cainta',membership_status:'pending',valid_until:null,created_at:new Date().toISOString()};
  let workouts=[],signups=0,recoveries=0,passwordUpdates=0,resends=0,emailFail=false,isAdmin=false,adminReads=0,adminWrites=0;
  await member.route('**/site.bundle.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await member.route('https://fitness-test.supabase.co/**',async r=>{
    const req=r.request(),url=new URL(req.url()),method=req.method(),data=req.postDataJSON();
    let result={},status=200;
    if(url.pathname==='/auth/v1/signup'){signups++;if(emailFail){status=500;result={msg:'Error sending confirmation email',error_code:'unexpected_failure'};}else result={user,session:null};}
    else if(url.pathname==='/auth/v1/token'){if(data.password==='wrong-password'){status=400;result={msg:'Invalid login credentials',error_code:'invalid_credentials'};}else {isAdmin=data.email==='testadmin@admin.progym.invalid';result=session;}}
    else if(url.pathname==='/auth/v1/user'){if(method==='PUT')passwordUpdates++;result=user;}
    else if(url.pathname==='/auth/v1/resend'){resends++;}
    else if(url.pathname==='/rest/v1/rpc/is_progym_admin')result=isAdmin;
    else if(url.pathname==='/rest/v1/rpc/admin_members'){assert.ok(isAdmin);adminReads++;result={members:[{...profile,email:user.email}],total:1,stats:{total:1,active:0,pending:1},renewals:[]};}
    else if(url.pathname==='/rest/v1/rpc/admin_update_membership'){assert.ok(isAdmin);adminWrites++;profile={...profile,full_name:data.p_name,membership_status:data.p_status,valid_until:data.p_expiry};}
    else if(url.pathname==='/auth/v1/recover'){recoveries++;}
    else if(url.pathname==='/auth/v1/logout')result={};
    else if(url.pathname==='/rest/v1/profiles'){
      assert.equal(req.headers().authorization,`Bearer ${jwt}`);
      assert.equal(url.searchParams.get('id'),`eq.${id}`);
      if(method==='PATCH')profile={...profile,...data};result=profile;
    }else if(url.pathname==='/rest/v1/workouts'){
      assert.equal(req.headers().authorization,`Bearer ${jwt}`);
      if(method==='POST'){assert.equal(data.member_id,id);workouts.unshift({...data,id:'33333333-3333-4333-8333-333333333333'});result=null;status=201;}
      else if(method==='DELETE'){assert.equal(url.searchParams.get('member_id'),`eq.${id}`);workouts=[];result=null;}
      else result=workouts;
    }else throw new Error('Unexpected API request: '+url.pathname);
    await r.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
  });
  await member.goto(base+'#signup');
  await member.getByLabel('Full name',{exact:true}).fill('Test Member');
  await member.getByLabel('Email address',{exact:true}).fill(user.email);
  await member.getByLabel('Password',{exact:true}).fill('test-password-123');
  await member.getByLabel('Confirm password',{exact:true}).fill('different-password');
  await member.getByRole('button',{name:'Create account'}).click();
  await member.getByText('The passwords do not match.').waitFor();assert.equal(signups,0);
  await member.getByLabel('Confirm password',{exact:true}).fill('test-password-123');
  await member.getByRole('button',{name:'Create account'}).click();
  await member.getByText(/Check your email for a confirmation link/).waitFor();assert.equal(signups,1);
  await member.getByRole('link',{name:'Back to sign in'}).click();
  await member.getByLabel('Email address',{exact:true}).fill(user.email);
  await member.getByLabel('Password',{exact:true}).fill('wrong-password');
  await member.getByRole('button',{name:'Sign in',exact:false}).click();
  await member.getByText('Invalid login credentials').waitFor();
  await member.getByLabel('Password',{exact:true}).fill('test-password-123');
  await member.getByRole('button',{name:'Sign in',exact:false}).click();
  await member.getByRole('heading',{name:'Hi, Test.'}).waitFor();
  await member.getByText('Pending activation',{exact:true}).waitFor();
  await member.screenshot({path:new URL('dashboard-1440.png',output).pathname.slice(process.platform==='win32'?1:0),fullPage:true});
  await member.getByRole('button',{name:'Log a workout'}).click();
  await member.getByLabel('Exercise',{exact:true}).fill('Squat');
  await member.getByLabel('Weight (kg)',{exact:true}).fill('50');
  await member.getByLabel('Repetitions',{exact:true}).fill('5');
  await member.getByRole('button',{name:'Save workout'}).click();
  await member.getByRole('heading',{name:'Squat',exact:true}).waitFor();assert.equal(workouts.length,1);
  await member.reload();await member.getByRole('heading',{name:'Squat',exact:true}).waitFor();
  await member.getByRole('button',{name:'Delete Squat entry'}).click();
  await member.getByRole('button',{name:'Delete entry',exact:true}).click();
  await member.getByRole('heading',{name:'Your first session starts here.'}).waitFor();assert.equal(workouts.length,0);
  await member.getByRole('link',{name:'My account',exact:true}).click();
  await member.getByLabel('Full name',{exact:true}).fill('Updated Member');
  await member.getByRole('button',{name:'Save changes'}).click();
  await member.getByRole('heading',{name:'Hi, Updated.'}).waitFor();assert.equal(profile.full_name,'Updated Member');
  await member.getByRole('button',{name:'Send password reset email'}).click();
  await member.getByText(/A password reset link has been requested/).waitFor();assert.equal(recoveries,1);
  for(const width of [768,390,320]){
    await member.setViewportSize({width,height:900});
    for(const route of ['member','member/progress','member/account']){
      await member.goto(base+'#'+route);await member.getByRole('heading',{name:'Hi, Updated.'}).waitFor();
      assert.ok(await member.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} overflows at ${width}`);
      if(width===390&&route==='member')await member.screenshot({path:new URL('dashboard-390.png',output).pathname.slice(process.platform==='win32'?1:0),fullPage:true});
    }
  }
  await member.goto(base+'#reset');
  await member.getByLabel('New password',{exact:true}).fill('another-password-123');
  await member.getByLabel('Confirm password',{exact:true}).fill('another-password-123');
  await member.getByRole('button',{name:'Save new password'}).click();
  await member.getByRole('heading',{name:'Hi, Updated.'}).waitFor();assert.equal(passwordUpdates,1);
  await member.getByRole('button',{name:'Sign out',exact:true}).click();
  await member.getByRole('heading',{name:'Welcome back.'}).waitFor();
  await member.goto(base+'#member/progress');await member.getByRole('heading',{name:'Welcome back.'}).waitFor();
  assert.ok(!(await member.locator('main').innerText()).includes('Updated Member'));
  // Email links arrive as a fresh document navigation, not an in-app hash change.
  await member.goto('about:blank');
  await member.goto(base+`#access_token=${jwt}&refresh_token=fixture-refresh&expires_in=3600&token_type=bearer&type=recovery`);
  await member.getByRole('heading',{name:'A fresh start.'}).waitFor();
  assert.equal(new URL(member.url()).hash,'#reset');
  await member.getByLabel('New password',{exact:true}).fill('recovered-password-123');
  await member.getByLabel('Confirm password',{exact:true}).fill('recovered-password-123');
  await member.getByRole('button',{name:'Save new password'}).click();
  await member.getByRole('heading',{name:'Hi, Updated.'}).waitFor();
  assert.equal(passwordUpdates,2);
  // A regular member cannot enter the staff workspace.
  await member.goto(base+'#admin');
  await member.getByRole('heading',{name:'Admin access required.'}).waitFor();assert.equal(adminReads,0);
  await member.getByRole('button',{name:'Use an admin account'}).click();
  await member.getByRole('heading',{name:'Admin sign in.'}).waitFor();
  await member.getByLabel('Username',{exact:true}).fill('TestAdmin');
  await member.getByLabel('Password',{exact:true}).fill('fixture-admin-password');
  await member.getByRole('button',{name:'Sign in',exact:false}).click();
  await member.getByRole('heading',{name:'Overview',exact:true}).waitFor();
  await member.getByText('No renewals due in the next seven days.').waitFor();
  for(const width of [1440,768,390,320]){
    await member.setViewportSize({width,height:900});
    for(const tab of ['overview','members','account']){
      await member.goto(base+'#admin/'+tab);
      await member.locator('.staff-main').waitFor();
      assert.ok(await member.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'admin '+tab+' overflow '+width+' '+JSON.stringify(await member.evaluate(()=>[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>innerWidth).map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right})))));
      if(tab==='overview'&&[1440,390].includes(width))await member.screenshot({path:new URL('admin-'+width+'.png',output).pathname.slice(process.platform==='win32'?1:0),fullPage:true});
    }
  }
  await member.goto(base+'#admin/members');
  await member.getByRole('button',{name:'Edit Updated Member'}).click();
  await member.getByLabel('Full name',{exact:true}).fill('Staff Updated');
  await member.locator('dialog select[name="status"]').selectOption('active');
  await member.getByLabel('Valid until',{exact:true}).fill('2099-01-01');
  await member.getByRole('button',{name:'Save membership'}).click();
  await member.getByRole('button',{name:'Edit Staff Updated'}).waitFor();assert.equal(adminWrites,1);
  await member.getByRole('searchbox',{name:'Search members'}).fill('Staff');
  await member.getByRole('button',{name:'Search',exact:true}).click();
  await member.getByRole('button',{name:'Sign out',exact:true}).click();
  await member.getByRole('heading',{name:'Admin sign in.'}).waitFor();
  assert.ok(!(await member.locator('main').innerText()).includes('Staff Updated'));
  await member.goto(base+'#signup');emailFail=true;
  await member.getByLabel('Full name',{exact:true}).fill('Test Member');
  await member.getByLabel('Email address',{exact:true}).fill(user.email);
  await member.getByLabel('Password',{exact:true}).fill('test-password-123');
  await member.getByLabel('Confirm password',{exact:true}).fill('test-password-123');
  await member.getByRole('button',{name:'Create account'}).click();
  await member.getByText(/We could not send your email/).waitFor();
  await member.getByRole('link',{name:'Resend confirmation email',exact:true}).click();
  await member.getByLabel('Email address',{exact:true}).fill(user.email);
  await member.getByRole('button',{name:'Resend confirmation'}).click();
  await member.getByText(/a new link has been requested/).waitFor();assert.equal(resends,1);
  console.log('PASS SMTP failure feedback, confirmation resend, regular-member admin denial, username login, responsive staff screens, membership editing and staff sign-out (mocked API).');
  assert.deepEqual(errors,[]);
  console.log('PASS signup confirmation, mismatch validation, failed login, sign-in, private dashboard, refresh, workout creation/deletion, profile editing, password reset, sign-out and responsive member screens (mocked API).');
  await context.close();
}finally{await browser.close();}
