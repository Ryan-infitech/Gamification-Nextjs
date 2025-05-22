'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCcw, 
  Loader2, 
  Mail, 
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/Card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';

interface AccountVerificationProps {
  token?: string; // Token verifikasi (dari URL)
  email?: string; // Email yang akan diverifikasi (untuk resend)
}

/**
 * Status verifikasi email
 */
type VerificationStatus = 
  | 'pending' // Menunggu verifikasi
  | 'verifying' // Sedang memproses verifikasi
  | 'success' // Verifikasi berhasil
  | 'invalid' // Token tidak valid
  | 'expired' // Token sudah kedaluwarsa
  | 'error'; // Error lainnya

/**
 * Komponen untuk verifikasi akun email
 */
export const AccountVerification: React.FC<AccountVerificationProps> = ({ token: propToken, email: propEmail }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkAuth } = useAuth();
  
  // Token bisa dari props atau query parameter
  const token = propToken || searchParams.get('token') || '';
  const email = propEmail || searchParams.get('email') || user?.email || '';
  
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  
  // Countdown timer untuk resend email
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);
  
  // Verify token saat component mount jika ada token
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);
  
  /**
   * Fungsi untuk verifikasi token
   */
  const verifyToken = async () => {
    if (!token) return;
    
    setStatus('verifying');
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/auth/verify-email', { token });
      
      if (response.data.success) {
        setStatus('success');
        setMessage('Email Anda berhasil diverifikasi. Anda sekarang bisa mengakses semua fitur platform.');
        
        // Update user authentication state
        await checkAuth();
        
        // Redirect setelah beberapa detik
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Verifikasi gagal. Silakan coba lagi.');
      }
    } catch (err: any) {
      console.error('Token verification error:', err);
      
      if (err.response?.status === 410) {
        setStatus('expired');
        setMessage('Link verifikasi sudah kedaluwarsa. Silakan minta link baru.');
      } else if (err.response?.status === 400) {
        setStatus('invalid');
        setMessage('Link verifikasi tidak valid. Silakan periksa email Anda atau minta link baru.');
      } else {
        setStatus('error');
        setMessage('Terjadi kesalahan saat verifikasi. Silakan coba lagi nanti.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Fungsi untuk request ulang email verifikasi
   */
  const resendVerificationEmail = async () => {
    if (!email) {
      setMessage('Email tidak valid. Silakan masukkan email Anda.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/auth/resend-verification', { email });
      
      if (response.data.success) {
        setMessage('Email verifikasi baru telah dikirim. Silakan cek inbox atau folder spam Anda.');
        setResendCooldown(60); // Set cooldown 60 detik
      } else {
        setMessage(response.data.message || 'Gagal mengirim email. Silakan coba lagi nanti.');
      }
    } catch (err: any) {
      console.error('Resend verification error:', err);
      setMessage(
        err.response?.data?.message || 
        'Gagal mengirim email verifikasi. Silakan coba lagi nanti.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Content berdasarkan status
  const renderContent = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-xl font-pixel-heading mb-4">Verifikasi Email Anda</CardTitle>
            <CardDescription className="font-pixel-body mb-6">
              Kami telah mengirimkan email verifikasi ke alamat email Anda.
              Silakan cek inbox atau folder spam Anda.
            </CardDescription>
            
            <div className="space-y-4">
              <Button
                className="w-full font-pixel-body"
                onClick={verifyToken}
                disabled={!token || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi Email'
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground font-pixel-body">
                Tidak menerima email? Cek folder spam atau
              </p>
              
              <Button
                variant="outline"
                className="w-full font-pixel-body"
                onClick={resendVerificationEmail}
                disabled={isLoading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? (
                  `Kirim Ulang (${resendCooldown}s)`
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Kirim Ulang Email Verifikasi
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      
      case 'verifying':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
            <CardTitle className="text-xl font-pixel-heading mb-4">Memverifikasi...</CardTitle>
            <CardDescription className="font-pixel-body">
              Mohon tunggu sementara kami memverifikasi email Anda.
            </CardDescription>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-accent/20 rounded-full animate-pulse-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className="h-16 w-16 text-accent" />
                </div>
              </div>
            </div>
            <CardTitle className="text-xl font-pixel-heading mb-4 text-accent">Verifikasi Berhasil!</CardTitle>
            <CardDescription className="font-pixel-body mb-6">
              {message}
            </CardDescription>
            <div className="flex justify-center">
              <Button className="font-pixel-body" onClick={() => router.push('/dashboard')}>
                Lanjutkan ke Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 'invalid':
      case 'expired':
      case 'error':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <XCircle className="h-16 w-16 text-danger" />
            </div>
            <CardTitle className="text-xl font-pixel-heading mb-4 text-danger">
              {status === 'expired' ? 'Link Kedaluwarsa' : 
               status === 'invalid' ? 'Link Tidak Valid' : 'Verifikasi Gagal'}
            </CardTitle>
            <CardDescription className="font-pixel-body mb-6">
              {message}
            </CardDescription>
            
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full font-pixel-body"
                onClick={resendVerificationEmail}
                disabled={isLoading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? (
                  `Kirim Ulang (${resendCooldown}s)`
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Kirim Ulang Email Verifikasi
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full font-pixel-body"
                onClick={() => router.push('/login')}
              >
                Kembali ke Login
              </Button>
            </div>
          </div>
        );
    }
  };
  
  // Animation properties
  const containerAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerAnimation}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-2">
        <CardContent className="pt-6 pb-6">
          {message && status !== 'success' && status !== 'invalid' && status !== 'expired' && status !== 'error' && (
            <Alert className={`mb-6 ${status === 'error' ? 'bg-danger/10 text-danger' : ''}`}>
              <AlertDescription className="font-pixel-body">
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {renderContent()}
        </CardContent>
      </Card>
      
      {/* Gambar dekoratif */}
      <div className="flex justify-center mt-8">
        <Image
          src="/assets/decorations/pixel-mail.png"
          alt="Email Verification"
          width={100}
          height={100}
          className="opacity-60"
        />
      </div>
    </motion.div>
  );
};

export default AccountVerification;
