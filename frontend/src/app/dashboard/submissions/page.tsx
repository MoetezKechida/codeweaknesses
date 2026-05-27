'use client';

import { useSubmissions } from '@/hooks/use-submissions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function SubmissionsPage() {
  const { data: submissions = [], isLoading, error } = useSubmissions();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return '✓';
      case 'rejected':
        return '✗';
      case 'pending':
        return '⏳';
      case 'runtime_error':
        return '💥';
      case 'timeout':
        return '⏱';
      case 'compilation_error':
        return '⚠';
      default:
        return '?';
    }
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Submissions</h1>
        </div>
        <p className="text-slate-400">View your submission history and results</p>
      </div>

      {/* Submissions List */}
      <Card className="border-white/35 bg-slate-900/50 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-r-blue-500 mb-4" />
              <p className="text-slate-400">Loading submissions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="text-red-400">Error loading submissions. Please try again.</p>
          </div>
        ) : submissions && submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/35 bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Problem</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Language</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Submitted At</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/35">
                {submissions.map((submission: any) => (
                  <tr key={submission.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusIcon(submission.status)} {submission.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-medium">Problem #{submission.problemId}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {submission.language.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(submission.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {submission.score !== undefined ? `${submission.score}%` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/submissions/${submission.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-slate-400">No submissions yet. Start solving problems!</p>
          </div>
        )}
      </Card>
    </div>
  );
}
