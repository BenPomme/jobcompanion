import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export async function generatePDF(content: { cv?: string; coverLetter?: string }) {
  try {
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // Add CV page
    if (content.cv) {
      const page = pdfDoc.addPage([612, 792]); // US Letter size
      const { width, height } = page.getSize();
      const fontSize = 12;
      const lineHeight = fontSize * 1.2;
      const margin = 72; // 1 inch margins
      
      // Split content into lines for proper formatting
      const cvLines = content.cv.split('\n');
      let y = height - margin;
      
      for (const line of cvLines) {
        // Check if this is a heading (simple detection based on line ending with ':')
        const isHeading = line.trim().endsWith(':') || line.trim().toUpperCase() === line.trim();
        const font = isHeading ? timesRomanBold : timesRoman;
        const lineFontSize = isHeading ? fontSize + 2 : fontSize;
        
        page.drawText(line, {
          x: margin,
          y,
          size: lineFontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        y -= lineHeight;
        
        // Add extra space after headings
        if (isHeading) {
          y -= lineHeight / 2;
        }
        
        // If we're running out of space, create a new page
        if (y < margin) {
          const newPage = pdfDoc.addPage([612, 792]);
          y = height - margin;
        }
      }
    }
    
    // Add cover letter page
    if (content.coverLetter) {
      const page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();
      const fontSize = 12;
      const lineHeight = fontSize * 1.2;
      const margin = 72;
      
      // Split content into paragraphs
      const clParagraphs = content.coverLetter.split('\n\n');
      let y = height - margin;
      
      for (const paragraph of clParagraphs) {
        // Wrap long paragraphs
        const words = paragraph.split(' ');
        let line = '';
        
        for (const word of words) {
          const testLine = line + word + ' ';
          const testWidth = timesRoman.widthOfTextAtSize(testLine, fontSize);
          
          if (testWidth > width - 2 * margin) {
            page.drawText(line, {
              x: margin,
              y,
              size: fontSize,
              font: timesRoman,
              color: rgb(0, 0, 0),
            });
            
            y -= lineHeight;
            line = word + ' ';
            
            // If we're running out of space, create a new page
            if (y < margin) {
              const newPage = pdfDoc.addPage([612, 792]);
              y = height - margin;
            }
          } else {
            line = testLine;
          }
        }
        
        if (line.trim() !== '') {
          page.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font: timesRoman,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
        }
        
        // Add extra space between paragraphs
        y -= lineHeight;
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF document');
  }
}

export async function generateDOCX(content: { cv?: string; coverLetter?: string }) {
  try {
    // Create CV document
    let documents = [];
    
    if (content.cv) {
      const cvDoc = new Document({
        sections: [
          {
            properties: {},
            children: formatContentForDocx(content.cv),
          },
        ],
      });
      const cvBuffer = await Packer.toBuffer(cvDoc);
      documents.push({ name: 'CV.docx', buffer: cvBuffer });
    }
    
    // Create cover letter document
    if (content.coverLetter) {
      const clDoc = new Document({
        sections: [
          {
            properties: {},
            children: formatContentForDocx(content.coverLetter),
          },
        ],
      });
      const clBuffer = await Packer.toBuffer(clDoc);
      documents.push({ name: 'CoverLetter.docx', buffer: clBuffer });
    }
    
    return documents;
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw new Error('Failed to generate DOCX document');
  }
}

function formatContentForDocx(content: string) {
  const paragraphs = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // Empty line
      paragraphs.push(new Paragraph({}));
      continue;
    }
    
    // Check if this is a heading (simple detection)
    const isHeading = trimmedLine.endsWith(':') || trimmedLine.toUpperCase() === trimmedLine;
    
    if (isHeading) {
      paragraphs.push(
        new Paragraph({
          text: trimmedLine,
          heading: HeadingLevel.HEADING_2,
          spacing: {
            after: 200,
            before: 400,
          },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(trimmedLine)],
          spacing: {
            after: 120,
          },
        })
      );
    }
  }
  
  return paragraphs;
}