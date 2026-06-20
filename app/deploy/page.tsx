'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Rocket, 
  Database, 
  Key, 
  Globe,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function DeployPage() {
  const [copied, setCopied] = useState(false);
  const [envCopied, setEnvCopied] = useState(false);
  const [activeStep, setActiveStep] = useState('vercel');

  const repoUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app';
  
  const envVars = `NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url'}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key'}
GOOGLE_API_KEY=your_google_api_key_here`;

  const copyToClipboard = (text: string, type: 'repo' | 'env') => {
    navigator.clipboard.writeText(text);
    if (type === 'repo') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setEnvCopied(true);
      setTimeout(() => setEnvCopied(false), 2000);
    }
  };

  const steps = [
    {
      id: 'vercel',
      title: 'Deploy to Vercel',
      icon: <Rocket className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              One-Click Deploy
            </h3>
            <p className="text-zinc-400 mb-6">
              Click the button below to import this project into Vercel. You'll need to connect your Git repository or upload the project files.
            </p>
            
            <a 
              href="https://vercel.com/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 px-8 py-6 text-lg shadow-lg shadow-emerald-500/20">
                <Rocket className="w-5 h-5" />
                Deploy to Vercel
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-violet-400" />
              Environment Variables
            </h3>
            <p className="text-zinc-400 mb-4">
              After deploying, add these environment variables in your Vercel project settings (Settings → Environment Variables):
            </p>
            
            <div className="relative">
              <pre className="bg-black rounded-lg p-4 text-sm font-mono text-zinc-300 overflow-x-auto border border-zinc-800">
                {envVars}
              </pre>
              <Button
                onClick={() => copyToClipboard(envVars, 'env')}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300"
              >
                {envCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-amber-950/20 border border-amber-800/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-200/80">
                  <strong>Important:</strong> You need a Google API Key for the AI critique feature. 
                  Get one free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">Google AI Studio</a>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'manual',
      title: 'Manual Deploy',
      icon: <ChevronRight className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4">Step-by-Step Manual Deploy</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-900/40 flex items-center justify-center shrink-0 text-sky-400 font-bold text-sm">1</div>
                <div>
                  <div className="font-medium">Push to GitHub</div>
                  <div className="text-sm text-zinc-400">Create a new repository and push your code</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-900/40 flex items-center justify-center shrink-0 text-sky-400 font-bold text-sm">2</div>
                <div>
                  <div className="font-medium">Import to Vercel</div>
                  <div className="text-sm text-zinc-400">Go to <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">vercel.com/new</a> and import your repo</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-900/40 flex items-center justify-center shrink-0 text-sky-400 font-bold text-sm">3</div>
                <div>
                  <div className="font-medium">Add Environment Variables</div>
                  <div className="text-sm text-zinc-400">In Project Settings → Environment Variables, add:</div>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-500">
                    <li><code className="bg-zinc-800 px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code></li>
                    <li><code className="bg-zinc-800 px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                    <li><code className="bg-zinc-800 px-1.5 py-0.5 rounded">GOOGLE_API_KEY</code></li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-900/40 flex items-center justify-center shrink-0 text-sky-400 font-bold text-sm">4</div>
                <div>
                  <div className="font-medium">Deploy</div>
                  <div className="text-sm text-zinc-400">Click Deploy and wait for the build to complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'supabase',
      title: 'Supabase Setup',
      icon: <Database className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-violet-400" />
              Database Already Configured
            </h3>
            <p className="text-zinc-400 mb-4">
              Your Supabase database is already provisioned and the schema is applied. The following tables are ready:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['sessions', 'session_metrics', 'coach_links', 'coaches'].map((table) => (
                <div key={table} className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-zinc-300">{table}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="text-sm text-zinc-400 mb-2">Your Supabase URL:</div>
              <div className="flex items-center gap-2">
                <code className="bg-black rounded px-3 py-2 text-sm font-mono text-zinc-300 flex-1 overflow-x-auto">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
                </code>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold tracking-tight">Deploy Your App</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Get Your App Live</h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Deploy to Vercel in minutes. Your app will be served over HTTPS so microphone access works properly.
          </p>
        </div>

        <Tabs value={activeStep} onValueChange={setActiveStep}>
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-8 mx-auto flex w-fit">
            {steps.map((step) => (
              <TabsTrigger 
                key={step.id} 
                value={step.id}
                className="data-[state=active]:bg-zinc-800 gap-2"
              >
                {step.icon}
                {step.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {steps.map((step) => (
            <TabsContent key={step.id} value={step.id}>
              {step.content}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-12 text-center">
          <p className="text-zinc-500 text-sm">
            After deploying, visit your live URL and the microphone will work because it's served over HTTPS.
          </p>
        </div>
      </main>
    </div>
  );
}
