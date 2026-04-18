import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zumamemyvczdmpswirjt.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_favqe0R1h3-xnSaoNGi-Iw_R8CVAlV6'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
