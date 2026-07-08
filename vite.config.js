import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ⚠️ Remplace "NOM-DE-TON-DEPOT" par le nom exact de ton dépôt GitHub
// Exemple : si ton dépôt s'appelle "oasis-pomme-cassis", laisse tel quel.
// Si tu utilises un domaine perso (CNAME), remets base: "/"
export default defineConfig({
  plugins: [react()],
  base: "/oasis-pomme-cassis/",
});
