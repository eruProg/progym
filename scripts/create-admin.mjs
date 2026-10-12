// Run locally only. Credentials are read from stdin, never from source or build arguments.
import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {adminEmail} from '../public/admin.js';

const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,publicKey=process.env.SUPABASE_ANON_KEY;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
try {
  if(!url||!key||!publicKey)throw new Error('Add SUPABASE_SECRET_KEY to your ignored local .env, alongside the project URL and publishable key.');
  const {username,password}=JSON.parse(readFileSync(0,'utf8'));
  const email=adminEmail(username);
  if(typeof password!=='string'||!password)throw new Error('A password is required.');
  const admin=createClient(url,key,options),member=createClient(url,publicKey,options);
  // This intentionally fails before any mutation, confirming that the migration exists.
  const check=await admin.rpc('provision_progym_admin',{p_user_id:'00000000-0000-4000-8000-000000000000',p_username:username.toLowerCase()});
  if(check.error?.message!=='Create and confirm the matching admin account first')throw new Error('Run supabase/admin.sql first and verify the local secret belongs to this project.');
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:username,home_branch:'Cainta'}});
  if(error)throw error;
  const grant=await admin.rpc('provision_progym_admin',{p_user_id:data.user.id,p_username:username.toLowerCase()});
  if(grant.error){
    // Roll back only the account created by this invocation. Never alter an existing user.
    const cleanup=await admin.auth.admin.deleteUser(data.user.id);
    if(cleanup.error)throw new Error('Role assignment failed. A non-admin account remains; inspect Authentication → Users before retrying.');
    throw new Error('Role assignment failed; the new account was rolled back. Verify admin.sql.');
  }
  const login=await member.auth.signInWithPassword({email,password});
  if(login.error)throw new Error('Admin created, but sign-in verification failed. Check Supabase Auth logs.');
  const role=await member.rpc('is_progym_admin');
  const members=await member.rpc('admin_members');
  await member.auth.signOut();
  if(role.error||role.data!==true||members.error)throw new Error('Account created, but admin access verification failed. Check the SQL migration.');
  console.log(`Admin ${username} created. Sign-in and protected member access verified. Use #admin on the website.`);
}catch(error){console.error(error.message||'Admin provisioning failed.');process.exitCode=1;}
