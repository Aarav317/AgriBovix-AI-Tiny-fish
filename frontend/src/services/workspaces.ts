import {
  Sprout,
  Leaf,
  ScanLine,
  Apple,
  Bug,
  BookOpen,
  HeartPulse,
  ClipboardList,
  Users,
  Droplets,
  Wheat,
  ShieldCheck,
} from "lucide-react";
import { CowIcon as Beef } from "../components/CowIcon";
import type { Workspace } from "../types";
export const workspaceConfig = {
  agrivision: {
    name: "AgriVision",
    label: "CROP & PLANT INTELLIGENCE",
    subject: "plant",
    plural: "crops",
    history: "Crop History",
    guide: "Farming Guide",
    image: "/images/crop-leaves.png",
    icon: Sprout,
    tagline: "Healthy crops. Higher yields.",
    welcome: "A little care. A better harvest.",
    description:
      "Understand your plants, spot visible concerns, and find your next step with confidence.",
    upload: "Upload a plant image",
    photoTip:
      "Photograph a single leaf or fruit in natural light. Include both healthy and affected areas.",
    actions: [
      {
        title: "Crop analysis",
        desc: "Explore visible plant health",
        icon: ScanLine,
        task: "crop",
      },
      {
        title: "Fruit maturity",
        desc: "Review ripeness indicators",
        icon: Apple,
        task: "maturity",
      },
      {
        title: "Disease assistance",
        desc: "Look into visible symptoms",
        icon: Bug,
        task: "disease",
      },
      {
        title: "Farming guide",
        desc: "Grow your knowledge",
        icon: BookOpen,
        task: "guide",
      },
    ],
    prompts: [
      "How do I take a useful leaf photo?",
      "What should I record when a crop looks unhealthy?",
      "How can I reduce pesticide use?",
    ],
    guideCards: [
      {
        title: "Observe before you act",
        text: "Inspect the field regularly and record where changes appear. A photo alone may not establish the cause of crop damage.",
        icon: Leaf,
      },
      {
        title: "Use an integrated approach",
        text: "FAO describes integrated pest management as combining suitable practices to protect crops while reducing pesticide risks.",
        icon: ShieldCheck,
      },
      {
        title: "Make inputs a local decision",
        text: "Discuss crop, soil, weather and water conditions with your local extension officer before choosing inputs.",
        icon: Droplets,
      },
      {
        title: "Treat with evidence",
        text: "Confirm the pest or disease before using a pesticide. Follow local registration, the product label and protective equipment instructions.",
        icon: Wheat,
      },
    ],
    sources: [
      {
        title: "FAO · Integrated pest management",
        url: "https://www.fao.org/pest-and-pesticide-management/ipm/integrated-pest-management/en/",
      },
      {
        title: "FAO · Farmer Field Schools",
        url: "https://www.fao.org/farmer-field-schools/themes/integrated-pest-management/",
      },
    ],
  },
  pashuvision: {
    name: "PashuVision",
    label: "LIVESTOCK INTELLIGENCE",
    subject: "animal",
    plural: "animals",
    history: "Livestock History",
    guide: "Animal Care Guide",
    image: "/images/cattle.png",
    icon: Beef,
    tagline: "Healthy animals. Stronger farms.",
    welcome: "Better care. A stronger herd.",
    description:
      "Keep useful records, understand supported visual findings, and make informed animal-care decisions.",
    upload: "Upload an animal image",
    photoTip:
      "Take a clear side-on photo of one animal at a safe distance. Record any changes in feeding or behaviour.",
    actions: [
      {
        title: "Breed recognition",
        desc: "Identify supported breeds",
        icon: Beef,
        task: "breed",
      },
      {
        title: "Health observations",
        desc: "Record visible concerns",
        icon: HeartPulse,
        task: "health",
      },
      {
        title: "Livestock information",
        desc: "Build better care habits",
        icon: ClipboardList,
        task: "guide",
      },
      {
        title: "Ask the assistant",
        desc: "Discuss general animal care",
        icon: Users,
        task: "assistant",
      },
    ],
    prompts: [
      "What should I record before calling a veterinarian?",
      "How can I take a clear animal photo safely?",
      "Can a photo confirm an animal’s health?",
    ],
    guideCards: [
      {
        title: "Notice changes early",
        text: "Changes in appetite, behaviour or breathing deserve closer attention. Contact your veterinarian when an animal appears unwell.",
        icon: HeartPulse,
      },
      {
        title: "Prepare a useful record",
        text: "Note when signs started and share feeding changes, relevant history and clear photographs with your veterinarian.",
        icon: ClipboardList,
      },
      {
        title: "Plan preventive care",
        text: "Ask your herd veterinarian to create locally appropriate vaccination, parasite-control and routine-care plans.",
        icon: ShieldCheck,
      },
      {
        title: "Treatment needs assessment",
        text: "A photograph cannot confirm a diagnosis. Your veterinarian should determine treatment protocols and medicine use.",
        icon: BookOpen,
      },
    ],
    sources: [
      {
        title: "MSD Veterinary Manual · Cattle health observation",
        url: "https://www.msdvetmanual.com/management-and-nutrition/preventative-health-care-and-husbandry-of-beef-cattle/disease-screening-treatment-and-surveillance-in-beef-cattle",
      },
      {
        title:
          "MSD Veterinary Manual · Esophageal obstruction and emergency bloat",
        url: "https://www.msdvetmanual.com/digestive-system/disorders-of-the-esophagus-in-large-animals/esophageal-obstruction-in-large-animals",
      },
    ],
  },
} satisfies Record<Workspace, unknown>;
export function safeReturn(value: string | null) {
  return value &&
    /^\/(agrivision|pashuvision)(\/(scan|history|assistant|guide|settings))?$/.test(
      value,
    )
    ? value
    : "/choose-workspace";
}
