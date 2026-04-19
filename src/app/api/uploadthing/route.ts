import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";
 
/**
 * UploadThing API Route Handlers
 */
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
