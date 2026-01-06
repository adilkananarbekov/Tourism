import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <span className="text-primary-foreground">KR</span>
              </div>
              <span className="text-xl">Kyrgyz Riders</span>
            </div>
            <p className="text-primary-foreground/70 text-sm mb-4">
              Your gateway to unforgettable adventures in the heart of Central Asia.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
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
                <Link to="/explore" className="hover:text-primary-foreground transition-colors">
                  Explore Kyrgyzstan
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="hover:text-primary-foreground transition-colors">
                  Travel Stories
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-primary-foreground transition-colors">
                  Feedback
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-primary-foreground transition-colors">
                  Admin Login
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
                <Phone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>+996 555 123 456</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>info@kyrgyzriders.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/70 text-sm">
          <p>&copy; 2025 Kyrgyz Riders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
