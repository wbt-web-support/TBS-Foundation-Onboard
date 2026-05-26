"use client";

import type { BuilderCustomization, HeaderLayout, FooterStyle } from "@/lib/builder/types";

const DEFAULT: BuilderCustomization = {
  colorScheme: { id: "teal-dark", label: "Ocean Pro", primary: "#0e7490", secondary: "#164e63", accent: "#14b8a6", bg: "#f0fdfa", text: "#0f172a" },
  buttonStyle: { id: "rounded", label: "Rounded", radius: "8px", shadow: "0 4px 12px rgba(0,0,0,0.15)", border: "none" },
  fontPair: { id: "inter-inter", label: "Modern Clean", heading: "'Inter', sans-serif", body: "'Inter', sans-serif", headingUrl: "", bodyUrl: "" },
  headerLayout: "centered",
  footerStyle: "dark",
};

function merge(c: BuilderCustomization): BuilderCustomization {
  return {
    colorScheme: c.colorScheme ?? DEFAULT.colorScheme!,
    buttonStyle: c.buttonStyle ?? DEFAULT.buttonStyle!,
    fontPair: c.fontPair ?? DEFAULT.fontPair!,
    headerLayout: c.headerLayout ?? DEFAULT.headerLayout!,
    footerStyle: c.footerStyle ?? DEFAULT.footerStyle!,
  };
}

function Header({ layout, primary, secondary, accent, text, fontH, btnRadius, btnShadow, btnBorder, templateName }: {
  layout: HeaderLayout; primary: string; secondary: string; accent: string; text: string;
  fontH: string; btnRadius: string; btnShadow: string; btnBorder: string; templateName: string;
}) {
  const centered = layout === "centered";
  const minimal  = layout === "minimal";
  return (
    <header style={{
      background: minimal ? "#fff" : `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)`,
      borderBottom: minimal ? `3px solid ${primary}` : "none",
      padding: centered ? "28px 40px 32px" : "20px 40px",
      display: "flex", flexDirection: centered ? "column" : "row",
      alignItems: "center", justifyContent: centered ? "center" : "space-between",
      gap: 16, textAlign: centered ? "center" : "left",
    }}>
      <div>
        <div style={{
          fontFamily: fontH, fontWeight: 800, fontSize: 22,
          color: minimal ? primary : "#fff", letterSpacing: -0.5,
        }}>
          🔧 {templateName || "Your Trades Business"}
        </div>
        {!minimal && (
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2, fontFamily: fontH }}>
            Professional · Reliable · Trusted
          </p>
        )}
      </div>
      <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
        {["Services", "About", "Reviews", "Contact"].map((item) => (
          <span key={item} style={{
            color: minimal ? text : "rgba(255,255,255,0.85)",
            fontSize: 13, fontFamily: fontH, cursor: "pointer",
            fontWeight: 500,
          }}>{item}</span>
        ))}
        <span style={{
          background: accent, color: secondary,
          padding: "8px 18px", borderRadius: btnRadius,
          boxShadow: btnShadow, border: btnBorder,
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          fontFamily: fontH, whiteSpace: "nowrap",
        }}>Get a Quote</span>
      </nav>
    </header>
  );
}

function Hero({ primary, secondary, accent, bg, text, fontH, fontB, btnRadius, btnShadow, btnBorder }: {
  primary: string; secondary: string; accent: string; bg: string; text: string;
  fontH: string; fontB: string; btnRadius: string; btnShadow: string; btnBorder: string;
}) {
  return (
    <section style={{
      background: `linear-gradient(160deg, ${secondary} 0%, ${primary} 60%, ${accent}33 100%)`,
      padding: "48px 40px", display: "flex", flexDirection: "column", gap: 16, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", right: -40, top: -40, width: 220, height: 220,
        borderRadius: "50%", background: `${accent}22`,
      }} />
      <span style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", fontFamily: fontH, textTransform: "uppercase" }}>
        ⭐ Rated 5 Stars · 500+ Projects Completed
      </span>
      <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 800, lineHeight: 1.2, fontFamily: fontH, maxWidth: 420, margin: 0 }}>
        Your Local Trusted Trades Expert
      </h1>
      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: fontB, maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
        From plumbing and heating to electrical and roofing — we deliver quality workmanship with guaranteed results.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        <span style={{
          background: accent, color: secondary, padding: "12px 24px",
          borderRadius: btnRadius, boxShadow: btnShadow, border: btnBorder,
          fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: fontH,
        }}>📞 Call Now — Free Quote</span>
        <span style={{
          background: "rgba(255,255,255,0.15)", color: "#fff", padding: "12px 24px",
          borderRadius: btnRadius, border: "1px solid rgba(255,255,255,0.3)",
          fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: fontH, backdropFilter: "blur(4px)",
        }}>View Our Work</span>
      </div>
    </section>
  );
}

function Services({ primary, accent, bg, text, fontH, fontB, btnRadius, btnShadow, btnBorder }: {
  primary: string; accent: string; bg: string; text: string;
  fontH: string; fontB: string; btnRadius: string; btnShadow: string; btnBorder: string;
}) {
  const services = [
    { icon: "🔥", title: "Heating & Boilers", desc: "Installations, servicing & emergency repairs 24/7." },
    { icon: "💧", title: "Plumbing", desc: "Leaks, bathrooms, full installations — fast & clean." },
    { icon: "⚡", title: "Electrical", desc: "Safe, certified electrical work for homes & businesses." },
    { icon: "🏠", title: "Roofing", desc: "Repairs, replacement & guttering with 10yr guarantee." },
  ];
  return (
    <section style={{ background: bg, padding: "40px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span style={{ color: primary, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: fontH }}>
          What We Do
        </span>
        <h2 style={{ color: text, fontSize: 22, fontWeight: 800, fontFamily: fontH, margin: "6px 0 0" }}>Our Services</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {services.map((s) => (
          <div key={s.title} style={{
            background: "#fff", borderRadius: btnRadius,
            padding: "18px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            border: `1px solid ${accent}33`, display: "flex", flexDirection: "column", gap: 8,
          }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <h3 style={{ color: primary, fontWeight: 700, fontSize: 14, fontFamily: fontH, margin: 0 }}>{s.title}</h3>
            <p style={{ color: text, fontSize: 12, fontFamily: fontB, lineHeight: 1.5, margin: 0, opacity: 0.75 }}>{s.desc}</p>
            <span style={{
              color: primary, fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: fontH, display: "flex", alignItems: "center", gap: 4,
            }}>Learn more →</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reviews({ primary, accent, bg, text, secondary, fontH, fontB }: {
  primary: string; accent: string; bg: string; text: string; secondary: string;
  fontH: string; fontB: string;
}) {
  return (
    <section style={{ background: `${primary}0d`, padding: "36px 40px" }}>
      <h2 style={{ color: text, fontSize: 20, fontWeight: 800, fontFamily: fontH, textAlign: "center", marginBottom: 20 }}>
        What Our Customers Say
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { name: "James T.", text: "Absolutely fantastic service. Fixed our boiler in 2 hours!", stars: 5 },
          { name: "Sarah M.", text: "Professional, tidy and great value. Would highly recommend.", stars: 5 },
        ].map((r) => (
          <div key={r.name} style={{
            background: "#fff", borderRadius: 12, padding: "16px 18px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${accent}`,
          }}>
            <div style={{ color: "#f59e0b", fontSize: 14, marginBottom: 6 }}>{"★".repeat(r.stars)}</div>
            <p style={{ color: text, fontSize: 13, fontFamily: fontB, lineHeight: 1.5, margin: "0 0 8px" }}>"{r.text}"</p>
            <span style={{ color: primary, fontSize: 12, fontWeight: 700, fontFamily: fontH }}>— {r.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer({ style: footerStyle, primary, secondary, accent, text, fontH, fontB }: {
  style: FooterStyle; primary: string; secondary: string; accent: string; text: string;
  fontH: string; fontB: string;
}) {
  const isDark = footerStyle === "dark";
  const isLight = footerStyle === "light";
  const bg = isDark ? secondary : isLight ? "#f8fafc" : "#fff";
  const fg = isDark ? "#fff" : text;
  const muted = isDark ? "rgba(255,255,255,0.55)" : "#94a3b8";
  return (
    <footer style={{ background: bg, padding: "28px 40px", borderTop: isLight ? `1px solid #e2e8f0` : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 20 }}>
        <div>
          <div style={{ color: isDark ? accent : primary, fontWeight: 800, fontSize: 16, fontFamily: fontH, marginBottom: 6 }}>
            🔧 Your Trades Business
          </div>
          <p style={{ color: muted, fontSize: 12, fontFamily: fontB, maxWidth: 200, lineHeight: 1.5, margin: 0 }}>
            Professional trades services across the UK. Fully insured &amp; certified.
          </p>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { title: "Services", items: ["Heating", "Plumbing", "Electrical", "Roofing"] },
            { title: "Contact", items: ["0800 123 456", "hello@trades.co.uk", "Mon–Fri 8am–6pm"] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ color: fg, fontWeight: 700, fontSize: 12, fontFamily: fontH, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{col.title}</div>
              {col.items.map((item) => (
                <div key={item} style={{ color: muted, fontSize: 12, fontFamily: fontB, marginBottom: 6 }}>{item}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: muted, fontSize: 11, fontFamily: fontB }}>© 2025 Your Trades Business. All rights reserved.</span>
        <span style={{ color: isDark ? accent : primary, fontSize: 11, fontFamily: fontH, fontWeight: 600 }}>Privacy · Terms</span>
      </div>
    </footer>
  );
}

export function TemplatePreviewFrame({
  customization,
  templateName,
  templateThumb,
}: {
  customization: BuilderCustomization;
  templateName: string;
  templateThumb?: string;
}) {
  const c = merge(customization);
  const col = c.colorScheme!;
  const btn = c.buttonStyle!;
  const font = c.fontPair!;
  const headerLayout = c.headerLayout!;
  const footerStyle = c.footerStyle!;

  const fontLink = font.headingUrl
    ? `<link rel="stylesheet" href="${font.headingUrl}" />`
    : "";

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
${fontLink}
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:${font.body};background:${col.bg};color:${col.text};}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:${col.primary}44;border-radius:4px;}
</style>
</head>
<body>
<div id="root"></div>
</body>
</html>`;

  return (
    <div style={{ width: "100%", height: "100%", overflowY: "auto", fontFamily: font.body }}>
      {/* Font loader */}
      {font.headingUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={font.headingUrl} />
      )}

      {/* Live rendered preview */}
      <div style={{ minHeight: "100%", background: col.bg }}>
        <Header
          layout={headerLayout} primary={col.primary} secondary={col.secondary}
          accent={col.accent} text={col.text} fontH={font.heading}
          btnRadius={btn.radius} btnShadow={btn.shadow} btnBorder={btn.border}
          templateName={templateName}
        />
        <Hero
          primary={col.primary} secondary={col.secondary} accent={col.accent}
          bg={col.bg} text={col.text} fontH={font.heading} fontB={font.body}
          btnRadius={btn.radius} btnShadow={btn.shadow} btnBorder={btn.border}
        />
        <Services
          primary={col.primary} accent={col.accent} bg={col.bg} text={col.text}
          fontH={font.heading} fontB={font.body}
          btnRadius={btn.radius} btnShadow={btn.shadow} btnBorder={btn.border}
        />
        <Reviews
          primary={col.primary} accent={col.accent} bg={col.bg}
          text={col.text} secondary={col.secondary} fontH={font.heading} fontB={font.body}
        />
        <Footer
          style={footerStyle} primary={col.primary} secondary={col.secondary}
          accent={col.accent} text={col.text} fontH={font.heading} fontB={font.body}
        />
      </div>
    </div>
  );
}
