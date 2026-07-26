import { createClient } from "@/lib/supabase/client";

// Supabase's storage-js SDK has no upload-progress hook — its .upload() call
// is a single fetch() with no access to XHR's upload.onprogress. This
// replicates the exact same REST call (POST {url}/storage/v1/object/{bucket}/{path},
// FormData with a "cacheControl" field + the file under an empty-string key,
// same auth headers) via raw XMLHttpRequest instead, purely to get real
// byte-level progress events. Same RLS policies apply since it uses the same
// bearer token as the SDK client.
export interface UploadWithProgressResult {
  error: { message: string } | null;
}

export interface UploadWithProgressHandle {
  promise: Promise<UploadWithProgressResult>;
  abort: () => void;
}

export function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void,
  opts?: { upsert?: boolean }
): UploadWithProgressHandle {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<UploadWithProgressResult>((resolve) => {
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const cleanPath = path.replace(/^\/+|\/+$/g, "");
      const url = `${supabaseUrl}/storage/v1/object/${bucket}/${cleanPath}`;

      const formData = new FormData();
      formData.append("cacheControl", "3600");
      formData.append("", file);

      xhr.open("POST", url, true);
      xhr.setRequestHeader("apikey", anonKey);
      xhr.setRequestHeader("Authorization", `Bearer ${session?.access_token ?? anonKey}`);
      xhr.setRequestHeader("x-upsert", String(opts?.upsert ?? false));

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve({ error: null });
        } else {
          let message = `Upload failed (${xhr.status})`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            message = parsed.message || parsed.error || message;
          } catch {
            // Response wasn't JSON — keep the generic status message.
          }
          resolve({ error: { message } });
        }
      };

      xhr.onerror = () => resolve({ error: { message: "Network error during upload." } });
      xhr.ontimeout = () => resolve({ error: { message: "Upload timed out." } });
      xhr.onabort = () => resolve({ error: { message: "Upload cancelled." } });

      xhr.send(formData);
    })();
  });

  return { promise, abort: () => xhr.abort() };
}
