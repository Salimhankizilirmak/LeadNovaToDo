import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * Mevcut HTML elementini (örneğin Dashboard Raporları) yüksek kalitede PDF'e çevirir.
 */
export const exportToPdf = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#030712' });
    const imgData = canvas.toDataURL('image/png');
    
    // A4 Boyutu: 210 x 297 mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    // En/boy oranını koru
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    // Antet / Header
    pdf.setFillColor(3, 7, 18); // Dark Premium Arka Plan (Tailwind bg-gray-950)
    pdf.rect(0, 0, pdfWidth, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    // Tipografi destekli olmadığı için standart font
    pdf.text('LeadNova Endustriyel Operasyon Raporu', 15, 15);
    
    pdf.setFontSize(10);
    pdf.setTextColor(156, 163, 175); // Gray 400
    pdf.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')} | Sistem: v1.0`, pdfWidth - 65, 15);
    
    // Veriler ve Grafikler (30mm'den başla)
    pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF Export Error:', error);
  }
};

/**
 * Dinamik veriyi endüstriyel standartlara uygun Excel dosyasına çevirir.
 */
export const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Operasyon Verisi');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
