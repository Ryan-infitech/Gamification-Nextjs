'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';

// Login form schema using Zod
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  rememberMe: z.boolean().optional(),
});

// Typescript type for our form
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  // Setup react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Form submission handler
  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      await login(data.email, data.password, data.rememberMe);
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Email atau password salah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex flex-col items-center justify-center p-4">
      {/* Animated pixels in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-24 h-24 top-20 left-20 opacity-20 animate-float">
          <Image src="/assets/decorations/pixel-star.svg" alt="Pixel decoration" width={96} height={96} />
        </div>
        <div className="absolute w-32 h-32 bottom-40 right-20 opacity-20 animate-float-delayed">
          <Image src="/assets/decorations/pixel-cloud.svg" alt="Pixel decoration" width={128} height={128} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-block">
              <Image
                src="/assets/logo/logo.png"
                alt="Gamifikasi CS Logo"
                width={80}
                height={80}
                className="mx-auto mb-4"
              />
            </div>
          </Link>
          <h1 className="font-pixel-heading text-3xl text-gradient mb-2">Login</h1>
          <p className="font-pixel-body text-muted-foreground">
            Masuk untuk melanjutkan petualanganmu!
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-pixel-body mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                className="border-2 border-border h-12 font-pixel-body"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block font-pixel-body">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-pixel-body text-primary hover:text-primary/80 transition-colors"
                >
                  Lupa Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="border-2 border-border h-12 font-pixel-body"
                {...register('password')}
                error={errors.password?.message}
              />
            </div>

            <div className="flex items-center">
              <Checkbox id="rememberMe" {...register('rememberMe')} />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-sm font-pixel-body text-foreground"
              >
                Ingat saya
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 font-pixel-body text-lg"
            isLoading={isLoading}
          >
            Login
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background font-pixel-body text-muted-foreground">
                Atau login dengan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 font-pixel-body"
              onClick={() => {
                /* Implement Google login */
              }}
            >
              <Image src="/assets/icons/google.svg" width={20} height={20} alt="Google" className="mr-2" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 font-pixel-body"
              onClick={() => {
                /* Implement GitHub login */
              }}
            >
              <Image src="/assets/icons/github.svg" width={20} height={20} alt="GitHub" className="mr-2" />
              GitHub
            </Button>
          </div>
        </form>

        {/* Register Link */}
        <div className="text-center mt-8">
          <p className="font-pixel-body text-muted-foreground">
            Belum punya akun?{' '}
            <Link
              href="/register"
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="text-sm font-pixel-body text-muted-foreground">
          &copy; {new Date().getFullYear()} Gamifikasi CS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
