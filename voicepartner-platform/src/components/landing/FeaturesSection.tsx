import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, GitBranch, BarChart3, Calendar, Phone, Briefcase } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: <Mic className="w-8 h-8 text-accent" />,
      title: "Natürliche Gesprächsführung",
      description: "Unsere KI versteht Kontext, Emotionen und Absichten. Sie führt Gespräche so natürlich wie ein menschlicher Mitarbeiter.",
      color: "bg-accent/5 border-accent/20"
    },
    {
      icon: <GitBranch className="w-8 h-8 text-accent" />,
      title: "Nahtlose Integration", 
      description: "Verbinden Sie VoicePartnerAI mit Ihren bestehenden Systemen - CRM, Kalender, Telefonie und mehr.",
      color: "bg-primary/5 border-primary/20"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-accent" />,
      title: "Intelligente Analytics",
      description: "Detaillierte Einblicke in jede Interaktion. Optimieren Sie Ihre Prozesse basierend auf echten Daten.",
      color: "bg-secondary/20 border-secondary/40"
    },
    {
      icon: <Calendar className="w-8 h-8 text-accent" />,
      title: "Terminverwaltung im Gesundheitswesen",
      description: "Automatisierte Terminvergabe, Erinnerungen und Rezeptbestellungen. Reduzieren Sie No-Shows um bis zu 75%.",
      color: "bg-accent/10 border-accent/30",
      cta: "Fallstudie ansehen →"
    },
    {
      icon: <Phone className="w-8 h-8 text-accent" />,
      title: "E-Commerce Support",
      description: "24/7 Kundenbetreuung für Bestellungen, Retouren und Produktfragen. Steigern Sie die Kundenzufriedenheit messbar.",
      color: "bg-primary/10 border-primary/30",
      cta: "Mehr erfahren →"
    },
    {
      icon: <Briefcase className="w-8 h-8 text-accent" />,
      title: "Qualifizierung von Leads",
      description: "Intelligente Vorqualifizierung von Interessenten. Ihre Vertriebsteams fokussieren sich auf die besten Opportunities.",
      color: "bg-secondary/30 border-secondary/50",
      cta: "Details ansehen →"
    }
  ];

  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`p-8 ${feature.color} hover:shadow-lg transition-all anthropic-fade`}
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    {feature.icon}
                    <h3 className="text-xl font-medium text-foreground">
                      {feature.title}
                    </h3>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {feature.cta && (
                    <Button 
                      variant="link" 
                      className="text-accent hover:text-accent/80 p-0 h-auto font-normal"
                    >
                      {feature.cta}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;