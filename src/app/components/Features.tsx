import { Backpack, BadgeCheck, Car, Compass, Home, Mountain } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Compass,
      title: 'Day Trips & Hikes',
      description: 'Flexible day adventures to Ala-Archa, Burana Tower, Suusamyr, or local lakes.',
    },
    {
      icon: Mountain,
      title: 'Multi-Day Treks',
      description: 'Custom trekking routes with camping, yurt stays, and scenic mountain passes.',
    },
    {
      icon: Backpack,
      title: 'Horseback Adventures',
      description: 'Ride through high valleys and alpine meadows with trusted local horsemen.',
    },
    {
      icon: Home,
      title: 'Cultural Homestays',
      description: 'Stay with nomadic families, visit yurt camps, and learn traditional crafts.',
    },
    {
      icon: Car,
      title: 'Transport & Driver',
      description: 'Private 4x4 transport, airport pickup, and intercity transfers included when needed.',
    },
    {
      icon: BadgeCheck,
      title: 'Permits & Logistics',
      description: 'I help arrange border permits, lodging, and seasonal planning so you travel stress-free.',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4">
            Services I Offer
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Pick a ready-made itinerary or tell me what you want and I will design a route around your time and budget.
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
