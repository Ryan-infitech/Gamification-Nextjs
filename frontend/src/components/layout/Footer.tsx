import { Code } from "lucide-react";
import Link from "next/link";
import { Twitter, Instagram, Github, Facebook, Heart } from "lucide-react";

const footerLinks = [
  {
    title: "Produk",
    links: [
      { label: "Game", href: "/game" },
      { label: "Materi Belajar", href: "/study" },
      { label: "Challenges", href: "/challenges" },
      { label: "Quiz", href: "/quiz" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { label: "Tentang Kami", href: "/about" },
      { label: "Team", href: "/team" },
      { label: "Karir", href: "/careers" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "FAQ", href: "/help/faq" },
      { label: "Kontak", href: "/contact" },
      { label: "Dokumentasi", href: "/docs" },
      { label: "Panduan", href: "/guides" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Kebijakan Privasi", href: "/privacy" },
      { label: "Syarat & Ketentuan", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
      { label: "Lisensi", href: "/licenses" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-background border-t border-border">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-white">
                <Code size={20} />
              </div>
              <span className="text-xl font-pixel-heading text-gradient">
                Gamifikasi CS
              </span>
            </Link>
            <p className="text-muted-foreground font-pixel-body mb-4 max-w-xs">
              Platform belajar ilmu komputer dengan pendekatan gamifikasi,
              membuat proses belajar menjadi lebih menyenangkan dan efektif.
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github size={20} />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="font-pixel-heading text-sm mb-4">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground font-pixel-body text-sm hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground font-pixel-body mt-12 pt-6 border-t border-border">
          <p>&copy; {currentYear} Gamifikasi CS. All rights reserved.</p>
          <p className="mt-2 flex items-center justify-center">
            Made with <Heart size={14} className="text-danger mx-1" /> in
            Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
