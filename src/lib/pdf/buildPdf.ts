import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CardData, SizeType } from '@/types';

// Paper sizes in points (1 inch = 72 points)
const PAPER_SIZES = {
  A4: { width: 595, height: 842 },
  A5: { width: 420, height: 595 }
};

// Margins in points
const MARGINS = {
  top: 36,
  bottom: 36,
  left: 36,
  right: 36
};

export async function buildPdfBuffer(cardData: CardData, size: SizeType = 'A5'): Promise<ArrayBuffer> {
  try {
    // Create new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Get paper dimensions
    const paperSize = PAPER_SIZES[size];
    const page = pdfDoc.addPage([paperSize.width, paperSize.height]);
    
    // Calculate usable area
    const usableWidth = paperSize.width - MARGINS.left - MARGINS.right;
    const usableHeight = paperSize.height - MARGINS.top - MARGINS.bottom;
    
    // Embed fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Add background image if provided
    if (cardData.imagePngBase64) {
      try {
        let imageBytes: Uint8Array;
        
        // Handle both data URL and plain base64
        if (cardData.imagePngBase64.startsWith('data:')) {
          const base64Data = cardData.imagePngBase64.split(',')[1];
          imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        } else {
          imageBytes = Uint8Array.from(atob(cardData.imagePngBase64), c => c.charCodeAt(0));
        }
        
        // Try to embed as PNG first, then as JPEG if that fails
        let backgroundImage;
        try {
          backgroundImage = await pdfDoc.embedPng(imageBytes);
        } catch {
          try {
            backgroundImage = await pdfDoc.embedJpg(imageBytes);
          } catch {
            console.warn('Failed to embed background image, continuing without it');
          }
        }
        
        if (backgroundImage) {
          // Scale image to fill page while maintaining aspect ratio
          const imageAspectRatio = backgroundImage.width / backgroundImage.height;
          const pageAspectRatio = paperSize.width / paperSize.height;
          
          let imageWidth, imageHeight;
          
          if (imageAspectRatio > pageAspectRatio) {
            // Image is wider - fit to page width
            imageWidth = paperSize.width;
            imageHeight = paperSize.width / imageAspectRatio;
          } else {
            // Image is taller - fit to page height  
            imageHeight = paperSize.height;
            imageWidth = paperSize.height * imageAspectRatio;
          }
          
          // Center the image
          const imageX = (paperSize.width - imageWidth) / 2;
          const imageY = (paperSize.height - imageHeight) / 2;
          
          page.drawImage(backgroundImage, {
            x: imageX,
            y: imageY,
            width: imageWidth,
            height: imageHeight,
          });
        }
      } catch (error) {
        console.warn('Failed to process background image:', error);
      }
    }
    
    // Add text overlay area with background for readability
    const textAreaHeight = usableHeight * 0.3;
    const textAreaY = MARGINS.bottom;
    
    // Semi-transparent white background for text
    page.drawRectangle({
      x: MARGINS.left,
      y: textAreaY,
      width: usableWidth,
      height: textAreaHeight,
      color: rgb(1, 1, 1),
      opacity: 0.85,
    });
    
    // Add subtle border around text area
    page.drawRectangle({
      x: MARGINS.left,
      y: textAreaY,
      width: usableWidth,
      height: textAreaHeight,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });
    
    // Calculate text layout
    const textCenterX = MARGINS.left + usableWidth / 2;
    const headlineSize = size === 'A4' ? 28 : 22;
    const lineSize = size === 'A4' ? 18 : 14;
    
    // Measure text to center it vertically in the text area
    const headlineHeight = headlineSize * 1.2;
    const lineHeight = lineSize * 1.2;
    const totalTextHeight = headlineHeight + lineHeight + 10; // 10pt spacing
    
    const textStartY = textAreaY + (textAreaHeight + totalTextHeight) / 2;
    
    // Draw headline
    const headlineWidth = regularFont.widthOfTextAtSize(cardData.headline, headlineSize);
    const headlineX = textCenterX - headlineWidth / 2;
    
    page.drawText(cardData.headline, {
      x: headlineX,
      y: textStartY - headlineHeight,
      size: headlineSize,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Draw line with word wrapping if needed
    const maxLineWidth = usableWidth * 0.85;
    const wrappedLines = wrapText(cardData.line, regularFont, lineSize, maxLineWidth);
    
    let currentY = textStartY - headlineHeight - 20;
    wrappedLines.forEach(line => {
      const lineWidth = regularFont.widthOfTextAtSize(line, lineSize);
      const lineX = textCenterX - lineWidth / 2;
      
      page.drawText(line, {
        x: lineX,
        y: currentY - lineHeight,
        size: lineSize,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      currentY -= lineHeight;
    });
    
    // Add footer attribution
    const footerText = `Generated with Greetingsmith • ${new Date().toLocaleDateString()}`;
    const footerSize = 8;
    const footerWidth = regularFont.widthOfTextAtSize(footerText, footerSize);
    const footerX = paperSize.width - MARGINS.right - footerWidth;
    const footerY = MARGINS.bottom / 2;
    
    page.drawText(footerText, {
      x: footerX,
      y: footerY,
      size: footerSize,
      font: regularFont,
      color: rgb(0.6, 0.6, 0.6),
    });
    
    // Save PDF and return buffer
    const pdfBytes = await pdfDoc.save();
    return pdfBytes.buffer;
    
  } catch (error) {
    console.error('Error building PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word is too long - force it on its own line
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}