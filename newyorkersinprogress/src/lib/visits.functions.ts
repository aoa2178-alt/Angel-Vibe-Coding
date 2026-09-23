import { createServerFn } from "@tanstack/react-start";

export const recordVisit = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("increment_daily_visit");
  if (error) throw new Error("Unable to record visit");
  return { recorded: true };
});