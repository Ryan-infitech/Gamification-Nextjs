import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { buttonVariants } from "@/components/ui/Button";
import {
  AnimatedDiv,
  AnimatedSection,
  containerVariants,
  itemVariants,
} from "@/components/ui/MotionComponents";
// Import Lucide icons to replace the missing SVGs
import {
  Gamepad,
  Code,
  Trophy,
  GitBranch,
  Users,
  Laptop,
  Star,
  Cloud,
} from "lucide-react";

// Overriding metadata for landing page
export const metadata: Metadata = {
  title: "Belajar Pemrograman Melalui Petualangan Game | Gamifikasi CS",
  description:
    "Belajar pemrograman dan computer science melalui pendekatan game yang menyenangkan dan interaktif. Dapatkan penghargaan dan capai level tertinggi sambil menguasai ilmu komputer!",
};

// Features data - updated to use Lucide icon components instead of SVG files
const features = [
  {
    title: "Belajar Sambil Bermain",
    description:
      "Kuasai konsep programming dengan metode game-based learning yang mengasyikkan",
    icon: <Gamepad size={24} className="text-primary" />,
  },
  {
    title: "Tantangan Koding",
    description: "Selesaikan tantangan koding interaktif dan dapatkan rewards",
    icon: <Code size={24} className="text-primary" />,
  },
  {
    title: "Jalur Belajar Terstruktur",
    description:
      "Ikuti learning path yang disesuaikan dengan level kemampuanmu",
    icon: <GitBranch size={24} className="text-primary" />,
  },
  {
    title: "Dapatkan Achievement",
    description: "Kumpulkan badge dan achievement untuk menunjukkan kemajuanmu",
    icon: <Trophy size={24} className="text-primary" />,
  },
  {
    title: "Kompetisi Multiplayer",
    description: "Tantang teman dan jadilah yang terbaik di leaderboard",
    icon: <Users size={24} className="text-primary" />,
  },
  {
    title: "Akses di Mana Saja",
    description: "Belajar dari perangkat apa saja, kapan saja, di mana saja",
    icon: <Laptop size={24} className="text-primary" />,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background z-10" />
            <div className="bg-grid-pattern opacity-20 absolute inset-0" />

            {/* Pixel art elements in background - replaced with Lucide icons */}
            <div className="absolute -bottom-16 -left-16 w-64 h-64 opacity-30 animate-float">
              <Cloud size={128} className="text-primary/30" />
            </div>
            <div className="absolute top-24 right-24 w-32 h-32 opacity-30 animate-float-delayed">
              <Star size={64} className="text-primary/30" />
            </div>
          </div>

          <div className="container mx-auto px-4 z-10 mt-10">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              {/* Text content */}
              <AnimatedDiv
                className="lg:col-span-3 text-center lg:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="font-pixel-heading text-3xl md:text-4xl lg:text-5xl leading-tight mb-6 text-gradient">
                  Jelajahi Dunia Computer Science dengan Bermain Game
                </h1>
                <p className="text-xl md:text-2xl mb-8 font-pixel-body max-w-2xl mx-auto lg:mx-0">
                  Platform belajar pemrograman interaktif dengan pendekatan
                  gamifikasi. Kuasai konsep-konsep fundamental dengan cara yang
                  menyenangkan!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/register"
                    className={buttonVariants({
                      size: "lg",
                      variant: "default",
                      className: "font-pixel-body text-lg px-8 py-6 h-auto",
                    })}
                  >
                    Mulai Petualangan
                  </Link>
                  <Link
                    href="/about"
                    className={buttonVariants({
                      size: "lg",
                      variant: "outline",
                      className: "font-pixel-body text-lg px-8 py-6 h-auto",
                    })}
                  >
                    Pelajari Selengkapnya
                  </Link>
                </div>
              </AnimatedDiv>

              {/* Hero Image */}
              <AnimatedDiv
                className="lg:col-span-2 flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="relative w-full max-w-md aspect-square">
                  {/* Using a solid background with a character emoji as a temporary placeholder */}
                  <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center text-8xl animate-float">
                    🧙‍♂️
                  </div>
                </div>
              </AnimatedDiv>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary/5 border-y border-primary/20 py-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-4">
                <p className="font-pixel-heading text-3xl md:text-4xl text-primary">
                  1000+
                </p>
                <p className="font-pixel-body text-lg mt-2">Challenges</p>
              </div>
              <div className="p-4">
                <p className="font-pixel-heading text-3xl md:text-4xl text-primary">
                  50+
                </p>
                <p className="font-pixel-body text-lg mt-2">Learning Paths</p>
              </div>
              <div className="p-4">
                <p className="font-pixel-heading text-3xl md:text-4xl text-primary">
                  100+
                </p>
                <p className="font-pixel-body text-lg mt-2">Achievement</p>
              </div>
              <div className="p-4">
                <p className="font-pixel-heading text-3xl md:text-4xl text-primary">
                  10.000+
                </p>
                <p className="font-pixel-body text-lg mt-2">Learners</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Updated to use Lucide icon components */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <AnimatedDiv
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-pixel-heading text-3xl mb-4">
                Fitur Unggulan
              </h2>
              <p className="font-pixel-body text-xl max-w-2xl mx-auto">
                Platform kami menawarkan berbagai fitur yang dirancang untuk
                membuat proses belajar pemrograman menjadi menyenangkan dan
                efektif
              </p>
            </AnimatedDiv>

            <AnimatedDiv
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {features.map((feature, index) => (
                <AnimatedDiv
                  key={index}
                  className="bg-card p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
                  variants={itemVariants}
                >
                  <div className="w-12 h-12 mb-4 bg-primary/10 rounded-md flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="font-pixel-heading text-xl mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-pixel-body">{feature.description}</p>
                </AnimatedDiv>
              ))}
            </AnimatedDiv>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <AnimatedDiv
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="font-pixel-heading text-3xl mb-4">
                  Siap Untuk Memulai Petualanganmu?
                </h2>
                <p className="font-pixel-body text-xl mb-8">
                  Daftar sekarang dan mulai perjalananmu dalam menaklukkan dunia
                  coding!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/register"
                    className={buttonVariants({
                      size: "lg",
                      variant: "default",
                      className: "font-pixel-body text-lg px-8",
                    })}
                  >
                    Daftar Gratis
                  </Link>
                  <Link
                    href="/auth/login"
                    className={buttonVariants({
                      size: "lg",
                      variant: "outline",
                      className: "font-pixel-body text-lg px-8",
                    })}
                  >
                    Login
                  </Link>
                </div>
              </AnimatedDiv>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <AnimatedDiv
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-pixel-heading text-3xl mb-4">
                Apa Kata Mereka?
              </h2>
              <p className="font-pixel-body text-xl max-w-2xl mx-auto">
                Dengarkan pengalaman para petualang yang telah menggunakan
                platform kami
              </p>
            </AnimatedDiv>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial cards would go here */}
              {/* This is a placeholder for future testimonial implementation */}
              <div className="bg-card p-6 rounded-lg border-2 border-border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                    <span className="font-pixel-heading text-primary">B</span>
                  </div>
                  <div>
                    <h4 className="font-pixel-heading text-lg">Budi Santoso</h4>
                    <p className="font-pixel-body text-sm text-muted-foreground">
                      Mahasiswa
                    </p>
                  </div>
                </div>
                <p className="font-pixel-body">
                  "Platform ini membantu saya memahami konsep-konsep programming
                  yang sulit dengan cara yang menyenangkan!"
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg border-2 border-border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                    <span className="font-pixel-heading text-primary">A</span>
                  </div>
                  <div>
                    <h4 className="font-pixel-heading text-lg">Ani Wijaya</h4>
                    <p className="font-pixel-body text-sm text-muted-foreground">
                      Pelajar SMA
                    </p>
                  </div>
                </div>
                <p className="font-pixel-body">
                  "Belajar coding ternyata bisa sangat menyenangkan! Saya tidak
                  sabar untuk menyelesaikan semua level."
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg border-2 border-border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                    <span className="font-pixel-heading text-primary">D</span>
                  </div>
                  <div>
                    <h4 className="font-pixel-heading text-lg">
                      Deni Kurniawan
                    </h4>
                    <p className="font-pixel-body text-sm text-muted-foreground">
                      Guru Informatika
                    </p>
                  </div>
                </div>
                <p className="font-pixel-body">
                  "Saya menggunakan platform ini untuk mengajar siswa saya.
                  Mereka menjadi jauh lebih antusias belajar programming!"
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
