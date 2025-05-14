import React, { useState } from 'react';
import { NextPage } from 'next';
import Layout from '@/components/Layout';
import CVUpload from '@/components/CVUpload';
import LinkedInConnect from '@/components/LinkedInConnect';
import JobInput from '@/components/JobInput';
import DocumentPreview from '@/components/DocumentPreview';
import { generatePDF, generateDOCX } from '@/services/document-generator';

const GeneratePage: NextPage = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profileMethod, setProfileMethod] = useState<'linkedin' | 'upload'>('upload');
  const [profileData, setProfileData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    cv?: string;
    coverLetter?: string;
  }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const handleProfileDataChange = (data: any) => {
    setProfileData(data);
  };
  
  const handleJobDataChange = (data: any) => {
    setJobData(data);
    setStep(3);
  };
  
  const handleGenerate = async () => {
    if (!profileData) {
      setError('Please provide your profile information first');
      return;
    }
    
    if (!jobData) {
      setError('Please provide job details first');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      // Import the API client dynamically to avoid SSR issues
      const { generateDocuments } = await import('@/utils/api-client');
      
      // Generate documents using Firebase Functions
      const result = await generateDocuments(profileData, jobData);
      
      // Update state with generated content
      setGeneratedContent({
        cv: result.cv,
        coverLetter: result.coverLetter,
      });
    } catch (error) {
      console.error('Error generating documents:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleRegenerate = async () => {
    return handleGenerate();
  };
  
  const handleEdit = (type: 'cv' | 'coverLetter', content: string) => {
    setGeneratedContent({
      ...generatedContent,
      [type]: content,
    });
  };
  
  const handleDownload = async (type: 'cv' | 'coverLetter', format: 'pdf' | 'docx') => {
    const content = type === 'cv' ? generatedContent.cv : generatedContent.coverLetter;
    
    if (!content) {
      setError(`No ${type === 'cv' ? 'CV' : 'cover letter'} content to download`);
      return;
    }
    
    try {
      if (format === 'pdf') {
        const pdfBytes = await generatePDF({
          [type]: content,
        });
        
        // Create a download link
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type === 'cv' ? 'CV' : 'CoverLetter'}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      } else if (format === 'docx') {
        const docxFiles = await generateDOCX({
          [type]: content,
        });
        
        if (docxFiles.length > 0) {
          const docxFile = docxFiles[0];
          const blob = new Blob([docxFile.buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = docxFile.name;
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        }
      }
    } catch (error) {
      console.error(`Error downloading ${format.toUpperCase()}:`, error);
      setError(`Failed to download ${format.toUpperCase()} file`);
    }
  };
  
  return (
    <Layout title="Generate CV & Cover Letter - CareerBoost" description="Generate tailored CV and cover letter for your job application">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Generate Your Application Documents</h1>
          <p className="text-gray-600 max-w-3xl">
            Create a tailored CV and cover letter for your job application in three simple steps.
            Our AI will optimize your documents to match the job requirements and increase your chances of getting noticed.
          </p>
        </div>
        
        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">Profile</span>
            </div>
            <div className={`h-1 flex-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">Job</span>
            </div>
            <div className={`h-1 flex-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">Generate</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Step 1: Provide Your Profile</h2>
                <div className="mb-6">
                  <div className="flex border-b border-gray-200 mb-6">
                    <button
                      className={`py-2 px-4 ${
                        profileMethod === 'upload'
                          ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setProfileMethod('upload')}
                    >
                      Upload CV
                    </button>
                    <button
                      className={`py-2 px-4 ${
                        profileMethod === 'linkedin'
                          ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setProfileMethod('linkedin')}
                    >
                      LinkedIn
                    </button>
                  </div>
                  
                  {profileMethod === 'upload' ? (
                    <CVUpload onProfileDataChange={handleProfileDataChange} />
                  ) : (
                    <LinkedInConnect onProfileDataChange={handleProfileDataChange} />
                  )}
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!profileData}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    Continue to Step 2
                  </button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Step 2: Enter Job Details</h2>
                <JobInput onJobDataChange={handleJobDataChange} />
                
                <div className="mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mb-2"
                  >
                    Back to Step 1
                  </button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Step 3: Generate Documents</h2>
                
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-lg font-medium mb-4">Profile and Job Summary</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Profile Source:</h4>
                    <p className="text-sm text-gray-600">
                      {profileMethod === 'upload' ? 'Uploaded CV' : 'LinkedIn Profile'}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Job Position:</h4>
                    <p className="text-sm text-gray-600">
                      {jobData?.title || 'Job title not available'}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Company:</h4>
                    <p className="text-sm text-gray-600">
                      {jobData?.company || 'Company name not available'}
                    </p>
                  </div>
                  
                  {!generatedContent.cv && !generatedContent.coverLetter && (
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed mt-4"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Documents'}
                    </button>
                  )}
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mb-2"
                  >
                    Back to Step 2
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div>
            {(generatedContent.cv || generatedContent.coverLetter) && (
              <DocumentPreview
                cvContent={generatedContent.cv}
                coverLetterContent={generatedContent.coverLetter}
                onDownload={handleDownload}
                onEdit={handleEdit}
                onRegenerate={handleRegenerate}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GeneratePage;