import { supabase } from "./supabase";

const BUCKET = "review-images";

export async function uploadReviewImages(files: File[]): Promise<string[]> {
  if (!files.length) return [];

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `reviews/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Failed to generate public image URL.");
    }

    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}