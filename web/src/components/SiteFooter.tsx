import { motion } from 'framer-motion';
import { Clock3, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { studioContact } from '../lib/bakery-data';
import footerImage from '@assets/generated_images/hero-baking.jpg';
import logo from '@assets/logo.jpg';

const quickLinks = [
  { href: '#showcase', label: 'The showcase' },
  { href: '#builder', label: 'Build yours' },
  { href: '/invoice', label: 'Your quote' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1fr_auto] lg:gap-8 lg:px-12 lg:py-20">
        <div>
          <img src={logo} alt="Dzifa Bakes" className="h-14 w-14 rounded-full object-cover" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Premium custom cakes, baked to order from a small studio in Osu. Every order gets a real conversation before it gets a whisk.</p>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" data-testid="link-instagram">
            <Instagram size={16} /> @dzifabakes
          </a>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">Visit or reach us</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5"><MapPin size={15} className="mt-0.5 shrink-0 text-primary" /> 12 Cantonments Road, Osu, Accra</li>
              <li className="flex items-start gap-2.5"><Clock3 size={15} className="mt-0.5 shrink-0 text-primary" /> Tue to Sat, 9am to 6pm</li>
              <li className="flex items-start gap-2.5"><MessageCircle size={15} className="mt-0.5 shrink-0 text-primary" /> {studioContact.whatsappDisplay}</li>
              <li className="flex items-start gap-2.5"><Mail size={15} className="mt-0.5 shrink-0 text-primary" /> {studioContact.email}</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Explore</p>
            <ul className="mt-4 space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-muted-foreground hover:text-foreground" data-testid={`link-footer-${link.label.toLowerCase().replaceAll(' ', '-')}`}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: .95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: .6 }}
          className="h-40 w-full overflow-hidden rounded-2xl lg:h-full lg:w-64"
        >
          <img src={footerImage} alt="A baker finishing a cake in the Dzifa Bakes studio" className="h-full w-full object-cover" />
        </motion.div>
      </div>
      <div className="border-t border-border px-5 py-6 sm:px-8 lg:px-12">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Dzifa Bakes. All rights reserved.</p>
      </div>
    </footer>
  );
}
