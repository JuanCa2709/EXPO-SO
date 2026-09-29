import { Comparison } from "@/components/Comparison";
import { Conclusion } from "@/components/Conclusion";
import { ConflictSection } from "@/components/ConflictSection";
import { ContextSection } from "@/components/ContextSection";
import { DeadlockConditions } from "@/components/DeadlockConditions";
import { Hero } from "@/components/Hero";
import { LaptopOpening } from "@/components/LaptopOpening/LaptopOpening";
import { Navbar } from "@/components/Navbar";
import { PhilosopherModel } from "@/components/PhilosopherModel";
import { ResourceSection } from "@/components/ResourceSection";
import { ScrollStory } from "@/components/ScrollStory";
import { SectionRail } from "@/components/SectionRail";
import { Simulation } from "@/components/Simulation";
import { SimulationProvider } from "@/components/SimulationContext";
import { Solutions } from "@/components/Solutions";
import { Team } from "@/components/Team";

export default function Page() {
  return (
    <SimulationProvider>
      <Navbar />
      <SectionRail />
      <main id="contenido">
        <Hero />
        <LaptopOpening />
        <ContextSection />
        <ResourceSection />
        <PhilosopherModel />
        <ConflictSection />
        <DeadlockConditions />
        <ScrollStory />
        <Simulation />
        <Solutions />
        <Comparison />
        <Conclusion />
      </main>
      <Team />
    </SimulationProvider>
  );
}
