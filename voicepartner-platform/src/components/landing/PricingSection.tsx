import { DollarSign, Star, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from 'next/link';

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      icon: <DollarSign className="w-8 h-8 text-accent mb-4" />, // Minimalistisches Icon
      price: "19",
      period: "Monat", 
      color: "bg-[#F5F3EE]",
      features: [
        "50 Minuten inklusive",
        "Danach: €0,50/Minute",
        "E-Mail Support"
      ],
      cta: "Plan wählen",
      popular: false
    },
    {
      name: "Professional",
      icon: <Star className="w-8 h-8 text-accent mb-4" />, // Minimalistisches Icon
      price: "79",
      period: "Monat",
      color: "bg-[#E3ECE7]",
      features: [
        "300 Minuten inklusive",
        "Danach: €0,40/Minute",
        "Priority Support",
        "Analytics Dashboard"
      ],
      cta: "Plan wählen",
      popular: true
    },
    {
      name: "Enterprise",
      icon: <Briefcase className="w-8 h-8 text-accent mb-4" />, // Minimalistisches Icon
      price: "299",
      period: "Monat",
      color: "bg-[#E6E6F7]",
      features: [
        "1.000 Minuten inklusive",
        "Danach: €0,30/Minute",
        "24/7 Support",
        "Custom Models"
      ],
      cta: "Kontakt aufnehmen",
      popular: false
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-normal text-foreground mb-6 tracking-tight">
              Transparente Preise
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Wählen Sie den Plan, der zu Ihrem Unternehmen passt. Alle Pläne beinhalten kostenlose Einrichtung und Migration.
            </p>
          </div>

          {/* Minimalistisches Pricing Grid */}
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 mb-12 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`flex flex-col items-center rounded-2xl px-8 py-12 ${plan.color} ${plan.popular ? 'border-2 border-accent' : ''}`}
              >
                {plan.icon}
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-end justify-center mb-2">
                  <span className="text-3xl font-normal text-foreground">€{plan.price}</span>
                  <span className="text-muted-foreground text-base ml-1">/{plan.period}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-6">zzgl. MwSt.</div>
                <ul className="space-y-3 mb-8 w-full">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-base text-muted-foreground">
                      <Check className="w-4 h-4 text-accent mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={plan.cta === "Kontakt aufnehmen" ? "/contact" : "/register"}>
                  <Button 
                    className={`w-full font-semibold rounded-lg px-6 py-3 ${plan.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="rounded-2xl bg-[#F5F3EE] p-8 mt-8 max-w-3xl mx-auto">
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-medium text-foreground">
                Haben Sie Fragen zu den Preisen?
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Unser Team berät Sie gerne bei der Auswahl des richtigen Plans. 
                Alle Pläne können jederzeit angepasst oder erweitert werden.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium text-base flex items-center justify-center"
                    style={{ minWidth: '220px' }}
                  >
                    Kostenlose Beratung buchen
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;