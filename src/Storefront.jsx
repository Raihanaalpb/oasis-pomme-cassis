import { useState, useMemo, useEffect, useRef } from "react";
import { ShoppingBag, X, Plus, Minus, Menu, Search, Instagram, MessageCircle, Truck, ShieldCheck, Award, Headphones, Leaf, User } from "lucide-react";

/* ============================================================
   OASIS POMME CASSIS — boutique de tabac à chicha
   Palette : blanc / prune (façon canette Oasis)
   Display : Fraunces · Corps : Inter · Utilitaire : IBM Plex Mono
   ============================================================ */

// ⚠️ À REMPLACER par ton numéro WhatsApp, format international SANS "+" ni espaces
// Exemple : 06 12 34 56 78 en France -> "33612345678"
const WHATSAPP_NUMBER = "33782216309";

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
  bg: "#3A1240",
  bgAlt: "#451A4C",
  surface: "#4F1F54",
  surfaceHover: "#5B2A5E",
  plum: "#8CC63F",
  plumSoft: "#B7E37E",
  wine: "#230A28",
  ink: "#FDF6FA",
  muted: "#C6A9C4",
  line: "#5C2A5E",
};

const CATEGORIES = [
  { id: "af", label: "Al Fakher" },
  { id: "ad", label: "Adalya" },
  { id: "mazaya", label: "Mazaya" },
  { id: "badmad", label: "Bad & Mad" },
  { id: "dope", label: "Dope" },
  { id: "jibiar", label: "Jibiar" },
  { id: "charbons", label: "Charbons" },
  { id: "accessoires", label: "Accessoires" },
];

// price = prix pour un sachet de 25g
// 47 produits — à VÉRIFIER : les prix sont des valeurs provisoires (9,90€ / 25g), à remplacer par tes vrais tarifs de vente
const PRODUCTS = [
  { id: 1, name: "Peach Ice", brand: "Pêche glacée", cat: "af", price: 9.9, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 2, name: "Watermelon Kiwi", brand: "Kiwi Pastèque", cat: "af", price: 9.9, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 3, name: "Cherry Fiesta", brand: "Cerise", cat: "af", price: 9.9, badge: null, g1: "#C97B3D", g2: "#5C3719" },
  { id: 4, name: "Mixed Berry", brand: "Mix fruits des bois", cat: "af", price: 9.9, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 5, name: "Gum Mint", brand: "Chewing-gum & menthe", cat: "af", price: 9.9, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 6, name: "Strawberry Punch", brand: "Fraise intense", cat: "af", price: 9.9, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 7, name: "Cool Mango", brand: "Mangue fraîche", cat: "af", price: 9.9, badge: null, g1: "#2F6B4A", g2: "#153524" },
  { id: 8, name: "Mint", brand: "Menthe", cat: "af", price: 9.9, badge: null, g1: "#3A5C8A", g2: "#16283D" },
  { id: 9, name: "Menthe AF", brand: "Menthe", cat: "af", price: 9.9, badge: null, g1: "#B8A23A", g2: "#4E4419" },
  { id: 10, name: "Menthe Crème", brand: "Menthe & crème", cat: "af", price: 9.9, badge: null, g1: "#3E6B5C", g2: "#1F3A32" },
  { id: 11, name: "Menthe Orange", brand: "Menthe & orange", cat: "af", price: 9.9, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 12, name: "Menthe Citron", brand: "Menthe & citron", cat: "af", price: 9.9, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 13, name: "Citron Passion Pamplemousse", brand: "Mazaya", cat: "mazaya", price: 9.9, badge: null, g1: "#C97B3D", g2: "#5C3719" },
  { id: 14, name: "Cola", brand: "Adalya", cat: "ad", price: 9.9, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 15, name: "Hawai", brand: "Mangue Ananas", cat: "ad", price: 9.9, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 16, name: "Menthe Sucrée", brand: "Adalya", cat: "ad", price: 9.9, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 17, name: "Watermelon Ice", brand: "Pastèque glacée", cat: "ad", price: 9.9, badge: null, g1: "#2F6B4A", g2: "#153524" },
  { id: 18, name: "Hawaii", brand: "Ananas Mangue Menthe", cat: "ad", price: 9.9, badge: null, g1: "#3A5C8A", g2: "#16283D" },
  { id: 19, name: "Love 66", brand: "Melon Passion Pastèque Menthe", cat: "ad", price: 9.9, badge: null, g1: "#B8A23A", g2: "#4E4419" },
  { id: 20, name: "Mi Amor", brand: "Ananas Banane Menthe", cat: "ad", price: 9.9, badge: null, g1: "#3E6B5C", g2: "#1F3A32" },
  { id: 21, name: "Ladykiller", brand: "Melon Mangue Baie", cat: "ad", price: 9.9, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 22, name: "Swiss Bonbon", brand: "Menthe fraîche Bonbon", cat: "ad", price: 9.9, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 23, name: "Chewing-gum Menthe", brand: "Gum Menthe", cat: "ad", price: 9.9, badge: null, g1: "#C97B3D", g2: "#5C3719" },
  { id: 24, name: "Ice Lemon The Rock", brand: "Citron vert Menthe", cat: "ad", price: 9.9, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 25, name: "Strawberry Banane Ice", brand: "Fraise Banane Ice", cat: "ad", price: 9.9, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 26, name: "Moscow Evening", brand: "Pêche Pastèque Menthe", cat: "ad", price: 9.9, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 27, name: "Zéro to Zéro", brand: "Menthe sucrée Social", cat: "badmad", price: 9.9, badge: null, g1: "#2F6B4A", g2: "#153524" },
  { id: 28, name: "Maghrébin Nana", brand: "Menthe Marocaine", cat: "badmad", price: 9.9, badge: null, g1: "#3A5C8A", g2: "#16283D" },
  { id: 29, name: "Hardcore Nana", brand: "Menthe verte", cat: "badmad", price: 9.9, badge: null, g1: "#B8A23A", g2: "#4E4419" },
  { id: 30, name: "Cold Peach", brand: "Pêche glacée", cat: "badmad", price: 9.9, badge: null, g1: "#3E6B5C", g2: "#1F3A32" },
  { id: 31, name: "Habibi 66", brand: "Fruit Rouge Melon Glacé Miel", cat: "badmad", price: 9.9, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 32, name: "Limeking", brand: "Elektra Citron vert Menthe", cat: "badmad", price: 9.9, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 33, name: "Hayati", brand: "Gum Ananas Banane (Baku Night)", cat: "badmad", price: 9.9, badge: null, g1: "#C97B3D", g2: "#5C3719" },
  { id: 34, name: "Flamingo", brand: "Mangue Passion Pamplemousse", cat: "badmad", price: 9.9, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 35, name: "Mango Jango", brand: "Mangue Passion", cat: "badmad", price: 9.9, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 36, name: "Cuban Mojito", brand: "Menthe Mojito", cat: "badmad", price: 9.9, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 37, name: "Badqueen", brand: "14 Fruits exotiques Africa Queen", cat: "badmad", price: 9.9, badge: null, g1: "#2F6B4A", g2: "#153524" },
  { id: 38, name: "Raspberry Ice", brand: "Framboise glacée", cat: "badmad", price: 9.9, badge: null, g1: "#3A5C8A", g2: "#16283D" },
  { id: 39, name: "Suprême", brand: "Mangue Ananas Passion Menthe (Hawaï fruité)", cat: "badmad", price: 9.9, badge: null, g1: "#B8A23A", g2: "#4E4419" },
  { id: 40, name: "Maldiwi", brand: "Façon Hawaï", cat: "dope", price: 9.9, badge: null, g1: "#3E6B5C", g2: "#1F3A32" },
  { id: 41, name: "Redmint", brand: "Menthe rouge", cat: "dope", price: 9.9, badge: null, g1: "#B24B3C", g2: "#5C231C" },
  { id: 42, name: "Menthe Verte", brand: "Dope", cat: "dope", price: 9.9, badge: null, g1: "#5B2E5C", g2: "#2B1730" },
  { id: 43, name: "Double Pomme", brand: "Pomme verte & rouge", cat: "dope", price: 9.9, badge: "Nouveau", g1: "#C97B3D", g2: "#5C3719" },
  { id: 44, name: "Mint", brand: "Menthe rouge", cat: "jibiar", price: 9.9, badge: null, g1: "#7A2E3A", g2: "#33141A" },
  { id: 45, name: "Absolute Zero", brand: "Menthe sucrée", cat: "jibiar", price: 9.9, badge: null, g1: "#4A3324", g2: "#20150E" },
  { id: 46, name: "Charbons naturels — 72 pièces", brand: "Combustion longue durée", cat: "charbons", price: 9.9, badge: null, g1: "#8A5A2A", g2: "#3A2610" },
  { id: 47, name: "Pince à charbon acier", brand: "Accessoire chicha", cat: "accessoires", price: 14.0, badge: null, g1: "#2F6B4A", g2: "#153524" },
];

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
  const photo = getPhoto(p);
  const [qty, setQty] = useState(1);
  return (
    <div
      className="group relative flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.line}`,
        clipPath: "polygon(0 12px, 12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
      }}
    >
      {p.badge && <Ribbon text={p.badge} tone={soldOut ? "wine" : "ember"} />}
      <div
        className="h-44 w-full relative overflow-hidden"
        style={{ background: `linear-gradient(155deg, ${p.g1}, ${p.g2})` }}
      >
        {photo ? (
          <img
            src={photo}
            alt={p.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            {p.price.toFixed(2)} € <span style={{ color: COLORS.muted, fontSize: "11px" }}>/25g</span>
          </span>
          {!soldOut && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="w-6 h-6 flex items-center justify-center text-xs"
                style={{ border: `1px solid ${COLORS.line}`, color: COLORS.plum }}
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
                style={{ border: `1px solid ${COLORS.line}`, color: COLORS.plum }}
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
  const [activeCat, setActiveCat] = useState("tous");
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
      (i) => `• ${i.qty} × ${i.name} (25g) — ${(i.price * i.qty).toFixed(2)} €`
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

  const filtered = activeCat === "tous" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === activeCat);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
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
            <span className="text-xl font-bold tracking-tight">Oasis</span>
            <span
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: COLORS.plumSoft, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Pomme Cassis
            </span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-5 flex-wrap justify-center">
          {[{ id: "tous", label: "Tout" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
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
          <Search size={19} style={{ color: COLORS.muted }} />
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

      {/* MOBILE NAV */}
      {menuOpen && (
        <div className="md:hidden flex flex-col px-5 py-4 gap-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          {[{ id: "tous", label: "Tout" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCat(c.id); setMenuOpen(false); }}
              className="text-left text-sm uppercase tracking-wide"
              style={{ color: activeCat === c.id ? COLORS.plumSoft : COLORS.muted, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* HERO */}
      <section
        className="relative grid md:grid-cols-2 overflow-hidden"
        style={{ background: `linear-gradient(100deg, #F6EEF7 0%, #F6EEF7 32%, ${COLORS.bgAlt} 58%, ${COLORS.bg} 100%)` }}
      >
        {/* palmes en filigrane sur la zone claire */}
        <svg viewBox="0 0 380 420" className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" preserveAspectRatio="xMidYMid slice">
          <g opacity="0.12" fill="#5B1B57" transform="translate(-30,-20)">
            <path d="M0,80 C20,20 60,-20 120,-30 C 90,20 80,70 105,115 Z" />
            <path d="M0,90 C 35,50 85,30 135,35 C 95,65 80,95 100,140 Z" />
          </g>
          <g opacity="0.10" fill="#5B1B57" transform="translate(-10,300) scale(1,-1)">
            <path d="M0,60 C15,15 45,-15 90,-22 C 68,15 60,52 79,86 Z" />
          </g>
        </svg>

        <div className="relative flex flex-col justify-center px-6 md:px-12 py-12 md:py-16 order-2 md:order-1">
          <span
            className="text-xs uppercase tracking-[0.25em] mb-4"
            style={{ color: COLORS.plum, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Sélection premium
          </span>
          <h1
            className="text-4xl md:text-5xl leading-[1.05] mb-4 font-bold"
            style={{ fontFamily: "'Fraunces', serif", color: "#2A1030" }}
          >
            Des goûts
            <br />
            d'exception
          </h1>
          <p className="text-sm md:text-base mb-8" style={{ color: "#6B5A6E" }}>
            Une expérience unique à chaque session — saveurs intenses,
            fumée généreuse, sélection Oasis Pomme Cassis.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Leaf, l1: "Arômes", l2: "intenses" },
              { icon: Award, l1: "Qualité", l2: "premium" },
              { icon: ShieldCheck, l1: "Fumée", l2: "épaisse" },
            ].map(({ icon: Icon, l1, l2 }, i) => (
              <div key={i} className="flex flex-col items-start gap-2">
                <Icon size={22} style={{ color: COLORS.plum }} />
                <span className="text-xs leading-snug uppercase tracking-wide" style={{ color: "#2A1030", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {l1}<br />{l2}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.scrollTo({ top: document.getElementById("catalogue")?.offsetTop || 0, behavior: "smooth" })}
            className="self-start px-6 py-3 text-sm uppercase tracking-wide"
            style={{ background: COLORS.plum, color: "#FFFFFF", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Voir le catalogue
          </button>
        </div>

        <div className="relative order-1 md:order-2 min-h-[320px] md:min-h-[460px] overflow-hidden">
          <svg viewBox="0 0 380 420" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="heroGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8C674" />
                <stop offset="100%" stopColor="#B9832A" />
              </linearGradient>
              <radialGradient id="heroGlow" cx="55%" cy="20%" r="70%">
                <stop offset="0%" stopColor={COLORS.plum} stopOpacity="0.28" />
                <stop offset="100%" stopColor={COLORS.plum} stopOpacity="0" />
              </radialGradient>
              <linearGradient id="jarPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7A2264" />
                <stop offset="100%" stopColor="#4A1442" />
              </linearGradient>
              <linearGradient id="jarWatermelon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B24B3C" />
                <stop offset="100%" stopColor="#7A2E1E" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="380" height="420" fill="url(#heroGlow)" />

            <g opacity="0.6" stroke="#EFE6D6" strokeWidth="2" strokeLinecap="round" fill="none">
              <path d="M190,150 C 172,130 202,116 188,96 C 214,104 208,128 190,150" />
              <path d="M190,150 C 208,136 180,122 198,106" />
              <path d="M150,120 C 138,104 158,94 148,80" />
            </g>

            {/* chicha centrale */}
            <g transform="translate(190,280)">
              <line x1="-2" y1="-4" x2="-2" y2="46" stroke="#B9832A" strokeWidth="3" />
              <ellipse cx="0" cy="50" rx="48" ry="19" fill="url(#jarPurple)" stroke={COLORS.plum} strokeWidth="2" />
              <ellipse cx="0" cy="38" rx="42" ry="15" fill={COLORS.plum} opacity="0.16" />
              <rect x="-5" y="-58" width="10" height="88" rx="4" fill="url(#heroGold)" />
              <ellipse cx="0" cy="-58" rx="15" ry="5" fill="url(#heroGold)" />
              <ellipse cx="0" cy="-4" rx="17" ry="5.5" fill="url(#heroGold)" />
              <ellipse cx="0" cy="30" rx="19" ry="6" fill="url(#heroGold)" />
              <path d="M -13 -68 C -22 -80 -20 -92 -8 -98 C -14 -88 -12 -78 -4 -70 Z" fill="#8A5D1E" />
              <ellipse cx="-8" cy="-94" rx="9" ry="5" fill="#B9832A" />
              <circle cx="-11" cy="-95" r="1.4" fill="#3A0F3D" />
              <circle cx="-6" cy="-93" r="1.4" fill="#3A0F3D" />
              <path d="M 16 -2 C 42 4 56 22 52 46 C 70 38 74 16 58 -2 C 46 -12 28 -10 16 -2 Z" fill="#4C9A2A" />
              <ellipse cx="60" cy="50" rx="9" ry="6" fill="#3A0F3D" />
            </g>

            {/* pot "Pomme Cassis" */}
            <g transform="translate(96,300)">
              <rect x="-30" y="-6" width="60" height="66" rx="8" fill="#FDF6FA" stroke="#E3D5E6" />
              <rect x="-30" y="-18" width="60" height="16" rx="6" fill="#241028" />
              <ellipse cx="0" cy="6" rx="22" ry="9" fill="url(#jarPurple)" />
              <text x="0" y="30" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fontWeight="700" fill="#2A1030">POMME</text>
              <text x="0" y="42" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fontWeight="700" fill="#2A1030">CASSIS</text>
              <text x="0" y="54" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="6" letterSpacing="1" fill="#8C7A85">PREMIUM</text>
            </g>

            {/* pot "Pastèque Menthe" */}
            <g transform="translate(288,308)">
              <rect x="-26" y="-4" width="52" height="56" rx="7" fill="#FDF6FA" stroke="#E3D5E6" />
              <rect x="-26" y="-15" width="52" height="14" rx="5" fill="#241028" />
              <ellipse cx="0" cy="5" rx="19" ry="7.5" fill="url(#jarWatermelon)" />
              <text x="0" y="26" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8.5" fontWeight="700" fill="#2A1030">PASTÈQUE</text>
              <text x="0" y="37" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8.5" fontWeight="700" fill="#2A1030">MENTHE</text>
            </g>

            {/* pomme verte */}
            <g transform="translate(60,344)">
              <path d="M0,-4 C-16,-14 -20,6 -12,18 C-6,26 6,26 12,18 C20,6 16,-14 0,-4 Z" fill="#8CC63F" />
              <path d="M0,-8 C2,-14 8,-16 10,-14" fill="none" stroke="#5C8A1E" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* grappe de raisin / cassis */}
            <g transform="translate(120,352)" fill="#4A1442">
              <circle cx="0" cy="0" r="6" />
              <circle cx="9" cy="4" r="6" />
              <circle cx="-9" cy="4" r="6" />
              <circle cx="4" cy="12" r="6" />
              <circle cx="-4" cy="12" r="6" />
              <circle cx="0" cy="20" r="6" />
            </g>

            {/* glaçons */}
            <g transform="translate(230,356)">
              <rect x="0" y="0" width="16" height="16" rx="3" fill="#EAF3EE" opacity="0.9" transform="rotate(8)" />
              <rect x="16" y="6" width="14" height="14" rx="3" fill="#F5FAF7" opacity="0.85" transform="rotate(-6 23 13)" />
            </g>
          </svg>
        </div>
      </section>

      {/* BANDEAU CONFIANCE */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: COLORS.plum }}>
        {[
          { icon: Truck, title: "Livraison rapide", sub: "48h / 72h" },
          { icon: ShieldCheck, title: "Commande simple", sub: "Sur WhatsApp" },
          { icon: Award, title: "Produits premium", sub: "Sélectionnés avec soin" },
          { icon: Headphones, title: "Service client", sub: "À votre écoute" },
        ].map(({ icon: Icon, title, sub }, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4" style={{ background: COLORS.plum }}>
            <Icon size={22} style={{ color: COLORS.bg }} className="shrink-0" />
            <div>
              <p className="text-xs font-medium leading-tight" style={{ color: COLORS.bg }}>{title}</p>
              <p className="text-[11px] leading-tight" style={{ color: COLORS.bg, opacity: 0.75 }}>{sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* BANDE SAVEURS */}
      <section id="catalogue" className="px-5 md:px-10 py-8" style={{ background: COLORS.bgAlt }}>
        <div className="flex gap-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((c) => {
            const sample = PRODUCTS.find((p) => p.cat === c.id) || PRODUCTS[0];
            const photo = getPhoto(sample);
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCat(c.id); }}
                className="flex flex-col items-center gap-2 shrink-0"
              >
                <div
                  className="w-16 h-16 rounded-full overflow-hidden"
                  style={{
                    background: `linear-gradient(155deg, ${sample.g1}, ${sample.g2})`,
                    border: activeCat === c.id ? `2px solid ${COLORS.plum}` : `2px solid transparent`,
                  }}
                >
                  {photo && <img src={photo} alt={c.label} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                </div>
                <span className="text-[11px] uppercase tracking-wide text-center" style={{ color: COLORS.ink, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="px-5 md:px-10 py-14">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: "none" }}>
          {[{ id: "tous", label: "Tout" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
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
        <div className="flex items-baseline justify-between mb-8">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink }} className="text-2xl">
            {activeCat === "tous" ? "Toute la collection" : CATEGORIES.find((c) => c.id === activeCat)?.label}
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

      {/* NEWSLETTER */}
      <section className="px-5 md:px-10 py-16 flex flex-col items-center text-center">
        <h3 style={{ fontFamily: "'Fraunces', serif", color: COLORS.ink }} className="text-2xl mb-2">
          Les nouveautés, avant tout le monde
        </h3>
        <p className="text-sm mb-6" style={{ color: COLORS.muted }}>
          Un e-mail de temps en temps, jamais plus.
        </p>
        <div className="flex w-full max-w-sm">
          <input
            type="email"
            placeholder="votre@email.com"
            className="flex-1 px-4 py-3 text-sm outline-none"
            style={{ background: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.line}` }}
          />
          <button
            className="px-5 text-xs uppercase tracking-wide"
            style={{ background: COLORS.plum, color: COLORS.bg, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            OK
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${COLORS.line}` }}>
        <span style={{ color: COLORS.muted, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">
          © 2026 Oasis Pomme Cassis
        </span>
        <Instagram size={18} style={{ color: COLORS.muted }} />
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
                      {getPhoto(i) && (
                        <img src={getPhoto(i)} alt={i.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: COLORS.ink }} className="text-sm truncate">{i.name}</p>
                      <p style={{ color: COLORS.plumSoft, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">
                        {i.price.toFixed(2)} € /25g
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
                  Merci ! Votre commande a été envoyée sur WhatsApp. Une fois la confirmation reçue, voici les moyens de paiement disponibles :
                </p>
                <div className="flex flex-col gap-2 text-sm" style={{ color: COLORS.ink }}>
                  <div className="flex justify-between px-3 py-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
                    <span>PayPal</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.plumSoft }}>@kevin</span>
                  </div>
                  <div className="flex justify-between px-3 py-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
                    <span>Revolut</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.plumSoft }}>@kevinrev</span>
                  </div>
                  <div className="px-3 py-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
                    <div className="flex justify-between mb-1">
                      <span>Virement — RIB</span>
                    </div>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.plumSoft, fontSize: "12px" }}>
                      IBAN : FR76 XXXX XXXX XXXX XXXX XXXX XXX<br />
                      BIC : XXXXXXXX<br />
                      Titulaire : Kevin XXXXXX
                    </p>
                  </div>
                </div>
                <p className="text-[11px]" style={{ color: COLORS.muted }}>
                  ⚠️ RIB d'exemple à remplacer par tes vraies coordonnées bancaires.
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
