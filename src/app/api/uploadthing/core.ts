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
      // Sadece giriş yapmış kullanıcılar yükleyebilir
      const { userId, orgId } = await auth();
 
      if (!userId || !orgId) throw new Error("Unauthorized");
 
      return { userId, orgId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL", file.url);
      
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
