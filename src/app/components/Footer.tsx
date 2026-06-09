import { Clock, Instagram, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  FOUNDER_NAME,
  INSTAGRAM_URL,
  TELEGRAM_URL,
  TELEGRAM_USERNAME,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../lib/contact';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <span className="text-primary-foreground">KT</span>
              </div>
              <span className="text-xl">Go Kyrgyzstan Travel</span>
            </div>
            <p className="text-primary-foreground/70 text-sm mb-4">
              Private Kyrgyzstan tours planned by {FOUNDER_NAME}.
            </p>
            <Link
              to="/feedback"
              className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <Send className="h-4 w-4" />
              Start a trip request
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-primary-foreground/70 text-sm">
              <li>
                <Link to="/tours" className="hover:text-primary-foreground transition-colors">
                  Our Tours
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-primary-foreground transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <a href="/#founder" className="hover:text-primary-foreground transition-colors">
                  Founder
                </a>
              </li>
              <li>
                <Link to="/blogs" className="hover:text-primary-foreground transition-colors">
                  Travel Stories
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-primary-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Tours */}
          <div>
            <h3 className="text-lg mb-4">Popular Tours</h3>
            <ul className="space-y-2 text-primary-foreground/70 text-sm">
              <li>
                <Link to="/tours/1" className="hover:text-primary-foreground transition-colors">
                  Song-Kul Lake Expedition
                </Link>
              </li>
              <li>
                <Link to="/tours/3" className="hover:text-primary-foreground transition-colors">
                  Silk Road Heritage
                </Link>
              </li>
              <li>
                <Link to="/tours/4" className="hover:text-primary-foreground transition-colors">
                  Horse Riding Adventure
                </Link>
              </li>
              <li>
                <Link to="/tours/5" className="hover:text-primary-foreground transition-colors">
                  Peak Lenin Trek
                </Link>
              </li>
              <li>
                <Link to="/tours/6" className="hover:text-primary-foreground transition-colors">
                  Issyk-Kul Circuit
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Bishkek, Kyrgyzstan</span>
              </li>
              <li className="flex items-start gap-2">
                <Send className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <Link to="/feedback" className="hover:text-primary-foreground transition-colors">
                  Trip request form
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <MessageCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-foreground transition-colors"
                >
                  Telegram {TELEGRAM_USERNAME}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-foreground transition-colors"
                >
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Instagram className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-foreground transition-colors"
                >
                  Instagram @jakypbekovv1
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Usually within 24 hours</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/70 text-sm">
          <p>&copy; 2025 Go Kyrgyzstan Travel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
