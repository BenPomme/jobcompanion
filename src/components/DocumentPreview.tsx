import React, { useState, useEffect } from 'react';

interface DocumentPreviewProps {
  cv?: string;
  coverLetter?: string;
  onEdit: (type: 'cv' | 'coverLetter', content: string) => void;
  onDownload: (type: 'cv' | 'coverLetter', format: 'pdf' | 'docx') => Promise<void>;
  onRegenerate?: () => Promise<void>;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  cv,
  coverLetter,
  onEdit,
  onDownload,
  onRegenerate,
}) => {
  const [activeTab, setActiveTab] = useState<'cv' | 'coverLetter'>('cv');
  const [viewMode, setViewMode] = useState<'preview' | 'edit' | 'code'>('preview');
  const [editableContent, setEditableContent] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<'formatted' | 'plain'>('formatted');
  
  // Update editable content when active tab changes
  useEffect(() => {
    const content = activeTab === 'cv' ? cv : coverLetter;
    setEditableContent(content || '');
  }, [activeTab, cv, coverLetter]);
  
  const handleEditClick = () => {
    setViewMode('edit');
  };
  
  const handleCodeClick = () => {
    setViewMode('code');
  };
  
  const handlePreviewClick = () => {
    setViewMode('preview');
  };
  
  const handleSaveEdit = () => {
    onEdit(activeTab, editableContent);
    setViewMode('preview');
  };
  
  const handleCancelEdit = () => {
    // Reset to original content
    setEditableContent(activeTab === 'cv' ? cv || '' : coverLetter || '');
    setViewMode('preview');
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
    if (!onRegenerate) return;
    
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };
  
  const currentContent = activeTab === 'cv' ? cv : coverLetter;
  
  const renderFormattedContent = () => {
    if (!currentContent) return null;
    
    if (previewFormat === 'plain') {
      return <div className="whitespace-pre-line font-mono text-sm">{currentContent}</div>;
    }
    
    const paragraphs = currentContent.split('\n\n');
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, i) => {
          // Check if this paragraph appears to be a heading
          if (paragraph.includes('EXPERIENCE') || 
              paragraph.includes('EDUCATION') || 
              paragraph.includes('SKILLS') ||
              paragraph.includes('SUMMARY') ||
              paragraph.includes('QUALIFICATIONS')) {
            return <h3 key={i} className="text-lg font-semibold text-gray-800">{paragraph}</h3>;
          }
          
          // Check if this paragraph might be a list item
          if (paragraph.startsWith('- ') || paragraph.startsWith('• ')) {
            return (
              <ul key={i} className="list-disc pl-5">
                <li className="text-gray-700">{paragraph.substring(2)}</li>
              </ul>
            );
          }
          
          // Regular paragraph
          return <p key={i} className="text-gray-700">{paragraph}</p>;
        })}
      </div>
    );
  };
  
  return (
    <div className="app-card">
      <div className="app-tabs">
        <button
          className={`app-tab ${activeTab === 'cv' ? 'app-tab-active' : ''}`}
          onClick={() => setActiveTab('cv')}
        >
          CV
        </button>
        <button
          className={`app-tab ${activeTab === 'coverLetter' ? 'app-tab-active' : ''}`}
          onClick={() => setActiveTab('coverLetter')}
        >
          Cover Letter
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="app-heading-xl">
            {activeTab === 'cv' ? 'Curriculum Vitae' : 'Cover Letter'}
          </h2>
          <div className="flex space-x-2">
            {onRegenerate && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="app-button app-button-secondary text-sm"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}
            
            <div className="app-tabs text-sm">
              <button
                className={`px-3 py-1 ${viewMode === 'preview' ? 'app-tab-active' : ''}`}
                onClick={handlePreviewClick}
              >
                Preview
              </button>
              <button
                className={`px-3 py-1 ${viewMode === 'edit' ? 'app-tab-active' : ''}`}
                onClick={handleEditClick}
              >
                Edit
              </button>
              <button
                className={`px-3 py-1 ${viewMode === 'code' ? 'app-tab-active' : ''}`}
                onClick={handleCodeClick}
              >
                Code
              </button>
            </div>
          </div>
        </div>
        
        {viewMode === 'preview' && (
          <>
            <div className="flex justify-end mb-2">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setPreviewFormat('formatted')}
                  className={`px-3 py-1 text-xs rounded-l-md ${
                    previewFormat === 'formatted'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Formatted
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFormat('plain')}
                  className={`px-3 py-1 text-xs rounded-r-md ${
                    previewFormat === 'plain'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Plain Text
                </button>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 h-[60vh] overflow-auto">
              {currentContent ? (
                renderFormattedContent()
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No content to display
                </div>
              )}
            </div>
          </>
        )}
        
        {viewMode === 'edit' && (
          <div className="mb-4">
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="app-input w-full h-[60vh] font-serif text-gray-700 resize-none"
              placeholder={`Enter your ${activeTab === 'cv' ? 'CV' : 'cover letter'} content here...`}
            />
            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={handleCancelEdit}
                className="app-button app-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="app-button app-button-primary"
              >
                Save
              </button>
            </div>
          </div>
        )}
        
        {viewMode === 'code' && (
          <div className="mb-4">
            <div className="bg-gray-800 text-gray-200 font-mono text-sm p-4 rounded-lg h-[60vh] overflow-auto">
              <pre>{currentContent || 'No content to display'}</pre>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handlePreviewClick}
                className="app-button app-button-secondary"
              >
                Back to Preview
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={isDownloading || !currentContent}
            className="app-button app-button-secondary flex items-center"
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
            className="app-button app-button-primary flex items-center"
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