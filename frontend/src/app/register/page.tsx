'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Code2, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordMatch, setPasswordMatch] = useState(true);
  const { register, isRegistering, registerError } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'password' || name === 'confirmPassword') {
      const pass = name === 'password' ? value : formData.password;
      const confirm = name === 'confirmPassword' ? value : formData.confirmPassword;
      setPasswordMatch(pass === confirm || confirm === '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordMatch) {
      return;
    }
    register(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              CodeWeaknesses
            </h1>
          </Link>
        </div>
      </nav>

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="p-6 sm:p-8">
            <h2 className="text-3xl font-bold mb-2 text-white">Create Account</h2>
            <p className="text-slate-400 mb-6">Join the competitive coding community</p>

            {registerError && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">
                  {(registerError as any)?.response?.data?.message || 'Registration failed. Please try again.'}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="name"
                  type="text"
                  name="email"
                  placeholder="your_email@example.com"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={isRegistering}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={isRegistering}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${
                    !passwordMatch ? 'border-red-500' : ''
                  }`}
                  disabled={isRegistering}
                />
                {!passwordMatch && formData.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isRegistering || !passwordMatch}
              >
                {isRegistering ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
