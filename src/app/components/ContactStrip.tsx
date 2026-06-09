import { Instagram, MessageCircle, Phone, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import {
  FOUNDER_NAME,
  INSTAGRAM_URL,
  TELEGRAM_URL,
  TELEGRAM_USERNAME,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../lib/contact';

export function ContactStrip() {
  const contacts = [
    {
      icon: Send,
      label: 'Trip request',
      value: 'Send a tour request with your contact details',
      to: '/feedback',
    },
    {
      icon: MessageCircle,
      label: 'Telegram',
      value: TELEGRAM_USERNAME,
      href: TELEGRAM_URL,
    },
    {
      icon: Phone,
      label: 'WhatsApp',
      value: WHATSAPP_DISPLAY,
      href: WHATSAPP_URL,
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: '@jakypbekovv1',
      href: INSTAGRAM_URL,
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl text-foreground">Send a Tour Request</h2>
          <p className="text-muted-foreground">
            Guests choose an available tour, share travel details, and {FOUNDER_NAME} or the team
            follows up personally.
          </p>
          <div>
            <Button asChild className="btn-micro btn-action">
              <Link
                to="/feedback"
                data-track-event="contact_strip_request_click"
                data-track-label="Contact strip request"
              >
                Send Request
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map((contact) => {
            const Icon = contact.icon;
            const content = (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Icon className="h-4 w-4" />
                  <span>{contact.label}</span>
                </div>
                <p className="text-foreground">{contact.value}</p>
              </div>
            );

            return contact.to ? (
              <Link key={contact.label} to={contact.to} className="hover:opacity-90">
                {content}
              </Link>
            ) : contact.href ? (
              <a
                key={contact.label}
                href={contact.href}
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-90"
                data-track-event="contact_strip_direct_link_click"
                data-track-label={contact.label}
              >
                {content}
              </a>
            ) : (
              <div key={contact.label}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
