import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import UnifiedWorkflow from '@/components/UnifiedWorkflow';
import { generatePDF, generateDOCX } from '@/services/document-generator';
import { useAuth } from '@/contexts/AuthContext';

const GeneratePage: NextPage = () => {
  return (
    <Layout title="Generate CV & Cover Letter - JobCV" description="Generate tailored CV and cover letter for your job application">
      <UnifiedWorkflow />
    </Layout>
  );
};

export default GeneratePage;