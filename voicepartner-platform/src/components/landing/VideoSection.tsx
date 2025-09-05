import { Play } from "lucide-react";
import Link from 'next/link';

const VideoSection = () => {
  return (
    <section className="pt-32 pb-20 bg-secondary/20">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Video Preview */}
          <div className="w-full lg:w-2/3 flex-shrink-0 relative flex items-center justify-center min-h-[420px] lg:min-h-[520px] rounded-3xl overflow-hidden shadow-lg bg-black">
            {/* Hier könnte ein echtes Video eingebunden werden */}
            <img 
              src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80" 
              alt="VoicePartnerAI in Aktion" 
              className="w-full h-full object-cover object-center opacity-80" 
            />
            <Link href="/demo">
              <button className="absolute inset-0 flex items-center justify-center z-10">
                <span className="bg-white/90 rounded-full p-5 shadow-xl hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-foreground" fill="currentColor" />
                </span>
              </button>
            </Link>
          </div>

          {/* Zitat und Name */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center items-start mt-10 lg:mt-0">
            <blockquote className="text-3xl lg:text-4xl font-serif text-foreground leading-relaxed mb-8 pl-2 border-l-4 border-accent/60 italic">
              „In einer Welt, in der Maschinen sprechen lernen, liegt unsere größte Verantwortung darin, ihnen beizubringen, zuzuhören."
            </blockquote>
            <div className="mb-2">
              <span className="text-lg font-bold text-foreground">Dr. Maria Schmidt</span>
              <div className="text-sm text-muted-foreground mt-1">Forschungsleiterin, Gesellschaftliche Auswirkungen</div>
            </div>
            <ul className="space-y-3 mt-6 pl-1">
              <li className="flex items-start space-x-3">
                <span className="mt-2 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <span className="text-base text-muted-foreground">Ethische Entwicklung von Sprach-KI steht im Mittelpunkt unserer Forschung</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="mt-2 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <span className="text-base text-muted-foreground">Transparenz und Verständlichkeit unserer KI-Systeme für alle Nutzer</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="mt-2 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <span className="text-base text-muted-foreground">Gesellschaftlicher Nutzen als Grundlage jeder technischen Entscheidung</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;