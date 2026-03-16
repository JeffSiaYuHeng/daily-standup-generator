import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found.`);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    
    const xXffset = (pdfWidth - finalWidth) / 2;
    const yOffset = 10; // Margin from top

    pdf.addImage(imgData, 'PNG', xXffset, yOffset, finalWidth, finalHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
};
