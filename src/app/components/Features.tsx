import { Calendar, Globe, Heart, Mountain, Shield, Users } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Mountain,
      title: 'Expert Local Guides',
      description: 'Our passionate guides are born and raised in Kyrgyzstan, offering authentic insights and stories.',
    },
    {
      icon: Users,
      title: 'Small Group Tours',
      description: 'We keep our groups intimate to ensure personalized attention and minimal environmental impact.',
    },
    {
      icon: Globe,
      title: 'Sustainable Tourism',
      description: 'We partner with local communities and practice responsible tourism to preserve our natural heritage.',
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Your safety is our priority with comprehensive insurance, quality equipment, and experienced leadership.',
    },
    {
      icon: Calendar,
      title: 'Flexible Itineraries',
      description: 'Choose from our curated tours or create a custom adventure tailored to your interests and pace.',
    },
    {
      icon: Heart,
      title: 'Authentic Experiences',
      description: 'Stay with nomadic families, learn traditional crafts, and experience the real Kyrgyz hospitality.',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4">
            Why Choose Kyrgyz Riders
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the difference with our locally-rooted, adventure-focused approach to travel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border border-border"
              >
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
