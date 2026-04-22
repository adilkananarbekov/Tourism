import { Clock, Mail, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

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
      label: 'Telegram bot',
      value: 'Requests also work through /start or /contact',
    },
    {
      icon: Mail,
      label: 'Contact details',
      value: 'Managers follow up through Telegram, WhatsApp, or phone',
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
          <h2 className="text-2xl sm:text-3xl text-foreground">Send a Tour Request</h2>
          <p className="text-muted-foreground">
            Guests choose a tour or custom route, leave contact details, and my team follows up
            personally.
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
            ) : (
              <div key={contact.label}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
