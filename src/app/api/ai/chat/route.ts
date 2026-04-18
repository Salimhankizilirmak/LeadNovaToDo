import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProjectContext {
  name: string;
  tasks: { title: string; status: string }[];
}

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY eksik. Lütfen .env.local dosyasını kontrol edin." },
      { status: 500 }
    );
  }

  try {
    const { messages, contextData } = await req.json() as { messages: Message[], contextData: ProjectContext };

    // Model ayarları (Flash modelini kullanıyoruz)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "Sen LeadNova'nın AI Proje Yöneticisisin. Sana JSON olarak verilen proje ve görev verilerini analiz et. Yanıtların her zaman ÇOK KISA, net ve madde imli (bullet points) olmalıdır. Asla uzun paragraflar yazma. Türkçe konuş. Profesyonel ama yardımsever bir ton kullan."
    });

    // Chat başlatma
    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: Message) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    });

    // Son mesajı ve bağlamı gönder (Context, sistem mesajı gibi en başa eklenir veya son kullanıcı mesajıyla birleştirilir)
    const lastUserMessage = messages[messages.length - 1].content;
    const projectContext = contextData 
      ? `\n\nBAĞLAM (Mevcut Proje Durumu):\n${JSON.stringify(contextData, null, 2)}`
      : "";

    const fullPrompt = `${lastUserMessage}${projectContext}`;

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "AI yanıt verirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
