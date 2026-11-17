import { useEffect, useRef, useState, type ReactNode } from "react";
import { verifyAgency, checkMrz, analyzeVisaImage, type Result } from "./api";

type Screen =
  | "home"
  | "voice"
  | "confirm"
  | "verified"
  | "notFound"
  | "warning"
  | "offer"
  | "report"
  | "reportDone"
  | "help"
  | "history"
  | "how"
  | "visa"
  | "library";
type VoiceState = "idle" | "listening" | "processing" | "missed" | "blocked";
type IconName =
  | "home"
  | "search"
  | "report"
  | "help"
  | "mic"
  | "building"
  | "document"
  | "shield"
  | "arrow"
  | "check"
  | "warning"
  | "close"
  | "speaker"
  | "share"
  | "phone"
  | "camera"
  | "clock"
  | "user"
  | "lock"
  | "chevron"
  | "edit"
  | "wifi"
  | "upload"
  | "spark"
  | "calendar";

const LABELS: Record<Screen, [string, string]> = {
  home: ["হোম", "Home"],
  voice: ["কণ্ঠে যাচাই", "Voice check"],
  confirm: ["তথ্য নিশ্চিত করুন", "Confirm details"],
  verified: ["যাচাই ফলাফল", "Check result"],
  notFound: ["যাচাই ফলাফল", "Check result"],
  warning: ["সতর্কতা", "Warning"],
  offer: ["অফার পরীক্ষা", "Offer check"],
  report: ["প্রতারণার খবর দিন", "Report a scam"],
  reportDone: ["রিপোর্ট জমা হয়েছে", "Report submitted"],
  help: ["সাহায্য", "Help"],
  history: ["আগের যাচাই", "History"],
  how: ["কিভাবে কাজ করে", "How it works"],
  visa: ["ভিসা যাচাই", "Visa Check"],
  library: ["ডিজাইন সিস্টেম", "Design system"],
};

function Icon({ name, size = 24, stroke = 2 }: { name: IconName; size?: number; stroke?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    report: <><path d="M5 3h11l3 3v15H5z" /><path d="M9 9h6M9 13h6M9 17h3" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.3 2.3 0 1 1 3 2.2c-.8.3-.8 1-.8 1.8M12 17h.01" /></>,
    mic: <><rect x="8" y="3" width="8" height="12" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></>,
    building: <><path d="M4 21V7l8-4 8 4v14M2 21h20" /><path d="M8 9h2M14 9h2M8 13h2M14 13h2M10 21v-4h4v4" /></>,
    document: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>,
    shield: <><path d="M12 2 4.5 5v6c0 5 3.2 9 7.5 11 4.3-2 7.5-6 7.5-11V5z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    warning: <><path d="M12 3 2.5 20h19z" /><path d="M12 9v5M12 17h.01" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    speaker: <><path d="M5 10v4h4l5 4V6l-5 4z" /><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></>,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.5-4.5M8.2 13.2l7.5 4.5" /></>,
    phone: <path d="M6.5 3 10 7 8 9.5a15 15 0 0 0 6.5 6.5l2.5-2 4 3.5-2 3c-.8 1-2 1.4-3.2 1C9 19.8 4.2 15 2.5 8.7c-.3-1.2 0-2.4 1-3.2z" />,
    camera: <><path d="M3 7h4l2-3h6l2 3h4v13H3z" /><circle cx="12" cy="13" r="4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    edit: <><path d="m4 16-1 5 5-1L19 9l-4-4zM13 7l4 4" /></>,
    wifi: <><path d="M4 10a12 12 0 0 1 16 0M7 14a8 8 0 0 1 10 0M10 18a3 3 0 0 1 4 0M12 21h.01" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 15v6h16v-6" /></>,
    spark: <><path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18M8 14h2M14 14h2M8 17h2" /></>,
  };
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "amber";
  icon?: IconName;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`button button-${variant}`}>{icon && <Icon name={icon} />}{children}</button>;
}

function Header({ title, en, toggle }: { title: string; en: boolean; toggle: () => void }) {
  return <header className="topbar">
    <div className="mini-brand"><span className="brand-mark"><Icon name="shield" size={22} /></span><span>{title}</span></div>
    <button className="language-toggle" onClick={toggle} aria-label="Change language"><span className={!en ? "active" : ""}>বাং</span><span className={en ? "active" : ""}>EN</span></button>
  </header>;
}

function BottomNav({ screen, go, en }: { screen: Screen; go: (s: Screen) => void; en: boolean }) {
  const items: [Screen, IconName, string, string][] = [
    ["home", "home", "হোম", "Home"],
    ["voice", "search", "যাচাই", "Check"],
    ["report", "report", "রিপোর্ট", "Report"],
    ["help", "help", "সাহায্য", "Help"],
  ];
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(([target, icon, bn, eng]) =>
    <button key={target} onClick={() => go(target)} className={(screen === target || (target === "voice" && ["confirm", "verified", "notFound", "warning", "offer"].includes(screen))) ? "active" : ""}>
      <Icon name={icon} size={22} /><span>{en ? eng : bn}</span>
    </button>
  )}</nav>;
}

function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`page ${className}`}>{children}</main>;
}

function StatusIcon({ type, small = false }: { type: "good" | "careful" | "danger"; small?: boolean }) {
  return <span className={`status-icon status-${type} ${small ? "small" : ""}`}><Icon name={type === "good" ? "check" : type === "careful" ? "warning" : "close"} size={small ? 20 : 42} stroke={small ? 2.5 : 3} /></span>;
}

function Badge({ type, children }: { type: "good" | "careful" | "danger"; children: ReactNode }) {
  return <span className={`badge badge-${type}`}><StatusIcon type={type} small />{children}</span>;
}

function InputField({ label, value, onChange, en, placeholder, multiline = false }: { label: string; value: string; onChange: (v: string) => void; en: boolean; placeholder?: string; multiline?: boolean }) {
  return <label className="field">
    <span>{label}</span>
    <span className="input-wrap">
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />}
      {!multiline && <button type="button" aria-label={en ? "Read aloud" : "শুনুন"} className="field-speaker"><Icon name="speaker" size={21} /></button>}
    </span>
  </label>;
}

function ResultActions({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  return <div className="result-actions">
    <div className="action-pair">
      <Button variant="secondary" icon="speaker">{en ? "Listen" : "ফলাফল শুনুন"}</Button>
      <Button variant="secondary" icon="share">{en ? "Share" : "শেয়ার করুন"}</Button>
    </div>
    <Button onClick={() => go("voice")} icon="search">{en ? "Check another" : "আরেকটি যাচাই করুন"}</Button>
  </div>;
}

function ResultFooter({ en }: { en: boolean }) {
  return <p className="tiny-note"><Icon name="shield" size={15} />{en ? "Provash Shield helps you decide. Always confirm before paying." : "প্রবাস শিল্ড আপনাকে সিদ্ধান্ত নিতে সাহায্য করে। টাকা দেওয়ার আগে নিশ্চিত হোন।"}</p>;
}

function Home({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  const action = (icon: IconName, title: string, sub: string, target: Screen, tone = "") =>
    <button className={`home-action ${tone}`} onClick={() => go(target)}>
      <span className="home-action-icon"><Icon name={icon} size={30} /></span>
      <span><strong>{title}</strong><small>{sub}</small></span><Icon name="chevron" />
    </button>;
  return <Page className="home-page">
    <section className="hero">
      <div className="logo-lockup"><span className="logo"><Icon name="shield" size={37} stroke={2.4} /></span><div><h1>{en ? "Provash Shield" : "প্রবাস শিল্ড"}</h1><p>{en ? "Safe steps abroad" : "নিরাপদ প্রবাসের সঙ্গী"}</p></div></div>
      <div className="promise">
        <span className="promise-dot"><Icon name="check" size={18} /></span>
        <h2>{en ? "Check before you pay" : "টাকা দেওয়ার আগে যাচাই করুন"}</h2>
        <p>{en ? "Check an agency or job offer in simple steps." : "সহজে এজেন্সি বা চাকরির অফার পরীক্ষা করুন।"}</p>
      </div>
    </section>
    <section className="home-actions">
      {action("building", en ? "Check an agency" : "এজেন্সি যাচাই করুন", en ? "Name or licence number" : "নাম বা লাইসেন্স নম্বর", "voice")}
      {action("document", en ? "Check a visa" : "ভিসা যাচাই করুন", en ? "Sticker and agent warning signs" : "স্টিকার ও এজেন্টের ঝুঁকি দেখুন", "visa")}
      {action("document", en ? "Check a job offer" : "অফার পরীক্ষা করুন", en ? "Find warning signs" : "ঝুঁকির লক্ষণ দেখুন", "offer", "amber-action")}
      {action("report", en ? "Report a scam" : "প্রতারণার খবর দিন", en ? "Your name can stay private" : "আপনার নাম গোপন থাকবে", "report")}
    </section>
    <button className="voice-card" onClick={() => go("voice")}><span className="mic-circle"><Icon name="mic" size={30} /></span><span><strong>{en ? "Speak, we're listening" : "বলুন, আমরা শুনছি"}</strong><small>{en ? "Tap to start" : "শুরু করতে চাপ দিন"}</small></span><Icon name="arrow" /></button>
    <button className="text-link" onClick={() => go("how")}>{en ? "How it works" : "কিভাবে কাজ করে"} <Icon name="arrow" size={18} /></button>
  </Page>;
}

function Voice({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  const [state, setState] = useState<VoiceState>("idle");
  useEffect(() => {
    if (state === "processing") {
      const timer = window.setTimeout(() => go("confirm"), 1000);
      return () => window.clearTimeout(timer);
    }
  }, [state, go]);
  const content: Record<VoiceState, { title: string; sub: string }> = {
    idle: { title: en ? "Ready when you are" : "আপনি বললেই শুরু", sub: en ? "Tap the microphone and speak clearly." : "মাইক্রোফোনে চাপ দিয়ে পরিষ্কার করে বলুন।" },
    listening: { title: en ? "I'm listening…" : "আমি শুনছি…", sub: en ? "Say the agency name and licence number" : "এজেন্সির নাম ও লাইসেন্স নম্বর বলুন" },
    processing: { title: en ? "Checking what you said…" : "আপনার কথা বোঝার চেষ্টা করছি…", sub: en ? "This will only take a moment." : "একটু সময় লাগবে।" },
    missed: { title: en ? "I didn't catch that" : "কথাটি বোঝা যায়নি", sub: en ? "Please try again and speak slowly." : "আবার ধীরে ও পরিষ্কার করে বলুন।" },
    blocked: { title: en ? "Microphone is off" : "মাইক্রোফোন বন্ধ আছে", sub: en ? "Allow microphone access in your browser, or type instead." : "ব্রাউজারে মাইক্রোফোন চালু করুন, অথবা লিখে দিন।" },
  };
  return <Page className="voice-page">
    <div className="voice-copy">
      <span className={`listening-label ${state}`}><i />{state === "listening" ? (en ? "Listening now" : "এখন শুনছি") : state === "processing" ? (en ? "Please wait" : "অপেক্ষা করুন") : (en ? "Voice check" : "কণ্ঠে যাচাই")}</span>
      <h2>{content[state].title}</h2><p>{content[state].sub}</p>
    </div>
    <div className={`voice-orb ${state}`}><span className="pulse p1" /><span className="pulse p2" /><button onClick={() => setState(state === "listening" ? "processing" : "listening")} aria-label={en ? "Microphone" : "মাইক্রোফোন"}><Icon name={state === "missed" ? "close" : state === "blocked" ? "lock" : "mic"} size={58} stroke={1.8} /></button></div>
    {state === "listening" && <div className="waveform" aria-label="Audio waveform">{[20, 36, 54, 30, 65, 42, 72, 48, 30, 56, 25, 43].map((h, i) => <i key={i} style={{ height: h }} />)}</div>}
    {state === "listening" && <div className="transcript"><small>{en ? "I heard" : "শুনেছি"}</small><p>{en ? "“Shapla Overseas, licence RL1234…”" : "“শাপলা ওভারসিজ, লাইসেন্স আর এল এক দুই তিন চার…”"}</p></div>}
    {state === "processing" && <div className="loading-card" aria-live="polite"><span /><span /><span /></div>}
    <div className="voice-controls">
      {state === "idle" && <Button icon="mic" onClick={() => setState("listening")}>{en ? "Start speaking" : "কথা বলা শুরু করুন"}</Button>}
      {state === "listening" && <Button icon="close" variant="danger" onClick={() => setState("processing")}>{en ? "Stop" : "থামুন"}</Button>}
      {state === "missed" && <Button icon="mic" onClick={() => setState("listening")}>{en ? "Try again" : "আবার চেষ্টা করুন"}</Button>}
      {state === "blocked" && <Button icon="mic" onClick={() => setState("listening")}>{en ? "Allow microphone" : "মাইক্রোফোন চালু করুন"}</Button>}
      {state !== "processing" && <Button variant="secondary" icon="edit" onClick={() => go("confirm")}>{en ? "Type instead" : "লিখে দিন"}</Button>}
    </div>
    <details className="state-picker"><summary>{en ? "See voice states" : "অন্য অবস্থা দেখুন"}</summary><div>{(["idle", "listening", "processing", "missed", "blocked"] as VoiceState[]).map((s) => <button key={s} onClick={() => setState(s)}>{s}</button>)}</div></details>
  </Page>;
}

type Check = { result: Result; name: string; licence: string } | null;

function Confirm({ en, go, onChecked }: { en: boolean; go: (s: Screen) => void; onChecked: (c: Check) => void }) {
  const [agency, setAgency] = useState("");
  const [licence, setLicence] = useState("");
  const [country, setCountry] = useState("");
  const [job, setJob] = useState("");
  const [fee, setFee] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const check = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await verifyAgency(agency, licence);
      onChecked({ result, name: agency, licence: licence.trim().toUpperCase() });
      go(result.status === "verified" ? "verified" : result.status === "not_found" ? "notFound" : "warning");
    } catch {
      setError(en ? "Could not reach the server. Please try again." : "সার্ভারে যোগাযোগ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };
  return <Page>
    <div className="page-intro"><span className="step-pill">{en ? "Step 2 of 3" : "৩টির মধ্যে ধাপ ২"}</span><h2>{en ? "Did we get it right?" : "তথ্যগুলো ঠিক আছে?"}</h2><p>{en ? "Check the details before we search." : "খোঁজার আগে তথ্যগুলো একবার দেখে নিন।"}</p></div>
    <div className="fields-card">
      <InputField en={en} label={en ? "Agency name" : "এজেন্সির নাম"} value={agency} onChange={setAgency} placeholder={en ? "Agency name" : "এজেন্সির নাম"} />
      <InputField en={en} label={en ? "Licence number" : "লাইসেন্স নম্বর"} value={licence} onChange={setLicence} placeholder="RL1234" />
      <InputField en={en} label={en ? "Destination country" : "কোন দেশে যাবেন"} value={country} onChange={setCountry} />
      <InputField en={en} label={en ? "Job type" : "কাজের ধরন"} value={job} onChange={setJob} />
      <InputField en={en} label={en ? "Fee asked" : "কত টাকা চেয়েছে"} value={fee} onChange={setFee} />
    </div>
    <p className="demo-hint"><Icon name="help" size={18} />{en ? "Test numbers: RL9001 (active), RL9002 (cancelled), RL9003 (expired)." : "পরীক্ষার নম্বর: RL9001 (চালু), RL9002 (বাতিল), RL9003 (মেয়াদ শেষ)।"}</p>
    {error && <p role="alert" className="demo-hint">{error}</p>}
    <Button onClick={check} icon="search" disabled={busy || !licence.trim()}>{busy ? (en ? "Checking…" : "যাচাই হচ্ছে…") : (en ? "Looks right, check now" : "ঠিক আছে, যাচাই করুন")}</Button>
  </Page>;
}

function ResultShell({ en, go, type, title, subtitle, children }: { en: boolean; go: (s: Screen) => void; type: "good" | "careful" | "danger"; title: string; subtitle: string; children: ReactNode }) {
  return <Page className="result-page">
    <section className={`result-hero result-${type}`}><StatusIcon type={type} /><span className="eyebrow">{type === "good" ? (en ? "VERIFIED" : "যাচাই হয়েছে") : type === "careful" ? (en ? "BE CAREFUL" : "সাবধান") : (en ? "WARNING" : "সতর্কতা")}</span><h2>{title}</h2><p>{subtitle}</p></section>
    {children}<ResultActions en={en} go={go} /><ResultFooter en={en} />
  </Page>;
}

function Verified({ en, go, check }: { en: boolean; go: (s: Screen) => void; check: Check }) {
  const a = check?.result.agency;
  const source = check?.result.source ?? null;
  return <ResultShell en={en} go={go} type="good" title={en ? "Listed as active" : "তালিকায় সক্রিয় হিসেবে পাওয়া গেছে"} subtitle={en ? "The name and licence number match." : "নাম ও লাইসেন্স নম্বর মিলেছে।"}>
    <section className="result-card">
      <div className="agency-heading"><span className="square-icon"><Icon name="building" /></span><div><small>{en ? "Agency" : "এজেন্সি"}</small><h3>{a?.name ?? (en ? "Shapla Overseas Ltd." : "শাপলা ওভারসিজ লিমিটেড")}</h3></div></div>
      <dl><div><dt>{en ? "Licence number" : "লাইসেন্স নম্বর"}</dt><dd>{a?.license_no ?? "RL1234"}</dd></div><div><dt>{en ? "Status" : "অবস্থা"}</dt><dd><Badge type="good">{en ? "Active" : "চালু"}</Badge></dd></div></dl>
      <p className="source"><Icon name="clock" size={17} />{source ? (en ? `Source: ${source}` : `সূত্র: ${source}`) : (en ? "Source: BMET data, dated 15 May 2025" : "সূত্র: BMET তথ্য, ১৫ মে ২০২৫")}</p>
    </section>
    <div className="notice"><Icon name="help" /><p><strong>{en ? "Remember" : "মনে রাখুন"}</strong>{en ? "This is not a guarantee. Confirm with BMET before paying." : "এটি নিশ্চয়তা নয়। টাকা দেওয়ার আগে BMET-এর সাথে নিশ্চিত হোন।"}</p></div>
  </ResultShell>;
}

function NotFound({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  return <ResultShell en={en} go={go} type="careful" title={en ? "Not found in the list" : "তালিকায় পাওয়া যায়নি"} subtitle={en ? "Do not pay until you know why." : "কারণ না জানা পর্যন্ত টাকা দেবেন না।"}>
    <section className="result-card explanation-card"><h3>{en ? "Why might this happen?" : "এমন কেন হতে পারে?"}</h3>
      <p><span>১</span>{en ? "The agency name may be spelled differently." : "এজেন্সির নামের বানান আলাদা হতে পারে।"}</p>
      <p><span>২</span>{en ? "The licence number may be wrong." : "লাইসেন্স নম্বর ভুল হতে পারে।"}</p>
      <p><span>৩</span>{en ? "They may not have a valid licence." : "তাদের বৈধ লাইসেন্স নাও থাকতে পারে।"}</p>
    </section>
    <div className="action-pair"><Button variant="amber" icon="edit" onClick={() => go("confirm")}>{en ? "Try again" : "আবার চেষ্টা করুন"}</Button><Button variant="secondary" icon="phone" onClick={() => go("help")}>{en ? "Call helpline" : "হেল্পলাইনে কল"}</Button></div>
  </ResultShell>;
}

function Warning({ en, go, check }: { en: boolean; go: (s: Screen) => void; check: Check }) {
  const r = check?.result;
  const flag = r?.flags[0];
  const mismatch = !r || r.status === "mismatch";
  const title = flag ? (en ? flag.title_en : flag.title_bn) : (en ? "Name and licence don't match" : "নাম ও লাইসেন্স নম্বর মিলছে না");
  const subtitle = flag ? (en ? flag.reason_en : flag.reason_bn) : (en ? "The official record shows a different agency." : "সরকারি তথ্যে অন্য এজেন্সির নাম আছে।");
  const enteredName = check?.name || (en ? "Shapla Overseas" : "শাপলা ওভারসিজ");
  const enteredLic = check?.licence || "RL0000";
  const recName = r?.agency?.name ?? (en ? "Padma Travels" : "পদ্মা ট্রাভেলস");
  const recLic = r?.agency?.license_no ?? "RL0000";
  return <ResultShell en={en} go={go} type="danger" title={title} subtitle={subtitle}>
    {mismatch ? <section className="comparison">
      <div><span>{en ? "YOU ENTERED" : "আপনি দিয়েছেন"}</span><h3>{enteredName}</h3><p>{enteredLic}</p></div>
      <div><span>{en ? "RECORD SHOWS" : "তালিকায় আছে"}</span><h3>{recName}</h3><p>{recLic}</p></div>
    </section> : <section className="result-card">
      <div className="agency-heading"><span className="square-icon"><Icon name="building" /></span><div><small>{en ? "Agency" : "এজেন্সি"}</small><h3>{recName}</h3></div></div>
      <dl><div><dt>{en ? "Licence number" : "লাইসেন্স নম্বর"}</dt><dd>{recLic}</dd></div><div><dt>{en ? "Status" : "অবস্থা"}</dt><dd><Badge type="danger">{r?.agency?.status ?? "-"}</Badge></dd></div></dl>
      {r?.source && <p className="source"><Icon name="clock" size={17} />{en ? `Source: ${r.source}` : `সূত্র: ${r.source}`}</p>}
    </section>}
    <div className="danger-advice"><Icon name="warning" size={30} /><div><h3>{en ? "Do not pay yet" : "এখন টাকা দেবেন না"}</h3><p>{en ? "Call a verified helpline first." : "আগে যাচাই করা হেল্পলাইনে কথা বলুন।"}</p></div></div>
    <div className="action-pair"><Button variant="danger" icon="report" onClick={() => go("report")}>{en ? "Report agency" : "এজেন্সির রিপোর্ট দিন"}</Button><Button variant="secondary" icon="phone" onClick={() => go("help")}>{en ? "Get help" : "সাহায্য নিন"}</Button></div>
  </ResultShell>;
}

function Offer({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  const reasons = [
    ["warning" as IconName, en ? "Fee looks higher than allowed" : "খরচ বেশি মনে হচ্ছে", en ? "The amount asked is above the public fee guidance for this route." : "এই দেশে যাওয়ার সরকারি খরচের চেয়ে বেশি টাকা চাওয়া হয়েছে।", en ? "Fee rule" : "খরচের নিয়ম"],
    ["document" as IconName, en ? "Salary is not written clearly" : "বেতন পরিষ্কারভাবে লেখা নেই", en ? "A safe offer should clearly state your monthly pay." : "নিরাপদ অফারে মাসিক বেতন পরিষ্কার লেখা থাকা উচিত।", en ? "Contract rule" : "চুক্তির নিয়ম"],
    ["building" as IconName, en ? "Employer details are missing" : "নিয়োগদাতার তথ্য নেই", en ? "The employer name and address should be on the offer." : "অফারে নিয়োগদাতার নাম ও ঠিকানা থাকা উচিত।", en ? "Offer rule" : "অফারের নিয়ম"],
  ];
  return <ResultShell en={en} go={go} type="danger" title={en ? "This offer has warning signs" : "এই অফারে ঝুঁকির লক্ষণ আছে"} subtitle={en ? "We found 3 things to check before you pay." : "টাকা দেওয়ার আগে ৩টি বিষয় যাচাই করুন।"}>
    <div className="reason-list"><h3>{en ? "Why we flagged it" : "কেন সতর্ক করা হয়েছে"}</h3>{reasons.map(([icon, title, desc, rule]) => <article className="reason-card" key={title}><span><Icon name={icon as IconName} /></span><div><h4>{title}</h4><p>{desc}</p><small>{rule}</small></div></article>)}</div>
    <div className="danger-advice"><Icon name="warning" size={30} /><div><h3>{en ? "Pause before paying" : "এখনই টাকা দেবেন না"}</h3><p>{en ? "Ask for a corrected written offer." : "সঠিক তথ্যসহ লিখিত অফার চান।"}</p></div></div>
  </ResultShell>;
}

function StepIndicator({ step, en }: { step: number; en: boolean }) {
  return <div className="steps">{[1, 2, 3].map((n) => <div key={n} className={n <= step ? "active" : ""}><span>{n < step ? <Icon name="check" size={16} /> : n}</span><small>{en ? ["Who", "What", "Proof"][n - 1] : ["কার কথা", "কি হয়েছে", "প্রমাণ"][n - 1]}</small></div>)}</div>;
}

function Report({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  const [step, setStep] = useState(1);
  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [story, setStory] = useState("");
  return <Page className="report-page">
    <div className="page-intro"><span className="step-pill">{en ? "Private report" : "গোপন রিপোর্ট"}</span><h2>{en ? "Tell us what happened" : "কি হয়েছে আমাদের জানান"}</h2><p>{en ? "This takes about 2 minutes." : "সময় লাগবে প্রায় ২ মিনিট।"}</p></div>
    <StepIndicator step={step} en={en} />
    <section className="form-card">
      {step === 1 && <><h3>{en ? "Who contacted you?" : "কে আপনার সাথে যোগাযোগ করেছে?"}</h3><InputField en={en} label={en ? "Agency or person's name" : "এজেন্সি বা ব্যক্তির নাম"} value={name} onChange={setName} placeholder={en ? "Write a name" : "নাম লিখুন"} /><InputField en={en} label={en ? "Phone number" : "ফোন নম্বর"} value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" /></>}
      {step === 2 && <><h3>{en ? "What happened?" : "কি হয়েছিল?"}</h3><InputField en={en} label={en ? "Tell us in your own words" : "সহজ ভাষায় লিখুন"} value={story} onChange={setStory} multiline placeholder={en ? "For example: They asked for money…" : "যেমন: তারা আমার কাছে টাকা চেয়েছে…"} /><button className="voice-note"><Icon name="mic" /><span><strong>{en ? "Add a voice note" : "কণ্ঠে বলে জানান"}</strong><small>{en ? "Tap to record" : "রেকর্ড করতে চাপ দিন"}</small></span></button></>}
      {step === 3 && <><h3>{en ? "Add proof (optional)" : "প্রমাণ যোগ করুন (ইচ্ছা হলে)"}</h3><button className="upload-box"><span><Icon name="camera" size={32} /></span><strong>{en ? "Photo of receipt or offer letter" : "রসিদ বা অফার লেটারের ছবি"}</strong><small>{en ? "Take a photo or choose a file" : "ছবি তুলুন বা ফাইল বেছে নিন"}</small></button><div className="privacy-row"><Icon name="lock" /><div><strong>{en ? "Your name stays private" : "আপনার নাম গোপন থাকবে"}</strong><small>{en ? "Report without sharing your identity" : "পরিচয় না জানিয়ে রিপোর্ট করুন"}</small></div><button aria-label="Anonymous reporting" onClick={() => setAnonymous(!anonymous)} className={`switch ${anonymous ? "on" : ""}`}><i /></button></div></>}
    </section>
    <div className="form-actions">{step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>{en ? "Back" : "পেছনে"}</Button>}<Button icon={step === 3 ? "shield" : "arrow"} onClick={() => step === 3 ? go("reportDone") : setStep(step + 1)}>{step === 3 ? (en ? "Send report" : "রিপোর্ট জমা দিন") : (en ? "Continue" : "পরের ধাপ")}</Button></div>
  </Page>;
}

function ReportDone({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  return <Page className="center-page"><StatusIcon type="good" /><span className="eyebrow">{en ? "REPORT RECEIVED" : "রিপোর্ট পেয়েছি"}</span><h2>{en ? "Thank you" : "ধন্যবাদ"}</h2><p>{en ? "Reports are reviewed before they appear. Your reference is PS-2048." : "রিপোর্ট প্রকাশের আগে যাচাই করা হয়। আপনার নম্বর PS-2048।"}</p><div className="notice"><Icon name="lock" /><p><strong>{en ? "Your identity is safe" : "আপনার পরিচয় নিরাপদ"}</strong>{en ? "We will not share your name." : "আমরা আপনার নাম প্রকাশ করব না।"}</p></div><Button onClick={() => go("home")} icon="home">{en ? "Back to home" : "হোমে ফিরুন"}</Button></Page>;
}

function Help({ en }: { en: boolean }) {
  const contacts = [
    [en ? "BMET complaint desk" : "BMET অভিযোগ কেন্দ্র", en ? "Government migrant support" : "সরকারি প্রবাসী সহায়তা"],
    [en ? "Migrant support NGO" : "অভিবাসী সহায়তা NGO", en ? "Independent advice" : "স্বাধীন পরামর্শ"],
    [en ? "Emergency legal help" : "জরুরি আইনি সহায়তা", en ? "For threats or withheld papers" : "হুমকি বা কাগজ আটকে রাখলে"],
  ];
  return <Page><div className="page-intro"><span className="step-pill">{en ? "You are not alone" : "আপনি একা নন"}</span><h2>{en ? "Help and contacts" : "সাহায্য ও যোগাযোগ"}</h2><p>{en ? "Tap a card to call for help." : "সাহায্যের জন্য কার্ডে চাপ দিন।"}</p></div><div className="contact-list">{contacts.map(([name, desc]) => <button className="contact-card" key={name}><span><Icon name="phone" /></span><div><h3>{name}</h3><p>{desc}</p><small>{en ? "To be filled with verified contacts" : "যাচাই করা নম্বর যোগ করা হবে"}</small></div><Icon name="chevron" /></button>)}</div><div className="notice"><Icon name="warning" /><p><strong>{en ? "Contact list is a prototype" : "এটি একটি নমুনা তালিকা"}</strong>{en ? "Numbers will be added only after verification." : "যাচাইয়ের পরই নম্বর যোগ করা হবে।"}</p></div></Page>;
}

function History({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  const rows: [string, string, "good" | "careful" | "danger", string, Screen][] = [
    [en ? "15 May 2025" : "১৫ মে ২০২৫", en ? "Shapla Overseas Ltd." : "শাপলা ওভারসিজ লিমিটেড", "good", en ? "Verified" : "যাচাই হয়েছে", "verified"],
    [en ? "12 May 2025" : "১২ মে ২০২৫", en ? "Padma Recruiting" : "পদ্মা রিক্রুটিং", "danger", en ? "Mismatch" : "তথ্য মেলেনি", "warning"],
    [en ? "2 May 2025" : "২ মে ২০২৫", en ? "Rahman Travels" : "রহমান ট্রাভেলস", "careful", en ? "Not found" : "পাওয়া যায়নি", "notFound"],
  ];
  return <Page><div className="page-intro"><span className="step-pill">{en ? "Your device only" : "শুধু আপনার ফোনে"}</span><h2>{en ? "Past checks" : "আগের যাচাই"}</h2><p>{en ? "Open a check to see its details." : "বিস্তারিত দেখতে কার্ডে চাপ দিন।"}</p></div><div className="history-list">{rows.map(([date, name, type, badge, target]) => <button key={name} onClick={() => go(target)} className="history-card"><StatusIcon type={type} small /><div><small>{date}</small><h3>{name}</h3><Badge type={type}>{badge}</Badge></div><Icon name="chevron" /></button>)}</div></Page>;
}

function How({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  const steps: [IconName, string, string][] = [
    ["mic", en ? "Speak or type" : "বলুন বা লিখুন", en ? "Give us the agency name and licence number." : "এজেন্সির নাম ও লাইসেন্স নম্বর দিন।"],
    ["search", en ? "We check records" : "আমরা তালিকা দেখি", en ? "We compare it with official public records." : "সরকারি উন্মুক্ত তথ্যের সাথে মিলিয়ে দেখি।"],
    ["shield", en ? "Get a clear answer" : "সহজ উত্তর পান", en ? "See the result and the reasons in plain words." : "ফলাফল ও কারণ সহজ ভাষায় দেখুন।"],
  ];
  return <Page><div className="page-intro"><span className="step-pill">{en ? "Simple and clear" : "সহজ ও পরিষ্কার"}</span><h2>{en ? "How it works" : "কিভাবে কাজ করে"}</h2><p>{en ? "Three steps before you pay." : "টাকা দেওয়ার আগে মাত্র তিন ধাপ।"}</p></div><div className="how-steps">{steps.map(([icon, title, desc], i) => <article key={title}><span className="number">{i + 1}</span><span className="how-icon"><Icon name={icon} size={31} /></span><div><h3>{title}</h3><p>{desc}</p></div></article>)}</div><div className="notice"><Icon name="help" /><p><strong>{en ? "An honest note" : "সত্য কথা"}</strong>{en ? "We use official public records. Results are help, not a guarantee." : "আমরা সরকারি উন্মুক্ত তথ্য ব্যবহার করি। ফলাফল সাহায্য করে, নিশ্চয়তা দেয় না।"}</p></div><Button onClick={() => go("voice")} icon="mic">{en ? "Start a check" : "যাচাই শুরু করুন"}</Button></Page>;
}

type VisaStage = "intro" | "sticker" | "confirm" | "physical" | "behavior" | "result";
type Answer = "yes" | "no" | "unsure" | null;

function PrivacyNote({ en }: { en: boolean }) {
  return <div className="privacy-note"><Icon name="lock" size={19} /><span>{en ? "Your passport details are not saved." : "আপনার পাসপোর্টের তথ্য সংরক্ষণ করা হয় না।"}</span></div>;
}

function ChoiceButtons({ value, onChange, en }: { value: Answer; onChange: (answer: Answer) => void; en: boolean }) {
  return <div className="choice-buttons">
    <button className={value === "yes" ? "selected yes" : ""} onClick={() => onChange("yes")}><Icon name="check" size={18} />{en ? "Yes" : "হ্যাঁ"}</button>
    <button className={value === "no" ? "selected no" : ""} onClick={() => onChange("no")}><Icon name="close" size={18} />{en ? "No" : "না"}</button>
    <button className={value === "unsure" ? "selected unsure" : ""} onClick={() => onChange("unsure")}><Icon name="help" size={18} />{en ? "Not sure" : "জানি না"}</button>
  </div>;
}

function VisaCheck({ en, go }: { en: boolean; go: (s: Screen) => void }) {
  const [stage, setStage] = useState<VisaStage>("intro");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [matches, setMatches] = useState([true, true, true, true]);
  const [physical, setPhysical] = useState<Answer[]>([null, null, null, null]);
  const [behavior, setBehavior] = useState<Answer[]>([null, null, null, null, null]);
  const [question, setQuestion] = useState(0);
  const [resultSource, setResultSource] = useState<"sticker" | "behavior">("sticker");
  const [mrz, setMrz] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [visaError, setVisaError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const physicalChecks = [
    [en ? "Hologram changes when tilted" : "কাত করলে হলোগ্রাম বদলায়", en ? "Slowly tilt the sticker under a light." : "আলোর নিচে স্টিকারটি ধীরে কাত করুন।", "spark"],
    [en ? "Letters and ink look sharp" : "লেখা ও কালি পরিষ্কার", en ? "Look for fuzzy edges or uneven printing." : "লেখার ধার ঝাপসা বা কালি অসমান কি না দেখুন।", "ink"],
    [en ? "Fine background pattern is visible" : "পেছনের সূক্ষ্ম নকশা দেখা যায়", en ? "The pattern should be clear, not like a flat copy." : "নকশা পরিষ্কার হওয়া উচিত, ফটোকপির মতো নয়।", "pattern"],
    [en ? "The dates make sense together" : "তারিখগুলো একে অন্যের সাথে মেলে", en ? "Issue, entry and expiry dates should be in a sensible order." : "ইস্যু, প্রবেশ ও মেয়াদ শেষের তারিখ ঠিক ক্রমে থাকা উচিত।", "calendar"],
  ];
  const behaviorQuestions = [
    [en ? "Did the agent say biometrics are not needed?" : "এজেন্ট কি বলেছে বায়োমেট্রিক লাগবে না?", en ? "Most visa processes require you to attend biometrics." : "বেশিরভাগ ভিসার জন্য নিজে গিয়ে বায়োমেট্রিক দিতে হয়।"],
    [en ? "Did they refuse to give an appointment receipt?" : "তারা কি অ্যাপয়েন্টমেন্টের রসিদ দেয়নি?", en ? "You should normally receive written appointment proof." : "সাধারণত অ্যাপয়েন্টমেন্টের লিখিত প্রমাণ পাওয়ার কথা।"],
    [en ? "Did they refuse access to the tracking login?" : "তারা কি ট্র্যাকিং লগইন দিতে অস্বীকার করেছে?", en ? "You should be able to follow your own application." : "নিজের আবেদন আপনি নিজেই দেখতে পারা উচিত।"],
    [en ? "Did they ask for cash or payment to an unknown account?" : "তারা কি নগদ বা অচেনা হিসাবে টাকা চেয়েছে?", en ? "Untraceable payments are hard to recover." : "যে টাকা খুঁজে বের করা যায় না, তা ফেরত পাওয়া কঠিন।"],
    [en ? "Did they claim to have an “inside man”?" : "তারা কি ‘ভেতরের লোক’ থাকার কথা বলেছে?", en ? "Embassy decisions cannot be guaranteed by an agent." : "কোনো এজেন্ট দূতাবাসের সিদ্ধান্ত নিশ্চিত করতে পারে না।"],
  ];

  const netError = en ? "Could not reach the server. Please try again." : "সার্ভারে যোগাযোগ করা যায়নি। আবার চেষ্টা করুন।";
  const readLines = async () => {
    setBusy(true);
    setVisaError("");
    try {
      setMrz(await checkMrz(line1, line2));
      setStage("confirm");
    } catch {
      setVisaError(netError);
    } finally {
      setBusy(false);
    }
  };
  const scanPhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setVisaError("");
    try {
      const r = await analyzeVisaImage(file);
      if (r.extracted) {
        setLine1(r.extracted.line1);
        setLine2(r.extracted.line2);
      } else {
        setVisaError(en ? "We could not read the code lines. Retake the photo or type them." : "কোড লাইন পড়া যায়নি। আবার ছবি তুলুন বা নিজে লিখুন।");
      }
    } catch {
      setVisaError(netError);
    } finally {
      setBusy(false);
    }
  };
  const updatePhysical = (index: number, answer: Answer) => setPhysical(physical.map((item, i) => i === index ? answer : item));
  const chooseBehavior = (answer: Answer) => {
    const next = behavior.map((item, i) => i === question ? answer : item);
    setBehavior(next);
    if (question < behaviorQuestions.length - 1) setQuestion(question + 1);
    else { setResultSource("behavior"); setStage("result"); }
  };
  const physicalFlags = physical.filter((answer) => answer === "no").length;
  const physicalUnsure = physical.filter((answer) => answer === "unsure").length;
  const behaviorFlags = behavior.filter((answer) => answer === "yes").length;
  const mismatchFlags = matches.filter((match) => !match).length;
  const serverFlags = resultSource === "sticker" && mrz ? mrz.flags : [];
  const serverWarn = serverFlags.filter((f) => f.severity === "warning").length;
  const serverCaution = serverFlags.length - serverWarn;
  const flagCount = resultSource === "behavior" ? behaviorFlags : physicalFlags + mismatchFlags + serverWarn;
  const unsureCount = resultSource === "behavior" ? 0 : physicalUnsure + serverCaution;
  const resultType: "good" | "careful" | "danger" = serverWarn > 0 || flagCount >= 2 ? "danger" : flagCount === 1 || unsureCount > 0 ? "careful" : "good";
  const resultTitle = resultType === "danger"
    ? (en ? "Warning signs found" : "ঝুঁকির লক্ষণ পাওয়া গেছে")
    : resultType === "careful"
      ? (en ? "Be careful" : "সাবধান থাকুন")
      : (en ? "No problems found" : "কোনো সমস্যা পাওয়া যায়নি");

  if (stage === "intro") return <Page className="visa-page">
    <section className="visa-intro">
      <span className="visa-shield"><Icon name="document" size={38} /></span>
      <span className="eyebrow">{en ? "VISA CHECK" : "ভিসা যাচাই"}</span>
      <h2>{en ? "Look for warning signs" : "ঝুঁকির লক্ষণ খুঁজুন"}</h2>
      <p>{en ? "We can help you inspect a visa sticker and the agent's behavior." : "ভিসার স্টিকার ও এজেন্টের আচরণে ঝুঁকির লক্ষণ আছে কি না দেখুন।"}</p>
    </section>
    <div className="honest-warning"><Icon name="warning" size={27} /><p><strong>{en ? "This cannot prove a visa is genuine" : "এতে ভিসা আসল প্রমাণ হয় না"}</strong>{en ? "Only the embassy or official visa center can confirm it." : "শুধু দূতাবাস বা সরকারি ভিসা কেন্দ্র নিশ্চিত করতে পারে।"}</p></div>
    <div className="visa-routes">
      <button onClick={() => setStage("sticker")}><span><Icon name="search" size={30} /></span><div><strong>{en ? "Check the sticker" : "স্টিকার যাচাই করুন"}</strong><small>{en ? "Read the code and inspect the print" : "কোড পড়ুন ও ছাপা দেখুন"}</small></div><Icon name="chevron" /></button>
      <button onClick={() => { setQuestion(0); setStage("behavior"); }}><span><Icon name="user" size={30} /></span><div><strong>{en ? "Check the agent's behavior" : "এজেন্টের আচরণ যাচাই করুন"}</strong><small>{en ? "Answer 5 simple questions" : "৫টি সহজ প্রশ্নের উত্তর দিন"}</small></div><Icon name="chevron" /></button>
    </div>
    <PrivacyNote en={en} />
  </Page>;

  if (stage === "sticker") {
    const updateLine = (setter: (value: string) => void) => (value: string) => setter(value.toUpperCase().replace(/[^A-Z0-9<]/g, "").slice(0, 44));
    return <Page className="visa-page">
      <div className="page-intro"><span className="step-pill">{en ? "Sticker · Step 1 of 3" : "স্টিকার · ৩টির মধ্যে ধাপ ১"}</span><h2>{en ? "Enter the two code lines" : "নিচের দুইটি কোড লাইন লিখুন"}</h2><p>{en ? "Find them at the bottom of the visa sticker." : "ভিসা স্টিকারের একদম নিচে লাইন দুইটি পাবেন।"}</p></div>
      <button className="scan-card" onClick={() => fileRef.current?.click()} disabled={busy}><span><Icon name="camera" size={30} /></span><div><strong>{en ? "Scan with camera" : "ক্যামেরা দিয়ে স্ক্যান করুন"}</strong><small>{en ? "Place both lines inside the frame" : "দুইটি লাইন ফ্রেমের মধ্যে রাখুন"}</small></div><Icon name="chevron" /></button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => scanPhoto(e.target.files?.[0])} />
      <div className="or-divider"><span>{en ? "or type below" : "অথবা নিচে লিখুন"}</span></div>
      <section className="mrz-card">
        <label><span>{en ? "Line 1" : "লাইন ১"} <b>{line1.length}/44</b></span><textarea value={line1} onChange={(event) => updateLine(setLine1)(event.target.value)} rows={2} spellCheck={false} /></label>
        <label><span>{en ? "Line 2" : "লাইন ২"} <b>{line2.length}/44</b></span><textarea value={line2} onChange={(event) => updateLine(setLine2)(event.target.value)} rows={2} spellCheck={false} /></label>
        <p><Icon name="help" size={17} />{en ? "Use the < symbol where you see it." : "যেখানে &lt; চিহ্ন আছে, সেটিও লিখুন।"}</p>
      </section>
      <PrivacyNote en={en} />
      {visaError && <p role="alert" className="demo-hint">{visaError}</p>}
      <Button onClick={readLines} icon="arrow" disabled={!line1 || !line2 || busy}>{en ? "Read these lines" : "লাইন দুইটি পড়ুন"}</Button>
    </Page>;
  }

  if (stage === "confirm") {
    const clean = (t: string) => t.replace(/</g, " ").trim().replace(/ +/g, " ");
    const fmt = (t: string) => /^[0-9]{6}$/.test(t) ? `${t.slice(4, 6)}/${t.slice(2, 4)}/${t.slice(0, 2)}` : t;
    const fields = [
      [en ? "Visa number" : "ভিসা নম্বর", line2.slice(0, 9).replace(/</g, "") || "-"],
      [en ? "Name" : "নাম", clean(line1.slice(5)) || "-"],
      [en ? "Date of birth (DD/MM/YY)" : "জন্মতারিখ (দিন/মাস/বছর)", fmt(line2.slice(13, 19))],
      [en ? "Visa expiry (DD/MM/YY)" : "ভিসার মেয়াদ (দিন/মাস/বছর)", fmt(line2.slice(21, 27))],
    ];
    return <Page className="visa-page">
      <div className="page-intro"><span className="step-pill">{en ? "Sticker · Step 2 of 3" : "স্টিকার · ৩টির মধ্যে ধাপ ২"}</span><h2>{en ? "Does this match?" : "তথ্যগুলো কি মিলে?"}</h2><p>{en ? "Compare each item with your passport and sticker." : "পাসপোর্ট ও স্টিকারের সাথে প্রতিটি তথ্য মিলিয়ে দেখুন।"}</p></div>
      <div className="match-list">{fields.map(([label, value], index) => <article key={label}><div><small>{label}</small><strong>{value}</strong></div><button className={matches[index] ? "match-toggle on" : "match-toggle"} onClick={() => setMatches(matches.map((item, i) => i === index ? !item : item))}><span>{matches[index] ? (en ? "Matches" : "মিলেছে") : (en ? "Doesn't match" : "মেলেনি")}</span><i><Icon name={matches[index] ? "check" : "close"} size={17} /></i></button></article>)}</div>
      <PrivacyNote en={en} />
      <div className="stack-actions"><Button onClick={() => setStage("physical")} icon="arrow">{en ? "Next: inspect sticker" : "পরের ধাপ: স্টিকার দেখুন"}</Button><Button onClick={() => setStage("sticker")} variant="ghost">{en ? "Edit code lines" : "কোড লাইন বদলান"}</Button></div>
    </Page>;
  }

  if (stage === "physical") return <Page className="visa-page">
    <div className="page-intro"><span className="step-pill">{en ? "Sticker · Step 3 of 3" : "স্টিকার · ৩টির মধ্যে ধাপ ৩"}</span><h2>{en ? "Look closely at the sticker" : "স্টিকারটি ভালো করে দেখুন"}</h2><p>{en ? "Answer what you can. “Not sure” is okay." : "যা বুঝতে পারেন উত্তর দিন। ‘জানি না’ বলাও ঠিক আছে।"}</p></div>
    <div className="physical-list">{physicalChecks.map(([title, desc, art], index) => <article key={title}>
      <div className={`check-illustration art-${art}`}><Icon name={index === 0 ? "spark" : index === 3 ? "calendar" : "document"} size={34} /><i /><i /></div>
      <div className="physical-copy"><span>{index + 1}/4</span><h3>{title}</h3><p>{desc}</p></div>
      <ChoiceButtons en={en} value={physical[index]} onChange={(answer) => updatePhysical(index, answer)} />
    </article>)}</div>
    <PrivacyNote en={en} />
    <Button disabled={physical.some((answer) => answer === null)} onClick={() => { setResultSource("sticker"); setStage("result"); }} icon="shield">{en ? "See result" : "ফলাফল দেখুন"}</Button>
  </Page>;

  if (stage === "behavior") {
    const [title, desc] = behaviorQuestions[question];
    return <Page className="visa-page behavior-page">
      <div className="quiz-progress"><span style={{ width: `${((question + 1) / behaviorQuestions.length) * 100}%` }} /></div>
      <div className="quiz-count">{en ? `Question ${question + 1} of 5` : `৫টির মধ্যে প্রশ্ন ${question + 1}`}</div>
      <section className="quiz-card"><span className="quiz-icon"><Icon name="user" size={35} /></span><h2>{title}</h2><p>{desc}</p><button className="read-question"><Icon name="speaker" />{en ? "Read this aloud" : "প্রশ্নটি শুনুন"}</button></section>
      <div className="quiz-answers">
        <button onClick={() => chooseBehavior("yes")} className="answer-yes"><Icon name="check" /><span><strong>{en ? "Yes" : "হ্যাঁ"}</strong><small>{en ? "This happened" : "এটি হয়েছে"}</small></span></button>
        <button onClick={() => chooseBehavior("no")}><Icon name="close" /><span><strong>{en ? "No" : "না"}</strong><small>{en ? "This did not happen" : "এটি হয়নি"}</small></span></button>
      </div>
      {question > 0 && <Button variant="ghost" onClick={() => setQuestion(question - 1)}>{en ? "Previous question" : "আগের প্রশ্ন"}</Button>}
      <PrivacyNote en={en} />
    </Page>;
  }

  const reasons = resultSource === "behavior"
    ? behaviorQuestions.map((item, index) => behavior[index] === "yes" ? item : null).filter(Boolean) as string[][]
    : [
      ...physicalChecks.map((item, index) => physical[index] === "no" ? [item[0], item[1]] : physical[index] === "unsure" ? [en ? `Could not confirm: ${item[0]}` : `নিশ্চিত নয়: ${item[0]}`, en ? "Ask the visa center to check this feature." : "ভিসা কেন্দ্রকে এই বিষয়টি পরীক্ষা করতে বলুন।"] : null).filter(Boolean) as string[][],
      ...serverFlags.map((f) => [en ? f.title_en : f.title_bn, en ? f.reason_en : f.reason_bn]),
      ...(mismatchFlags > 0 ? [[en ? "Some details do not match" : "কিছু তথ্য মেলেনি", en ? "The sticker code and passport details should be the same." : "স্টিকারের কোড ও পাসপোর্টের তথ্য একই হওয়া উচিত।"]] : []),
    ];
  return <Page className="result-page visa-result">
    <section className={`result-hero result-${resultType}`}><StatusIcon type={resultType} /><span className="eyebrow">{resultType === "danger" ? (en ? "WARNING" : "সতর্কতা") : resultType === "careful" ? (en ? "BE CAREFUL" : "সাবধান") : (en ? "NO PROBLEMS FOUND" : "সমস্যা পাওয়া যায়নি")}</span><h2>{resultTitle}</h2><p>{en ? "This check looks for common warning signs only." : "এই যাচাই শুধু পরিচিত ঝুঁকির লক্ষণ খোঁজে।"}</p></section>
    {reasons.length > 0 ? <div className="reason-list"><h3>{en ? "What needs attention" : "যে বিষয়গুলো খেয়াল করবেন"}</h3>{reasons.map(([title, desc], index) => <article className="reason-card" key={`${title}-${index}`}><span><Icon name={resultType === "danger" ? "warning" : "help"} /></span><div><h4>{title}</h4><p>{desc}</p></div></article>)}</div> : <section className="result-card no-flags"><Icon name="check" /><div><h3>{en ? "Your answers did not show a common warning sign" : "আপনার উত্তরে পরিচিত কোনো ঝুঁকি ধরা পড়েনি"}</h3><p>{en ? "This still does not confirm that the visa is genuine." : "তবুও এতে ভিসা আসল বলে নিশ্চিত হওয়া যায় না।"}</p></div></section>}
    <div className="honest-warning"><Icon name="warning" size={27} /><p><strong>{en ? "Not proof" : "এটি প্রমাণ নয়"}</strong>{en ? "Confirm with the embassy or visa center." : "দূতাবাস বা ভিসা কেন্দ্র থেকে নিশ্চিত হোন।"}</p></div>
    <PrivacyNote en={en} />
    <div className="visa-result-actions"><Button variant="secondary" icon="speaker">{en ? "Listen" : "শুনুন"}</Button><Button variant="secondary" icon="share">{en ? "Share" : "শেয়ার"}</Button><Button variant="danger" icon="report" onClick={() => go("report")}>{en ? "Report" : "রিপোর্ট দিন"}</Button><Button variant="secondary" icon="phone" onClick={() => go("help")}>{en ? "Get help" : "সাহায্য নিন"}</Button></div>
    <Button variant="ghost" onClick={() => { setStage("intro"); setMrz(null); setLine1(""); setLine2(""); setPhysical([null, null, null, null]); setBehavior([null, null, null, null, null]); setMatches([true, true, true, true]); }}>{en ? "Check another visa" : "আরেকটি ভিসা যাচাই করুন"}</Button>
    <ResultFooter en={en} />
  </Page>;
}

function Library({ en }: { en: boolean }) {
  return <Page><div className="page-intro"><span className="step-pill">UI KIT 1.0</span><h2>{en ? "Components & styles" : "কম্পোনেন্ট ও স্টাইল"}</h2><p>{en ? "Provash Shield's accessible building blocks." : "প্রবাস শিল্ডের সহজ ও ব্যবহারযোগ্য উপাদান।"}</p></div>
    <section className="library-section"><h3>{en ? "Colour roles" : "রঙের ব্যবহার"}</h3><div className="swatches"><div className="swatch green"><i /><strong>Shield green</strong><small>#0B3D3A</small></div><div className="swatch amber"><i /><strong>Care amber</strong><small>#F2A33A</small></div><div className="swatch cream"><i /><strong>Warm cream</strong><small>#F6F4EE</small></div><div className="swatch red"><i /><strong>Warning red</strong><small>#B4232E</small></div></div></section>
    <section className="library-section type-sample"><h3>{en ? "Type scale" : "লেখার ধরন"}</h3><h2>পরিষ্কার বড় শিরোনাম</h2><h3>Readable section heading</h3><p>সহজ ভাষা, বড় অক্ষর, বেশি ফাঁকা জায়গা।</p><small>Noto Sans Bengali · 18px minimum</small></section>
    <section className="library-section component-stack"><h3>{en ? "Actions" : "বাটন"}</h3><Button icon="shield">Primary action</Button><Button variant="secondary" icon="speaker">Secondary action</Button><Button variant="danger" icon="warning">Warning action</Button></section>
    <section className="library-section"><h3>{en ? "Statuses" : "ফলাফলের অবস্থা"}</h3><div className="badges"><Badge type="good">যাচাই হয়েছে</Badge><Badge type="careful">সাবধান</Badge><Badge type="danger">সতর্কতা</Badge></div></section>
  </Page>;
}

function OfflineBanner({ en }: { en: boolean }) {
  return <div className="offline"><Icon name="wifi" size={19} /><span>{en ? "Poor connection. Some results may be delayed." : "ইন্টারনেট দুর্বল। ফলাফল পেতে দেরি হতে পারে।"}</span><button>{en ? "Retry" : "আবার চেষ্টা"}</button></div>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [en, setEn] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [check, setCheck] = useState<Check>(null);
  const go = (next: Screen) => { setScreen(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const screens: Record<Screen, ReactNode> = {
    home: <Home en={en} go={go} />, voice: <Voice en={en} go={go} />, confirm: <Confirm en={en} go={go} onChecked={setCheck} />,
    verified: <Verified en={en} go={go} check={check} />, notFound: <NotFound en={en} go={go} />, warning: <Warning en={en} go={go} check={check} />,
    offer: <Offer en={en} go={go} />, report: <Report en={en} go={go} />, reportDone: <ReportDone en={en} go={go} />,
    help: <Help en={en} />, history: <History en={en} go={go} />, how: <How en={en} go={go} />, visa: <VisaCheck en={en} go={go} />, library: <Library en={en} />,
  };
  const desktopNav: [Screen, IconName][] = [["home", "home"], ["voice", "search"], ["visa", "shield"], ["offer", "document"], ["report", "report"], ["history", "clock"], ["help", "help"], ["how", "shield"], ["library", "edit"]];
  return <div className="app-shell">
    <aside className="desktop-sidebar">
      <div className="sidebar-brand"><span className="logo"><Icon name="shield" size={32} /></span><div><strong>{en ? "Provash Shield" : "প্রবাস শিল্ড"}</strong><small>{en ? "Verification toolkit" : "যাচাই সহায়িকা"}</small></div></div>
      <nav>{desktopNav.map(([target, icon]) => <button key={target} className={screen === target ? "active" : ""} onClick={() => go(target)}><Icon name={icon} /><span>{en ? LABELS[target][1] : LABELS[target][0]}</span></button>)}</nav>
      <div className="sidebar-note"><Icon name="lock" /><p>{en ? "Private by design" : "তথ্য গোপন ও নিরাপদ"}</p></div>
    </aside>
    <div className="app-frame">
      <Header title={en ? LABELS[screen][1] : LABELS[screen][0]} en={en} toggle={() => setEn(!en)} />
      {showOffline && <OfflineBanner en={en} />}
      {screens[screen]}
      <button className="offline-trigger" onClick={() => setShowOffline(!showOffline)} aria-label="Toggle offline demo"><Icon name="wifi" size={15} /></button>
      <BottomNav screen={screen} go={go} en={en} />
    </div>
    <aside className="desktop-context">
      <span className="eyebrow">{en ? "STAFF PREVIEW" : "স্টাফ প্রিভিউ"}</span><h2>{en ? "Mobile-first safety checks" : "সহজ নিরাপত্তা যাচাই"}</h2><p>{en ? "This desktop view keeps the worker's mobile experience at the centre." : "ডেস্কটপেও ব্যবহারকারীর মোবাইল অভিজ্ঞতাই মূল।"}</p>
      <div className="context-stat"><strong>56+</strong><span>{en ? "minimum touch target" : "সর্বনিম্ন টাচ টার্গেট"}</span></div>
      <div className="context-stat"><strong>18</strong><span>{en ? "minimum body size" : "সর্বনিম্ন লেখার মাপ"}</span></div>
    </aside>
  </div>;
}
