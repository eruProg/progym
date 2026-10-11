import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('PostgreSQL policies isolate members and prevent membership self-activation',async()=>{
  const db=new PGlite();
  const first='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222';
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
    await db.query('insert into auth.users values ($1,$2),($3,$4)',[first,JSON.stringify({full_name:'First Member',home_branch:'Cainta',membership_status:'active'}),second,JSON.stringify({full_name:'Second Member',home_branch:'Antipolo'})]);
    const profiles=await db.query('select * from profiles');assert.equal(profiles.rows.length,2);assert.equal(profiles.rows[0].membership_status,'pending');
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from profiles'),/permission denied/);
    await db.exec('reset role; set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[first]);
    const own=await db.query('select * from profiles');assert.equal(own.rows.length,1);assert.equal(own.rows[0].id,first);
    await db.query('update profiles set full_name=$1 where id=$2',['Renamed',first]);
    assert.equal((await db.query('update profiles set full_name=$1 where id=$2 returning id',['Intruder',second])).rows.length,0);
    await assert.rejects(db.query("update profiles set membership_status='active',valid_until='2099-01-01' where id=$1",[first]),/permission denied/);
    await assert.rejects(db.query('insert into profiles(id,full_name) values($1,$2)',[first,'Forged']),/permission denied/);
    await assert.rejects(db.query('insert into workouts(member_id,trained_on,exercise,weight_kg,reps) values($1,current_date,$2,20,5)',[second,'Squat']),/row-level security/);
    await db.query('insert into workouts(member_id,trained_on,exercise,weight_kg,reps) values($1,current_date,$2,20,5)',[first,'Squat']);
    assert.equal((await db.query('select * from workouts')).rows.length,1);
    await assert.rejects(db.query('insert into workouts(member_id,trained_on,exercise,weight_kg,reps) values($1,current_date,$2,-5,5)',[first,'Squat']),/check constraint/);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[second]);
    assert.equal((await db.query('select * from workouts')).rows.length,0);
    assert.equal((await db.query('delete from workouts returning id')).rows.length,0);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[first]);
    assert.equal((await db.query('delete from workouts returning id')).rows.length,1);
  }finally{await db.close();}
});
