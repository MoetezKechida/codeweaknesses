'use client';

import { useAuth } from '@/hooks/use-auth';
import { useProblems } from '@/hooks/use-problems';
import { useContests } from '@/hooks/use-contests';
import { useSubmissions } from '@/hooks/use-submissions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { BookOpen, Trophy, FileText, Zap } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading, isReady } = useAuth();
  const { data: problems = [] } = useProblems({ limit: 5 });
  const { data: contests = [] } = useContests({ limit: 5 });
  const { data: submissions = [] } = useSubmissions({ limit: 10 });

  if (!isReady || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-r-blue-500" />
          <p className="mt-4 text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Problems',
      value: problems?.length || 0,
      icon: BookOpen,
      color: 'blue',
    },
    {
      name: 'Contests',
      value: contests?.length || 0,
      icon: Trophy,
      color: 'cyan',
    },
    {
      name: 'Submissions',
      value: submissions?.length || 0,
      icon: FileText,
      color: 'blue',
    },
    {
      name: 'Accepted',
      value: submissions?.filter((s) => s.status === 'accepted').length || 0,
      icon: Zap,
      color: 'cyan',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-slate-400">Track your progress and continue solving problems</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClass = stat.color === 'blue' ? 'text-blue-500' : 'text-cyan-500';
          return (
            <Card key={stat.name} className="border-white/35 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">{stat.name}</p>
                  <p className="text-white font-bold">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${colorClass}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Problems */}
        <div className="lg:col-span-2">
          <Card className="border-white/35 bg-slate-900/50">
            <div className="p-6 border-b border-white/35">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold">Recent Problems</h2>
                <Link href="/dashboard/problems" className="text-blue-400 hover:text-blue-300 text-sm">
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-white/35">
              {problems && problems.length > 0 ? (
                problems.slice(0, 5).map((problem: any) => (
                  <Link
                    key={problem.id}
                    href={`/dashboard/problems/${problem.id}`}
                    className="p-4 hover:bg-slate-800/50 transition flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-blue-400 transition">{problem.title}</p>
                      <p className="text-sm text-slate-400">{problem.description?.substring(0, 100)}...</p>
                    </div>
                    <Badge
                      className={`ml-4 flex-shrink-0 ${
                        problem.difficulty === 'easy'
                          ? 'bg-green-500/20 text-green-400'
                          : problem.difficulty === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {problem.difficulty}
                    </Badge>
                  </Link>
                ))
              ) : (
                <p className="p-4 text-slate-400">No problems available</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Submissions */}
        <div>
          <Card className="border-white/35 bg-slate-900/50">
            <div className="p-6 border-b border-white/35">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold">Recent Submissions</h2>
                <Link href="/dashboard/submissions" className="text-blue-400 hover:text-blue-300 text-sm">
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-white/35">
              {submissions && submissions.length > 0 ? (
                submissions.slice(0, 5).map((submission: any) => (
                  <Link
                    key={submission.id}
                    href={`/dashboard/submissions/${submission.id}`}
                    className="p-4 hover:bg-slate-800/50 transition flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-blue-400 transition">
                        Problem #{submission.problemId}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={`ml-2 flex-shrink-0 ${
                        submission.status === 'accepted'
                          ? 'bg-green-500/20 text-green-400'
                          : submission.status === 'pending'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {submission.status}
                    </Badge>
                  </Link>
                ))
              ) : (
                <p className="p-4 text-slate-400">No submissions yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
