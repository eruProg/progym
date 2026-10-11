import test from 'node:test';
import assert from 'node:assert/strict';
import {classes,rates,coaches,escapeHTML,validateWorkout,membershipLabel,manilaDate} from '../public/content.js';
import {createMemberAPI} from '../public/member-api.js';
test('supplied rates and schedule match the gym material',()=>{
  assert.deepEqual(rates,{membership:1500,monthly:1800});
  assert.equal(classes.length,5);assert.equal(classes[3].time,'6:30 PM');
  assert.deepEqual(classes.map(c=>c.coach),['Ashley','Micko','Ashley','Micko','JL John']);
  assert.deepEqual(coaches.map(c=>c.name),['Domz','Paul']);
});
test('Manila dates and membership expiry use the local calendar',()=>{
  assert.equal(manilaDate(new Date('2026-10-10T16:01:00Z')),'2026-10-11');
  assert.equal(membershipLabel({membership_status:'pending',valid_until:'2099-01-01'}),'Pending activation');
  assert.equal(membershipLabel({membership_status:'active',valid_until:'2026-10-11'},'2026-10-11'),'Active');
  assert.equal(membershipLabel({membership_status:'active',valid_until:'2026-10-10'},'2026-10-11'),'Expired');
  assert.equal(membershipLabel({membership_status:'active',valid_until:null}),'Expired');
});
test('workout validation rejects invalid numbers, dates and empty exercises',()=>{
  const entry={exercise:' Squat ',trained_on:manilaDate(),weight_kg:'50',reps:'5'};
  assert.deepEqual(validateWorkout(entry),{exercise:'Squat',trained_on:manilaDate(),weight_kg:50,reps:5});
  for(const patch of [{exercise:' '},{weight_kg:''},{weight_kg:'NaN'},{weight_kg:-1},{weight_kg:501},{reps:1.5},{reps:0},{trained_on:'2099-01-01'},{trained_on:'2026-02-30'}])assert.throws(()=>validateWorkout({...entry,...patch}));
});
test('untrusted member text is escaped',()=>{
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
test('unconfigured backend cannot create a fake account or session',async()=>{
  const api=createMemberAPI('','');assert.equal(api.configured,false);assert.equal(await api.session(),null);
  await assert.rejects(api.signIn({email:'test@example.com',password:'private'}),/not available/);
});
