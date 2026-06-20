import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hgbdnwcdpuiowmscxtzq.supabase.co'
const supabaseKey = 'sb_publishable_OfcsuEUpQzu8sSun-6VynQ_oiUfm5BL'

export const supabase = createClient(supabaseUrl, supabaseKey)
