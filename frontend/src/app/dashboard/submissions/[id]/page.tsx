'use client';

import { useSubmission } from '@/hooks/use-submissions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const { data: submission, isLoading } = useSubmission(params.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
      case 'runtime_error':
      case 'compilation_error':
        return 'bg-red-500/20 text-red-400';
      case 'timeout':
        return 'bg-orange-500/20 text-orange-400';
      case 'pending':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'rejected':
      case 'runtime_error':
      case 'compilation_error':
        return <XCircle className="w-6 h-6 text-red-400" />;
      case 'timeout':
        return <Clock className="w-6 h-6 text-orange-400" />;
      case 'pending':
        return <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-r-blue-400" />;
      default:
        return <AlertCircle className="w-6 h-6 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-r-blue-500" />
          <p className="mt-4 text-slate-400">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="border-slate-800 bg-red-500/10 p-6">
          <p className="text-red-400">Submission not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Submission Details</h1>
          </div>
          <div className="flex items-center gap-3">
            {getStatusIcon(submission.status)}
            <Badge className={getStatusColor(submission.status)}>
              {submission.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submission Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="border-white/35 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold mb-4">Submission Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Problem ID</p>
                <p className="font-semibold">{submission.problemId}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Language</p>
                <p className="font-semibold">{submission.language.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Submitted At</p>
                <p className="font-semibold">{new Date(submission.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Score</p>
                <p className="font-semibold">{submission.score !== undefined ? `${submission.score}%` : '-'}</p>
              </div>
            </div>
          </Card>

          {/* Code */}
          <Card className="border-white/35 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold mb-4">Submitted Code</h2>
            <pre className="bg-slate-800 rounded p-4 overflow-auto max-h-96 text-sm text-slate-300 font-mono">
              {submission.code}
            </pre>
          </Card>

          {/* Test Results */}
          {submission.testResults && submission.testResults.length > 0 && (
            <Card className="border-white/35 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Test Results</h2>
              <div className="space-y-2">
                {submission.testResults.map((result: any, idx: number) => (
                  <div
                    key={result.id}
                    className={`p-4 rounded-lg border ${
                      result.passed
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-red-500/10 border-red-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Test Case {idx + 1}</span>
                      <Badge
                        className={
                          result.passed
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }
                      >
                        {result.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                    {result.executionTime !== undefined && (
                      <p className="text-sm text-slate-400">
                        Time: {result.executionTime}ms
                        {result.memoryUsed !== undefined && ` | Memory: ${result.memoryUsed}MB`}
                      </p>
                    )}
                    {result.error && (
                      <div className="mt-2 p-2 bg-slate-800 rounded text-sm font-mono text-red-400">
                        {result.error}
                      </div>
                    )}
                    {result.output && (
                      <div className="mt-2">
                        <p className="text-sm text-slate-400 mb-1">Output:</p>
                        <div className="p-2 bg-slate-800 rounded text-sm font-mono whitespace-pre-wrap break-words">
                          {result.output}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Stats */}
        <div>
          <Card className="border-white/35 bg-slate-900/50 p-6">
            <h3 className="text-lg font-semibold mb-6">Summary</h3>
            <div className="space-y-6">
              {submission.testResults && (
                <>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Tests Passed</p>
                    <p className="text-2xl font-bold text-green-400">
                      {submission.testResults.filter((r: any) => r.passed).length} / {submission.testResults.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Status</p>
                    <p className="text-lg font-semibold capitalize">
                      {submission.status === 'accepted' ? 'Accepted ✓' : 'Not Accepted ✗'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
