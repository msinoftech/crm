"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { mapSupabaseUserToUser, canAccessApp } from "@crm/shared/auth";

export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim?.();
  const password = formData.get("password") as string;
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: signInError.message };
  }

  const user = mapSupabaseUserToUser(data.user ?? null);
  if (!user || !canAccessApp(user.role, "workspace")) {
    await supabase.auth.signOut();
    return { error: "You don't have access to this app. Workspace users only." };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("disabled")
    .eq("user_id", data.user!.id)
    .single();

  if (workspace?.disabled) {
    await supabase.auth.signOut();
    return { error: "Your account is deactivated, please contact administrator." };
  }

  return {};
}
