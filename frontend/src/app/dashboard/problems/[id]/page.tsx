'use client';

import { useState } from 'react';
import { useProblem } from '@/hooks/use-problems';
import { useCreateSubmission } from '@/hooks/use-submissions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Editor from '@monaco-editor/react';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LANGUAGE_TEMPLATES: Record<string, string> = {
  cpp: `#include<bits/stdc++.h>
using namespace std;

int main(){
    // Write your code here
    return 0;
}`,
  python: `# Write your code here
def solve():
    pass

if __name__ == "__main__":
    solve()`,
  java: `import java.io.*;

class Solution {
    public static void main(String[] args) {
        // Write your code here
    }
}`,
  javascript: `// Write your code here
function solve() {

}

solve();`,
};

export default function ProblemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: problem, isLoading } = useProblem(params.id);
  const { mutate: submitCode, isPending: isSubmitting } = useCreateSubmission();
  
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.cpp);
  const [language, setLanguage] = useState('cpp');
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

  const handleLanguageChange = (newLanguage: string | null) => {
    if (!newLanguage) return;
    setLanguage(newLanguage);
    setCode(LANGUAGE_TEMPLATES[newLanguage] || '');
  };

  const handleSubmit = () => {
    if (!problem) return;
    
    submitCode(
      {
        problemId: problem.id,
        code,
        language,
      },
      {
        onSuccess: () => {
          setSubmissionStatus('success');
          setTimeout(() => {
            router.push('/dashboard/submissions');
          }, 2000);
        },
        onError: (error: any) => {
          setSubmissionStatus('error');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-r-blue-500" />
          <p className="mt-4 text-slate-400">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="border-slate-800 bg-red-500/10 p-6">
          <p className="text-red-400">Problem not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Problem Statement */}
        <div>
          <Card className="border-white/35 bg-slate-900/50 p-6 h-full flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{problem.title}</h1>
                <Badge
                  className={
                    problem.difficulty === 'easy'
                      ? 'bg-green-500/20 text-green-400'
                      : problem.difficulty === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }
                >
                  {problem.difficulty}
                </Badge>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{problem.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded p-4">
                <p className="text-slate-400 text-sm">Time Limit</p>
                <p className="text-xl font-semibold">{problem.timeLimit}ms</p>
              </div>
              <div className="bg-slate-800/50 rounded p-4">
                <p className="text-slate-400 text-sm">Memory Limit</p>
                <p className="text-xl font-semibold">{problem.memoryLimit}MB</p>
              </div>
            </div>

            {problem.testCases && problem.testCases.length > 0 && (
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4">Sample Test Cases</h3>
                <div className="space-y-4 overflow-y-auto max-h-96">
                  {problem.testCases.map((testCase: any, idx: number) => (
                    <div key={idx} className="bg-slate-800/50 rounded p-4">
                      <p className="text-sm text-slate-400 mb-2">Test Case {idx + 1}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 mb-1">Input:</p>
                          <p className="bg-slate-900 p-2 rounded font-mono text-xs whitespace-pre-wrap break-words">
                            {testCase.input}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Output:</p>
                          <p className="bg-slate-900 p-2 rounded font-mono text-xs whitespace-pre-wrap break-words">
                            {testCase.output}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Code Editor */}
        <div>
          <Card className="border-white/35 bg-slate-900/50 p-6 h-full flex flex-col">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Language</label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 mb-4 rounded border border-slate-700 overflow-hidden">
              <Editor
                height="400px"
                language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : language === 'java' ? 'java' : 'javascript'}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            {submissionStatus && (
              <div
                className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                  submissionStatus === 'success'
                    ? 'bg-green-500/10 border border-green-500/50'
                    : 'bg-red-500/10 border border-red-500/50'
                }`}
              >
                {submissionStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400">Submission successful! Redirecting...</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400">Submission failed. Please try again.</p>
                  </>
                )}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Solution'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
