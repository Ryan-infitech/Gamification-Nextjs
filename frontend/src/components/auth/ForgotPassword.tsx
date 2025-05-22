'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowLeft,
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/Card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';

// Validation schema for forgot password email
const forgotPasswordSchema = z.object({
  email: z.string().email('Email harus valid').min(1, 'Email wajib diisi'),
});

// Validation schema for reset password
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password harus minimal 8 karakter')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

interface ForgotPasswordProps {
  token?: string; // Jika ada token, berarti user membuka halaman dari email reset
  onBackToLogin?: () => void; // Callback untuk kembali ke login
}

/**
 * Komponen untuk form reset password dan form masukkan email
 */
export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ token, onBackToLogin }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State untuk form email atau form reset password
  const mode = token ? 'reset' : 'forgot';
  
  // Form hook untuk forgot password (send email)
  const forgotForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
  
  // Form hook untuk reset password
  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  
  /**
   * Handler untuk mengirim email reset password
   */
  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post('/api/auth/reset-password', {
        email: data.email,
      });
      
      setSuccess(
        'Instruksi reset password telah dikirim ke email Anda. ' +
        'Silakan cek inbox atau folder spam Anda.'
      );
      
      // Reset form
      forgotForm.reset();
    } catch (err: any) {
      console.error('Error requesting password reset:', err);
      setError(
        err.response?.data?.message || 
        'Gagal mengirim instruksi reset password. Silakan coba lagi nanti.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Handler untuk reset password dengan token
   */
  const handleResetPassword = async (data: ResetPasswordForm) => {
    if (!token) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post('/api/auth/reset-password/confirm', {
        token,
        password: data.password,
      });
      
      setSuccess(
        'Password Anda berhasil direset. ' +
        'Sekarang Anda dapat login dengan password baru Anda.'
      );
      
      // Reset form
      resetForm.reset();
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(
        err.response?.data?.message || 
        'Gagal mereset password. Token mungkin tidak valid atau sudah kedaluwarsa.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Animation properties
  const containerAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerAnimation}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="font-pixel-heading text-xl text-center">
            {mode === 'forgot' ? 'Lupa Password' : 'Reset Password'}
          </CardTitle>
          <CardDescription className="text-center font-pixel-body">
            {mode === 'forgot'
              ? 'Masukkan email Anda untuk menerima instruksi reset password'
              : 'Masukkan password baru Anda'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-pixel-heading">Error</AlertTitle>
              <AlertDescription className="font-pixel-body">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="font-pixel-heading">Sukses</AlertTitle>
              <AlertDescription className="font-pixel-body">{success}</AlertDescription>
            </Alert>
          )}
          
          {mode === 'forgot' ? (
            <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-pixel-body">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@example.com"
                      className="pl-10 font-pixel-body"
                      {...forgotForm.register('email')}
                    />
                  </div>
                  {forgotForm.formState.errors.email && (
                    <p className="text-sm text-danger font-pixel-body">
                      {forgotForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full font-pixel-body"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Kirim Instruksi Reset'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-pixel-body">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password baru"
                      className="pl-10 font-pixel-body"
                      {...resetForm.register('password')}
                    />
                  </div>
                  {resetForm.formState.errors.password && (
                    <p className="text-sm text-danger font-pixel-body">
                      {resetForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-pixel-body">Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Konfirmasi password baru"
                      className="pl-10 font-pixel-body"
                      {...resetForm.register('confirmPassword')}
                    />
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-danger font-pixel-body">
                      {resetForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full font-pixel-body"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="justify-center">
          <Button 
            variant="ghost" 
            className="font-pixel-body"
            onClick={onBackToLogin}
            type="button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Login
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ForgotPassword;
