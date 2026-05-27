'use client';

import { useContests } from '@/hooks/use-contests';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Trophy, Clock } from 'lucide-react';

export default function ContestsPage() {
  const { data: contests = [], isLoading, error } = useContests();

  const getContestStatus = (contest: any) => {
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);

    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'finished';
    return 'ongoing';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-500/20 text-green-400';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400';
      case 'finished':
        return 'bg-slate-500/20 text-slate-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-cyan-500" />
          <h1 className="text-3xl font-bold">Contests</h1>
        </div>
        <p className="text-slate-400">Participate in contests and compete with other programmers</p>
      </div>

      {/* Contests List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-r-blue-500 mb-4" />
              <p className="text-slate-400">Loading contests...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-slate-800 bg-red-500/10 p-6">
            <p className="text-red-400">Error loading contests. Please try again.</p>
          </Card>
        ) : contests && contests.length > 0 ? (
          contests.map((contest: any) => {
            const status = getContestStatus(contest);
            const startTime = new Date(contest.startTime);
            const endTime = new Date(contest.endTime);

            return (
              <Link key={contest.id} href={`/dashboard/contests/${contest.id}`}>
                <Card className="border-white/35 bg-slate-900/50 p-6 hover:bg-slate-800/50 transition cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{contest.title}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2">
                        {contest.description}
                      </p>
                    </div>
                    <Badge className={`flex-shrink-0 ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Starts: {startTime.toLocaleDateString()} {startTime.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Ends: {endTime.toLocaleDateString()} {endTime.toLocaleTimeString()}</span>
                    </div>
                    <div>
                      <span>{contest.participants || 0} Participants</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card className="border-white/35 bg-slate-900/50 p-6 text-center">
            <p className="text-slate-400">No contests available at the moment.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
