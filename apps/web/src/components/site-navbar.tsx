'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mail, Menu, Music2, Newspaper, PlayCircle, Radio, Star, Trophy, Users, X, type LucideIcon } from 'lucide-react';

type NavItemType = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItemType[] = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/tv', label: 'En vivo', icon: Radio },
  { href: '/programas', label: 'Programas', icon: Star },
  { href: '/exitos', label: "90's & 2000's", icon: Music2 },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/noticias', label: 'Noticias', icon: Newspaper },
  { href: '/comunidad', label: 'Comunidad', icon: Users },
  { href: '/contacto', label: 'Contacto', icon: Mail }
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function useScrollPosition(threshold = 12) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => setHasScrolled(window.scrollY > threshold);

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });

    return () => window.removeEventListener('scroll', updateScroll);
  }, [threshold]);

  return hasScrolled;
}

function LogoBlock() {
  return (
    <Link
      className="hit-banner-brand"
      href="/"
      aria-label="Radio Hit 90 y 2000"
    >
      <Image
        alt="Radio Hit 90 y 2000"
        className="hit-banner-brand-image"
        height={230}
        priority
        src="/hit-header-banner.png"
        width={780}
      />
    </Link>
  );
}

function NavItem({ href, label, icon: Icon, active, onClick }: NavItemType & { active: boolean; onClick?: () => void }) {
  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className={classNames('hit-nav-link', active && 'is-active')}
      href={href}
      onClick={() => {
        if (href === '/tv') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
        onClick?.();
      }}
      scroll
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function CTAButton() {
  return (
    <Link className="hit-live-cta" href="/tv" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })} scroll>
      <PlayCircle className="h-4 w-4" aria-hidden="true" />
      <span>En vivo</span>
    </Link>
  );
}

export function SiteNavbar() {
  const pathname = usePathname();
  const hasScrolled = useScrollPosition();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeDesktopMenu = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };

    window.addEventListener('resize', closeDesktopMenu);
    return () => window.removeEventListener('resize', closeDesktopMenu);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={classNames(
        'hit-header',
        hasScrolled && 'is-condensed'
      )}
      role="banner"
    >
      <div className="hit-header-backdrop" aria-hidden="true">
        <Image
          alt=""
          className="hit-header-backdrop-image"
          fill
          priority
          sizes="100vw"
          src="/header-radio.jpeg"
        />
        <span className="hit-header-shade" />
        <span className="hit-header-scan" />
      </div>

      <div className="hit-header-inner">
        <div className="hit-banner-row">
          <LogoBlock />

          <div className="hit-header-actions">
            <button
              type="button"
              className="hit-menu-button"
              aria-controls="mobile-header-nav"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <nav className="hit-desktop-nav" aria-label="Navegacion principal">
          <ul className="hit-nav-list">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavItem {...item} active={isActive(item.href)} />
              </li>
            ))}
          </ul>
          <CTAButton />
        </nav>
      </div>

      <nav
        id="mobile-header-nav"
        className={classNames(
          'hit-mobile-panel',
          menuOpen && 'is-open'
        )}
        aria-label="Navegacion principal movil"
      >
        <ul className="hit-mobile-list">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavItem {...item} active={isActive(item.href)} onClick={() => setMenuOpen(false)} />
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
