'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProblems } from '@/hooks/use-problems';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Search } from 'lucide-react';

export default function ProblemsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const { data: problems = [], isLoading, error } = useProblems({ page, limit });

  const filteredProblems = useMemo(() => {
    return (problems || []).filter((problem: any) => {
      const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase()) ||
        problem.description?.toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || problem.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [problems, search, difficultyFilter]);

  const handleDifficultyChange = (value: string | null) => {
    if (value) setDifficultyFilter(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Problems</h1>
        </div>
        <p className="text-slate-400">Solve problems and improve your coding skills</p>
      </div>

      {/* Filters */}
      <Card className="border-white/35 bg-slate-900/50 p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={handleDifficultyChange}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Problems List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-r-blue-500 mb-4" />
              <p className="text-slate-400">Loading problems...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-slate-800 bg-red-500/10 p-6">
            <p className="text-red-400">Error loading problems. Please try again.</p>
          </Card>
        ) : filteredProblems.length > 0 ? (
          filteredProblems.map((problem: any) => (
            <Link key={problem.id} href={`/dashboard/problems/${problem.id}`}>
              <Card className="border-white/35 bg-slate-900/50 p-6 hover:bg-slate-800/50 transition cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400">
                      {problem.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {problem.description}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Badge
                      className={`flex-shrink-0 ${
                        problem.difficulty === 'easy'
                          ? 'bg-green-500/20 text-green-400'
                          : problem.difficulty === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {problem.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
                  <span>Time Limit: {problem.timeLimit}ms</span>
                  <span>Memory Limit: {problem.memoryLimit}MB</span>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="border-white/35 bg-slate-900/50 p-6 text-center">
            <p className="text-slate-400">No problems found matching your criteria.</p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {filteredProblems.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {filteredProblems.length} of {problems?.length} problems
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage(page + 1)}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
