import React, { useState } from 'react';
import FileUpload from './FileUpload';

interface CVUploadProps {
  onProfileDataChange: (profileData: any) => void;
}

const CVUpload: React.FC<CVUploadProps> = ({ onProfileDataChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const handleFileChange = (uploadedFile: File) => {
    setFile(uploadedFile);
    setError('');
    setUploadSuccess(false);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload CV');
      }
      
      const data = await response.json();
      
      // Now process the CV to extract data
      const parseResponse = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: data.fileUrl }),
      });
      
      if (!parseResponse.ok) {
        const parseErrorData = await parseResponse.json();
        throw new Error(parseErrorData.error || 'Failed to parse CV');
      }
      
      const parsedData = await parseResponse.json();
      
      // Update parent component with the profile data
      onProfileDataChange({
        ...parsedData,
        originalFileUrl: data.fileUrl,
        fileName: data.fileName,
      });
      
      setUploadSuccess(true);
    } catch (error) {
      console.error('Error uploading CV:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Your CV</h2>
      
      <div className="mb-6">
        <FileUpload 
          onFileChange={handleFileChange}
          accept=".pdf,.docx"
          maxSizeMB={5}
          label="Upload CV"
          description="Drag and drop your CV here or click to browse"
        />
      </div>
      
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Upload and Process CV'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {uploadSuccess && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">
            CV uploaded and processed successfully!
          </p>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Tips for best results:</h3>
        <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
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