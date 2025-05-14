import React, { useState } from 'react';

interface DocumentPreviewProps {
  cvContent?: string;
  coverLetterContent?: string;
  onDownload: (type: 'cv' | 'coverLetter', format: 'pdf' | 'docx') => Promise<void>;
  onEdit: (type: 'cv' | 'coverLetter', content: string) => void;
  onRegenerate: () => Promise<void>;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  cvContent,
  coverLetterContent,
  onDownload,
  onEdit,
  onRegenerate,
}) => {
  const [activeTab, setActiveTab] = useState<'cv' | 'coverLetter'>('cv');
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const handleEditClick = () => {
    setEditableContent(activeTab === 'cv' ? cvContent || '' : coverLetterContent || '');
    setIsEditing(true);
  };
  
  const handleSaveEdit = () => {
    onEdit(activeTab, editableContent);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableContent('');
  };
  
  const handleDownload = async (format: 'pdf' | 'docx') => {
    setIsDownloading(true);
    try {
      await onDownload(activeTab, format);
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };
  
  const currentContent = activeTab === 'cv' ? cvContent : coverLetterContent;
  const formattedContent = currentContent?.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      <br />
    </React.Fragment>
  ));
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'cv'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('cv')}
          >
            CV
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'coverLetter'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('coverLetter')}
          >
            Cover Letter
          </button>
        </nav>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {activeTab === 'cv' ? 'Curriculum Vitae' : 'Cover Letter'}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
            {!isEditing && (
              <button
                onClick={handleEditClick}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full h-[60vh] p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 h-[60vh] overflow-auto font-serif">
            {currentContent ? (
              <div className="whitespace-pre-line">{formattedContent}</div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No content to display
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={isDownloading || !currentContent}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd" 
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" 
                clipRule="evenodd" 
              />
            </svg>
            Download PDF
          </button>
          <button
            onClick={() => handleDownload('docx')}
            disabled={isDownloading || !currentContent}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd" 
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" 
                clipRule="evenodd" 
              />
            </svg>
            Download DOCX
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;