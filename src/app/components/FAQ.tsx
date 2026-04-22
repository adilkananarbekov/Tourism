import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function FAQ() {
  const faqs = [
    {
      question: 'What is the best season to visit?',
      answer:
        'June to September is best for high-mountain trekking. May and October are great for lower hikes, culture, and city trips.',
    },
    {
      question: 'What is included in the tour price?',
      answer:
        'I usually include guiding, transport, accommodation, and meals during the trip. We agree on what is included before you confirm.',
    },
    {
      question: 'Can you arrange permits for border areas?',
      answer:
        'Yes. I can help with border permits for places like Kel-Suu and remote regions when needed.',
    },
    {
      question: 'How fit do I need to be?',
      answer:
        'I can design routes for beginner, moderate, or advanced fitness levels. We will adjust daily distance and altitude to your comfort.',
    },
    {
      question: 'How do I book?',
      answer:
        'Send your travel dates and interests, and I will reply with an itinerary and price. A small deposit confirms the booking.',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4">FAQ</h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Quick answers to the most common questions.
          </p>
        </div>

        <Accordion type="single" collapsible className="rounded-lg border border-border bg-card px-4">
          {faqs.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
