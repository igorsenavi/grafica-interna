import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = https://wknxkyarvirxlerzqhor.supabase.co;
const SUPABASE_ANON_KEY = sb_publishable_VCRd74KVBRnqQt9PBMnTOA_xvXKTkPy;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
