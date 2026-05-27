'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Code2, Zap, Award, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, isLoading, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isReady, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              CodeWeaknesses
            </h1>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Master Competitive Programming
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            CodeWeaknesses is your ultimate platform for real-time coding contests, problem-solving, and skill development. Judge your solutions instantly and compete with the best.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Start Coding Now
              </Button>
            </Link>
            <Link href="/dashboard/problems">
              <Button size="lg" variant="outline" className="px-8">
                Browse Problems
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose CodeWeaknesses?</h3>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:border-blue-500 transition">
            <Zap className="w-12 h-12 text-blue-500 mb-4" />
            <h4 className="font-bold text-lg mb-2">Real-Time Judging</h4>
            <p className="text-slate-400">Get instant feedback on your code submissions with real-time execution and test result streaming.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:border-cyan-500 transition">
            <Award className="w-12 h-12 text-cyan-500 mb-4" />
            <h4 className="font-bold text-lg mb-2">Comprehensive Problem Set</h4>
            <p className="text-slate-400">Access hundreds of curated problems ranging from easy to hard, with detailed test cases and explanations.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:border-blue-500 transition">
            <Users className="w-12 h-12 text-blue-500 mb-4" />
            <h4 className="font-bold text-lg mb-2">Live Contests</h4>
            <p className="text-slate-400">Participate in real-time contests, climb the leaderboard, and showcase your competitive programming skills.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:border-cyan-500 transition">
            <Code2 className="w-12 h-12 text-cyan-500 mb-4" />
            <h4 className="font-bold text-lg mb-2">Multi-Language Support</h4>
            <p className="text-slate-400">Write solutions in your favorite language with full syntax highlighting and intelligent code execution.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-400 mb-2">500+</div>
            <p className="text-slate-300">Problems</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-cyan-400 mb-2">10k+</div>
            <p className="text-slate-300">Active Programmers</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-400 mb-2">24/7</div>
            <p className="text-slate-300">Real-Time Judge</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-800 rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h3>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of programmers solving problems, competing in contests, and improving their skills.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>&copy; 2026 CodeWeaknesses. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
