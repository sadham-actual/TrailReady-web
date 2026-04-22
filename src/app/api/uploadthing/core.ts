import { createUploadthing, type FileRouter } from 'uploadthing/server';
import { createServerClient } from '@supabase/ssr';

const f = createUploadthing();

function parseCookies(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').flatMap((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return [];
    return [{ name: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() }];
  });
}

/**
 * UploadThing file router for trail photo intel uploads.
 * Each report can attach up to 5 images (max 8MB each).
 * Authentication is required — anonymous uploads are rejected.
 */
export const ourFileRouter = {
  trailPhoto: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req, files }) => {
      // Auth check — only signed-in users may upload photos
      const cookieHeader = req.headers.get('cookie') ?? '';
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return parseCookies(cookieHeader);
            },
            setAll() {
              // No-op — can't set cookies in UploadThing middleware
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required to upload photos');

      // File validation
      for (const file of files) {
        if (file.size === 0) throw new Error('Zero-byte files not allowed');
        if (file.size < 1024) throw new Error('File too small — minimum 1KB required');
      }

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for user:', metadata.userId, file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
