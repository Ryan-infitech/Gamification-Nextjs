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
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';

// Registration form schema using Zod
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username minimal 3 karakter')
      .max(30, 'Username maksimal 30 karakter')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore'),
    email: z.string().email('Email tidak valid'),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Z]/, 'Password harus mengandung setidaknya 1 huruf kapital')
      .regex(/[0-9]/, 'Password harus mengandung setidaknya 1 angka'),
    confirmPassword: z.string(),
    role: z.enum(['student', 'teacher']),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: 'Anda harus menyetujui syarat dan ketentuan' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

// Typescript type for our form
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register: authRegister } = useAuth();

  // Setup react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      agreeTerms: false,
    },
  });

  // Form submission handler
  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await authRegister(data.email, data.password, data.username, data.role);
      setSuccess('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
      
      // Redirect to verification page after a short delay
      setTimeout(() => {
        router.push('/verify-email');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Gagal mendaftar. Email atau username mungkin sudah terdaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex flex-col items-center justify-center p-4 py-12">
      {/* Animated pixels in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-24 h-24 top-40 right-20 opacity-20 animate-float">
          <Image src="/assets/decorations/pixel-star.svg" alt="Pixel decoration" width={96} height={96} />
        </div>
        <div className="absolute w-32 h-32 bottom-20 left-20 opacity-20 animate-float-delayed">
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
          <h1 className="font-pixel-heading text-3xl text-gradient mb-2">Daftar Akun</h1>
          <p className="font-pixel-body text-muted-foreground">
            Buat akun untuk memulai petualangan coding!
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert variant="success" className="mb-6">
            {success}
          </Alert>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block font-pixel-body mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="coolcoder123"
                className="border-2 border-border h-12 font-pixel-body"
                {...register('username')}
                error={errors.username?.message}
              />
            </div>

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
              <label htmlFor="password" className="block font-pixel-body mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="border-2 border-border h-12 font-pixel-body"
                {...register('password')}
                error={errors.password?.message}
              />
              <p className="text-xs font-pixel-body text-muted-foreground mt-1">
                Minimal 8 karakter, 1 huruf kapital, dan 1 angka
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-pixel-body mb-2">
                Konfirmasi Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="border-2 border-border h-12 font-pixel-body"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
            </div>

            <div>
              <label className="block font-pixel-body mb-2">Daftar Sebagai</label>
              <RadioGroup defaultValue="student" className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    id="student"
                    value="student"
                    {...register('role')}
                  />
                  <label htmlFor="student" className="font-pixel-body">
                    Pelajar
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    id="teacher"
                    value="teacher"
                    {...register('role')}
                  />
                  <label htmlFor="teacher" className="font-pixel-body">
                    Pengajar
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <Checkbox id="agreeTerms" {...register('agreeTerms')} />
              </div>
              <div className="ml-3">
                <label
                  htmlFor="agreeTerms"
                  className="font-pixel-body text-sm text-foreground"
                >
                  Saya setuju dengan{' '}
                  <Link
                    href="/terms"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Syarat dan Ketentuan
                  </Link>{' '}
                  serta{' '}
                  <Link
                    href="/privacy"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Kebijakan Privasi
                  </Link>
                </label>
                {errors.agreeTerms && (
                  <p className="mt-1 text-xs text-danger">{errors.agreeTerms.message}</p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 font-pixel-body text-lg"
            isLoading={isLoading}
          >
            Daftar
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background font-pixel-body text-muted-foreground">
                Atau daftar dengan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 font-pixel-body"
              onClick={() => {
                /* Implement Google registration */
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
                /* Implement GitHub registration */
              }}
            >
              <Image src="/assets/icons/github.svg" width={20} height={20} alt="GitHub" className="mr-2" />
              GitHub
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="font-pixel-body text-muted-foreground">
            Sudah punya akun?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Login sekarang
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
