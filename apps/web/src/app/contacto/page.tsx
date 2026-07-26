import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone, Radio, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const contact = {
  email: 'contacto@radiolabranza.cl',
  phoneLabel: '(+56 2) 2810 80 10',
  phoneHref: 'tel:+56228108010',
  whatsappLabel: '+56 2 2810 80 10',
  whatsappHref: 'https://wa.me/56228108010',
  location: 'Labranza, Temuco, Chile'
};

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6">
      <Button asChild className="w-fit border-slate-900/10 bg-white text-slate-950 hover:bg-amber-50" variant="outline">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </Button>

      <section className="contact-page-hero">
        <div>
          <span className="contact-page-eyebrow">
            <Radio className="h-4 w-4" />
            Contacto directo
          </span>
          <h1>Hablemos con Radio Labranza FM+</h1>
          <p>
            Escríbenos para avisos, noticias, programas, transmisión, comunidad o coordinación con la radio.
          </p>
        </div>
        <div className="contact-page-signal">
          <span>FM+</span>
          <strong>107.5</strong>
          <small>Labranza conectada</small>
        </div>
      </section>

      <section className="contact-action-grid" aria-label="Canales de contacto">
        <a className="contact-action-card contact-action-whatsapp" href={contact.whatsappHref} rel="noreferrer" target="_blank">
          <span><MessageCircle className="h-6 w-6" /></span>
          <div>
            <small>WhatsApp</small>
            <strong>{contact.whatsappLabel}</strong>
            <p>Respuesta rápida para coordinación y avisos.</p>
          </div>
          <Send className="ml-auto h-5 w-5" />
        </a>

        <a className="contact-action-card" href={`mailto:${contact.email}`}>
          <span><Mail className="h-6 w-6" /></span>
          <div>
            <small>Correo</small>
            <strong>{contact.email}</strong>
            <p>Ideal para información, propuestas y material adjunto.</p>
          </div>
          <Send className="ml-auto h-5 w-5" />
        </a>

        <a className="contact-action-card" href={contact.phoneHref}>
          <span><Phone className="h-6 w-6" /></span>
          <div>
            <small>Teléfono</small>
            <strong>{contact.phoneLabel}</strong>
            <p>Llamadas para contacto directo con la radio.</p>
          </div>
          <Send className="ml-auto h-5 w-5" />
        </a>
      </section>

      <section className="contact-info-strip">
        <MapPin className="h-5 w-5 text-amber-300" />
        <span>{contact.location}</span>
      </section>
    </main>
  );
}
