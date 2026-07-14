import { useState, useMemo, useEffect, useRef } from "react";
import { ShoppingBag, X, Plus, Minus, Menu, Search, MessageCircle, Truck, ShieldCheck, Award, Headphones, Leaf, User, Ghost, Send } from "lucide-react";

/* ============================================================
   OASIS POMME CASSIS — boutique de tabac à chicha
   Palette : blanc / prune (façon canette Oasis)
   Display : Fraunces · Corps : Inter · Utilitaire : IBM Plex Mono
   ============================================================ */

// ⚠️ À REMPLACER par ton numéro WhatsApp, format international SANS "+" ni espaces
// Exemple : 06 12 34 56 78 en France -> "33612345678"
const WHATSAPP_NUMBER = "33782216309";

// Nom d'utilisateur PayPal.me — génère un lien de paiement avec le montant pré-rempli
const PAYPAL_ME_USERNAME = "raihanaaik";

// Identifiant Revolut (Revtag) — le lien revolut.me ne permet pas de pré-remplir
// le montant, le client devra le saisir lui-même une fois sur la page.
const REVOLUT_TAG = "raihanav111";

// ⚠️ Colle ici le lien public de ton image (ex. depuis Supabase Storage).
// Laisse vide ("") pour garder l'illustration codée (chicha + fruits) par défaut.
const BANNER_IMAGE_URL = "https://qhkpehujmkeraupworzb.supabase.co/storage/v1/object/public/chicha/795ec212-4c1d-4d3a-82c1-7a271a2a803b.png";
// ⚠️ Colle ici le lien de ta bannière format mobile (verticale ou plus carrée).
// Laisse vide ("") pour utiliser la même bannière que sur ordinateur, recadrée.
const BANNER_IMAGE_URL_MOBILE = "https://qhkpehujmkeraupworzb.supabase.co/storage/v1/object/public/chicha/e.png";

// ⚠️ Code test fourni publiquement par Mondial Relay ("BDTEST"). Un message
// d'avertissement s'affichera dans le widget tant que ce code n'est pas
// remplacé par ton vrai "code enseigne" (obtenu avec un compte pro Mondial Relay).
const MONDIAL_RELAY_BRAND = "BDTEST  "; // doit faire 8 caractères (espaces inclus)

let mrAssetsPromise = null;
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("load failed: " + src));
    document.head.appendChild(s);
  });
}
function loadMondialRelayAssets() {
  if (mrAssetsPromise) return mrAssetsPromise;
  mrAssetsPromise = (async () => {
    if (!document.querySelector('link[data-mr-leaflet]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
      link.setAttribute("data-mr-leaflet", "1");
      document.head.appendChild(link);
    }
    if (!window.jQuery) await loadScriptOnce("https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js");
    if (!window.L) await loadScriptOnce("https://unpkg.com/leaflet/dist/leaflet.js");
    if (!(window.jQuery && window.jQuery.fn && window.jQuery.fn.MR_ParcelShopPicker)) {
      await loadScriptOnce("https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js");
    }
  })();
  return mrAssetsPromise;
}

// Sélecteur de Point Relais Mondial Relay (widget officiel avec carte).
// Repli automatique sur un champ texte si le widget ne peut pas se charger
// (ex. réseau bloqué en aperçu) — le site reste utilisable dans tous les cas.
function MondialRelayPicker({ postCode, searchToken, onSelect }) {
  const zoneRef = useRef(null);
  const zoneId = useRef(`mr-zone-${Math.random().toString(36).slice(2)}`);
  const targetId = useRef(`mr-target-${Math.random().toString(36).slice(2)}`);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | failed

  useEffect(() => {
    if (!postCode || !searchToken) return;
    let cancelled = false;
    setStatus("loading");
    const failTimer = setTimeout(() => !cancelled && setStatus((s) => (s === "ready" ? s : "failed")), 6000);

    loadMondialRelayAssets()
      .then(() => {
        if (cancelled) return;
        const $ = window.jQuery;
        if (!$ || !$.fn || !$.fn.MR_ParcelShopPicker || !zoneRef.current) {
          setStatus("failed");
          return;
        }
        $(zoneRef.current).MR_ParcelShopPicker({
          Target: `#${targetId.current}`,
          Brand: MONDIAL_RELAY_BRAND,
          Country: "FR",
          PostCode: postCode,
          ColLivMod: "24R",
          NbResults: "7",
          Responsive: true,
          ShowResultsOnMap: true,
          OnParcelShopSelected: function (data) {
            const d = (data && data.Data) || data || {};
            onSelect({
              id: d.ID || "",
              name: d.Nom || "Point Relais",
              address: [d.Adresse1, `${d.CP || ""} ${d.Ville || ""}`.trim()].filter(Boolean).join(", "),
            });
          },
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("failed"));

    return () => {
      cancelled = true;
      clearTimeout(failTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchToken]);

  if (status === "failed") {
    return (
      <div className="text-xs px-3 py-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, color: COLORS.muted }}>
        Le widget Mondial Relay n'a pas pu se charger ici (aperçu). Indique le nom et la ville de ton point relais préféré dans le champ ci-dessous, ou réessaie une fois le site en ligne.
        <input
          type="text"
          placeholder="Ex : Tabac de la Gare, 12 rue de la Gare, 75001 Paris"
          onChange={(e) => onSelect({ id: "manuel", name: e.target.value, address: "" })}
          className="mt-2 w-full px-3 py-2 text-sm outline-none"
          style={{ background: COLORS.bg, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}
        />
      </div>
    );
  }

  return (
    <div>
      {status === "loading" && (
        <p className="text-xs mb-2" style={{ color: COLORS.muted }}>Chargement des points relais…</p>
      )}
      <div ref={zoneRef} id={zoneId.current} />
      <input type="hidden" id={targetId.current} />
    </div>
  );
}

const COLORS = {
  bg: "#FFFFFF",
  bgAlt: "#FAFAF8",
  surface: "#FFFFFF",
  surfaceHover: "#F5F4F1",
  plum: "#CA4690",
  plumSoft: "#9AC894",
  wine: "#D05957",
  ink: "#1A1A1A",
  muted: "#8C8C86",
  line: "#E5DEF0",
};

const CATEGORIES = [
  { id: "af", label: "Al Fakher" },
  { id: "ad", label: "Adalya" },
  { id: "mazaya", label: "Puff" },
  { id: "badmad", label: "Bad & Mad" },
  { id: "dope", label: "Dope" },
  { id: "jibiar", label: "Jibiar" },
  { id: "charbons", label: "Charbons" },
  { id: "accessoires", label: "Accessoires" },
];

// Navigation simplifiée en 4 groupes : Best-sellers, Goûts chicha (toutes les
// marques de tabac réunies), Puff, et Accessoires (charbons inclus).
// Pour les Puffs, les produits partagent tous cat "mazaya" mais viennent de
// marques différentes à l'origine — on garde cette info ici pour permettre
// le sous-filtrage par marque, sans toucher au champ "cat" de chaque produit.
const PUFF_ORIGIN = {
  1: "puff_af", 2: "puff_af", 3: "puff_af", 4: "puff_af", 5: "puff_af", 6: "puff_af", 7: "puff_af", 8: "puff_af",
  13: "puff_mazaya",
  14: "puff_ad", 15: "puff_ad", 16: "puff_ad", 17: "puff_ad",
};
function getSub(p) {
  return PUFF_ORIGIN[p.id] || p.cat;
}
const SUB_LABELS = {
  af: "Al Fakher",
  ad: "Adalya",
  badmad: "Bad & Mad",
  dope: "Dope",
  jibiar: "Jibiar",
  accessoires: "Accessoires",
  charbons: "Charbons",
  puff_af: "Al Fakher",
  puff_mazaya: "Mazaya",
  puff_ad: "Adalya",
};

const NAV_GROUPS = [
  { id: "best", label: "Best-sellers", subs: null }, // cas spécial : BESTSELLER_IDS
  { id: "chicha", label: "Goûts chicha", subs: ["af", "ad", "badmad", "dope", "jibiar"] },
  { id: "puff", label: "Puff", subs: ["puff_af", "puff_mazaya", "puff_ad"] },
  { id: "accessoires", label: "Accessoires", subs: ["accessoires", "charbons"] },
];

// price = prix de la boîte de 1kg pour les tabacs à chicha (af/ad/badmad/dope/jibiar),
// prix à l'unité pour les Puffs (cat "mazaya") et les charbons/accessoires.
function getUnitLabel(p) {
  if (["af", "ad", "badmad", "dope", "jibiar"].includes(p.cat)) return "/1kg";
  return "";
}
// 48 produits — prix des tabacs à chicha = boîte de 1kg, prix des Puffs = à l'unité (voir getUnitLabel)
const PRODUCTS = [
  { id: 1, name: "Peach Ice", brand: "Pêche glacée", cat: "mazaya", price: 20.0, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 2, name: "Watermelon Kiwi", brand: "Kiwi Pastèque", cat: "mazaya", price: 20.0, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 3, name: "Cherry Fiesta", brand: "Cerise", cat: "mazaya", price: 20.0, badge: null, g1: "#C97B3D", g2: "#5C3719" },
  { id: 4, name: "Mixed Berry", brand: "Mix fruits des bois", cat: "mazaya", price: 20.0, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 5, name: "Gum Mint", brand: "Chewing-gum & menthe", cat: "mazaya", price: 20.0, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 6, name: "Strawberry Punch", brand: "Fraise intense", cat: "mazaya", price: 20.0, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 7, name: "Cool Mango", brand: "Mangue fraîche", cat: "mazaya", price: 20.0, badge: null, g1: "#2F6B4A", g2: "#153524" },
  { id: 8, name: "Mint", brand: "Menthe", cat: "mazaya", price: 15.0, badge: null, g1: "#3A5C8A", g2: "#16283D" },
  { id: 9, name: "Menthe AF", brand: "Menthe", cat: "af", price: 80.0, badge: null, g1: "#B8A23A", g2: "#4E4419" },
  { id: 10, name: "Menthe Crème", brand: "Menthe & crème", cat: "af", price: 80.0, badge: null, g1: "#3E6B5C", g2: "#1F3A32" },
  { id: 11, name: "Menthe Orange", brand: "Menthe & orange", cat: "af", price: 80.0, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 12, name: "Menthe Citron", brand: "Menthe & citron", cat: "af", price: 80.0, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 13, name: "Citron Passion Pamplemousse", brand: "Puff", cat: "mazaya", price: 20.0, badge: null, g1: "#C97B3D", g2: "#5C3719" },
  { id: 14, name: "Cola", brand: "Adalya", cat: "mazaya", photo: "", price: 15.0, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 15, name: "Hawai", brand: "Mangue Ananas", cat: "mazaya", photo: "", price: 15.0, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 16, name: "Menthe Sucrée", brand: "Adalya", cat: "mazaya", photo: "", price: 15.0, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 17, name: "Watermelon Ice", brand: "Pastèque glacée", cat: "mazaya", photo: "https://qhkpehujmkeraupworzb.supabase.co/storage/v1/object/public/chicha/Adalya%20Watermelon%20Hookah%20Flavor%20-%20250g.jpg", price: 15.0, badge: null, g1: "#2F6B4A", g2: "#153524" },
  { id: 18, name: "Hawaii", brand: "Ananas Mangue Menthe", cat: "ad", photo: "", price: 80.0, badge: null, g1: "#3A5C8A", g2: "#16283D" },
  { id: 19, name: "Love 66", brand: "Melon Passion Pastèque Menthe", cat: "ad", photo: "https://qhkpehujmkeraupworzb.supabase.co/storage/v1/object/public/chicha/Adalya%20Love%2066%20Hookah%20Flavor%20250g%20-.jpg", price: 80.0, badge: null, g1: "#B8A23A", g2: "#4E4419" },
  { id: 20, name: "Mi Amor", brand: "Ananas Banane Menthe", cat: "ad", photo: "https://qhkpehujmkeraupworzb.supabase.co/storage/v1/object/public/chicha/Adalya%20Mi%20Amor%20Hookah%20Flavor%20-%20250g.jpg", price: 80.0, badge: null, g1: "#3E6B5C", g2: "#1F3A32" },
  { id: 21, name: "Ladykiller", brand: "Melon Mangue Baie", cat: "ad", photo: "https://qhkpehujmkeraupworzb.supabase.co/storage/v1/object/public/chicha/Adalya%20Lady%20Killer%20Hookah%20Flavor%20250g%20-.jpg", price: 80.0, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 22, name: "Swiss Bonbon", brand: "Menthe fraîche Bonbon", cat: "ad", photo: "", price: 80.0, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 23, name: "Chewing-gum Menthe", brand: "Gum Menthe", cat: "ad", photo: "", price: 80.0, badge: null, g1: "#C97B3D", g2: "#5C3719" },
  { id: 24, name: "Ice Lemon The Rock", brand: "Citron vert Menthe", cat: "ad", photo: "", price: 80.0, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 25, name: "Strawberry Banane Ice", brand: "Fraise Banane Ice", cat: "ad", photo: "https://qhkpehujmkeraupworzb.supabase.co/storage/v1/object/public/chicha/strawberry%20banane%20ice.jpg", price: 80.0, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 26, name: "Moscow Evening", brand: "Pêche Pastèque Menthe", cat: "ad", photo: "", price: 80.0, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 27, name: "Zéro to Zéro", brand: "Menthe sucrée Social", cat: "badmad", price: 60.0, badge: null, g1: "#2F6B4A", g2: "#153524" },
  { id: 28, name: "Maghrébin Nana", brand: "Menthe Marocaine", cat: "badmad", price: 60.0, badge: null, g1: "#3A5C8A", g2: "#16283D" },
  { id: 29, name: "Hardcore Nana", brand: "Menthe verte", cat: "badmad", price: 60.0, badge: null, g1: "#B8A23A", g2: "#4E4419" },
  { id: 30, name: "Cold Peach", brand: "Pêche glacée", cat: "badmad", price: 60.0, badge: null, g1: "#3E6B5C", g2: "#1F3A32" },
  { id: 31, name: "Habibi 66", brand: "Fruit Rouge Melon Glacé Miel", cat: "badmad", price: 60.0, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 32, name: "Limeking", brand: "Elektra Citron vert Menthe", cat: "badmad", price: 60.0, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 33, name: "Hayati", brand: "Gum Ananas Banane (Baku Night)", cat: "badmad", price: 60.0, badge: null, g1: "#C97B3D", g2: "#5C3719" },
  { id: 34, name: "Flamingo", brand: "Mangue Passion Pamplemousse", cat: "badmad", price: 60.0, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 35, name: "Mango Jango", brand: "Mangue Passion", cat: "badmad", price: 60.0, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 36, name: "Cuban Mojito", brand: "Menthe Mojito", cat: "badmad", price: 60.0, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 37, name: "Badqueen", brand: "14 Fruits exotiques Africa Queen", cat: "badmad", price: 60.0, badge: null, g1: "#2F6B4A", g2: "#153524" },
  { id: 38, name: "Raspberry Ice", brand: "Framboise glacée", cat: "badmad", price: 60.0, badge: null, g1: "#3A5C8A", g2: "#16283D" },
  { id: 39, name: "Suprême", brand: "Mangue Ananas Passion Menthe (Hawaï fruité)", cat: "badmad", price: 60.0, badge: null, g1: "#B8A23A", g2: "#4E4419" },
  { id: 48, name: "Menthe", brand: "Hawaï fruité", cat: "badmad", price: 60.0, badge: null, g1: "#3E6B5C", g2: "#1F3A32" },
  { id: 40, name: "Maldiwi", brand: "Façon Hawaï", cat: "dope", price: 60.0, badge: null, g1: "#3E6B5C", g2: "#1F3A32" },
  { id: 41, name: "Redmint", brand: "Menthe rouge", cat: "dope", price: 60.0, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 42, name: "Menthe Verte", brand: "Dope", cat: "dope", price: 60.0, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 43, name: "Double Pomme", brand: "Pomme verte & rouge", cat: "dope", price: 60.0, badge: "Nouveau", g1: "#C97B3D", g2: "#5C3719" },
  { id: 44, name: "Mint", brand: "Menthe rouge", cat: "jibiar", price: 70.0, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 45, name: "Absolute Zero", brand: "Menthe sucrée", cat: "jibiar", price: 70.0, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 46, name: "Charbons naturels — 72 pièces", brand: "Combustion longue durée", cat: "charbons", price: 9.9, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 47, name: "Pince à charbon acier", brand: "Accessoire chicha", cat: "accessoires", price: 14.0, badge: null, g1: "#2F6B4A", g2: "#153524" },
];

// Sélection "Best-sellers" (choisie manuellement)
const BESTSELLER_IDS = [28, 18, 19, 27, 29, 9, 41, 40, 42, 44, 45, 1, 2];

function Ribbon({ text, tone = "ember" }) {
  const bg = tone === "wine" ? COLORS.wine : COLORS.plum;
  return (
    <span
      className="absolute top-3 left-0 px-3 py-1 text-[11px] tracking-widest uppercase font-medium"
      style={{
        background: bg,
        color: "#FFFFFF",
        fontFamily: "'IBM Plex Mono', monospace",
        clipPath: "polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%)",
      }}
    >
      {text}
    </span>
  );
}

// Photos libres de droits (Pexels), associées automatiquement selon le nom/la saveur
const PHOTOS = {
  peach: "https://images.pexels.com/photos/16880045/pexels-photo-16880045.jpeg?auto=compress&cs=tinysrgb&w=600",
  watermelon: "https://images.pexels.com/photos/1398655/pexels-photo-1398655.jpeg?auto=compress&cs=tinysrgb&w=600",
  mint: "https://images.pexels.com/photos/12568118/pexels-photo-12568118.jpeg?auto=compress&cs=tinysrgb&w=600",
  citrus: "https://images.pexels.com/photos/6517125/pexels-photo-6517125.jpeg?auto=compress&cs=tinysrgb&w=600",
};

function getPhoto(p) {
  const s = (p.name + " " + p.brand).toLowerCase();
  if (s.includes("peach") || s.includes("pêche") || s.includes("peche")) return PHOTOS.peach;
  if (s.includes("watermelon") || s.includes("pastèque") || s.includes("pasteque")) return PHOTOS.watermelon;
  if (s.includes("citron") || s.includes("lemon") || s.includes("lime") || s.includes("orange") || s.includes("pamplemousse"))
    return PHOTOS.citrus;
  if (s.includes("menthe") || s.includes("mint")) return PHOTOS.mint;
  return null; // pas de photo dédiée pour l'instant -> dégradé couleur en repli
}

function ProductCard({ p, onAdd }) {
  const soldOut = p.badge === "Épuisé";
  const photo = p.photo || getPhoto(p);
  const isRealPhoto = !!p.photo;
  const [qty, setQty] = useState(1);
  return (
    <div
      className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.line}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.ink; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.line; }}
    >
      {p.badge && <Ribbon text={p.badge} tone={soldOut ? "wine" : "ember"} />}
      <div
        className={isRealPhoto ? "h-56 w-full relative overflow-hidden" : "h-44 w-full relative overflow-hidden"}
        style={{ background: isRealPhoto ? "#F5F4F1" : `linear-gradient(155deg, ${p.g1}, ${p.g2})` }}
      >
        {photo ? (
          <img
            src={photo}
            alt={p.name}
            className={
              isRealPhoto
                ? "absolute inset-0 w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                : "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            }
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            loading="lazy"
          />
        ) : (
        <svg
          className="absolute inset-0 w-full h-full opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          viewBox="0 0 200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M-10,90 C30,60 40,110 80,80 C120,50 130,100 170,70 C190,55 200,60 210,50"
            stroke={"#FFFFFF"}
            strokeWidth="1"
            fill="none"
            opacity="0.35"
          />
          <path
            d="M-10,60 C40,90 50,40 90,65 C130,90 150,45 210,70"
            stroke={"#FFFFFF"}
            strokeWidth="1"
            fill="none"
            opacity="0.2"
          />
        </svg>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4 flex-1">
        <span
          className="text-[11px] tracking-wider uppercase"
          style={{ color: COLORS.muted, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {p.brand}
        </span>
        <h3
          className="text-lg leading-snug"
          style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink }}
        >
          {p.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span
            style={{ color: COLORS.plumSoft, fontFamily: "'IBM Plex Mono', monospace" }}
            className="text-base"
          >
            {p.price.toFixed(2)} € <span style={{ color: COLORS.muted, fontSize: "11px" }}>{getUnitLabel(p)}</span>
          </span>
          {!soldOut && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="w-6 h-6 flex items-center justify-center text-xs"
                style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
              >
                −
              </button>
              <span
                style={{ color: COLORS.ink, fontFamily: "'IBM Plex Mono', monospace" }}
                className="text-sm w-4 text-center"
              >
                {qty}
              </span>
              <button
                onClick={() => setQty((n) => n + 1)}
                className="w-6 h-6 flex items-center justify-center text-xs"
                style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
              >
                +
              </button>
            </div>
          )}
        </div>
        <button
          disabled={soldOut}
          onClick={() => { onAdd(p, qty); setQty(1); }}
          className="mt-2 w-full text-xs uppercase tracking-wide px-3 py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: soldOut ? "transparent" : COLORS.plum,
            color: soldOut ? COLORS.muted : COLORS.bg,
            border: soldOut ? `1px solid ${COLORS.line}` : "none",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {soldOut ? "Épuisé" : `Ajouter${qty > 1 ? ` (${qty})` : ""}`}
        </button>
      </div>
    </div>
  );
}

export default function Storefront() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCat, setActiveCat] = useState("best");
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [postCode, setPostCode] = useState("");
  const [searchToken, setSearchToken] = useState(0);
  const [selectedRelay, setSelectedRelay] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderSent, setOrderSent] = useState(false);
  const [formError, setFormError] = useState("");

  const [toast, setToast] = useState(null);

  const addToCart = (p, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { ...p, qty }];
    });
    setToast(`${p.name} ajouté au panier${qty > 1 ? ` (x${qty})` : ""}`);
    clearTimeout(addToCart._t);
    addToCart._t = setTimeout(() => setToast(null), 1800);
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) return;
    if (!customerFirstName.trim() || !customerLastName.trim() || !customerPhone.trim() || !selectedRelay) {
      setFormError("Merci de remplir prénom, nom, téléphone et de choisir un point relais avant d'envoyer la commande.");
      return;
    }
    setFormError("");
    const lines = cart.map(
      (i) => `• ${i.qty} × ${i.name}${getUnitLabel(i) ? " (" + getUnitLabel(i).replace("/", "") + ")" : ""} — ${(i.price * i.qty).toFixed(2)} €`
    );
    const message = [
      "Bonjour, je souhaite passer une commande sur Oasis Pomme Cassis :",
      "",
      ...lines,
      "",
      `Total : ${total.toFixed(2)} €`,
      "",
      `Prénom : ${customerFirstName}`,
      `Nom : ${customerLastName}`,
      `Téléphone : ${customerPhone}`,
      `Point Relais : ${selectedRelay.name}${selectedRelay.address ? " — " + selectedRelay.address : ""}`,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setOrderSent(true);
  };

  const resetOrder = () => {
    setCart([]);
    setCustomerFirstName("");
    setCustomerLastName("");
    setPostCode("");
    setSelectedRelay(null);
    setCustomerPhone("");
    setOrderSent(false);
    setCartOpen(false);
  };

  const activeGroup = NAV_GROUPS.find((g) => g.id === activeCat);
  const filtered = (
    activeCat === "best"
      ? PRODUCTS.filter((p) => BESTSELLER_IDS.includes(p.id))
      : activeSubCat
      ? PRODUCTS.filter((p) => getSub(p) === activeSubCat)
      : PRODUCTS.filter((p) => activeGroup?.subs?.includes(getSub(p)))
  ).filter((p) =>
    searchQuery.trim()
      ? (p.name + " " + p.brand).toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true
  );

  const [ageVerified, setAgeVerified] = useState(false);
  const [underage, setUnderage] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  if (underage) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6 text-center" style={{ background: COLORS.bg }}>
        <div>
          <p style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink }} className="text-2xl mb-3">
            Accès réservé aux personnes majeures
          </p>
          <p style={{ color: COLORS.muted }} className="text-sm">
            Ce site propose des produits de tabac à chicha, dont la vente et la consultation sont réservées aux personnes de 18 ans et plus.
          </p>
        </div>
      </div>
    );
  }

  if (!ageVerified) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: COLORS.bg }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Fredoka:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
          * { font-family: 'Inter', sans-serif; }
        `}</style>
        <div className="w-full max-w-sm text-center py-10 px-6" style={{ background: COLORS.bgAlt, border: `1px solid ${COLORS.line}` }}>
          <svg width="40" height="40" viewBox="0 0 40 40" className="mx-auto mb-4" style={{ color: COLORS.plum }}>
            <ellipse cx="20" cy="33" rx="13" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="8" x2="20" y2="28" stroke="currentColor" strokeWidth="2" />
            <ellipse cx="20" cy="8" rx="7" ry="2.6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M14,2 C10,4 9,8 12,10 C 10,7 11,4 15,3 Z" fill="currentColor" />
            <path d="M22,10 C 30,12 33,20 29,26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <p style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink }} className="text-xl mb-2">
            <span style={{ fontFamily: "'Fredoka', sans-serif", color: "#E4312B", fontWeight: 700 }}>Oasis</span> Pomme Cassis
          </p>
          <p style={{ color: COLORS.muted }} className="text-sm mb-6">
            Ce site présente des produits de tabac à chicha, réservés aux personnes majeures. Avez-vous 18 ans ou plus ?
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setAgeVerified(true)}
              className="w-full py-3 text-sm uppercase tracking-wide"
              style={{ background: COLORS.plum, color: "#FFFFFF", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Oui, j'ai 18 ans ou plus
            </button>
            <button
              onClick={() => setUnderage(true)}
              className="w-full py-3 text-sm uppercase tracking-wide"
              style={{ background: "transparent", color: COLORS.muted, border: `1px solid ${COLORS.line}`, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Non
            </button>
          </div>
          <p className="text-[11px] mt-6" style={{ color: COLORS.muted }}>
            La vente de tabac est interdite aux mineurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Fredoka:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes drift {
          0% { transform: translateX(0) translateY(0); opacity: 0; }
          15% { opacity: 0.5; }
          85% { opacity: 0.5; }
          100% { transform: translateX(60px) translateY(-40px); opacity: 0; }
        }
        .wisp { animation: drift 9s ease-in-out infinite; }
      `}</style>

      {/* HEADER */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 md:px-10 py-4"
        style={{ background: `${COLORS.bg}F2`, borderBottom: `1px solid ${COLORS.line}`, backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-center gap-3">
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: COLORS.ink }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <svg width="30" height="30" viewBox="0 0 40 40" style={{ color: COLORS.plum }}>
            <ellipse cx="20" cy="33" rx="13" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="8" x2="20" y2="28" stroke="currentColor" strokeWidth="2" />
            <ellipse cx="20" cy="8" rx="7" ry="2.6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M14,2 C10,4 9,8 12,10 C 10,7 11,4 15,3 Z" fill="currentColor" />
            <path d="M22,10 C 30,12 33,20 29,26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink, lineHeight: 1 }} className="flex flex-col">
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Fredoka', sans-serif", color: "#E4312B" }}>Oasis</span>
            <span
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: COLORS.plumSoft, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Pomme Cassis
            </span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-5 flex-wrap justify-center">
          {NAV_GROUPS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCat(c.id); setActiveSubCat(null); }}
              className="text-sm uppercase tracking-wide pb-1 transition-colors whitespace-nowrap shrink-0"
              style={{
                color: activeCat === c.id ? COLORS.plumSoft : COLORS.muted,
                borderBottom: activeCat === c.id ? `1px solid ${COLORS.plum}` : "1px solid transparent",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={() => setSearchOpen((v) => !v)} style={{ color: searchOpen ? COLORS.plum : COLORS.muted }}>
            <Search size={19} />
          </button>
          <User size={19} style={{ color: COLORS.muted }} className="hidden sm:block" />
          <button className="relative" onClick={() => setCartOpen(true)} style={{ color: COLORS.ink }}>
            <ShoppingBag size={21} />
            {count > 0 && (
              <span
                className="absolute -top-2 -right-2 text-[10px] w-4 h-4 flex items-center justify-center rounded-full"
                style={{ background: COLORS.plum, color: COLORS.bg }}
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* RECHERCHE */}
      {searchOpen && (
        <div className="px-5 md:px-10 py-3" style={{ background: COLORS.bgAlt, borderBottom: `1px solid ${COLORS.line}` }}>
          <div className="flex items-center gap-2 max-w-md mx-auto md:mx-0 px-3 py-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
            <Search size={16} style={{ color: COLORS.muted }} />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chercher une saveur..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: COLORS.ink }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ color: COLORS.muted }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* MOBILE NAV */}
      {menuOpen && (
        <div className="md:hidden flex flex-col px-5 py-4 gap-3" style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.line}` }}>
          {NAV_GROUPS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCat(c.id); setActiveSubCat(null); setMenuOpen(false); }}
              className="text-left text-sm uppercase tracking-wide"
              style={{ color: activeCat === c.id ? COLORS.plumSoft : COLORS.muted, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* BANNIÈRE */}
      <section className="w-full overflow-hidden" style={{ background: "transparent" }}>
        {BANNER_IMAGE_URL ? (
          <>
            {/* Mobile */}
            <img
              src={BANNER_IMAGE_URL_MOBILE || BANNER_IMAGE_URL}
              alt="Oasis Pomme Cassis"
              className={
                BANNER_IMAGE_URL_MOBILE
                  ? "w-full h-auto md:hidden object-contain block"
                  : "w-full h-56 sm:h-72 md:hidden object-cover block"
              }
              style={BANNER_IMAGE_URL_MOBILE ? {} : { objectPosition: "center 30%" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            {/* Desktop */}
            <img
              src={BANNER_IMAGE_URL}
              alt="Oasis Pomme Cassis"
              className="w-full h-auto hidden md:block object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </>
        ) : (
          <div className="w-full flex items-center justify-center py-16" style={{ color: COLORS.muted }}>
            <p className="text-sm">Ajoute le lien de ta bannière dans BANNER_IMAGE_URL en haut du fichier.</p>
          </div>
        )}
      </section>

      <div id="catalogue" />

      {/* PRODUCT GRID */}
      <section
        className="px-5 md:px-10 py-14"
        style={{ background: COLORS.bgAlt }}
      >
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: "none" }}>
          {NAV_GROUPS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCat(c.id); setActiveSubCat(null); }}
              className="shrink-0 px-4 py-2 text-xs uppercase tracking-wide whitespace-nowrap transition-colors"
              style={{
                background: activeCat === c.id ? COLORS.plum : COLORS.surface,
                color: activeCat === c.id ? "#FFFFFF" : COLORS.muted,
                border: `1px solid ${activeCat === c.id ? COLORS.plum : COLORS.line}`,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        {activeGroup?.subs && activeGroup.subs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setActiveSubCat(null)}
              className="shrink-0 px-3 py-1.5 text-[11px] uppercase tracking-wide whitespace-nowrap transition-colors"
              style={{
                color: !activeSubCat ? COLORS.plum : COLORS.muted,
                borderBottom: !activeSubCat ? `1px solid ${COLORS.plum}` : "1px solid transparent",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {activeCat === "accessoires" ? "Tous les produits" : "Toutes les marques"}
            </button>
            {activeGroup.subs.map((subId) => (
              <button
                key={subId}
                onClick={() => setActiveSubCat(subId)}
                className="shrink-0 px-3 py-1.5 text-[11px] uppercase tracking-wide whitespace-nowrap transition-colors"
                style={{
                  color: activeSubCat === subId ? COLORS.plum : COLORS.muted,
                  borderBottom: activeSubCat === subId ? `1px solid ${COLORS.plum}` : "1px solid transparent",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {SUB_LABELS[subId]}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-baseline justify-between mb-8">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink }} className="text-2xl">
            {activeSubCat ? SUB_LABELS[activeSubCat] : NAV_GROUPS.find((c) => c.id === activeCat)?.label}
          </h2>
          <span style={{ color: COLORS.muted, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">
            {filtered.length} référence{filtered.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} onAdd={addToCart} />
          ))}
        </div>
      </section>

      {/* AGE / LEGAL NOTICE */}
      <section
        className="px-5 md:px-10 py-8 flex items-center gap-4"
        style={{ borderTop: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}` }}
      >
        <div
          className="text-xs px-3 py-2 uppercase tracking-widest shrink-0"
          style={{ border: `1px solid ${COLORS.plum}`, color: COLORS.plum, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          18+
        </div>
        <p className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>
          Vente réservée aux personnes majeures. La consommation de tabac est réglementée ;
          une vérification d'âge est requise à la commande et à la livraison, conformément à la législation en vigueur.
        </p>
      </section>

      {/* RÉSEAUX SOCIAUX */}
      <section className="px-5 md:px-10 py-16 flex flex-col items-center text-center">
        <h3 style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink }} className="text-2xl mb-2">
          Suis-nous
        </h3>
        <p className="text-sm mb-6" style={{ color: COLORS.muted }}>
          Nouveautés, promos et coulisses sur nos réseaux.
        </p>
        <div className="flex gap-4">
          <a
            href="https://www.snapchat.com/add/oasispommecassis"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wide"
            style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <Ghost size={16} /> Snapchat
          </a>
          <a
            href="https://t.me/oasispc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wide"
            style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <Send size={16} /> Telegram
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${COLORS.line}` }}>
        <span style={{ color: COLORS.muted, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">
          © 2026 Oasis Pomme Cassis
        </span>
        <div className="flex items-center gap-5">
          <button
            onClick={() => setLegalOpen(true)}
            className="text-xs underline"
            style={{ color: COLORS.muted, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Mentions légales
          </button>
          <a href="https://www.snapchat.com/add/oasispommecassis" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.muted }}>
            <Ghost size={18} />
          </a>
          <a href="https://t.me/oasispc" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.muted }}>
            <Send size={18} />
          </a>
        </div>
      </footer>

      {/* TOAST */}
      {toast && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: COLORS.plum, color: "#FFFFFF", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}
        >
          ✓ {toast}
        </div>
      )}

      {/* MENTIONS LÉGALES */}
      {legalOpen && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setLegalOpen(false)}>
          <div
            className="w-full max-w-2xl my-8 p-6 md:p-10"
            style={{ background: COLORS.bg, border: `1px solid ${COLORS.line}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink }} className="text-2xl">
                Mentions légales
              </h2>
              <button onClick={() => setLegalOpen(false)} style={{ color: COLORS.muted }}>
                <X size={22} />
              </button>
            </div>

            <div className="flex flex-col gap-5 text-sm leading-relaxed" style={{ color: COLORS.ink }}>
              <p className="text-xs px-3 py-2" style={{ background: COLORS.surfaceHover, color: COLORS.muted }}>
                ⚠️ Modèle à personnaliser : remplace les champs entre crochets par tes vraies informations
                avant la mise en ligne définitive. Ceci n'est pas un avis juridique — fais relire ce texte
                par un professionnel (avocat, expert-comptable, CCI...) si tu as un doute.
              </p>

              <section>
                <h3 className="font-medium mb-1" style={{ color: COLORS.plum }}>1. Éditeur du site</h3>
                <p>
                  Le site Oasis Pomme Cassis est édité par [Nom / Prénom ou raison sociale], [statut :
                  entrepreneur individuel / auto-entrepreneur / société], immatriculé sous le n° SIRET
                  [XXX XXX XXX XXXXX], dont le siège est situé au [adresse complète].<br />
                  Numéro de téléphone : {WHATSAPP_NUMBER}<br />
                  E-mail de contact : [ton-email@exemple.com]
                </p>
              </section>

              <section>
                <h3 className="font-medium mb-1" style={{ color: COLORS.plum }}>2. Hébergement</h3>
                <p>
                  Le site est hébergé par GitHub Pages — GitHub, Inc., 88 Colin P. Kelly Jr. Street,
                  San Francisco, CA 94107, États-Unis.
                </p>
              </section>

              <section>
                <h3 className="font-medium mb-1" style={{ color: COLORS.plum }}>3. Vente de produits du tabac</h3>
                <p>
                  Les produits présentés sur ce site sont réservés aux personnes majeures (18 ans et plus),
                  conformément à la législation française en vigueur sur la vente de produits du tabac.
                  Une vérification d'âge est demandée à l'accès au site. Toute commande doit être passée
                  par une personne majeure, pour son usage personnel.
                </p>
              </section>

              <section>
                <h3 className="font-medium mb-1" style={{ color: COLORS.plum }}>4. Commandes et paiement</h3>
                <p>
                  Les commandes sont passées via WhatsApp après sélection des produits sur le site.
                  Le règlement s'effectue par [PayPal / Revolut / virement bancaire], selon les modalités
                  communiquées après validation de la commande. Aucune donnée bancaire n'est collectée
                  ou stockée par ce site.
                </p>
              </section>

              <section>
                <h3 className="font-medium mb-1" style={{ color: COLORS.plum }}>5. Livraison</h3>
                <p>
                  Les commandes sont expédiées en point relais (Mondial Relay). Les délais indicatifs
                  sont de 48h à 72h après confirmation du paiement. [Précise ici tes zones de livraison
                  et frais éventuels.]
                </p>
              </section>

              <section>
                <h3 className="font-medium mb-1" style={{ color: COLORS.plum }}>6. Droit de rétractation</h3>
                <p>
                  [À compléter avec un professionnel : les conditions de rétractation/retour applicables
                  aux produits du tabac peuvent différer du droit commun de la vente à distance —
                  fais vérifier ce point avant mise en ligne.]
                </p>
              </section>

              <section>
                <h3 className="font-medium mb-1" style={{ color: COLORS.plum }}>7. Données personnelles</h3>
                <p>
                  Les informations transmises via WhatsApp (nom, prénom, téléphone, point relais) sont
                  utilisées uniquement pour le traitement de ta commande et ne sont ni revendues, ni
                  partagées avec des tiers. Conformément au RGPD, tu disposes d'un droit d'accès, de
                  rectification et de suppression de tes données, à exercer en nous contactant sur WhatsApp
                  ou par e-mail.
                </p>
              </section>

              <section>
                <h3 className="font-medium mb-1" style={{ color: COLORS.plum }}>8. Propriété intellectuelle</h3>
                <p>
                  L'ensemble des contenus présents sur ce site (textes, visuels, logo) est la propriété
                  de Oasis Pomme Cassis, sauf mention contraire. Toute reproduction sans autorisation
                  est interdite.
                </p>
              </section>

              <section>
                <h3 className="font-medium mb-1" style={{ color: COLORS.plum }}>9. Cookies</h3>
                <p>
                  Ce site n'utilise pas de cookies de suivi publicitaire. [À ajuster si tu ajoutes un
                  outil d'analyse de trafic ou un service tiers plus tard.]
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} />
          <div
            className="relative w-full max-w-sm h-full flex flex-col p-6"
            style={{ background: COLORS.bgAlt, borderLeft: `1px solid ${COLORS.line}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink }} className="text-xl">
                Votre panier
              </h3>
              <button onClick={() => setCartOpen(false)} style={{ color: COLORS.muted }}>
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <p style={{ color: COLORS.muted }} className="text-sm">Votre panier est vide.</p>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                {cart.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 pb-4" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                    <div
                      className="w-14 h-14 shrink-0 overflow-hidden"
                      style={{ background: `linear-gradient(155deg, ${i.g1}, ${i.g2})` }}
                    >
                      {(i.photo || getPhoto(i)) && (
                        <img src={i.photo || getPhoto(i)} alt={i.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: COLORS.ink }} className="text-sm truncate">{i.name}</p>
                      <p style={{ color: COLORS.plumSoft, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">
                        {i.price.toFixed(2)} € {getUnitLabel(i)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(i.id, -1)} style={{ color: COLORS.muted }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ color: COLORS.ink, fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm w-4 text-center">
                        {i.qty}
                      </span>
                      <button onClick={() => changeQty(i.id, 1)} style={{ color: COLORS.muted }}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && !orderSent && (
              <div className="pt-4 mt-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${COLORS.line}` }}>
                <p className="text-[11px]" style={{ color: COLORS.muted }}>
                  Livraison en point relais Mondial Relais — entre ton code postal pour choisir ton point relais sur la carte.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Prénom *"
                    value={customerFirstName}
                    onChange={(e) => setCustomerFirstName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm outline-none"
                    style={{ background: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}
                  />
                  <input
                    type="text"
                    placeholder="Nom *"
                    value={customerLastName}
                    onChange={(e) => setCustomerLastName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm outline-none"
                    style={{ background: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}
                  />
                </div>
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Code postal *"
                      value={postCode}
                      onChange={(e) => setPostCode(e.target.value)}
                      maxLength={5}
                      className="flex-1 px-3 py-2 text-sm outline-none"
                      style={{ background: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}
                    />
                    <button
                      type="button"
                      onClick={() => { if (postCode.trim()) { setSelectedRelay(null); setSearchToken((n) => n + 1); } }}
                      className="px-4 text-xs uppercase tracking-wide shrink-0"
                      style={{ background: COLORS.plum, color: COLORS.bg, fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Chercher
                    </button>
                  </div>
                  {searchToken > 0 && !selectedRelay && (
                    <div className="mt-2">
                      <MondialRelayPicker postCode={postCode} searchToken={searchToken} onSelect={setSelectedRelay} />
                    </div>
                  )}
                  {selectedRelay && (
                    <div className="mt-2 flex items-start justify-between gap-2 px-3 py-2 text-sm" style={{ background: COLORS.surface, border: `1px solid ${COLORS.plum}`, color: COLORS.ink }}>
                      <div>
                        <p className="font-medium">📦 {selectedRelay.name}</p>
                        {selectedRelay.address && <p className="text-xs" style={{ color: COLORS.muted }}>{selectedRelay.address}</p>}
                      </div>
                      <button onClick={() => { setSelectedRelay(null); }} className="text-xs shrink-0" style={{ color: COLORS.plumSoft }}>
                        Changer
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="Téléphone *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-3 py-2 text-sm outline-none"
                  style={{ background: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}
                />
                {formError && (
                  <p className="text-xs" style={{ color: COLORS.wine }}>{formError}</p>
                )}
                <div className="flex justify-between">
                  <span style={{ color: COLORS.muted }} className="text-sm">Total</span>
                  <span style={{ color: COLORS.ink, fontFamily: "'IBM Plex Mono', monospace" }} className="text-lg">
                    {total.toFixed(2)} €
                  </span>
                </div>
                <button
                  onClick={sendOrderToWhatsApp}
                  className="w-full py-3 text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                  style={{ background: "#25D366", color: "#0B1A10", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  <MessageCircle size={16} />
                  Commander sur WhatsApp
                </button>
                <p className="text-[11px] text-center" style={{ color: COLORS.muted }}>
                  Vous serez redirigé vers WhatsApp avec votre commande pré-remplie.
                </p>
              </div>
            )}

            {orderSent && (
              <div className="pt-4 mt-4 flex flex-col gap-4" style={{ borderTop: `1px solid ${COLORS.line}` }}>
                <p style={{ color: COLORS.ink }} className="text-sm">
                  Merci ! Votre commande a été envoyée sur WhatsApp.
                </p>
                <a
                  href={`https://paypal.me/${PAYPAL_ME_USERNAME}/${total.toFixed(2)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                  style={{ background: "#003087", color: "#FFFFFF", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Payer {total.toFixed(2)} € avec PayPal
                </a>
                <p className="text-[11px] text-center" style={{ color: COLORS.muted }}>
                  Le montant est déjà rempli — il ne vous reste qu'à confirmer sur PayPal.
                </p>
                <a
                  href={`https://revolut.me/${REVOLUT_TAG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                  style={{ background: "#191C1F", color: "#FFFFFF", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Payer avec Revolut
                </a>
                <p className="text-[11px] text-center" style={{ color: COLORS.muted }}>
                  Sur Revolut, indiquez le montant exact : {total.toFixed(2)} €.
                </p>
                <button
                  onClick={resetOrder}
                  className="w-full py-3 text-sm uppercase tracking-wide"
                  style={{ background: COLORS.plum, color: COLORS.bg, fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Nouvelle commande
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
