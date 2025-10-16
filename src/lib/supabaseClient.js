import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('SB URL =', url);
console.log('SB ANON present =', !!anon, anon ? '(starts with ' + anon.slice(0,8) + '...)' : '');

export const supabase = createClient(url, anon);
