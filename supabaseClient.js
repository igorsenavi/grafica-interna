import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = https://wknxkyarvirxlerzqhor.supabase.co;
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbnhreWFydmlyeGxlcnpxaG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODM0NzcsImV4cCI6MjA5MTg1OTQ3N30.y-pV0Wv1yHPdtF2qldRQXP3Pq5PCGQpia2p7AtnAlhs;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
