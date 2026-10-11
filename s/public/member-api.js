import { createClient } from '@supabase/supabase-js';
import { validateWorkout } from './content.js';

export function createMemberAPI(url, key) {
  const client = url && key ? createClient(url, key, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
  const requireClient = () => { if (!client) throw new Error('Member access is not available yet. Please contact the gym.'); return client; };
  const unwrap = ({data,error}) => {if(error) throw error; return data;};
  const redirect = () => location.origin + location.pathname;
  return {
    configured: Boolean(client),
    onAuthChange(callback) { return client?.auth.onAuthStateChange(callback); },
    async session() {return client ? unwrap(await client.auth.getSession()).session : null;},
    async signUp({name,email,password,branch}) {
      return unwrap(await requireClient().auth.signUp({email:email.trim(),password,options:{emailRedirectTo:redirect(),data:{full_name:name.trim(),home_branch:branch}}}));
    },
    async signIn({email,password}) { return unwrap(await requireClient().auth.signInWithPassword({email:email.trim(),password})); },
    async signOut() { unwrap(await requireClient().auth.signOut()); },
    async recover(email) {unwrap(await requireClient().auth.resetPasswordForEmail(email.trim(),{redirectTo:redirect()}));},
    async updatePassword(password) {unwrap(await requireClient().auth.updateUser({password}));},
    async load(userId) {
      const [profile,workouts] = await Promise.all([
        requireClient().from('profiles').select('id,full_name,home_branch,membership_status,valid_until,created_at').eq('id',userId).single(),
        requireClient().from('workouts').select('id,trained_on,exercise,weight_kg,reps').eq('member_id',userId).order('trained_on',{ascending:false}).order('created_at',{ascending:false}).limit(100),
      ]);
      return {profile:unwrap(profile),workouts:unwrap(workouts)};
    },
    async updateProfile(userId, {name,branch}) {
      if (!name.trim() || name.trim().length > 80 || !['Cainta','Antipolo'].includes(branch)) throw new Error('Enter a name and choose your branch.');
      unwrap(await requireClient().from('profiles').update({full_name:name.trim(),home_branch:branch}).eq('id',userId).select('id').single());
    },
    async addWorkout(userId, data) {unwrap(await requireClient().from('workouts').insert({member_id:userId,...validateWorkout(data)}));},
    async deleteWorkout(userId, id) {unwrap(await requireClient().from('workouts').delete().eq('id',id).eq('member_id',userId));},
  };
}
