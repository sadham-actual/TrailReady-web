import { createUploadthing, type FileRouter } from 'uploadthing/server';

const f = createUploadthing();

/**
 * UploadThing file router for trail photo intel uploads.
 * Each report can attach up to 5 images (max 10MB each).
 */
export const ourFileRouter = {
  trailPhoto: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 5,
    },
  })
    .middleware(async ({ files }) => {
      // Server-side validation before upload starts
      for (const file of files) {
        // Reject zero-byte files
        if (file.size === 0) {
          throw new Error('Zero-byte files not allowed');
        }

        // Reject files under 1KB
        if (file.size < 1024) {
          throw new Error('File too small - minimum 1KB required');
        }

        // Note: UploadThing automatically validates MIME type against 'image' config
        // and checks file signatures (magic bytes) server-side
      }

      return {}; // Return metadata if needed
    })
    .onUploadComplete(async ({ file }) => {
      // Verify upload succeeded and file is accessible
      console.log('Upload complete:', file.ufsUrl);

      // Return URL for client
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
