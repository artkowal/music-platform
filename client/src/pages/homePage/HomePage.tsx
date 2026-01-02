import { HomeHero } from "./components/HomeHero";
import { HomeFeatures } from "./components/HomeFeatures";
import { HomeSteps } from "./components/HomeSteps";
import { HomeIntegrations } from "./components/HomeIntegrations";
import { HomeCTA } from "./components/HomeCTA";
import { HomeFooter } from "./components/HomeFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 selection:text-primary-foreground">
      
      <main>
        <HomeHero />
        <HomeFeatures />
        <HomeSteps />
        <HomeIntegrations />
        <HomeCTA />
      </main>

      <HomeFooter />
    </div>
  );
}