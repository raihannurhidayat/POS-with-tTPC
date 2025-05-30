
import type { Bucker } from "@/server/bucket";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

export const uploadFileToSignedUrl = async ({ file, path, token, bucket }: { file: File, path: string, token: string, bucket: Bucker }) => {
  try {
    const { data, error } = await supabaseClient.storage.from(bucket).uploadToSignedUrl(path, token, file)

    if (error) throw error
    if (!data) throw new Error("No Data uploaded")

    const fileUrl = supabaseClient.storage.from(bucket).getPublicUrl(data.path)

    return fileUrl.data.publicUrl
  } catch (error) {
    throw error
  }
}