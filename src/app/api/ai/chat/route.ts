import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects, tasks, cells } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();

    // ── Deep Context Retrieval (RAG Lite) ──
    const allProjects = await db.query.projects.findMany({
      where: eq(projects.orgId, orgId),
      columns: { name: true, status: true, budget: true }
    });

    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.orgId, orgId),
      columns: { title: true, status: true, priority: true, dueDate: true }
    });

    const allCells = await db.query.cells.findMany({
      where: eq(cells.orgId, orgId),
      with: { members: true }
    });

    const contextSummary = {
      organizasyon_id: orgId,
      toplam_proje_sayisi: allProjects.length,
      projeler: allProjects.map(p => ({
        ad: p.name,
        durum: p.status,
        butce: `₺${((p.budget || 0) / 100).toLocaleString('tr-TR')}`
      })),
      gorev_ozeti: {
        toplam: allTasks.length,
        tamamlanan: allTasks.filter(t => t.status === 'done').length,
        kritik: allTasks.filter(t => t.priority === 'critical').length,
      },
      departmanlar: allCells.map(c => ({
        ad: c.name,
        personel_sayisi: c.members.length
      }))
    };

    const systemPrompt = `
      Sen LeadNova Yönetim Sisteminin Kurumsal Yapay Zeka Danışmanısın. 
      Yöneticine "Sayın Yöneticim" veya "Efendim" şeklinde hitap etmelisin.
      Yanıtların son derece resmi, saygılı, net ve tamamen Türkçe olmalıdır.
      Kesinlikle laf kalabalığı yapma, verileri profesyonelce analiz et.
      
      BAĞLAM (SİSTEM VERİLERİ):
      ${JSON.stringify(contextSummary, null, 2)}
      
      GÖREVİN:
      Yöneticinin sorularına yukarıdaki verilere dayanarak rapor sunmak, projelerin sağlık durumunu (bütçe ve gecikme bazlı) yorumlamak ve operasyonel tavsiyeler vermektir.
    `;

    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });


    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI API Error:", error);
    return new Response("AI yanıt verirken bir hata oluştu.", { status: 500 });
  }
}
