import { Star } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Mitchell',
      location: 'United Kingdom',
      rating: 5,
      text: 'The Song-Kul Lake expedition exceeded all expectations. Our guide was knowledgeable and passionate, and staying with nomadic families was truly unforgettable. Kyrgyzstan is a hidden gem!',
      tour: 'Song-Kul Lake Expedition',
    },
    {
      name: 'Marco Rossi',
      location: 'Italy',
      rating: 5,
      text: 'I did the Silk Road Heritage Tour and was blown away by the history, culture, and hospitality. Every detail was perfectly organized. This is authentic travel at its best.',
      tour: 'Silk Road Heritage Tour',
    },
    {
      name: 'Emily Chen',
      location: 'Australia',
      rating: 5,
      text: 'The horseback riding expedition was the adventure of a lifetime. Camping under the stars, galloping through valleys - it felt like stepping back in time. Highly recommend!',
      tour: 'Horseback Riding Expedition',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4">
            What Our Travelers Say
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Read experiences from adventurers who explored Kyrgyzstan with us
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-lg p-6"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author Info */}
              <div className="border-t border-border pt-4">
                <p className="text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                <p className="text-sm text-secondary mt-2">{testimonial.tour}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
