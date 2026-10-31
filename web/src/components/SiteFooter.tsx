import { Clock3, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'wouter';
import { studioContact } from '../lib/bakery-data';
import logo from '@assets/logo.png';

const quickLinks = [
  { href: '#showcase', label: 'The showcase' },
  { href: '#builder', label: 'Build yours' },
  { href: '/invoice', label: 'Your quote' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_1.6fr] lg:gap-16 lg:px-12 lg:py-12">
        <div>
          <img src={logo} alt="Dzilicious Bakery & More" className="h-16 w-16 object-contain mix-blend-multiply" />
          <p className="mt-3 max-w-xs text-[13px] leading-5 text-muted-foreground">Premium custom cakes, baked to order from a small studio in Osu. Every order gets a real conversation before it gets a whisk.</p>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground" data-testid="link-instagram">
            <Instagram size={16} /> @dziliciousbakesandmore
          </a>
        </div>

        <div className="grid gap-6 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-sm font-semibold">Visit or reach us</p>
            <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
              <li className="flex items-start gap-2.5"><MapPin size={15} className="mt-0.5 shrink-0 text-primary" /> 12 Cantonments Road, Osu, Accra</li>
              <li className="flex items-start gap-2.5"><Clock3 size={15} className="mt-0.5 shrink-0 text-primary" /> Tue to Sat, 9am to 6pm</li>
              <li className="flex items-start gap-2.5"><MessageCircle size={15} className="mt-0.5 shrink-0 text-primary" /> {studioContact.whatsappDisplay}</li>
              <li className="flex items-start gap-2.5"><Mail size={15} className="mt-0.5 shrink-0 text-primary" /> {studioContact.email}</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Explore</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-muted-foreground hover:text-foreground" data-testid={`link-footer-${link.label.toLowerCase().replaceAll(' ', '-')}`}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-8 lg:px-12">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Dzilicious Bakery & More. All rights reserved.</p>
        <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground" data-testid="link-footer-staff-login">Staff login</Link>
      </div>
    </footer>
  );
}
