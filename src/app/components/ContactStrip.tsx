import { Clock, Mail, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function ContactStrip() {
  const contacts = [
    {
      icon: Send,
      label: 'Trip request',
      value: 'Use the short form for dates and route ideas',
      to: '/feedback',
    },
    {
      icon: MessageCircle,
      label: 'Telegram bot',
      value: 'Send /start or /contact in Telegram',
    },
    {
      icon: Mail,
      label: 'Contact details',
      value: 'Phone, WhatsApp, Telegram, or email all work',
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

            return contact.to ? (
              <Link key={contact.label} to={contact.to} className="hover:opacity-90">
                {content}
              </Link>
            ) : (
              <div key={contact.label}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
