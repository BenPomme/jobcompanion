import Head from 'next/head';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  return (
    <>
      <Head>
        <title>CV & Cover Letter Generator</title>
        <meta name="description" content="Generate tailored CVs and cover letters for job applications" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`min-h-screen p-4 md:p-24 ${inter.className}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            CV & Cover Letter Generator
          </h1>
          <p className="text-lg text-center mb-12">
            Connect your LinkedIn profile or upload your CV to generate tailored job applications
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LinkedIn connection option */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Connect LinkedIn</h2>
              <p className="mb-4">Import your professional experience directly from LinkedIn</p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                Connect LinkedIn
              </button>
            </div>
            
            {/* CV upload option */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Upload CV</h2>
              <p className="mb-4">Upload your existing CV in PDF or DOCX format</p>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                Upload CV
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}