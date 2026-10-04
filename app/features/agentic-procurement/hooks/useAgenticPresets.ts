import { useLanguage } from "../../../context/LanguageContext";
import type { PresetPrompt } from "../types";

/**
 * Returns translated preset prompts for agentic-procurement.
 * Centralised so switching locale automatically updates the preset chips.
 */
export function useAgenticPresets(): PresetPrompt[] {
  const { t } = useLanguage();

  return [
    {
      title: t("agentic.prompt.presets.laptopDev.title"),
      category: t("agentic.prompt.presets.laptopDev.category"),
      prompt: t("agentic.prompt.presets.laptopDev.prompt"),
    },
    {
      title: t("agentic.prompt.presets.officeChair.title"),
      category: t("agentic.prompt.presets.officeChair.category"),
      prompt: t("agentic.prompt.presets.officeChair.prompt"),
    },
    {
      title: t("agentic.prompt.presets.safetyApd.title"),
      category: t("agentic.prompt.presets.safetyApd.category"),
      prompt: t("agentic.prompt.presets.safetyApd.prompt"),
    },
    {
      title: t("agentic.prompt.presets.serverRack.title"),
      category: t("agentic.prompt.presets.serverRack.category"),
      prompt: t("agentic.prompt.presets.serverRack.prompt"),
    },
  ];
}
