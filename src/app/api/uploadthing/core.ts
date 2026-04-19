import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
 
const f = createUploadthing();
 
/**
 * UploadThing API Yapılandırması
 */
export const ourFileRouter = {
  // Görev ekleri için dosya yükleme tanımı
  taskAttachment: f({ 
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    pdf: { maxFileSize: "8MB", maxFileCount: 5 },
    blob: { maxFileSize: "8MB", maxFileCount: 5 }
  })
    .middleware(async ({ req }) => {
      const { userId, orgId } = await auth();
      if (!userId || !orgId) throw new Error("Unauthorized");
      return { userId, orgId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Proje bazlı ekler (Brief, materyal vb)
  projectAttachment: f({ 
    image: { maxFileSize: "16MB", maxFileCount: 5 },
    pdf: { maxFileSize: "32MB", maxFileCount: 5 },
    blob: { maxFileSize: "32MB", maxFileCount: 5 }
  })
    .middleware(async ({ req }) => {
      const { userId, orgId } = await auth();
      if (!userId || !orgId) throw new Error("Unauthorized");
      return { userId, orgId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

 
export type OurFileRouter = typeof ourFileRouter;
