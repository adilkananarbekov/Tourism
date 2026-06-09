const popularRoutes = [
  'Song-Kul Lake yurt stays and horse riding',
  'Issyk-Kul lake circuit with canyons and hot springs',
  'Ala-Archa day hikes and short mountain trips from Bishkek',
  'Silk Road heritage routes through Burana, Tash Rabat, and Osh',
];

const faqs = [
  {
    question: 'What are the best months for Kyrgyzstan tours?',
    answer:
      'June to September is best for high mountain lakes, yurt camps, horse riding, and trekking. Spring and autumn are good for cultural tours, Issyk-Kul routes, and Silk Road travel.',
  },
  {
    question: 'Can a private tour start from Bishkek or Osh?',
    answer:
      'Yes. Most private Kyrgyzstan tours can start from Bishkek or Osh, depending on the route, flight schedule, and preferred travel pace.',
  },
  {
    question: 'Do you organize tours for international travelers?',
    answer:
      'Yes. Go Kyrgyzstan Travel helps international guests plan mountain, lake, culture, road-trip, and nomad experiences with direct follow-up by Telegram or phone.',
  },
  {
    question: 'How do I request a Kyrgyzstan tour?',
    answer:
      'Choose a ready route or send a quick request with your dates, group size, and contact details. A manager will confirm the route, price, and timing directly.',
  },
];

export function SEOContent() {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
              Kyrgyzstan travel planning
            </p>
            <h2 className="mb-4 text-3xl text-foreground sm:text-4xl">
              Kyrgyzstan tours for international travelers
            </h2>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Go Kyrgyzstan Travel plans private and small-group tours across Kyrgyzstan:
              alpine lakes, nomad yurt camps, horse riding routes, mountain treks, Silk Road
              heritage stops, and flexible road trips from Bishkek or Osh.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {popularRoutes.map((route) => (
              <div key={route} className="rounded-md border border-border bg-card p-4">
                <h3 className="text-base text-foreground">{route}</h3>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-2xl text-foreground sm:text-3xl">
            Kyrgyzstan tours FAQ
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-md border border-border bg-card p-5">
                <h3 className="mb-2 text-lg text-foreground">{item.question}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
