import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import { api } from '@/utils/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface CVUploadProps {
  onProfileDataChange: (profileData: any) => void;
}

interface ValidationState {
  isValid: boolean;
  message: string;
}

const CVUpload: React.FC<CVUploadProps> = ({ onProfileDataChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { currentUser } = useAuth();
  const [fileValidation, setFileValidation] = useState<ValidationState>({ isValid: true, message: '' });
  
  // Validate file when it changes
  useEffect(() => {
    if (!file) {
      setFileValidation({ isValid: true, message: '' });
      return;
    }
    
    // Check file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setFileValidation({
        isValid: false,
        message: 'Invalid file type. Please upload a PDF or DOCX file.'
      });
      return;
    }
    
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setFileValidation({
        isValid: false,
        message: `File is too large. Maximum allowed size is 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      });
      return;
    }
    
    setFileValidation({ isValid: true, message: '' });
  }, [file]);
  
  const handleFileChange = (uploadedFile: File) => {
    setFile(uploadedFile);
    setError('');
    setUploadSuccess(false);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setFileValidation({
        isValid: false,
        message: 'Please select a file to upload'
      });
      return;
    }
    
    if (!fileValidation.isValid) {
      // Validation message already displayed
      return;
    }
    
    if (!currentUser) {
      setError('You must be logged in to upload a CV');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Check if we're running in the Firebase-hosted environment
      const isFirebaseHosted = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
      
      let fileUrl, fileName;
      
      if (isFirebaseHosted) {
        // Use Firebase Storage directly
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const { initFirebase } = await import('@/utils/firebase');
        
        // Initialize Firebase if needed and get services
        const services = initFirebase();
        
        if (!services.app || !services.storage) {
          throw new Error('Firebase Storage not initialized');
        }
        
        const storage = services.storage;
        const fileRef = ref(storage, `cvs/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
        fileName = file.name;
      } else {
        // Use the API endpoint for local development
        const response = await fetch('/api/upload-cv', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload CV');
        }
        
        const data = await response.json();
        fileUrl = data.fileUrl;
        fileName = data.fileName;
      }
      
      // Now process the CV to extract data using our API client
      try {
        const parseResponse = await api.post<{ parsedData: any }>('/parse-cv', { fileUrl });
        
        // Update parent component with the profile data
        onProfileDataChange({
          ...(parseResponse?.parsedData || {}),
          originalFileUrl: fileUrl,
          fileName: fileName,
        });
        
        setUploadSuccess(true);
      } catch (parseError) {
        console.error('Error parsing CV:', parseError);
        throw new Error('Failed to parse CV. Please try again or use a different file format.');
      }
    } catch (error) {
      console.error('Error uploading CV:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="app-card p-6 mb-6">
      <h2 className="app-heading-lg mb-4">Upload Your CV</h2>
      
      <div className="mb-6">
        <FileUpload 
          onFileChange={handleFileChange}
          accept=".pdf,.docx"
          maxSizeMB={5}
          label="Upload CV"
          description="Drag and drop your CV here or click to browse"
        />
        {!fileValidation.isValid && (
          <p className="mt-2 app-text-sm text-error-text">
            {fileValidation.message}
          </p>
        )}
      </div>
      
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="app-button app-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Upload and Process CV'}
      </button>
      
      {error && (
        <div className="app-alert app-alert-error mt-4">
          <p className="app-text-sm text-error-text">{error}</p>
        </div>
      )}
      
      {uploadSuccess && (
        <div className="app-alert app-alert-success mt-4">
          <p className="app-text-sm text-success-text">
            CV uploaded and processed successfully!
          </p>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="app-text-sm font-medium text-gray-700 mb-2">Tips for best results:</h3>
        <ul className="app-text-xs text-gray-600 list-disc pl-5 space-y-1">
          <li>Use PDF or DOCX format for best parsing accuracy</li>
          <li>Ensure your CV is well-structured with clear headings</li>
          <li>Include detailed information about your skills and experience</li>
          <li>Avoid using tables, headers/footers, or complex formatting</li>
          <li>Make sure text is selectable (not an image)</li>
        </ul>
      </div>
    </div>
  );
};

export default CVUpload;