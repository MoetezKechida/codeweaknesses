'use client';

import { useContest } from '@/hooks/use-contests';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, BookOpen } from 'lucide-react';

export default function ContestDetailPage({ params }: { params: { id: string } }) {
  const { data: contest, isLoading } = useContest(params.id);

  const getContestStatus = (contest: any) => {
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);

    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'finished';
    return 'ongoing';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-r-blue-500" />
          <p className="mt-4 text-slate-400">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="border-slate-800 bg-red-500/10 p-6">
          <p className="text-red-400">Contest not found</p>
        </Card>
      </div>
    );
  }

  const status = getContestStatus(contest);
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-cyan-500" />
            <h1 className="text-3xl font-bold">{contest.title}</h1>
          </div>
          <Badge
            className={
              status === 'ongoing'
                ? 'bg-green-500/20 text-green-400'
                : status === 'upcoming'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-slate-500/20 text-slate-400'
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <p className="text-slate-400 mb-4">{contest.description}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Contest Info */}
        <div className="lg:col-span-2">
          <Card className="border-white/35 bg-slate-900/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Contest Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/35">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-slate-400 text-sm">Start Time</p>
                  <p className="font-semibold">{startTime.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-4 border-b border-white/35">
                <Clock className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="text-slate-400 text-sm">End Time</p>
                  <p className="font-semibold">{endTime.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div>
          <Card className="border-white/35 bg-slate-900/50 p-6">
            <h3 className="text-lg font-semibold mb-6">Statistics</h3>
            <div className="space-y-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Participants</p>
                <p className="text-2xl font-bold">{contest.participants || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Problems</p>
                <p className="text-2xl font-bold">{contest.problems?.length || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Problems in Contest */}
      {contest.problems && contest.problems.length > 0 && (
        <Card className="border-white/35 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Problems ({contest.problems.length})
          </h2>
          <div className="space-y-2">
            {contest.problems.map((problem: any, idx: number) => (
              <div key={problem.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-800/50 transition">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg text-slate-400 w-8">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <div>
                    <p className="font-medium">{problem.title}</p>
                    <p className="text-sm text-slate-400">Time: {problem.timeLimit}ms, Memory: {problem.memoryLimit}MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                  <Link href={`/dashboard/problems/${problem.id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Solve
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
