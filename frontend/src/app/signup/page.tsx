'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    await signup({ name, email, password });

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000] p-4">
      <Card className="w-full max-w-[420px] bg-[#0a0a0a] border-[#333333]">
        <CardHeader className="space-y-3 pb-8">
          <CardTitle className="text-2xl font-semibold text-white text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-[#a1a1a1] text-[14px]">
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2.5">
              <Label htmlFor="name" className="text-[13px] font-medium text-white">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="h-10 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#444444] focus-visible:ring-0 text-[13px]"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-10 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#444444] focus-visible:ring-0 text-[13px]"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-10 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#444444] focus-visible:ring-0 text-[13px]"
              />
              <p className="text-[11px] text-[#666666]">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword" className="text-[13px] font-medium text-white">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-10 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#444444] focus-visible:ring-0 text-[13px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Button
              type="submit"
              className="w-full h-10 bg-white text-black hover:bg-[#fafafa] font-medium text-[13px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
            <p className="text-[13px] text-center text-[#666666]">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:text-[#fafafa] font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
