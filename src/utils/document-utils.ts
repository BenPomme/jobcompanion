import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generatePDF, generateDOCX } from '@/services/document-generator';

/**
 * Save generated documents to Firebase Storage and Firestore
 */
export async function saveGeneratedDocuments(
  userId: string,
  data: {
    cv?: string;
    coverLetter?: string;
    profileData: any;
    jobData: any;
  }
) {
  try {
    const timestamp = Date.now();
    const docFiles = [];
    
    // Generate PDF
    if (data.cv) {
      const pdfBytes = await generatePDF({ cv: data.cv });
      const pdfRef = ref(storage, `documents/${userId}/cv_${timestamp}.pdf`);
      await uploadBytes(pdfRef, pdfBytes);
      const pdfUrl = await getDownloadURL(pdfRef);
      docFiles.push({ type: 'cv', format: 'pdf', url: pdfUrl });
    }
    
    if (data.coverLetter) {
      const clPdfBytes = await generatePDF({ coverLetter: data.coverLetter });
      const clPdfRef = ref(storage, `documents/${userId}/cover_letter_${timestamp}.pdf`);
      await uploadBytes(clPdfRef, clPdfBytes);
      const clPdfUrl = await getDownloadURL(clPdfRef);
      docFiles.push({ type: 'coverLetter', format: 'pdf', url: clPdfUrl });
    }
    
    // Generate DOCX
    if (data.cv) {
      const docxFiles = await generateDOCX({ cv: data.cv });
      if (docxFiles.length > 0) {
        const docxRef = ref(storage, `documents/${userId}/cv_${timestamp}.docx`);
        await uploadBytes(docxRef, docxFiles[0].buffer);
        const docxUrl = await getDownloadURL(docxRef);
        docFiles.push({ type: 'cv', format: 'docx', url: docxUrl });
      }
    }
    
    if (data.coverLetter) {
      const clDocxFiles = await generateDOCX({ coverLetter: data.coverLetter });
      if (clDocxFiles.length > 0) {
        const clDocxRef = ref(storage, `documents/${userId}/cover_letter_${timestamp}.docx`);
        await uploadBytes(clDocxRef, clDocxFiles[0].buffer);
        const clDocxUrl = await getDownloadURL(clDocxRef);
        docFiles.push({ type: 'coverLetter', format: 'docx', url: clDocxUrl });
      }
    }
    
    // Save record to Firestore
    const docRef = await addDoc(collection(db, 'generated_documents'), {
      userId,
      rawContent: {
        cv: data.cv,
        coverLetter: data.coverLetter,
      },
      files: docFiles,
      profileData: data.profileData,
      jobData: data.jobData,
      createdAt: serverTimestamp(),
    });
    
    return { docId: docRef.id, files: docFiles };
  } catch (error) {
    console.error('Error saving generated documents:', error);
    throw new Error('Failed to save generated documents');
  }
}

/**
 * Get user's document history
 */
export async function getUserDocumentHistory(userId: string) {
  try {
    const documents: Array<{
      id: string;
      files: Array<{
        type: string;
        format: string;
        url: string;
      }>;
      createdAt: any;
      jobData: any;
    }> = [];

    // Implement Firestore query to get user's documents
    // This is a placeholder for the actual implementation

    return documents;
  } catch (error) {
    console.error('Error getting user document history:', error);
    throw new Error('Failed to retrieve document history');
  }
}

/**
 * Format content for display
 */
export function formatDocumentContent(content: string) {
  // This is a basic formatter
  // In a production application, you would have more sophisticated formatting
  
  if (!content) return '';
  
  // Add proper line breaks
  let formatted = content.replace(/\n{3,}/g, '\n\n');
  
  // Ensure section headers are properly highlighted
  formatted = formatted.replace(/^([A-Z][A-Z\s]+):?$/gm, '\n$1:');
  
  return formatted;
}