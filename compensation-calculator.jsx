import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════
// מחשבון פיצויים — שאגת הארי 2026
// שירות חינמי לציבור
// ═══════════════════════════════════════════════
// IMPORTANT: הוסף ל-index.html:
// <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
// ═══════════════════════════════════════════════

const AVG_WAGE_2026 = 12800;

const SECTORS = [
  { value: 1, label: "כללי", icon: "🏢" },
  { value: 0.35, label: "דלק (סיטונאי/קמעונאי)", icon: "⛽" },
  { value: 0.68, label: "קבלן ביצוע", icon: "🏗️" },
  { value: 0.19, label: "יהלומים / פטור סעיף 33", icon: "💎" },
];

const GRANT_TABLE = [
  { min: 12000, max: 50000, grant: 1833 },
  { min: 50001, max: 90000, grant: 3300 },
  { min: 90001, max: 120000, grant: 4400 },
  { min: 120001, max: 150000, grant: 2776 },
  { min: 150001, max: 200000, grant: 3273 },
  { min: 200001, max: 250000, grant: 4190 },
  { min: 250001, max: Infinity, grant: 4897 },
];

function getBaseGrant(annual) {
  const row = GRANT_TABLE.find((r) => annual >= r.min && annual <= r.max);
  return row ? row.grant : 0;
}

function getDamageFactor(drop) {
  if (drop > 0.8) return { factor: 3, label: "מעל 80%", color: "#c62828" };
  if (drop > 0.6) return { factor: 2.4, label: "60%-80%", color: "#d84315" };
  if (drop > 0.4) return { factor: 1.5, label: "40%-60%", color: "#e68a00" };
  return { factor: 1, label: "25%-40%", color: "#2e7d32" };
}

function getExpFactor(drop) {
  if (drop > 0.8) return 0.22;
  if (drop > 0.6) return 0.15;
  if (drop > 0.4) return 0.11;
  return 0.07;
}

function formatCurrency(n) {
  return Math.round(n).toLocaleString("he-IL");
}

function getPeriodLabels(sector, cashBasis, affectedArea) {
  const isContractor = sector === 0.68;
  const isDelayed = isContractor || cashBasis;
  const baseYear = affectedArea ? "2023" : "2025";
  const annualYear = affectedArea ? "2022" : "2025";
  return {
    eligibility: isDelayed ? "מאי-יוני 2026" : "מרץ-אפריל 2026",
    base: isDelayed ? `מאי-יוני ${baseYear}` : `מרץ-אפריל ${baseYear}`,
    annualYear,
    prevYear: affectedArea ? "ספטמבר 2022 – אוגוסט 2023" : "2025",
  };
}

// ─── Animated Number ────────────────────────────
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const end = Math.round(value);
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  return <>{display.toLocaleString("he-IL")}</>;
}

// ─── Tooltip ────────────────────────────────────
function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "help" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          style={{
            position: "absolute",
            bottom: "130%",
            right: "50%",
            transform: "translateX(50%)",
            background: "#001a4d",
            color: "#e8f0fa",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            width: 260,
            lineHeight: 1.6,
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            textAlign: "right",
          }}
        >
          {text}
          <span
            style={{
              position: "absolute",
              top: "100%",
              right: "50%",
              transform: "translateX(50%)",
              border: "6px solid transparent",
              borderTopColor: "#001a4d",
            }}
          />
        </span>
      )}
    </span>
  );
}

// ─── Input Field ────────────────────────────────
function Field({ label, tooltip, value, onChange, placeholder, type = "number", error, suffix, disabled }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <label style={{ fontWeight: 600, fontSize: 14, color: "#0d1b3e" }}>{label}</label>
        {tooltip && (
          <Tooltip text={tooltip}>
            <span
              style={{
                width: 18, height: 18, borderRadius: "50%", background: "#d0e2f2",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#0038B8",
              }}
            >?</span>
          </Tooltip>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "12px 16px",
            paddingLeft: suffix ? 50 : 16,
            border: `2px solid ${error ? "#c62828" : "#b8d0e8"}`,
            borderRadius: 10,
            fontSize: 16,
            fontFamily: "inherit",
            direction: "rtl",
            background: disabled ? "#f0f7ff" : "#fff",
            transition: "border-color 0.2s, box-shadow 0.2s",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = "#0038B8";
            e.target.style.boxShadow = "0 0 0 3px rgba(0,56,184,0.12)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "#c62828" : "#b8d0e8";
            e.target.style.boxShadow = "none";
          }}
        />
        {suffix && (
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "#6b8db5", fontSize: 14, fontWeight: 500,
          }}>
            {suffix}
          </span>
        )}
      </div>
      {error && <p style={{ color: "#c62828", fontSize: 12, margin: "6px 0 0", fontWeight: 500 }}>{error}</p>}
    </div>
  );
}

// ─── Sector Selector ────────────────────────────
function SectorSelector({ value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontWeight: 600, fontSize: 14, color: "#0d1b3e", marginBottom: 10, display: "block" }}>
        ענף פעילות
      </label>
      <div className="calc-sector-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {SECTORS.map((s) => (
          <button
            key={s.value}
            onClick={() => onChange(s.value)}
            style={{
              padding: "14px 12px",
              border: `2px solid ${value === s.value ? "#0038B8" : "#b8d0e8"}`,
              borderRadius: 12,
              background: value === s.value ? "#e6eeff" : "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center",
              fontSize: 14,
              fontWeight: value === s.value ? 600 : 400,
              color: value === s.value ? "#0038B8" : "#3a5a7c",
              fontFamily: "inherit",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Toggle ─────────────────────────────────────
function Toggle({ label, tooltip, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
        borderRadius: 10, border: `2px solid ${checked ? "#0038B8" : "#b8d0e8"}`,
        background: checked ? "#e6eeff" : "#fff", cursor: "pointer",
        transition: "all 0.2s", marginBottom: 10,
      }}
      onClick={() => onChange(!checked)}
    >
      <div
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? "#0038B8" : "#b8d0e8",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 18, height: 18, borderRadius: "50%", background: "#fff",
            position: "absolute", top: 2,
            left: checked ? 20 : 2,
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#0d1b3e" }}>{label}</span>
        {tooltip && (
          <Tooltip text={tooltip}>
            <span
              style={{
                width: 16, height: 16, borderRadius: "50%", background: "#d0e2f2",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#0038B8", marginRight: 6,
              }}
            >?</span>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ─── Step Indicator ─────────────────────────────
function StepIndicator({ current, total, labels }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700,
                background: i < current ? "#2e7d32" : i === current ? "#0038B8" : "#d0e2f2",
                color: i <= current ? "#fff" : "#8aa4be",
                transition: "all 0.4s",
                boxShadow: i === current ? "0 0 0 4px rgba(0,56,184,0.15)" : "none",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <div style={{
              fontSize: 11, marginTop: 6, color: i === current ? "#0038B8" : "#8aa4be",
              fontWeight: i === current ? 600 : 400, whiteSpace: "nowrap",
            }}>
              {label}
            </div>
          </div>
          {i < labels.length - 1 && (
            <div style={{
              width: 48, height: 3, background: i < current ? "#2e7d32" : "#d0e2f2",
              margin: "0 6px", marginBottom: 22, borderRadius: 2, transition: "background 0.4s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Breakdown Row ──────────────────────────────
function BreakdownRow({ label, value, highlight, sub }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: sub ? "6px 12px" : "10px 0",
        borderBottom: sub ? "none" : "1px solid #d6e8f5",
        fontSize: sub ? 13 : 14,
        color: sub ? "#5a7a9a" : "#0d1b3e",
        fontWeight: highlight ? 700 : 400,
        paddingRight: sub ? 20 : 0,
      }}
    >
      <span>{label}</span>
      <span style={{
        fontFamily: "'Courier New', monospace",
        color: highlight ? "#0038B8" : "#3a5a7c",
        fontWeight: highlight ? 700 : 500,
        fontSize: highlight ? 16 : 14,
        direction: "ltr",
      }}>
        {typeof value === "number" ? `₪ ${formatCurrency(value)}` : value}
      </span>
    </div>
  );
}

// ─── Print Button ───────────────────────────────
function PrintButton({ result }) {
  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8">
      <title>סימולציית פיצוי — שאגת הארי 2026</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 600px; margin: auto; }
        h1 { color: #0038B8; font-size: 22px; border-bottom: 3px solid #0038B8; padding-bottom: 12px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d6e8f5; }
        .total { font-size: 20px; font-weight: bold; color: #0038B8; margin-top: 16px; padding: 16px; background: #e6eeff; border-radius: 8px; text-align: center; }
        .disclaimer { font-size: 11px; color: #8aa4be; margin-top: 30px; border-top: 1px solid #d6e8f5; padding-top: 12px; }
        .date { font-size: 12px; color: #8aa4be; }
      </style></head><body>
      <h1>סימולציית פיצוי — שאגת הארי 2026</h1>
      <p class="date">תאריך הפקה: ${new Date().toLocaleDateString("he-IL")}</p>
      <div class="row"><span>מחזור שנתי</span><span>₪ ${formatCurrency(result.annual)}</span></div>
      <div class="row"><span>שיעור ירידה</span><span>${(result.drop * 100).toFixed(1)}%</span></div>
      <div class="row"><span>מסלול חישוב</span><span>${result.track}</span></div>
      <div class="total">פיצוי משוער: ₪ ${formatCurrency(result.total)}</div>
      <p class="disclaimer">הבהרה: מחשבון זה מבוסס על תזכיר חוק (טיוטה) ממרץ 2026. נוסח החוק הסופי עשוי להשתנות. הפיצוי הסופי ייקבע אך ורק על ידי רשות המיסים לפי נתוני האמת של העסק. השימוש באפליקציה הינו כלי עזר בלבד ואינו מהווה ייעוץ משפטי או חשבונאי.</p>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <button
      onClick={handlePrint}
      style={{
        background: "none", border: "2px solid #b8d0e8", borderRadius: 10,
        padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600,
        color: "#3a5a7c", display: "flex", alignItems: "center", gap: 8,
        fontFamily: "inherit", transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.target.style.borderColor = "#0038B8"; e.target.style.color = "#0038B8"; }}
      onMouseLeave={(e) => { e.target.style.borderColor = "#b8d0e8"; e.target.style.color = "#3a5a7c"; }}
    >
      🖨️ הדפס סימולציה
    </button>
  );
}

// ─── Sponsor Banner ─────────────────────────────
function SponsorBanner({ position }) {
  return (
    <div
      className="calc-banner-placeholder"
      style={{
        margin: position === "top" ? "0 0 20px" : "20px 0 0",
        padding: 16,
        borderRadius: 12,
        border: "2px dashed #b8d0e8",
        background: "#f8fbff",
        textAlign: "center",
        minHeight: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 11, color: "#8aa4be", letterSpacing: 1 }}>מקום פרסום לנותני חסות</div>
      <div style={{ fontSize: 13, color: "#5a7a9a", fontWeight: 500 }}>
        {position === "top" ? "באנר עליון — 728×90" : "באנר תחתון — 728×90"}
      </div>
      <div style={{ fontSize: 11, color: "#a0b8d0" }}>
        לפרטים על חסות: sponsor@example.co.il
      </div>
    </div>
  );
}

// ─── Legal Modal ────────────────────────────────
function LegalModal({ title, children, onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,20,60,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, direction: "rtl",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, maxWidth: 600, width: "100%",
          maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,20,60,0.25)",
        }}
      >
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid #d6e8f5",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f0f7ff",
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#001a4d" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: 22, cursor: "pointer",
              color: "#5a7a9a", lineHeight: 1, padding: 4,
            }}
          >×</button>
        </div>
        <div style={{
          padding: 24, overflowY: "auto", fontSize: 14, lineHeight: 1.8,
          color: "#1a2e4a",
        }}>
          {children}
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid #d6e8f5", textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 32px", borderRadius: 10, border: "none",
              background: "#0038B8", color: "#fff", fontSize: 14,
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >סגור</button>
        </div>
      </div>
    </div>
  );
}

// ─── Privacy Policy Content ─────────────────────
function PrivacyPolicyContent() {
  return (
    <div>
      <h3 style={{ color: "#0038B8", fontSize: 16, marginTop: 0 }}>מדיניות פרטיות</h3>
      <p><strong>עדכון אחרון:</strong> מרץ 2026</p>

      <h4 style={{ color: "#001a4d" }}>1. כללי</h4>
      <p>מחשבון הפיצויים "שאגת הארי 2026" (להלן: "השירות") הוא כלי עזר חינמי לחישוב סימולטיבי בלבד. אנו מחויבים להגנה על פרטיותך.</p>

      <h4 style={{ color: "#001a4d" }}>2. מידע שאנו אוספים</h4>
      <p>השירות <strong>אינו אוסף, שומר או מעביר</strong> מידע אישי מזהה. כל הנתונים שתזין (מחזורים, שכר, מספר עובדים) מעובדים באופן מקומי בדפדפן שלך בלבד ואינם נשלחים לשום שרת.</p>

      <h4 style={{ color: "#001a4d" }}>3. עוגיות (Cookies)</h4>
      <p>השירות אינו משתמש בעוגיות לצורך מעקב. נותני חסות עשויים להשתמש בעוגיות צד שלישי לצורך הצגת פרסומות בלבד.</p>

      <h4 style={{ color: "#001a4d" }}>4. נותני חסות ופרסום</h4>
      <p>השירות עשוי להציג באנרים של נותני חסות. לנותני החסות אין גישה לנתונים שהוזנו במחשבון. תוכן הפרסומות הוא באחריות המפרסמים בלבד.</p>

      <h4 style={{ color: "#001a4d" }}>5. אבטחת מידע</h4>
      <p>מכיוון שכל החישוב מתבצע מקומית בדפדפן, אין סיכון להדלפת נתונים. אף מידע אינו נשמר לאחר סגירת הדף.</p>

      <h4 style={{ color: "#001a4d" }}>6. יצירת קשר</h4>
      <p>לשאלות בנוגע למדיניות פרטיות זו ניתן לפנות אלינו בכתובת: privacy@example.co.il</p>
    </div>
  );
}

// ─── User Guide Content ─────────────────────────
function UserGuideContent() {
  return (
    <div>
      <h3 style={{ color: "#0038B8", fontSize: 16, marginTop: 0 }}>מדריך למשתמש</h3>

      <h4 style={{ color: "#001a4d" }}>מטרת המחשבון</h4>
      <p>המחשבון מאפשר לעסקים לבצע <strong>סימולציה בלבד</strong> של סכום הפיצוי המשוער לפי תזכיר חוק הסיוע הכלכלי (שאגת הארי 2026). תוצאות המחשבון אינן מחייבות ואינן מהוות תחליף לבדיקה מול רשות המיסים.</p>

      <h4 style={{ color: "#001a4d" }}>שלב 1 — נתוני בסיס</h4>
      <ul style={{ paddingRight: 20 }}>
        <li><strong>מחזור עסקאות שנתי</strong> — סך ההכנסות ללא מע״מ, כפי שדווחו לרשות המיסים בשנת הבסיס (2025, או 2022 לעסקים באזורים שפונו).</li>
        <li><strong>ענף פעילות</strong> — בחר את הענף הרלוונטי. הענף משפיע על מקדם ההוצאות הקבועות.</li>
        <li><strong>בסיס מזומן</strong> — סמן אם אתה מדווח למע״מ עם קבלת התמורה. תקופת הזכאות תהיה מאי-יוני 2026 (במקום מרץ-אפריל), ונדרשת ירידה מינימלית של 40%.</li>
        <li><strong>אזור שפונה</strong> — סמן אם עסקך ביישוב שפונה בעת מלחמת חרבות ברזל. שנת הבסיס תהיה 2022.</li>
      </ul>

      <h4 style={{ color: "#001a4d" }}>שלב 2 — השוואת מחזורים</h4>
      <ul style={{ paddingRight: 20 }}>
        <li><strong>מחזור בסיס</strong> — מחזור עסקאות בתקופה המקבילה (לפי שנת הבסיס).</li>
        <li><strong>מחזור נוכחי</strong> — מחזור עסקאות בתקופת הזכאות (בפועל או משוער).</li>
        <li>נדרשת ירידה של <strong>25% לפחות</strong> (40% לעוסק על בסיס מזומן).</li>
      </ul>

      <h4 style={{ color: "#001a4d" }}>שלב 3 — שכר והוצאות (עסק מעל 300K)</h4>
      <ul style={{ paddingRight: 20 }}>
        <li><strong>עובדים מזכים</strong> — עובדים שלא פוטרו/יצאו לחל״ת ולא נוכו להם ימי חופשה בתקופה.</li>
        <li><strong>שכר</strong> — סך השכר ברוטו שדווח בטופס 102. לכל עובד, עד תקרת השכר הממוצע במשק.</li>
        <li><strong>תשומות</strong> — תשומות שוטפות שנתיות (ללא שכר וללא ציוד).</li>
        <li><strong>מילואים</strong> — אם התקבל החזר תגמולי מילואים מביטוח לאומי, הסכום מנוכה מרכיב השכר.</li>
      </ul>

      <h4 style={{ color: "#001a4d" }}>שלב 4 — תוצאות</h4>
      <p>התוצאה מציגה את סכום הפיצוי המשוער, כולל פירוט מלא של שלבי החישוב. ניתן להדפיס את הסימולציה.</p>

      <div style={{
        padding: 14, borderRadius: 10, background: "#fff8e6",
        border: "1px solid #fcd34d", marginTop: 16, fontSize: 13,
      }}>
        <strong>⚠️ חשוב:</strong> סכום הפיצוי הסופי שיינתן בפועל נקבע אך ורק על ידי רשות המיסים, על סמך נתוני האמת של העסק ובהתאם לנוסח החוק הסופי שיתקבל בכנסת. אין להסתמך על תוצאות המחשבון לצורך קבלת החלטות כלכליות.
      </div>
    </div>
  );
}

// ─── Terms / Disclaimer Content ─────────────────
function TermsContent() {
  return (
    <div>
      <h3 style={{ color: "#0038B8", fontSize: 16, marginTop: 0 }}>תנאי שימוש והסרת אחריות</h3>
      <p><strong>עדכון אחרון:</strong> מרץ 2026</p>

      <h4 style={{ color: "#001a4d" }}>1. מהות השירות</h4>
      <p>מחשבון הפיצויים "שאגת הארי 2026" (להלן: "השירות") הוא <strong>כלי עזר לסימולציה בלבד</strong>, המבוסס על תזכיר חוק התוכנית לסיוע כלכלי (פיצויים בעד נזק עקיף) (הוראת שעה), התשפ"ו–2026 (להלן: "תזכיר החוק"), כפי שפורסם במרץ 2026.</p>

      <h4 style={{ color: "#001a4d" }}>2. הסרת אחריות — סייג לטעויות</h4>
      <p>השירות ניתן "כמות שהוא" (AS IS) ללא אחריות מכל סוג שהוא. מפעילי השירות <strong>אינם אחראים</strong> לכל טעות, אי-דיוק, השמטה או חוסר עדכניות בתוצאות החישוב, לרבות:</p>
      <ul style={{ paddingRight: 20 }}>
        <li>טעויות בפרשנות משפטית של הוראות תזכיר החוק;</li>
        <li>שינויים שיחולו בנוסח החוק הסופי כפי שיאושר בכנסת;</li>
        <li>הבדלים בין תוצאות המחשבון לבין קביעת רשות המיסים;</li>
        <li>שגיאות טכניות או באגים בקוד המחשבון;</li>
        <li>נתונים שגויים שהוזנו על ידי המשתמש.</li>
      </ul>

      <h4 style={{ color: "#c62828" }}>3. סכום הפיצוי הסופי</h4>
      <p style={{ fontWeight: 600, fontSize: 15 }}>סכום הפיצוי הסופי שיינתן בפועל נקבע אך ורק על ידי רשות המיסים בישראל, על סמך נתוני האמת של העסק, בהתאם לנוסח החוק הסופי שיאושר בכנסת ובהתאם להוראות הביצוע שתפרסם רשות המיסים. אין לראות בתוצאות מחשבון זה כל התחייבות, הבטחה או אינדיקציה לסכום שיתקבל בפועל.</p>

      <h4 style={{ color: "#001a4d" }}>4. אין ייעוץ מקצועי</h4>
      <p>השימוש בשירות <strong>אינו מהווה</strong> ולא יכול להחליף ייעוץ משפטי, ייעוץ מס, ייעוץ חשבונאי או כל ייעוץ מקצועי אחר. מומלץ להתייעץ עם איש מקצוע מוסמך בטרם קבלת החלטות כלכליות.</p>

      <h4 style={{ color: "#001a4d" }}>5. הגבלת אחריות</h4>
      <p>בשום מקרה לא יהיו מפעילי השירות, מפתחיו, נותני החסות או כל גורם הקשור אליו אחראים לכל נזק ישיר, עקיף, תוצאתי, מיוחד או אגבי הנובע מהשימוש או מחוסר היכולת להשתמש בשירות.</p>

      <h4 style={{ color: "#001a4d" }}>6. שינויים</h4>
      <p>מפעילי השירות שומרים לעצמם את הזכות לשנות, לעדכן או להסיר את השירות בכל עת וללא הודעה מוקדמת.</p>
    </div>
  );
}

// ─── Consent Screen ─────────────────────────────
function ConsentScreen({ onAccept }) {
  const [checked, setChecked] = useState(false);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #ffffff 0%, #e8f2ff 50%, #d0e4f7 100%)",
      padding: "16px",
      fontFamily: "'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif",
      direction: "rtl",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      overflowY: "auto", WebkitOverflowScrolling: "touch",
      paddingTop: "env(safe-area-inset-top, 16px)",
      paddingBottom: "env(safe-area-inset-bottom, 16px)",
    }}>
      <div style={{
        maxWidth: 560, width: "100%", background: "#fff", borderRadius: 20,
        boxShadow: "0 20px 60px rgba(0,40,120,0.08)", overflow: "hidden",
        margin: "auto 0",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0038B8 0%, #0054C8 100%)",
          padding: "28px 20px 20px", color: "#fff", textAlign: "center",
        }}>
          <img src={new URL("../public/icons/logo-shaagat.svg", import.meta.url).href} alt="שאגת הארי" style={{ width: 72, height: 72, marginBottom: 8, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>מחשבון פיצויים — שאגת הארי 2026</h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, opacity: 0.85 }}>שירות חינמי לציבור הישראלי</p>
        </div>

        {/* Disclaimer body */}
        <div style={{ padding: "20px 18px", fontSize: 14, lineHeight: 1.8, color: "#1a2e4a" }}>
          <div style={{
            padding: 16, borderRadius: 12, background: "#fff8e6",
            border: "1px solid #fcd34d", marginBottom: 20,
          }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#92400e", fontSize: 15 }}>⚠️ הסרת אחריות — נא לקרוא בעיון</p>
            <ul style={{ paddingRight: 20, margin: "0 0 10px", color: "#6b4a00" }}>
              <li>מחשבון זה מבוסס על <strong>תזכיר חוק (טיוטה)</strong> ממרץ 2026 בלבד. נוסח החוק הסופי עשוי להשתנות.</li>
              <li>תוצאות החישוב הן <strong>הערכה בלבד</strong> ועלולות לכלול אי-דיוקים או טעויות.</li>
              <li><strong style={{ color: "#c62828" }}>סכום הפיצוי הסופי שיינתן בפועל נקבע אך ורק על ידי רשות המיסים</strong>, לפי נתוני האמת של העסק ולפי החוק שיאושר בכנסת.</li>
              <li>השירות <strong>אינו מהווה ייעוץ</strong> משפטי, מיסויי או חשבונאי. מומלץ להתייעץ עם איש מקצוע.</li>
              <li>מפעילי השירות <strong>לא יישאו באחריות</strong> לכל נזק הנובע משימוש בתוצאות המחשבון.</li>
            </ul>
          </div>

          <div style={{
            padding: 16, borderRadius: 12, background: "#f0f7ff",
            border: "1px solid #b8d0e8", marginBottom: 20, fontSize: 13,
          }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#001a4d" }}>📋 מידע על פרטיות</p>
            <p style={{ margin: 0, color: "#3a5a7c" }}>
              כל הנתונים מעובדים מקומית בדפדפן שלך בלבד. אין איסוף, שמירה או העברה של נתונים אישיים.
              השירות עשוי להציג באנרים של נותני חסות אשר אין להם גישה לנתונים שהוזנו.
            </p>
          </div>

          {/* Consent checkbox */}
          <div
            style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: 16,
              borderRadius: 12, border: `2px solid ${checked ? "#0038B8" : "#b8d0e8"}`,
              background: checked ? "#e6eeff" : "#fff", cursor: "pointer",
              transition: "all 0.2s",
            }}
            onClick={() => setChecked(!checked)}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 2,
              border: `2px solid ${checked ? "#0038B8" : "#b8d0e8"}`,
              background: checked ? "#0038B8" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {checked && <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#0d1b3e" }}>
              קראתי והבנתי כי מחשבון זה הוא <strong>כלי עזר לסימולציה בלבד</strong>, כי תוצאותיו עלולות לכלול טעויות,
              וכי <strong>סכום הפיצוי הסופי נקבע אך ורק על ידי רשות המיסים</strong>.
              אני מוותר/ת על כל טענה כלפי מפעילי השירות בגין אי-דיוקים בתוצאות.
            </div>
          </div>
        </div>

        {/* Enter button */}
        <div style={{ padding: "0 18px 24px", textAlign: "center" }}>
          <button
            onClick={() => { if (checked) onAccept(); }}
            disabled={!checked}
            style={{
              width: "100%", padding: "16px 20px", borderRadius: 12, border: "none",
              background: checked
                ? "linear-gradient(135deg, #0038B8, #0054C8)"
                : "#d0e2f2",
              fontSize: 17, fontWeight: 700, cursor: checked ? "pointer" : "not-allowed",
              color: checked ? "#fff" : "#8aa4be",
              fontFamily: "inherit", transition: "all 0.3s",
              boxShadow: checked ? "0 4px 16px rgba(0,56,184,0.3)" : "none",
            }}
          >
            {checked ? "אני מאשר/ת — כניסה למחשבון ←" : "יש לאשר את התנאים כדי להמשך"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Main Calculator Component
// ═══════════════════════════════════════════════
export default function CompensationCalculator() {
  const [consented, setConsented] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [form, setForm] = useState({
    annual: "",
    basePeriod: "",
    currentPeriod: "",
    sector: 1,
    cashBasis: false,
    affectedArea: false,
    empCount: "",
    totalSalary: "",
    annualInputs: "",
    miluimReimbursement: "",
  });

  const annual = parseFloat(form.annual) || 0;
  const isLargeBusiness = annual > 300000;
  const isContractor = form.sector === 0.68;
  const isDelayed = isContractor || form.cashBasis;
  const periods = getPeriodLabels(form.sector, form.cashBasis, form.affectedArea);

  const stepLabels = isLargeBusiness
    ? ["נתוני בסיס", "מחזורים", "שכר והוצאות", "תוצאה"]
    : ["נתוני בסיס", "מחזורים", "תוצאה"];

  const totalSteps = stepLabels.length;

  const update = useCallback((key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: null }));
  }, []);

  // ── Validation ──
  function validateStep(s) {
    const e = {};
    if (s === 0) {
      const a = parseFloat(form.annual);
      if (!form.annual || isNaN(a)) e.annual = "נא להזין מחזור שנתי";
      else if (a < 0) e.annual = "המחזור לא יכול להיות שלילי";
      else if (a < 12000) e.annual = "מחזור מתחת ל-12,000 ₪ — אין זכאות לפי המתווה";
      else if (a > 400000000) e.annual = "מחזור מעל 400 מיליון ₪ — אין זכאות לפי סעיף 38לז(א)(1)";
    }
    if (s === 1) {
      const b = parseFloat(form.basePeriod);
      const c = parseFloat(form.currentPeriod);
      if (!form.basePeriod || isNaN(b)) e.basePeriod = "נא להזין מחזור בסיס";
      else if (b <= 0) e.basePeriod = "מחזור הבסיס חייב להיות חיובי";
      if (!form.currentPeriod && form.currentPeriod !== "0") e.currentPeriod = "נא להזין מחזור נוכחי";
      else if (isNaN(c)) e.currentPeriod = "ערך לא תקין";
      else if (c < 0) e.currentPeriod = "מחזור לא יכול להיות שלילי";
      if (Object.keys(e).length === 0 && b > 0) {
        const drop = (b - c) / b;
        const minDrop = form.cashBasis ? 0.4 : 0.25;
        if (drop < minDrop) {
          e.currentPeriod = form.cashBasis
            ? "עוסק על בסיס מזומן — נדרשת ירידה של 40% לפחות (סעיף 38לו)"
            : "שיעור הירידה נמוך מ-25%. נדרשת ירידה של 25% לפחות";
        }
      }
    }
    if (s === 2 && isLargeBusiness) {
      if (!form.empCount || parseInt(form.empCount) < 0) e.empCount = "נא להזין מספר עובדים תקין";
      if (!form.totalSalary && form.totalSalary !== "0") e.totalSalary = "נא להזין סך שכר";
      if (!form.annualInputs && form.annualInputs !== "0") e.annualInputs = "נא להזין תשומות שנתיות";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) {
      const nextS = step + 1;
      if (nextS >= totalSteps - 1) {
        calculate();
        setStep(nextS);
      } else {
        setStep(nextS);
      }
    }
  }

  function prevStep() {
    setResult(null);
    setShowBreakdown(false);
    setStep((s) => Math.max(0, s - 1));
  }

  function reset() {
    setStep(0);
    setResult(null);
    setShowBreakdown(false);
    setErrors({});
    setForm({
      annual: "", basePeriod: "", currentPeriod: "", sector: 1,
      cashBasis: false, affectedArea: false,
      empCount: "", totalSalary: "", annualInputs: "", miluimReimbursement: "",
    });
  }

  // ── Calculation Engine ──
  function calculate() {
    const annual = parseFloat(form.annual);
    const base = parseFloat(form.basePeriod);
    const current = parseFloat(form.currentPeriod);
    const drop = (base - current) / base;
    const baseGrant = getBaseGrant(annual);
    const damage = getDamageFactor(drop);
    const breakdown = [];

    let total = 0;
    let track = "";

    if (annual <= 300000) {
      track = "עסק קטן (מענק קבוע)";
      const isSmallSmall = annual <= 120000;
      if (isSmallSmall) {
        total = baseGrant * 2;
        breakdown.push({ label: "מענק בסיס חודשי", value: baseGrant });
        breakdown.push({ label: "× 2 חודשים", value: baseGrant * 2, highlight: true });
      } else {
        total = baseGrant * damage.factor * 2;
        breakdown.push({ label: "מענק בסיס חודשי", value: baseGrant });
        breakdown.push({ label: `מקדם נזק (${damage.label})`, value: `×${damage.factor}` });
        breakdown.push({ label: "× 2 חודשים", value: "" });
        breakdown.push({ label: "סה״כ מסלול עסק קטן", value: total, highlight: true });
      }
    } else {
      track = "שכר והוצאות (עסק גדול)";
      const empCount = parseInt(form.empCount) || 0;
      const reportedSalary = parseFloat(form.totalSalary) || 0;
      const annualInputs = parseFloat(form.annualInputs) || 0;
      const miluim = parseFloat(form.miluimReimbursement) || 0;
      const sectorMult = form.sector;
      const sectorLabel = SECTORS.find((s) => s.value === sectorMult)?.label || "כללי";
      const expFactor = getExpFactor(drop);

      // רכיב הוצאות קבועות (סעיף 38לו)
      const fixedExpComp = (annualInputs / 6) * expFactor * sectorMult;

      // רכיב שכר — הנמוך מבין שתי אופציות (סעיף 38לו)
      const salaryOptionA = reportedSalary * 0.75 * 1.25;
      const salaryOptionB = AVG_WAGE_2026 * empCount * 2 * 1.25;
      const salaryBeforeMiluim = Math.min(salaryOptionA, salaryOptionB);
      const salaryCapped = salaryOptionA > salaryOptionB;
      // הפחתת תגמולי מילואים
      const salaryExpenses = Math.max(0, salaryBeforeMiluim - miluim);
      // חלק השכר המזכה = הוצאות שכר × שיעור ירידה
      const salaryComp = salaryExpenses * drop;
      const trackTotal = fixedExpComp + salaryComp;

      // תקרת הוצאות מזכות (סעיף 38לו)
      let expCeiling;
      if (annual <= 100000000) {
        expCeiling = 600000 * 2;
      } else if (annual <= 300000000) {
        expCeiling = (600000 + 0.003 * (annual - 100000000)) * 2;
      } else {
        expCeiling = 1200000 * 2;
      }
      const cappedTrackTotal = Math.min(trackTotal, expCeiling);
      const expCeilingApplied = trackTotal > expCeiling;

      // כלל האופציה הטובה — סעיף 38לז(ג)
      const smallOption = baseGrant * damage.factor * 2;
      total = Math.max(cappedTrackTotal, smallOption);

      breakdown.push({ label: "רכיב הוצאות קבועות", value: null, sub: false });
      breakdown.push({ label: `תשומות שנתיות ÷ 6`, value: Math.round(annualInputs / 6), sub: true });
      breakdown.push({ label: `× מקדם הוצאות (${(expFactor * 100).toFixed(0)}%)`, value: "", sub: true });
      if (sectorMult !== 1) {
        breakdown.push({ label: `× מכפיל ענפי — ${sectorLabel} (${sectorMult})`, value: "", sub: true });
      }
      breakdown.push({ label: "סה״כ רכיב הוצאות", value: fixedExpComp, highlight: false });

      breakdown.push({ label: "רכיב שכר (סעיף 38לו)", value: null });
      breakdown.push({ label: `(א) 75% × שכר × 1.25`, value: Math.round(salaryOptionA), sub: true });
      breakdown.push({ label: `(ב) תקרה: ${formatCurrency(AVG_WAGE_2026)} × ${empCount} × 2 × 1.25`, value: Math.round(salaryOptionB), sub: true });
      if (miluim > 0) {
        breakdown.push({ label: `בניכוי תגמולי מילואים`, value: Math.round(miluim), sub: true });
      }
      breakdown.push({ label: `הוצאות שכר${salaryCapped ? " (תקרה)" : ""}${miluim > 0 ? " (אחרי ניכוי)" : ""}`, value: Math.round(salaryExpenses), sub: true });
      breakdown.push({ label: "× שיעור ירידה", value: "", sub: true });
      breakdown.push({ label: "סה״כ חלק שכר מזכה", value: salaryComp, highlight: false });

      breakdown.push({ label: "סה״כ הוצאות מזכות", value: trackTotal, highlight: false });
      if (expCeilingApplied) {
        breakdown.push({ label: `תקרת הוצאות מזכות (${formatCurrency(expCeiling)})`, value: cappedTrackTotal, highlight: false });
      }
      breakdown.push({ label: "סה״כ מסלול עסק קטן (השוואה)", value: smallOption, highlight: false });

      if (total === smallOption && smallOption > cappedTrackTotal) {
        breakdown.push({ label: "✦ נבחר: האופציה הטובה — מסלול עסק קטן", value: total, highlight: true });
      } else {
        breakdown.push({ label: "✦ פיצוי סופי — מסלול שכר+הוצאות", value: total, highlight: true });
      }
    }

    setResult({ annual, drop, total, track, damage, baseGrant, breakdown });
  }

  // ── Render Steps ──
  const renderStep = () => {
    if (step === 0) {
      return (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#001a4d", marginBottom: 4 }}>נתוני בסיס</h2>
          <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 24 }}>הזן את המחזור השנתי, בחר ענף פעילות וסמן מאפיינים רלוונטיים</p>
          <Field
            label={`מחזור עסקאות שנתי (${periods.annualYear})`}
            tooltip="סך ההכנסות ללא מע״מ, בהתאם לדוחות שהוגשו לרשות המיסים. לעסק באזור שפונה — יש להזין נתוני שנת הבסיס הרלוונטית."
            value={form.annual}
            onChange={(v) => update("annual", v)}
            placeholder="למשל: 480,000"
            suffix="₪"
            error={errors.annual}
          />
          <SectorSelector value={form.sector} onChange={(v) => update("sector", v)} />

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, fontSize: 14, color: "#0d1b3e", marginBottom: 10, display: "block" }}>
              מאפיינים נוספים
            </label>
            <Toggle
              label="עוסק המדווח על בסיס מזומן"
              tooltip="עוסק שמתחייב במע״מ עם קבלת התמורה ומקבל את עיקר התקבולים בחודש שלאחר ביצוע העסקה. תקופת הזכאות תהיה מאי-יוני 2026 במקום מרץ-אפריל. נדרשת ירידה של 40% לפחות."
              checked={form.cashBasis}
              onChange={(v) => update("cashBasis", v)}
            />
            <Toggle
              label="עסק באזור שפונה (חרבות ברזל)"
              tooltip="עסק ביישוב שפונה בהתאם להחלטות הממשלה בתקופת מלחמת חרבות ברזל. שנת הבסיס היא 2022 ותקופת ההשוואה מבוססת על 2023."
              checked={form.affectedArea}
              onChange={(v) => update("affectedArea", v)}
            />
          </div>

          {form.annual && annual >= 12000 && annual <= 400000000 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                padding: "12px 16px", borderRadius: 10,
                background: isLargeBusiness ? "#e6eeff" : "#f0fff4",
                border: `1px solid ${isLargeBusiness ? "#a0b8e8" : "#b8e0c8"}`,
                fontSize: 13, color: isLargeBusiness ? "#0038B8" : "#276749",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {isLargeBusiness ? "📊" : "🏪"}
                <span>
                  מסלול חישוב: <strong>{isLargeBusiness ? "שכר והוצאות (עסק גדול)" : "מענק קבוע (עסק קטן)"}</strong>
                </span>
              </div>
              {isLargeBusiness && annual <= 400000 && (
                <div style={{
                  padding: "10px 16px", borderRadius: 10,
                  background: "#fffbeb", border: "1px solid #fcd34d",
                  fontSize: 12, color: "#92400e", lineHeight: 1.6,
                }}>
                  💡 <strong>שים לב:</strong> לפי סעיף 38לז(ג), אם הפיצוי במסלול שכר+הוצאות נמוך מהמענק המקסימלי של עסק קטן — תקבל אוטומטית את הסכום הגבוה מביניהם.
                </div>
              )}
              {(isDelayed || form.affectedArea) && (
                <div style={{
                  padding: "10px 16px", borderRadius: 10,
                  background: "#e6eeff", border: "1px solid #a0b8e8",
                  fontSize: 12, color: "#001a4d", lineHeight: 1.6,
                }}>
                  📅 תקופת זכאות: <strong>{periods.eligibility}</strong> | תקופת בסיס: <strong>{periods.base}</strong>
                  {form.affectedArea && <> | שנת בסיס: <strong>{periods.annualYear}</strong></>}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (step === 1) {
      const b = parseFloat(form.basePeriod) || 0;
      const c = parseFloat(form.currentPeriod) || 0;
      const canShowDrop = b > 0 && c >= 0 && form.basePeriod && form.currentPeriod;
      const drop = canShowDrop ? ((b - c) / b) : 0;
      const minDrop = form.cashBasis ? 0.4 : 0.25;

      return (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#001a4d", marginBottom: 4 }}>השוואת מחזורים</h2>
          <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 24 }}>
            השווה בין תקופת הבסיס לתקופת הזכאות (חודשיים)
          </p>
          <Field
            label={`מחזור בסיס (${periods.base})`}
            tooltip="מחזור עסקאות בתקופה המקבילה — לפי דו״ח תקופתי למע״מ. לעסקים חדשים: המחזור מחושב באופן יחסי מתחילת הפעילות."
            value={form.basePeriod}
            onChange={(v) => update("basePeriod", v)}
            placeholder="מחזור בתקופה המקבילה"
            suffix="₪"
            error={errors.basePeriod}
          />
          <Field
            label={`מחזור נוכחי (${periods.eligibility})`}
            tooltip="מחזור עסקאות בתקופת הזכאות — בפועל או משוער"
            value={form.currentPeriod}
            onChange={(v) => update("currentPeriod", v)}
            placeholder="מחזור בתקופה הנוכחית"
            suffix="₪"
            error={errors.currentPeriod}
          />
          {canShowDrop && drop > 0 && (
            <div style={{
              marginTop: 8, padding: 16, borderRadius: 12,
              background: "linear-gradient(135deg, #0038B8 0%, #0054C8 100%)",
              color: "#fff", textAlign: "center",
            }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>שיעור ירידה</div>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Courier New', monospace" }}>
                {(drop * 100).toFixed(1)}%
              </div>
              {drop >= minDrop && (
                <div style={{
                  marginTop: 8, padding: "4px 12px", background: "rgba(255,255,255,0.2)",
                  borderRadius: 20, display: "inline-block", fontSize: 12,
                }}>
                  {getDamageFactor(drop).label} — מכפיל ×{getDamageFactor(drop).factor}
                </div>
              )}
              {drop > 0 && drop < minDrop && (
                <div style={{
                  marginTop: 8, padding: "4px 12px", background: "rgba(255,100,100,0.3)",
                  borderRadius: 20, display: "inline-block", fontSize: 12,
                }}>
                  מתחת לסף הזכאות ({minDrop * 100}%)
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (step === 2 && isLargeBusiness) {
      return (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#001a4d", marginBottom: 4 }}>נתוני שכר והוצאות</h2>
          <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 24 }}>
            נתונים נוספים הנדרשים למסלול עסקים מעל 300,000 ₪
          </p>
          <Field
            label="מספר עובדים מזכים"
            tooltip="עובדים שמתקיימים לגביהם כל התנאים: (1) לא פוטרו ולא הוצאו לחל״ת; (2) המעסיק לא ניכה להם ימי חופשה בגין היעדרות בתקופה; (3) יש להפחית תגמולי מילואים שהתקבלו מביטוח לאומי."
            value={form.empCount}
            onChange={(v) => update("empCount", v)}
            placeholder="0"
            error={errors.empCount}
          />
          <Field
            label={`סך שכר עבודה ששולם (${periods.eligibility})`}
            tooltip={`עבור כל עובד, אין להזין סכום העולה על השכר הממוצע במשק (${formatCurrency(AVG_WAGE_2026)} ₪ לחודש). הפיצוי ייגזר מהנמוך מבין: 75%×שכר×1.25 לבין שכר ממוצע×עובדים×2×1.25.`}
            value={form.totalSalary}
            onChange={(v) => update("totalSalary", v)}
            placeholder="סך שכר ברוטו לעובדים מזכים"
            suffix="₪"
            error={errors.totalSalary}
          />
          <Field
            label={`תשומות שוטפות שנתיות (${periods.prevYear})`}
            tooltip="סך התשומות השוטפות כפי שדווחו בדוחות תקופתיים למע״מ — ללא שכר עבודה וללא תשומות ציוד."
            value={form.annualInputs}
            onChange={(v) => update("annualInputs", v)}
            placeholder="סך תשומות שנתיות"
            suffix="₪"
            error={errors.annualInputs}
          />
          <Field
            label="החזר תגמולי מילואים מביטוח לאומי (אם רלוונטי)"
            tooltip="סכומים שהמוסד לביטוח לאומי שילם למעסיק להחזר תגמולי מילואים ששולמו לעובדים. סכום זה מופחת מרכיב השכר (סעיף 38לו)."
            value={form.miluimReimbursement}
            onChange={(v) => update("miluimReimbursement", v)}
            placeholder="0"
            suffix="₪"
          />
        </div>
      );
    }

    // ── Results Step ──
    if (result) {
      return (
        <div>
          <div style={{
            textAlign: "center", padding: 32, borderRadius: 16,
            background: "linear-gradient(135deg, #0038B8 0%, #0054C8 50%, #1A6FD4 100%)",
            color: "#fff", marginBottom: 24,
          }}>
            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>פיצוי משוער</div>
            <div style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Courier New', monospace", letterSpacing: 1 }}>
              ₪ <AnimatedNumber value={result.total} />
            </div>
            <div style={{
              display: "inline-block", marginTop: 12, padding: "6px 16px",
              background: "rgba(255,255,255,0.15)", borderRadius: 20, fontSize: 13,
            }}>
              {result.track}
            </div>
          </div>

          <div className="calc-stats-row" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{
              flex: 1, padding: 14, borderRadius: 10, background: "#f0f7ff",
              border: "1px solid #b8d0e8", textAlign: "center",
            }}>
              <div style={{ fontSize: 11, color: "#5a7a9a", marginBottom: 4 }}>שיעור ירידה</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: result.damage.color }}>
                {(result.drop * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{
              flex: 1, padding: 14, borderRadius: 10, background: "#f0f7ff",
              border: "1px solid #b8d0e8", textAlign: "center",
            }}>
              <div style={{ fontSize: 11, color: "#5a7a9a", marginBottom: 4 }}>מענק בסיס</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0038B8" }}>
                ₪ {formatCurrency(result.baseGrant)}
              </div>
            </div>
            <div style={{
              flex: 1, padding: 14, borderRadius: 10, background: "#f0f7ff",
              border: "1px solid #b8d0e8", textAlign: "center",
            }}>
              <div style={{ fontSize: 11, color: "#5a7a9a", marginBottom: 4 }}>מקדם נזק</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: result.damage.color }}>
                ×{result.damage.factor}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            style={{
              width: "100%", background: "none", border: "1px solid #b8d0e8",
              borderRadius: 10, padding: "12px 16px", cursor: "pointer",
              fontSize: 14, fontWeight: 600, color: "#3a5a7c",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "inherit", transition: "all 0.2s", marginBottom: 16,
            }}
          >
            {showBreakdown ? "▲ הסתר פירוט" : "▼ הצג פירוט חישוב מלא"}
          </button>

          {showBreakdown && (
            <div style={{
              padding: 20, borderRadius: 12, background: "#f0f7ff",
              border: "1px solid #b8d0e8", marginBottom: 16,
              animation: "fadeIn 0.3s ease",
            }}>
              {result.breakdown.map((row, i) =>
                row.value === null ? (
                  <div key={i} style={{
                    fontSize: 13, fontWeight: 700, color: "#0038B8",
                    marginTop: i > 0 ? 16 : 0, marginBottom: 4, paddingBottom: 4,
                    borderBottom: "2px solid #a0b8e8",
                  }}>
                    {row.label}
                  </div>
                ) : (
                  <BreakdownRow key={i} label={row.label} value={row.value} highlight={row.highlight} sub={row.sub} />
                )
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <PrintButton result={result} />
            <button
              onClick={reset}
              style={{
                background: "none", border: "2px solid #b8d0e8", borderRadius: 10,
                padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600,
                color: "#3a5a7c", fontFamily: "inherit", transition: "all 0.2s",
              }}
            >
              🔄 חישוב חדש
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  const isResultStep = step === totalSteps - 1 && result;

  // ── Consent Gate ──
  if (!consented) {
    return <ConsentScreen onAccept={() => setConsented(true)} />;
  }

  return (
    <div className="calc-footer-pad" style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #ffffff 0%, #e8f2ff 50%, #d0e4f7 100%)",
      padding: "16px",
      paddingTop: "env(safe-area-inset-top, 16px)",
      fontFamily: "'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif",
      direction: "rtl",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; appearance: textfield; }
        /* iOS: prevent zoom on input focus (requires font-size >= 16px) */
        input, select, textarea { font-size: 16px !important; }
        /* iOS safe areas */
        @supports (padding: env(safe-area-inset-bottom)) {
          .calc-footer-pad { padding-bottom: env(safe-area-inset-bottom, 16px) !important; }
        }
        @media (max-width: 480px) {
          .calc-stats-row { flex-direction: column !important; }
          .calc-stats-row > div { flex: none !important; width: 100% !important; }
          .calc-sector-grid { grid-template-columns: 1fr !important; }
          .calc-toolbar { gap: 4px !important; }
          .calc-toolbar button { padding: 5px 8px !important; font-size: 11px !important; }
          .calc-header h1 { font-size: 20px !important; }
          .calc-legal-links { gap: 10px !important; }
          .calc-banner-placeholder { min-height: 60px !important; }
          .calc-nav-row { flex-direction: column !important; }
          .calc-nav-row button { flex: none !important; width: 100% !important; }
        }
      `}</style>

      {/* Legal Modals */}
      {showPrivacy && (
        <LegalModal title="מדיניות פרטיות" onClose={() => setShowPrivacy(false)}>
          <PrivacyPolicyContent />
        </LegalModal>
      )}
      {showGuide && (
        <LegalModal title="מדריך למשתמש" onClose={() => setShowGuide(false)}>
          <UserGuideContent />
        </LegalModal>
      )}
      {showTerms && (
        <LegalModal title="תנאי שימוש והסרת אחריות" onClose={() => setShowTerms(false)}>
          <TermsContent />
        </LegalModal>
      )}

      {/* Top Sponsor Banner */}
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <SponsorBanner position="top" />
      </div>

      <div style={{
        maxWidth: 600, margin: "0 auto",
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 20px 60px rgba(0,40,120,0.08), 0 4px 12px rgba(0,40,120,0.04)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0038B8 0%, #0054C8 100%)",
          padding: "24px 16px 18px",
          color: "#fff",
          textAlign: "center",
        }}>
          <img src={new URL("../public/icons/logo-shaagat.svg", import.meta.url).href} alt="שאגת הארי" style={{ width: 56, height: 56, marginBottom: 8, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
          <div style={{ fontSize: 13, opacity: 0.7, letterSpacing: 2, marginBottom: 6 }}>שאגת הארי 2026</div>
          <h1 className="calc-header" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>מחשבון פיצויים</h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, opacity: 0.8 }}>
            לפי תזכיר חוק הסיוע הכלכלי — מרץ 2026 | שירות חינמי לציבור
          </p>
        </div>

        {/* Toolbar — Guide & Help */}
        <div className="calc-toolbar" style={{
          display: "flex", justifyContent: "center", gap: 8, padding: "12px 16px 0",
          flexWrap: "wrap",
        }}>
          {[
            { label: "📖 מדריך למשתמש", action: () => setShowGuide(true) },
            { label: "🔒 מדיניות פרטיות", action: () => setShowPrivacy(true) },
            { label: "📜 תנאי שימוש", action: () => setShowTerms(true) },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                background: "#f0f7ff", border: "1px solid #b8d0e8", borderRadius: 8,
                padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "#3a5a7c",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.background = "#e6eeff"; e.target.style.borderColor = "#0038B8"; }}
              onMouseLeave={(e) => { e.target.style.background = "#f0f7ff"; e.target.style.borderColor = "#b8d0e8"; }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "20px 16px 20px" }}>
          <StepIndicator current={step} total={totalSteps} labels={stepLabels} />

          <div style={{ animation: "fadeIn 0.35s ease" }} key={step}>
            {renderStep()}
          </div>

          {/* Navigation */}
          {!isResultStep && (
            <div className="calc-nav-row" style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "space-between" }}>
              {step > 0 && (
                <button
                  onClick={prevStep}
                  style={{
                    flex: 1, padding: "14px 20px", borderRadius: 10, border: "2px solid #b8d0e8",
                    background: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
                    color: "#3a5a7c", fontFamily: "inherit", transition: "all 0.2s",
                  }}
                >
                  → חזרה
                </button>
              )}
              <button
                onClick={nextStep}
                style={{
                  flex: step === 0 ? "1 1 100%" : 2, padding: "14px 20px", borderRadius: 10,
                  border: "none", background: "linear-gradient(135deg, #0038B8, #0054C8)",
                  fontSize: 16, fontWeight: 700, cursor: "pointer", color: "#fff",
                  fontFamily: "inherit", transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(0,56,184,0.25)",
                }}
              >
                {step === totalSteps - 2 ? "חשב פיצוי ←" : "המשך ←"}
              </button>
            </div>
          )}
        </div>

        {/* In-card sponsor slot (between content and disclaimer) */}
        <div style={{ padding: "0 16px" }}>
          <div style={{
            padding: 12, borderRadius: 10, border: "1px dashed #b8d0e8",
            background: "#f8fbff", textAlign: "center", fontSize: 11, color: "#8aa4be",
          }}>
            מקום פרסום לנותני חסות — באנר פנימי 468×60
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div style={{
          padding: "16px 16px 12px",
          borderTop: "1px solid #d6e8f5",
          marginTop: 16,
          fontSize: 11,
          color: "#8aa4be",
          lineHeight: 1.7,
          textAlign: "center",
        }}>
          <strong style={{ color: "#5a7a9a" }}>הבהרה:</strong> מחשבון זה מבוסס על תזכיר חוק (טיוטה) ממרץ 2026.
          נוסח החוק הסופי עשוי להשתנות.{" "}
          <strong style={{ color: "#c62828" }}>הפיצוי הסופי ייקבע אך ורק על ידי רשות המיסים</strong>{" "}
          לפי נתוני האמת של העסק.
          השימוש באפליקציה הינו כלי עזר בלבד ואינו מהווה ייעוץ משפטי או חשבונאי.
          תוצאות החישוב עלולות לכלול טעויות — אין להסתמך עליהן לצורך קבלת החלטות כלכליות.
        </div>

        {/* Legal links */}
        <div className="calc-legal-links" style={{
          display: "flex", justifyContent: "center", gap: 16, padding: "0 16px 16px",
          flexWrap: "wrap",
        }}>
          {[
            { label: "מדיניות פרטיות", action: () => setShowPrivacy(true) },
            { label: "תנאי שימוש", action: () => setShowTerms(true) },
            { label: "מדריך למשתמש", action: () => setShowGuide(true) },
          ].map((link) => (
            <button
              key={link.label}
              onClick={link.action}
              style={{
                background: "none", border: "none", fontSize: 11, color: "#0038B8",
                cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
                padding: 0,
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sponsor Banner */}
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <SponsorBanner position="bottom" />
      </div>

      {/* Public footer */}
      <div style={{
        textAlign: "center", marginTop: 16, fontSize: 12, color: "#8aa4be",
        lineHeight: 1.8,
      }}>
        <div>שירות חינמי לציבור הישראלי</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>
          השימוש במחשבון מותנה באישור תנאי השימוש והסרת האחריות
        </div>
      </div>
    </div>
  );
}
