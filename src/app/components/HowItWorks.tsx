export function HowItWorks() {
  const steps = [
    {
      title: 'Send your dates',
      description: 'Tell me when you want to travel, group size, and your interests.',
    },
    {
      title: 'Get a custom plan',
      description: 'I build an itinerary with routes, stays, transport, and pricing.',
    },
    {
      title: 'Confirm the details',
      description: 'We finalize the plan, confirm the deposit, and lock in dates.',
    },
    {
      title: 'Meet in Kyrgyzstan',
      description: 'I meet you in Bishkek and we start the journey.',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4">How It Works</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A simple process from first message to arriving in the mountains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <div key={step.title} className="flex gap-4 rounded-lg border border-border bg-card p-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
