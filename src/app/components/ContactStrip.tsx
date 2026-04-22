import { Clock, Mail, Phone, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function ContactStrip() {
  const contacts = [
    {
      icon: Phone,
      label: 'Phone / WhatsApp',
      value: '+996 555 123 456',
      href: 'tel:+996555123456',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'info@kyrgyzriders.com',
      href: 'mailto:info@kyrgyzriders.com',
    },
    {
      icon: Send,
      label: 'Telegram',
      value: 't.me/yourhandle',
      href: 'https://t.me/yourhandle',
    },
    {
      icon: Clock,
      label: 'Response time',
      value: 'Usually within 24 hours',
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl text-foreground">Contact Me Directly</h2>
          <p className="text-muted-foreground">
            Send your dates, group size, and travel style. I will reply with a plan and a clear quote.
          </p>
          <div>
            <Button asChild className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/feedback">Start a Trip Request</Link>
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

            return contact.href ? (
              <a key={contact.label} href={contact.href} className="hover:opacity-90">
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
