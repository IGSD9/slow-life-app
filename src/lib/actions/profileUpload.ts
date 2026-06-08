"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import {
  uploadProfileImage,
  removeProfileImageFiles,
  type ProfileImageKind,
} from "@/lib/storage/profileImages";

const FIELD: Record<ProfileImageKind, "profileIconUrl" | "portraitUrl"> = {
  icon: "profileIconUrl",
  portrait: "portraitUrl",
};

export async function uploadProfileImageAction(kind: ProfileImageKind, file: File) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false as const, error: "UNAUTHORIZED" };

  await ensureUserSetup(authUser.id, authUser.email);

  let url: string;
  try {
    url = await uploadProfileImage(authUser.id, kind, file);
    await prisma.profile.update({
      where: { userId: authUser.id },
      data: { [FIELD[kind]]: url },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UPLOAD_FAILED";
    if (msg === "INVALID_TYPE" || msg === "FILE_TOO_LARGE") {
      return { success: false as const, error: msg };
    }
    if (msg === "SUPABASE_STORAGE_NOT_CONFIGURED") {
      return { success: false as const, error: "STORAGE_NOT_CONFIGURED" };
    }
    return { success: false as const, error: "UPLOAD_FAILED" };
  }

  revalidatePath("/profile");
  revalidatePath("/room");
  revalidatePath("/friends");
  return { success: true as const, url };
}

export async function removeProfileImageAction(kind: ProfileImageKind) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false as const, error: "UNAUTHORIZED" };

  await removeProfileImageFiles(authUser.id, kind);
  await prisma.profile.update({
    where: { userId: authUser.id },
    data: { [FIELD[kind]]: null },
  });

  revalidatePath("/profile");
  revalidatePath("/room");
  revalidatePath("/friends");
  return { success: true as const };
}
