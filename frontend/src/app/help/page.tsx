'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  Book,
  HelpCircle,
  MessageCircle,
  FileText,
  Lightbulb,
  ChevronRight,
  ExternalLink,
  Gamepad2,
  Code,
  Trophy,
  Zap,
  ArrowRight,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import MainLayout from '@/components/layout/MainLayout';
import MetaTags from '@/components/common/MetaTags';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

// Help categories
const helpCategories = [
  {
    title: 'Memulai',
    icon: <Zap className="h-5 w-5" />,
    description: 'Panduan dasar untuk pemula',
    url: '/help/getting-started',
    topics: [
      'Membuat akun baru',
      'Tutorial dasar',
      'Navigasi platform',
      'Istilah umum'
    ]
  },
  {
    title: 'Game',
    icon: <Gamepad2 className="h-5 w-5" />,
    description: 'Cara bermain dan fitur game',
    url: '/help/game',
    topics: [
      'Kontrol karakter',
      'Navigasi dunia',
      'Item dan inventaris',
      'Interaksi dengan NPC'
    ]
  },
  {
    title: 'Challenges',
    icon: <Code className="h-5 w-5" />,
    description: 'Menyelesaikan tantangan koding',
    url: '/help/challenges',
    topics: [
      'Tipe tantangan',
      'Menggunakan code editor',
      'Debug & solusi',
      'Hints & petunjuk'
    ]
  },
  {
    title: 'Study',
    icon: <Book className="h-5 w-5" />,
    description: 'Panduan materi pembelajaran',
    url: '/help/study',
    topics: [
      'Mengakses materi',
      'Learning paths',
      'Quiz & tes',
      'Tracking kemajuan'
    ]
  },
  {
    title: 'Achievement',
    icon: <Trophy className="h-5 w-5" />,
    description: 'Sistem level dan penghargaan',
    url: '/help/achievements',
    topics: [
      'Cara mendapatkan XP',
      'Level & rank',
      'Badges & rewards',
      'Leaderboard'
    ]
  },
  {
    title: 'Pengaturan',
    icon: <FileText className="h-5 w-5" />,
    description: 'Konfigurasi akun dan preferensi',
    url: '/help/settings',
    topics: [
      'Profil akun',
      'Notifikasi',
      'Privasi & keamanan',
      'Aksesibilitas'
    ]
  }
];

// FAQ items
const faqItems = [
  {
    question: 'Apa itu Gamifikasi CS?',
    answer: 'Gamifikasi CS adalah platform belajar ilmu komputer dengan pendekatan gamifikasi, membuat proses belajar menjadi lebih menyenangkan dan efektif. Platform ini menggabungkan elemen game seperti karakter, level, tantangan, dan penghargaan untuk membuat pengalaman belajar lebih interaktif.'
  },
  {
    question: 'Bagaimana cara memulai petualangan di Gamifikasi CS?',
    answer: 'Untuk memulai, daftar akun baru di halaman Registrasi. Setelah login, kamu akan dibawa ke area tutorial yang akan menjelaskan dasar-dasar platform. Selesaikan tutorial untuk membuka area game utama dan mulai petualanganmu!'
  },
  {
    question: 'Bagaimana cara mendapatkan XP dan naik level?',
    answer: 'XP dapat diperoleh dengan menyelesaikan tantangan, quiz, dan aktivitas pembelajaran. Setiap kali kamu mencapai jumlah XP tertentu, levelmu akan naik. Level yang lebih tinggi akan membuka fitur dan area baru di dalam game.'
  },
  {
    question: 'Apa yang terjadi jika saya tidak bisa menyelesaikan tantangan?',
    answer: 'Setiap tantangan memiliki sistem hint yang dapat digunakan jika kamu kesulitan. Kamu juga dapat mencoba kembali tantangan tersebut kapan saja. Jika masih kesulitan, kamu bisa mengunjungi forum diskusi untuk meminta bantuan dari komunitas.'
  },
  {
    question: 'Apakah saya bisa mengakses platform ini secara offline?',
    answer: 'Beberapa materi pembelajaran dapat diakses secara offline melalui fitur PWA (Progressive Web App), tetapi fitur interaktif seperti multiplayer, challenge submissions, dan sinkronisasi progress memerlukan koneksi internet.'
  },
  {
    question: 'Bagaimana cara mengubah pengaturan bahasa?',
    answer: 'Kamu dapat mengubah bahasa di halaman Pengaturan. Saat ini platform mendukung Bahasa Indonesia dan Bahasa Inggris. Pilih bahasa yang diinginkan dan perubahan akan diterapkan secara otomatis.'
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would search through help content
    console.log('Searching for:', searchQuery);
  };
  
  return (
    <MainLayout>
      <MetaTags 
        title="Pusat Bantuan - Gamifikasi CS" 
        description="Pelajari cara menggunakan platform Gamifikasi CS dengan panduan lengkap, tutorial, dan FAQ."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-background/60 pt-6 pb-12">
        <div className="container px-4 mx-auto">
          {/* Header */}
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-pixel-heading text-gradient mb-4">Pusat Bantuan</h1>
            <p className="text-muted-foreground font-pixel-body text-lg mb-8">
              Pelajari cara menggunakan platform Gamifikasi CS dengan panduan lengkap, 
              tutorial, dan FAQ.
            </p>
            
            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
              <Input
                type="text"
                placeholder="Cari bantuan..."
                className="pr-12 font-pixel-body h-12 border-2 rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                className="absolute right-0 top-0 h-12 px-3"
                aria-label="Cari"
              >
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>
          
          {/* Quick Help Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-pixel-heading flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Panduan Cepat
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-pixel-body text-muted-foreground mb-4">
                  Petunjuk dasar dan tutorial untuk pemula
                </p>
                <Button 
                  variant="outline" 
                  className="w-full font-pixel-body"
                  asChild
                >
                  <Link href="/help/getting-started">
                    Lihat Panduan Cepat
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-pixel-heading flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Dukungan Langsung
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-pixel-body text-muted-foreground mb-4">
                  Hubungi tim support untuk bantuan personal
                </p>
                <Button 
                  variant="outline" 
                  className="w-full font-pixel-body"
                  asChild
                >
                  <Link href="/contact">
                    Hubungi Kami
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-pixel-heading flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Komunitas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-pixel-body text-muted-foreground mb-4">
                  Bergabung dengan forum diskusi komunitas
                </p>
                <Button 
                  variant="outline" 
                  className="w-full font-pixel-body"
                  asChild
                >
                  <Link href="/community">
                    Ke Forum Komunitas
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Help Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-pixel-heading mb-6">Kategori Bantuan</h2>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {helpCategories.map((category, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Link href={category.url}>
                    <Card className="h-full border-2 hover:border-primary/50 hover:shadow-md transition-all">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-lg font-pixel-heading flex items-center gap-2">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                            {category.icon}
                          </div>
                          {category.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="font-pixel-body text-muted-foreground mb-4">
                          {category.description}
                        </p>
                        <ul className="space-y-1 mb-4">
                          {category.topics.map((topic, idx) => (
                            <li key={idx} className="flex items-start">
                              <Check className="h-4 w-4 text-primary mr-2 mt-0.5" />
                              <span className="font-pixel-body text-sm">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button variant="ghost" size="sm" className="font-pixel-body ml-auto">
                          Baca Selengkapnya
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* FAQ Section */}
          <div className="mb-12">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-pixel-heading text-center mb-6">Pertanyaan Umum</h2>
              
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="font-pixel-heading text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="font-pixel-body">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <div className="flex justify-center mt-6">
                <Button variant="outline" className="font-pixel-body" asChild>
                  <Link href="/help/faq">
                    Lihat Semua FAQ
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Video Tutorials */}
          <div className="mb-12">
            <h2 className="text-2xl font-pixel-heading mb-6">Video Tutorial</h2>
            
            <Tabs defaultValue="beginner">
              <TabsList className="mb-6">
                <TabsTrigger value="beginner" className="font-pixel-body">Pemula</TabsTrigger>
                <TabsTrigger value="intermediate" className="font-pixel-body">Menengah</TabsTrigger>
                <TabsTrigger value="advanced" className="font-pixel-body">Lanjutan</TabsTrigger>
              </TabsList>
              
              <TabsContent value="beginner">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((num) => (
                    <Card key={num} className="border-2">
                      <div className="aspect-video bg-muted relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button size="icon" aria-label="Play video">
                            <Image 
                              src="/assets/ui/play-button.svg" 
                              alt="Play" 
                              width={32} 
                              height={32} 
                            />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-pixel-heading text-lg mb-2">Tutorial Pemula #{num}</h3>
                        <p className="font-pixel-body text-muted-foreground text-sm">
                          Pelajari dasar-dasar navigasi dan interaksi dalam platform Gamifikasi CS.
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="intermediate">
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <Image 
                      src="/assets/decorations/pixel-construction.svg"
                      alt="Coming Soon"
                      width={120}
                      height={120}
                      className="mx-auto mb-4"
                    />
                    <h3 className="font-pixel-heading text-xl mb-2">Video Akan Datang</h3>
                    <p className="font-pixel-body text-muted-foreground max-w-md mx-auto">
                      Kami sedang menyiapkan video tutorial untuk level menengah. Pantau terus untuk pembaruan!
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced">
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <Image 
                      src="/assets/decorations/pixel-construction.svg"
                      alt="Coming Soon"
                      width={120}
                      height={120}
                      className="mx-auto mb-4"
                    />
                    <h3 className="font-pixel-heading text-xl mb-2">Video Akan Datang</h3>
                    <p className="font-pixel-body text-muted-foreground max-w-md mx-auto">
                      Kami sedang menyiapkan video tutorial untuk level lanjutan. Pantau terus untuk pembaruan!
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Documentation Links */}
          <div className="mb-12">
            <h2 className="text-2xl font-pixel-heading mb-6">Dokumentasi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="font-pixel-heading">Platform Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-pixel-body text-muted-foreground mb-4">
                    Panduan lengkap tentang semua fitur dan fungsi dalam platform Gamifikasi CS.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li>
                      <Link 
                        href="/docs/platform/overview" 
                        className="flex items-center font-pixel-body text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Ikhtisar Platform
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/docs/platform/game" 
                        className="flex items-center font-pixel-body text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Game Mechanics
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/docs/platform/rewards" 
                        className="flex items-center font-pixel-body text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Sistem Reward
                      </Link>
                    </li>
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full font-pixel-body"
                    asChild
                  >
                    <Link href="/docs/platform">
                      Buka Dokumentasi Platform
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="font-pixel-heading">CS Learning Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-pixel-body text-muted-foreground mb-4">
                    Panduan belajar Computer Science dengan kurikulum terstruktur.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li>
                      <Link 
                        href="/docs/cs/programming" 
                        className="flex items-center font-pixel-body text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Dasar Pemrograman
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/docs/cs/algorithms" 
                        className="flex items-center font-pixel-body text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Algoritma
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/docs/cs/data-structures" 
                        className="flex items-center font-pixel-body text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Struktur Data
                      </Link>
                    </li>
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full font-pixel-body"
                    asChild
                  >
                    <Link href="/docs/cs">
                      Buka Dokumentasi CS
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="text-center max-w-2xl mx-auto mt-16 mb-8">
            <h2 className="text-2xl font-pixel-heading mb-4">Belum Menemukan Jawaban?</h2>
            <p className="font-pixel-body text-muted-foreground mb-6">
              Jika kamu belum menemukan jawaban yang kamu cari, jangan ragu untuk menghubungi tim dukungan kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="default" 
                size="lg" 
                className="font-pixel-body"
                asChild
              >
                <Link href="/contact">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Hubungi Support
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="font-pixel-body"
                asChild
              >
                <Link href="/feedback">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  Kirim Feedback
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
