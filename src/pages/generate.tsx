import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CVUpload from '@/components/CVUpload';
import ProfileInput from '@/components/ProfileInput';
import JobInput from '@/components/JobInput';
import DocumentPreview from '@/components/DocumentPreview';
import { generatePDF, generateDOCX } from '@/services/document-generator';
import { useAuth } from '@/contexts/AuthContext';

const GeneratePage: NextPage = () => {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  const { method } = router.query;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profileMethod, setProfileMethod] = useState<'profile' | 'upload'>('upload');
  
  // Set profile method based on URL parameter
  useEffect(() => {
    if (method === 'profile') {
      setProfileMethod('profile');
    } else if (method === 'upload') {
      setProfileMethod('upload');
    }
  }, [method]);
  
  const [profileData, setProfileData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    cv?: string;
    coverLetter?: string;
  }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Check authentication and redirect if needed
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/generate');
    }
  }, [currentUser, loading, router]);
  
  const handleProfileDataChange = (data: any) => {
    setProfileData(data);
    if (data) {
      setStep(2);
    }
  };
  
  const handleJobDataChange = (data: any) => {
    setJobData(data);
    if (data) {
      setStep(3);
    }
  };
  
  const handleGenerate = async () => {
    if (!currentUser) {
      setError('You must be logged in to generate documents');
      router.push('/login?redirect=/generate');
      return;
    }
  
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
      
      // Save generated documents in Firebase
      try {
        const { saveGeneratedDocuments } = await import('@/utils/document-utils');
        await saveGeneratedDocuments(currentUser.uid, {
          cv: result.cv,
          coverLetter: result.coverLetter,
          profileData,
          jobData
        });
      } catch (saveError) {
        console.error('Error saving documents:', saveError);
        // Don't throw this error since the documents are already generated
        // Just log it as it's not critical to the user experience
      }
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
  
  // Show loading or redirect state
  if (loading || (!loading && !currentUser)) {
    return (
      <Layout title="Generate CV & Cover Letter - JobCV" description="Generate tailored CV and cover letter for your job application">
        <div className="container mx-auto py-10 px-4">
          <div className="bg-white rounded-lg shadow text-center p-8">
            <h1 className="text-2xl font-semibold mb-4">
              {loading ? "Loading..." : "Please log in to access this page"}
            </h1>
            {!loading && !currentUser && (
              <p className="mb-6 text-gray-600">
                You need to be logged in to generate documents. Redirecting to login...
              </p>
            )}
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Generate CV & Cover Letter - JobCV" description="Generate tailored CV and cover letter for your job application">
      <div className="py-10">
        <div className="mb-10">
          <h1 className="app-heading-3xl mb-4">Generate Your Application Documents</h1>
          <p className="app-text-lg text-gray-600 max-w-3xl">
            Create a tailored CV and cover letter for your job application in three simple steps.
            Our AI will optimize your documents to match the job requirements and increase your chances of getting noticed.
          </p>
        </div>
        
        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'app-bg-primary text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                1
              </div>
              <span className="mt-2 app-text-sm font-medium text-gray-600">Profile</span>
            </div>
            <div className={`h-1 flex-1 mx-2 ${step >= 2 ? 'app-bg-primary' : 'bg-gray-300'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'app-bg-primary text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                2
              </div>
              <span className="mt-2 app-text-sm font-medium text-gray-600">Job</span>
            </div>
            <div className={`h-1 flex-1 mx-2 ${step >= 3 ? 'app-bg-primary' : 'bg-gray-300'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 3 ? 'app-bg-primary text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                3
              </div>
              <span className="mt-2 app-text-sm font-medium text-gray-600">Generate</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {step === 1 && (
              <div>
                <h2 className="app-heading-2xl mb-4">Step 1: Provide Your Profile</h2>
                <div className="mb-6">
                  <div className="app-tabs mb-6">
                    <button
                      className={`app-tab ${profileMethod === 'upload' ? 'app-tab-active' : ''}`}
                      onClick={() => setProfileMethod('upload')}
                    >
                      Upload CV
                    </button>
                    <button
                      className={`app-tab ${profileMethod === 'profile' ? 'app-tab-active' : ''}`}
                      onClick={() => setProfileMethod('profile')}
                    >
                      Enter Profile
                    </button>
                  </div>
                  
                  {profileMethod === 'upload' ? (
                    <CVUpload onProfileDataChange={handleProfileDataChange} />
                  ) : (
                    <ProfileInput onProfileDataChange={handleProfileDataChange} />
                  )}
                </div>
                
                {profileData && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="app-button app-button-primary inline-flex items-center"
                    >
                      Continue to Job Details
                      <svg className="ml-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h2 className="app-heading-2xl mb-4">Step 2: Enter Job Details</h2>
                <JobInput onJobDataChange={handleJobDataChange} />
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="app-button app-button-secondary inline-flex items-center"
                  >
                    <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Profile
                  </button>
                  
                  {jobData && (
                    <button
                      onClick={() => setStep(3)}
                      className="app-button app-button-primary inline-flex items-center"
                    >
                      Continue to Generate
                      <svg className="ml-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h2 className="app-heading-2xl mb-4">Step 3: Generate Documents</h2>
                <div className="app-card mb-6">
                  <p className="text-gray-600 mb-4">
                    We will use AI to generate a tailored CV and cover letter based on your profile and the job details you provided.
                  </p>
                  
                  {error && (
                    <div className="app-alert app-alert-error mb-4">
                      <p>{error}</p>
                    </div>
                  )}
                  
                  {!generatedContent.cv && !generatedContent.coverLetter ? (
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="app-button app-button-primary w-full inline-flex items-center justify-center disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating Documents...
                        </>
                      ) : (
                        <>
                          <svg className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          Generate CV & Cover Letter
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="app-button app-button-outline w-full inline-flex items-center justify-center disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <svg className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          Regenerate Documents
                        </>
                      )}
                    </button>
                  )}
                  
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="text-gray-600 hover:text-gray-800 font-medium flex items-center"
                    >
                      <svg className="mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      Back to Job Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            {(generatedContent.cv || generatedContent.coverLetter) && (
              <div>
                <h2 className="app-heading-2xl mb-4">Your Documents</h2>
                <DocumentPreview
                  cv={generatedContent.cv}
                  coverLetter={generatedContent.coverLetter}
                  onEdit={handleEdit}
                  onDownload={handleDownload}
                  onRegenerate={handleRegenerate}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GeneratePage;