import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

// Dynamically import Firebase modules only on the server side
// This prevents client-side errors when using static exports
let storage: any = null;
let ref: any = null;
let uploadBytes: any = null;
let getDownloadURL: any = null;

// Initialize Firebase modules
async function initFirebaseStorage() {
  try {
    // Import Firebase modules
    const firebaseApp = await import('@/utils/firebase');
    const storageModule = await import('firebase/storage');
    
    // Get Firebase services
    const app = firebaseApp.initFirebase();
    
    if (!app || !app.storage) {
      throw new Error('Firebase Storage not initialized');
    }
    
    storage = app.storage;
    ref = storageModule.ref;
    uploadBytes = storageModule.uploadBytes;
    getDownloadURL = storageModule.getDownloadURL;
    
    return true;
  } catch (error) {
    console.error('Error initializing Firebase Storage:', error);
    return false;
  }
}

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  success?: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase Storage on first API call
    const isStorageInitialized = await initFirebaseStorage();
    
    if (!isStorageInitialized) {
      throw new Error('Failed to initialize Firebase Storage');
    }

    // Parse the incoming form data
    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
    });

    const parsedForm = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = parsedForm.files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only PDF and DOCX files are allowed.' });
    }

    // Read the file
    const fileData = fs.readFileSync(file.filepath);

    // Create a unique file name
    const fileName = `cvs/${Date.now()}-${file.originalFilename}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, fileData);

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);

    // Clean up the temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      fileUrl: downloadUrl,
      fileName: file.originalFilename,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      error: 'Failed to upload file',
    });
  }
}