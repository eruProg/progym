import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {adminEmail} from '../public/admin.js';

test('admin usernames map consistently without accepting arbitrary emails',()=>{
  assert.equal(adminEmail(' TestAdmin '),'testadmin@admin.progym.invalid');
  for(const name of ['ab','admin@example.com','<script>','admin space'])assert.throws(()=>adminEmail(name));
});

test('admin functions require private roles, restrict mutations, and audit updates',async()=>{
  const db=new PGlite();
  const staff='11111111-1111-4111-8111-111111111111',member='22222222-2222-4222-8222-222222222222';
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
      create table auth.users(id uuid primary key,raw_user_meta_data jsonb,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
    const sql=await readFile(new URL('../supabase/admin.sql',import.meta.url),'utf8');
    await db.exec(sql);await db.exec(sql); // migration can be re-run safely
    await db.query('insert into auth.users values ($1,$2,$3,now()),($4,$5,$6,now())',[staff,JSON.stringify({full_name:'TestAdmin',role:'admin'}),'testadmin@admin.progym.invalid',member,JSON.stringify({full_name:'Real Member',role:'admin'}),'member@example.test']);
    await db.exec('set role anon');
    await assert.rejects(db.query('select public.admin_members()'),/permission denied/);
    await db.exec('reset role; set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[staff]);
    assert.equal((await db.query('select public.is_progym_admin() as allowed')).rows[0].allowed,false);
    await assert.rejects(db.query('select public.admin_members()'),/Administrator access required/);
    await assert.rejects(db.query('select public.provision_progym_admin($1,$2)',[staff,'testadmin']),/permission denied/);
    await assert.rejects(db.query('insert into private.progym_admins(user_id,username) values ($1,$2)',[staff,'testadmin']),/permission denied/);
    await db.exec('reset role; set role service_role');
    await assert.rejects(db.query('select public.provision_progym_admin($1,$2)',[member,'testadmin']),/matching admin/);
    await db.query('select public.provision_progym_admin($1,$2)',[staff,'testadmin']);
    await db.exec('reset role; set role authenticated');
    assert.equal((await db.query('select public.is_progym_admin() as allowed')).rows[0].allowed,true);
    let data=(await db.query('select public.admin_members() as data')).rows[0].data;
    assert.equal(data.total,1);assert.equal(data.stats.pending,1);assert.equal(data.members[0].id,member);
    await assert.rejects(db.query('select public.admin_members(null)'),/Invalid member filter/);
    assert.equal((await db.query("select public.admin_members('missing') as data")).rows[0].data.total,0);
    await assert.rejects(db.query("select public.admin_update_membership($1,'Renamed','Cainta','active',null)",[member]),/valid member details/);
    await assert.rejects(db.query("select public.admin_update_membership($1,'Renamed','Cainta','pending',null)",[staff]),/Staff accounts/);
    await db.query("select public.admin_update_membership($1,'Renamed','Antipolo','active',(now() at time zone 'Asia/Manila')::date+3)",[member]);
    data=(await db.query('select public.admin_members() as data')).rows[0].data;
    assert.equal(data.stats.active,1);assert.equal(data.renewals.length,1);assert.equal(data.members[0].full_name,'Renamed');
    assert.equal((await db.query('select * from profiles')).rows.length,1); // direct access remains scoped to self
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[member]);
    await assert.rejects(db.query("select public.admin_update_membership($1,'Hacked','Cainta','pending',null)",[member]),/Administrator access required/);
    await db.exec('reset role');
    const audit=(await db.query('select * from private.membership_audit')).rows;
    assert.equal(audit.length,1);assert.equal(audit[0].actor_id,staff);assert.equal(audit[0].old_status,'pending');
    await db.query('delete from private.progym_admins where user_id=$1',[staff]);
    await db.exec('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[staff]);
    await assert.rejects(db.query('select public.admin_members()'),/Administrator access required/);
  }finally{await db.close();}
});
