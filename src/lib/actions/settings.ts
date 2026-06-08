"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";

export async function getAccountSettings() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;

  await ensureUserSetup(authUser.id, authUser.email);

  return {
    email: authUser.email,
    userId: authUser.id,
  };
}

export async function updateAccountEmail(newEmail: string, password: string) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "INVALID_EMAIL" };
  }
  if (trimmed === authUser.email.toLowerCase()) {
    return { success: false, error: "SAME_EMAIL" };
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authUser.email,
    password,
  });
  if (signInError) {
    return { success: false, error: "INVALID_PASSWORD" };
  }

  const { data, error: updateError } = await supabase.auth.updateUser({
    email: trimmed,
  });
  if (updateError) {
    return { success: false, error: "UPDATE_FAILED", message: updateError.message };
  }

  const confirmedEmail = data.user?.email ?? trimmed;
  await prisma.user.update({
    where: { id: authUser.id },
    data: { email: confirmedEmail },
  });

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/room");

  return {
    success: true,
    email: confirmedEmail,
    pendingConfirmation: confirmedEmail.toLowerCase() !== trimmed,
  };
}
