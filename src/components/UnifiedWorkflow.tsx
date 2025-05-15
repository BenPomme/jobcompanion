import React, { useState, useEffect } from 'react';
import CVUpload from './CVUpload';
import ProfileInput from './ProfileInput';
import JobInput from './JobInput';
import DocumentPreview from './DocumentPreview';
import { generatePDF, generateDOCX } from '@/services/document-generator';
import { generateDocuments } from '@/utils/api-client';
import { saveGeneratedDocuments } from '@/utils/document-utils';
import { useAuth } from '@/contexts/AuthContext';

const UnifiedWorkflow: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profileMethod, setProfileMethod] = useState<'upload' | 'profile'>('upload');
  const [profileData, setProfileData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState<{ cv?: string; coverLetter?: string }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!loading && !currentUser) {
      // redirect handled by page wrapper
    }
  }, [currentUser, loading]);

  const handleProfileDataChange = (data: any) => {
    setProfileData(data);
    setStep(2);
  };

  const handleJobDataChange = (data: any) => {
    setJobData(data);
    setStep(3);
  };

  const handleGenerate = async () => {
    if (!currentUser) return;
    setIsGenerating(true);
    setError('');
    try {
      const result = await generateDocuments(profileData, jobData);
      setGeneratedContent({ cv: result.cv, coverLetter: result.coverLetter });
      // save to Firestore
      await saveGeneratedDocuments(currentUser.uid, { cv: result.cv, coverLetter: result.coverLetter, profileData, jobData });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => handleGenerate();

  const handleEdit = (type: 'cv' | 'coverLetter', content: string) => {
    setGeneratedContent(prev => ({ ...prev, [type]: content }));
  };

  const handleDownload = async (type: 'cv' | 'coverLetter', format: 'pdf' | 'docx') => {
    const content = type === 'cv' ? generatedContent.cv : generatedContent.coverLetter;
    if (!content) return;
    try {
      if (format === 'pdf') {
        const bytes = await generatePDF({ [type]: content });
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `${type === 'cv' ? 'CV' : 'CoverLetter'}.pdf`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      } else {
        const files = await generateDOCX({ [type]: content });
        if (files.length) {
          const f = files[0];
          const blob = new Blob([f.buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url;
          a.download = f.name; document.body.appendChild(a); a.click();
          setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
        }
      }
    } catch (err) {
      console.error(err);
      setError(`Download failed: ${format.toUpperCase()}`);
    }
  };

  // Accordion helper for mobile
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {['Profile', 'Job', 'Generate'].map((label, i) => {
          const idx = i + 1;
          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= idx ? 'app-bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>{idx}</div>
                <span className="mt-1 text-sm text-gray-600">{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px ${step > idx ? 'app-bg-primary' : 'bg-gray-300'}`}></div>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Sections */}
      {!isMobile && (
        <>{step === 1 && (
          <section>
            <h2 className="app-heading-xl mb-4">Profile</h2>
            <div className="app-tabs mb-4">
              <button className={`app-tab ${profileMethod === 'upload' ? 'app-tab-active' : ''}`} onClick={() => setProfileMethod('upload')}>Upload CV</button>
              <button className={`app-tab ${profileMethod === 'profile' ? 'app-tab-active' : ''}`} onClick={() => setProfileMethod('profile')}>Enter Profile</button>
            </div>
            {profileMethod === 'upload' ? <CVUpload onProfileDataChange={handleProfileDataChange} /> : <ProfileInput onProfileDataChange={handleProfileDataChange} />}
          </section>
        )}
        {step === 2 && (
          <section>
            <h2 className="app-heading-xl mb-4">Job</h2>
            <JobInput onJobDataChange={handleJobDataChange} />
          </section>
        )}
        {step === 3 && (
          <section>
            <h2 className="app-heading-xl mb-4">Generate</h2>
            {error && <div className="app-alert app-alert-error mb-4">{error}</div>}
            {!generatedContent.cv && <button onClick={handleGenerate} disabled={isGenerating} className="app-button app-button-primary">{isGenerating ? 'Generating...' : 'Generate Documents'}</button>}
            {(generatedContent.cv || generatedContent.coverLetter) && (
              <DocumentPreview
                cv={generatedContent.cv}
                coverLetter={generatedContent.coverLetter}
                onEdit={handleEdit}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
              />
            )}
          </section>
        )}</>
      )}

      {/* Mobile Accordion */}
      {isMobile && (
        <div className="space-y-4">
          {step >= 1 && (
            <div className="app-card">
              <button className="w-full text-left flex justify-between items-center p-4" onClick={() => setStep(1)}>
                <span>Profile</span><span>{step === 1 ? '-' : '+'}</span>
              </button>
              {step === 1 && <div className="p-4 pt-0">{profileMethod === 'upload' ? <CVUpload onProfileDataChange={handleProfileDataChange} /> : <ProfileInput onProfileDataChange={handleProfileDataChange} />}</div>}
            </div>
          )}
          {step >= 2 && (
            <div className="app-card">
              <button className="w-full text-left flex justify-between items-center p-4" onClick={() => setStep(2)}>
                <span>Job</span><span>{step === 2 ? '-' : '+'}</span>
              </button>
              {step === 2 && <div className="p-4 pt-0"><JobInput onJobDataChange={handleJobDataChange} /></div>}
            </div>
          )}
          {step >= 3 && (
            <div className="app-card">
              <button className="w-full text-left flex justify-between items-center p-4" onClick={() => setStep(3)}>
                <span>Generate</span><span>{step === 3 ? '-' : '+'}</span>
              </button>
              {step === 3 && <div className="p-4 pt-0">{error && <div className="app-alert app-alert-error mb-4">{error}</div>}
                {!generatedContent.cv && <button onClick={handleGenerate} disabled={isGenerating} className="app-button app-button-primary">{isGenerating ? 'Generating...' : 'Generate Documents'}</button>}
                {(generatedContent.cv || generatedContent.coverLetter) && <DocumentPreview cv={generatedContent.cv} coverLetter={generatedContent.coverLetter} onEdit={handleEdit} onDownload={handleDownload} onRegenerate={handleRegenerate}/>}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedWorkflow; 