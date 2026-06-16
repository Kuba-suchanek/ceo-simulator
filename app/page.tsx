"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type StatKey = "money" | "employees" | "reputation" | "morale";

type Impact = {
  money: number;
  employees: number;
  reputation: number;
  morale: number;
};

type Choice = {
  label: string;
  impact: Impact;
};

type Scenario = {
  title: string;
  description: string;
  choices: [Choice, Choice, Choice];
};

type LeaderboardEntry = {
  name: string;
  score: number;
  resultType: string;
  money: number;
  employees: number;
  reputation: number;
  morale: number;
  createdAt: string;
};

type LeaderboardRow = {
  id: number;
  name: string | null;
  score: number | null;
  result_type: string | null;
  money: number | null;
  employees: number | null;
  reputation: number | null;
  morale: number | null;
  created_at: string | null;
};

const START_STATS: Record<StatKey, number> = {
  money: 1_000_000,
  employees: 3,
  reputation: 10,
  morale: 50,
};

const scenarios: Scenario[] = [
  {
    title: "První klient",
    description:
      "Na obzoru je první větší zakázka. Potřebujete se rozhodnout, jestli půjdete po rychlém zisku, nebo budete hrát dlouhou hru.",
    choices: [
      {
        label: "Přijmout projekt za 200 000 Kč a doručit ho rychle",
        impact: { money: 200_000, employees: 0, reputation: 2, morale: 3 },
      },
      {
        label: "Poslat kvalitní nabídku a počkat o týden déle",
        impact: { money: -50_000, employees: 0, reputation: 3, morale: -2 },
      },
      {
        label: "Odmítnout a hledat perspektivnější klienty",
        impact: { money: -20_000, employees: 0, reputation: -1, morale: 1 },
      },
    ],
  },
  {
    title: "Marketingová kampaň",
    description:
      "Firma potřebuje zviditelnit. Každá cesta stojí jiné peníze a přináší jiný typ růstu.",
    choices: [
      {
        label: "Spustit sociální sítě a video kampaň",
        impact: { money: -120_000, employees: 0, reputation: 4, morale: 2 },
      },
      {
        label: "Vsadit na osobní doporučení a partnerství",
        impact: { money: -30_000, employees: 0, reputation: 2, morale: 6 },
      },
      {
        label: "Nechat marketing na později",
        impact: { money: 0, employees: 0, reputation: -2, morale: -3 },
      },
    ],
  },
  {
    title: "Nábor nových lidí",
    description:
      "Růst je vidět, ale váš tým je pod tlakem. Potřebujete nového specialistu.",
    choices: [
      {
        label: "Najmout 2 juniorní analytiky",
        impact: { money: -180_000, employees: 2, reputation: 1, morale: 4 },
      },
      {
        label: "Najmout 1 zkušeného obchodníka",
        impact: { money: -250_000, employees: 1, reputation: 3, morale: 1 },
      },
      {
        label: "Dál pracovat bez změn",
        impact: { money: 50_000, employees: 0, reputation: -1, morale: -4 },
      },
    ],
  },
  {
    title: "Velká smlouva",
    description:
      "Obchodní partner nabízí dlouhodobou smlouvu s vysokým objemem práce.",
    choices: [
      {
        label: "Přijmout smlouvu a rozšířit tým",
        impact: { money: 550_000, employees: 2, reputation: 4, morale: 2 },
      },
      {
        label: "Přijmout jen polovinu a udržet stabilitu",
        impact: { money: 250_000, employees: 0, reputation: 2, morale: 1 },
      },
      {
        label: "Odmítnout z obavy z přetížení",
        impact: { money: -50_000, employees: 0, reputation: -2, morale: -1 },
      },
    ],
  },
  {
    title: "Dodavatelská krize",
    description:
      "Jeden z dodavatelů selhal. Musíte rychle najít náhradní řešení.",
    choices: [
      {
        label: "Přesunout dodávky a zaplatit prémii",
        impact: { money: -140_000, employees: 0, reputation: -1, morale: -3 },
      },
      {
        label: "Najít nové partnery a budovat stabilitu",
        impact: { money: -90_000, employees: 0, reputation: 3, morale: 2 },
      },
      {
        label: "Přesunout práci na vlastní tým",
        impact: { money: -70_000, employees: -1, reputation: 1, morale: -4 },
      },
    ],
  },
  {
    title: "Nový produkt",
    description:
      "Přichází příležitost vytvořit nový digitální produkt, který může firmu posunout dopředu.",
    choices: [
      {
        label: "Rozjet vývoj s vlastními lidmi",
        impact: { money: -220_000, employees: 1, reputation: 4, morale: 3 },
      },
      {
        label: "Investovat do externího týmu",
        impact: { money: -300_000, employees: 0, reputation: 5, morale: 1 },
      },
      {
        label: "Zůstat u stávajících služeb",
        impact: { money: 50_000, employees: 0, reputation: -1, morale: -2 },
      },
    ],
  },
  {
    title: "Únik dat",
    description:
      "Došlo k drobnému úniku informací. Je třeba reagovat profesionálně a rychle.",
    choices: [
      {
        label: "Zaplatit bezpečnostní audit a aktualizaci",
        impact: { money: -160_000, employees: 0, reputation: 2, morale: -1 },
      },
      {
        label: "Oznámit incident a řešit ho transparentně",
        impact: { money: -80_000, employees: 0, reputation: 4, morale: 2 },
      },
      {
        label: "Zamlčet problém a doufat, že vyšumí",
        impact: { money: 50_000, employees: 0, reputation: -5, morale: -5 },
      },
    ],
  },
  {
    title: "Rozšíření do zahraničí",
    description:
      "Evropský trh nabízí velký růst, ale přináší i nové náklady a rizika.",
    choices: [
      {
        label: "Vstoupit na trh s lokálním partnerem",
        impact: { money: -250_000, employees: 1, reputation: 3, morale: 2 },
      },
      {
        label: "Rozjet testovací pilot v jedné zemi",
        impact: { money: -180_000, employees: 0, reputation: 2, morale: 1 },
      },
      {
        label: "Počkat a sledovat konkurenci",
        impact: { money: 0, employees: 0, reputation: -1, morale: -2 },
      },
    ],
  },
  {
    title: "Zvýšení mezd",
    description:
      "Tým žádá o lepší podmínky. Musíte rozhodnout, zda investovat do lidí, nebo šetřit.",
    choices: [
      {
        label: "Zvýšit platy o 10 %",
        impact: { money: -140_000, employees: 0, reputation: 3, morale: 7 },
      },
      {
        label: "Poskytnout bonus a flexibilní pracovní dobu",
        impact: { money: -80_000, employees: 0, reputation: 2, morale: 4 },
      },
      {
        label: "Nechat vše při starém",
        impact: { money: 100_000, employees: 0, reputation: -1, morale: -5 },
      },
    ],
  },
  {
    title: "Strategický partner",
    description:
      "Investor nabízí partnerství s podporou pro růst, ale chce větší kontrolu.",
    choices: [
      {
        label: "Přijmout partnera a rozšířit kapacity",
        impact: { money: 400_000, employees: 2, reputation: 3, morale: 1 },
      },
      {
        label: "Přijmout partnera s omezeným vlivem",
        impact: { money: 180_000, employees: 1, reputation: 2, morale: 2 },
      },
      {
        label: "Odmítnout a zůstat nezávislí",
        impact: { money: -50_000, employees: 0, reputation: -1, morale: -1 },
      },
    ],
  },
  {
    title: "Rychlý růst",
    description:
      "Trh chce více služeb. Rozhodujete se, jak rychle firmu rozšíříte.",
    choices: [
      {
        label: "Rozběhnout expanzi v rekordním tempu",
        impact: { money: -260_000, employees: 2, reputation: 3, morale: -1 },
      },
      {
        label: "Rozšířit krok za krokem",
        impact: { money: -120_000, employees: 1, reputation: 2, morale: 2 },
      },
      {
        label: "Udržet běžný rytmus",
        impact: { money: 40_000, employees: 0, reputation: -1, morale: 1 },
      },
    ],
  },
  {
    title: "Stávka v týmu",
    description:
      "Někteří zaměstnanci jsou nespokojení s pracovní zátěží a chtějí změny.",
    choices: [
      {
        label: "Jednat s týmem a upravit procesy",
        impact: { money: -100_000, employees: 0, reputation: 3, morale: 6 },
      },
      {
        label: "Snížit zatížení s pomocí externistů",
        impact: { money: -170_000, employees: 1, reputation: 2, morale: 3 },
      },
      {
        label: "Přesvědčit lidi, že je to jen dočasné",
        impact: { money: 20_000, employees: 0, reputation: -2, morale: -6 },
      },
    ],
  },
  {
    title: "Mediální pozornost",
    description:
      "Vaše firma se dostává do médií. Získáte reputaci, ale i větší tlak.",
    choices: [
      {
        label: "Událost otevřít pro média a klienty",
        impact: { money: -90_000, employees: 0, reputation: 4, morale: 2 },
      },
      {
        label: "Vyhlásit pracovní seminář pro klienty",
        impact: { money: -50_000, employees: 0, reputation: 2, morale: 3 },
      },
      {
        label: "Zůstat zcela v pozadí",
        impact: { money: 30_000, employees: 0, reputation: -2, morale: -1 },
      },
    ],
  },
  {
    title: "Automatizace a AI",
    description: "Nabízí se investice do AI, která může ušetřit čas i peníze.",
    choices: [
      {
        label: "Automatizovat procesy pomocí AI nástrojů",
        impact: { money: -180_000, employees: -1, reputation: 3, morale: 4 },
      },
      {
        label: "Nasadit AI jen do podpory zákazníků",
        impact: { money: -80_000, employees: 0, reputation: 2, morale: 2 },
      },
      {
        label: "Investovat raději do osobního kontaktu",
        impact: { money: -50_000, employees: 0, reputation: 1, morale: 1 },
      },
    ],
  },
  {
    title: "Audit a kontrola",
    description:
      "Vnitřní audit může odhalit slabiny. Potřebujete se rozhodnout, kolik energie mu dáte.",
    choices: [
      {
        label: "Provést důkladný interní audit",
        impact: { money: -110_000, employees: 0, reputation: 3, morale: 1 },
      },
      {
        label: "Optimalizovat procesy bez auditu",
        impact: { money: -60_000, employees: 0, reputation: 1, morale: 2 },
      },
      {
        label: "Přesunout audit na později",
        impact: { money: 20_000, employees: 0, reputation: -2, morale: -3 },
      },
    ],
  },
  {
    title: "Investiční příležitost",
    description:
      "Na trhu se objevil projekt, který může zvýšit zisky, ale vyžaduje vyšší riziko.",
    choices: [
      {
        label: "Investovat do nového produktu",
        impact: { money: -300_000, employees: 1, reputation: 4, morale: 2 },
      },
      {
        label: "Rozdělit riziko mezi více projektů",
        impact: { money: -150_000, employees: 0, reputation: 2, morale: 3 },
      },
      {
        label: "Zůstat na stabilní trase",
        impact: { money: 70_000, employees: 0, reputation: -1, morale: -1 },
      },
    ],
  },
  {
    title: "Kultura a loajalita",
    description:
      "Firma je ve fázi, kdy se rozhoduje, jestli bude stavět hlavně na lidech, nebo na tempu růstu.",
    choices: [
      {
        label: "Vytvořit program podpory a vzdělávání",
        impact: { money: -120_000, employees: 0, reputation: 4, morale: 7 },
      },
      {
        label: "Podpořit zaměstnance v práci i osobním životě",
        impact: { money: -90_000, employees: 0, reputation: 3, morale: 5 },
      },
      {
        label: "Dát přednost rychlému růstu",
        impact: { money: 100_000, employees: 1, reputation: -1, morale: -4 },
      },
    ],
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateScore(stats: Record<StatKey, number>) {
  return Math.floor(
    stats.money / 10000 +
      stats.reputation * 10 +
      stats.morale * 5 +
      stats.employees * 2,
  );
}

function mapLeaderboardRows(rows: LeaderboardRow[] | null): LeaderboardEntry[] {
  return (rows ?? []).map((row) => ({
    name: row.name ?? "Anonym",
    score: row.score ?? 0,
    resultType: row.result_type ?? "",
    money: row.money ?? 0,
    employees: row.employees ?? 0,
    reputation: row.reputation ?? 0,
    morale: row.morale ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
  }));
}

function getResultName(stats: Record<StatKey, number>) {
  if (stats.money >= 2_500_000 && stats.employees >= 8) {
    return {
      name: "Unicorn Builder",
      text: "Budujete firmu s mimořádným růstem a velkou ambicí.",
    };
  }

  if (stats.reputation >= 18 && stats.morale >= 65) {
    return {
      name: "People Leader",
      text: "Tým vás respektuje, firma má silnou kulturu a výbornou pověst.",
    };
  }

  if (stats.employees >= 12) {
    return {
      name: "Operations Expert",
      text: "Postavili jste pevný provozní základ a zvládli růst bez chaosu.",
    };
  }

  return {
    name: "Strategist",
    text: "Řídíte firmu s rozvahou, dlouhodobě a bez zbytečných zkratek.",
  };
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState(START_STATS);
  const [finished, setFinished] = useState(false);
  const [failed, setFailed] = useState(false);
  const [leaderboardName, setLeaderboardName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboardSaved, setLeaderboardSaved] = useState(false);

  const progress = useMemo(() => {
    if (!started) {
      return 0;
    }

    return ((currentIndex + 1) / scenarios.length) * 100;
  }, [currentIndex, started]);

  const currentScenario = scenarios[currentIndex];
  const result = useMemo(() => getResultName(stats), [stats]);
  const score = useMemo(() => calculateScore(stats), [stats]);

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setLeaderboardError("Nepodařilo se načíst leaderboard.");
      return;
    }

    setLeaderboard(mapLeaderboardRows(data as LeaderboardRow[]));
  };

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  const startGame = () => {
    setStarted(true);
    setCurrentIndex(0);
    setStats(START_STATS);
    setFinished(false);
    setFailed(false);
    setLeaderboardName("");
    setLeaderboardError("");
    setLeaderboardSaved(false);
  };

  const resetGame = () => {
    setStarted(false);
    setCurrentIndex(0);
    setStats(START_STATS);
    setFinished(false);
    setFailed(false);
    setLeaderboardName("");
    setLeaderboardError("");
    setLeaderboardSaved(false);
  };

  const handleChoice = (choice: Choice) => {
    const nextStats: Record<StatKey, number> = {
      money: stats.money + choice.impact.money,
      employees: Math.max(0, stats.employees + choice.impact.employees),
      reputation: Math.max(0, stats.reputation + choice.impact.reputation),
      morale: Math.max(0, stats.morale + choice.impact.morale),
    };

    setStats(nextStats);

    if (nextStats.money <= 0 || nextStats.reputation <= 0) {
      setFailed(true);
      setFinished(true);
      return;
    }

    if (currentIndex === scenarios.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleSaveLeaderboard = async () => {
    alert("VERCEL TEST");
    console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPABASE KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
    const trimmedName = leaderboardName.trim();
if (!trimmedName) {
  setLeaderboardError("Vyplň prosím svoje jméno.");
  return;
}

console.log("Ukladam do Supabase");

const { data, error } = await supabase
  .from("leaderboard")
  .insert({
    name: trimmedName,
    score,
    result_type: result.name,
    money: stats.money,
    employees: stats.employees,
    reputation: stats.reputation,
    morale: stats.morale,
  })
  .select();

console.log("INSERT DATA:", data);
console.log("INSERT ERROR:", error);

if (error) {
  setLeaderboardError("Nepodařilo se uložit výsledek.");
  return;
}

    setLeaderboardError("");
    setLeaderboardSaved(true);
    setLeaderboardName(trimmedName);
    await loadLeaderboard();
  };

  const showLeaderboard = leaderboardSaved || leaderboard.length > 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#111827,_#020617_55%)] text-slate-100 antialiased">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">
              CEO Simulator
            </p>
            <h1 className="text-xl font-black text-white sm:text-2xl">
              Vybuduj firmu od nuly
            </h1>
          </div>
          <button
            type="button"
            onClick={resetGame}
            className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Reset
          </button>
        </header>

        {!started && !finished && (
          <section className="grid flex-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-cyan-100">
                5 minut na úspěch
              </span>
              <h2 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                Vybuduj firmu od nuly
              </h2>
              <p className="mt-4 max-w-lg text-base text-slate-200 sm:text-lg">
                Dokážeš během pár minut projít {scenarios.length} klíčových
                rozhodnutí a vybudovat stabilní firmu?
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
                  Rychlé rozhodování
                </span>
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-2">
                  Moderní dark design
                </span>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                  {scenarios.length} obchodních scénářů
                </span>
              </div>
              <button
                type="button"
                onClick={startGame}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-base font-black text-slate-950 shadow-xl shadow-cyan-400/20 transition hover:scale-[1.02] hover:bg-cyan-300"
              >
                Začít hru
              </button>
            </article>

            <aside className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
              <h3 className="text-xl font-black text-white">Jak hra funguje</h3>
              <ul className="mt-4 space-y-4 text-sm text-slate-200">
                <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  Každá otázka má 3 možnosti a každá mění finance, tým,
                  reputaci i morálku.
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  Když peníze nebo reputace klesnou na nulu, firma zkrachuje.
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  Na konci dostaneš jeden ze 4 výsledků podle toho, jak jsi
                  firmu vedl.
                </li>
              </ul>
              <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Startovní stav: 1 000 000 Kč, 3 zaměstnanci, reputace 10,
                morálka 50.
              </div>
            </aside>
          </section>
        )}

        {started && !finished && !failed && currentScenario && (
          <section className="grid flex-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <aside className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-6">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>
                  Otázka {currentIndex + 1} / {scenarios.length}
                </span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                  Průběh hry
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {([
                  ["Money", formatMoney(stats.money)],
                  ["Employees", stats.employees],
                  ["Reputation", stats.reputation],
                  ["Morale", stats.morale],
                ] as const).map(([label, value]) => (
                  <article
                    key={label}
                    className="rounded-3xl border border-white/10 bg-black/20 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-300">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {value}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-violet-400/20 bg-violet-400/10 p-4 text-sm text-violet-100">
                Tip: když je reputace nebo hotovost příliš nízká, hra může
                rychle skončit.
              </div>
            </aside>

            <article className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-100">
                    Scénář
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                    {currentScenario.title}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.35em] text-slate-200">
                  Krok {currentIndex + 1}
                </span>
              </div>
              <p className="mt-4 text-slate-200">
                {currentScenario.description}
              </p>

              <div className="mt-6 space-y-3">
                {currentScenario.choices.map((choice, index) => (
                  <button
                    key={`${currentScenario.title}-${index}`}
                    type="button"
                    onClick={() => handleChoice(choice)}
                    className="w-full rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-400/10"
                  >
                    <span className="block text-sm uppercase tracking-[0.35em] text-cyan-100">
                      Volba {index + 1}
                    </span>
                    <span className="mt-2 block text-base font-semibold text-white">
                      {choice.label}
                    </span>
                    <span className="mt-3 block text-xs text-slate-200">
                      Peníze {choice.impact.money >= 0 ? "+" : ""}
                      {formatMoney(choice.impact.money)} · Zaměstnanci{" "}
                      {choice.impact.employees >= 0 ? "+" : ""}
                      {choice.impact.employees} · Reputace{" "}
                      {choice.impact.reputation >= 0 ? "+" : ""}
                      {choice.impact.reputation} · Morálka{" "}
                      {choice.impact.morale >= 0 ? "+" : ""}
                      {choice.impact.morale}
                    </span>
                  </button>
                ))}
              </div>
            </article>
          </section>
        )}

        {finished && !failed && (
          <section className="grid flex-1 gap-6 lg:grid-cols-[1fr_0.95fr]">
            <article className="rounded-[32px] border border-emerald-400/20 bg-emerald-400/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-100">
                Konec hry
              </p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Porovnání
              </h2>
              <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-slate-100">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span>Začátek</span>
                  <span>Konec</span>
                </div>
                {([
                  ["Money", START_STATS.money, stats.money],
                  ["Employees", START_STATS.employees, stats.employees],
                  ["Reputation", START_STATS.reputation, stats.reputation],
                  ["Morale", START_STATS.morale, stats.morale],
                ] as const).map(([label, start, end]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"
                  >
                    <span className="text-slate-200">{label}</span>
                    <span className="text-slate-300">
                      {label === "Money" ? formatMoney(start) : start}
                    </span>
                    <span className="font-semibold text-white">
                      {label === "Money" ? formatMoney(end) : end}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-100">
                Výsledek
              </p>
              <h3 className="mt-3 text-3xl font-black text-white">
                {result.name}
              </h3>
              <p className="mt-3 text-slate-200">{result.text}</p>
              <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-sm text-cyan-50">
                <p className="font-semibold">Shrnutí firmy</p>
                <p className="mt-2 text-cyan-100/90">
                  Finance: {formatMoney(stats.money)}, zaměstnanci:{" "}
                  {stats.employees}, reputace: {stats.reputation}, morálka:{" "}
                  {stats.morale}.
                </p>
                <p className="mt-2 text-cyan-100/90">
                  Skóre: <span className="font-bold text-white">{score}</span>
                </p>
              </div>

              <section className="mt-6 rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-5 shadow-xl shadow-black/30 backdrop-blur-xl">
                <h4 className="text-xl font-black text-white">
                  🏆 Soutěž o nejlepšího CEO dne
                </h4>

                <div className="mt-4">
                  <label
                    htmlFor="leaderboard-name"
                    className="mb-2 block text-sm font-semibold text-slate-100"
                  >
                    Tvoje jméno
                  </label>
                  <input
                    id="leaderboard-name"
                    type="text"
                    value={leaderboardName}
                    onChange={(event) => {
                      setLeaderboardName(event.target.value);
                      if (leaderboardError) {
                        setLeaderboardError("");
                      }
                    }}
                    placeholder="Např. Kuba"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400/50 focus:bg-black/30"
                  />
                  {leaderboardError && (
                    <p className="mt-2 text-sm text-rose-300">
                      {leaderboardError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveLeaderboard}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-400/20 transition hover:scale-[1.02] hover:bg-cyan-300"
                >
                  Uložit výsledek
                </button>
              </section>

              {showLeaderboard && (
                <section className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-xl shadow-black/30 backdrop-blur-xl">
                  <h4 className="text-xl font-black text-white">
                    🏆 TOP 10 CEO DNE
                  </h4>

                  <div className="mt-4 space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={`${entry.name}-${entry.createdAt}-${index}`}
                        className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-sm ${
                          index === 0
                            ? "border-amber-300/40 bg-amber-300/15 text-amber-50"
                            : "border-white/10 bg-white/5 text-slate-100"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {index + 1}. {entry.name}
                          </p>
                          <p
                            className={`mt-1 truncate text-xs ${
                              index === 0 ? "text-amber-100" : "text-slate-300"
                            }`}
                          >
                            {entry.score} — {entry.resultType}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-xl shadow-black/30 backdrop-blur-xl">
                <h4 className="text-xl font-black text-white">
                  Chceš zjistit, jak se rozhodují skuteční podnikatelé?
                </h4>
                <p className="mt-3 text-sm text-slate-200">
                  Ve hře rozhoduješ během pár minut. V CBT Czech můžeš navštívit
                  firmy a zjistit, jak podobná rozhodnutí řeší podnikatelé v
                  reálném světě.
                </p>
                <a
                  href="https://cbtczech.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/20"
                >
                  Zjistit více o CBT Czech →
                </a>
              </section>

              <button
                type="button"
                onClick={startGame}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-base font-black text-slate-950 shadow-xl shadow-cyan-400/20 transition hover:scale-[1.02] hover:bg-cyan-300"
              >
                Hrát znovu
              </button>
            </article>
          </section>
        )}

        {failed && (
          <section className="grid flex-1 items-center gap-6 lg:grid-cols-[1fr_0.95fr]">
            <article className="rounded-[32px] border border-rose-400/30 bg-rose-400/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-rose-100">
                Krach
              </p>
              <h2 className="mt-3 text-4xl font-black text-white">
                Firma zkrachovala
              </h2>
              <p className="mt-4 text-slate-100">
                Peníze nebo reputace klesly na nulu. Tentokrát se firmu
                nepodařilo udržet, ale další kolo může dopadnout lépe.
              </p>
              <button
                type="button"
                onClick={startGame}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-base font-black text-slate-950 shadow-xl transition hover:scale-[1.02]"
              >
                Hrát znovu
              </button>
            </article>

            <article className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300">
                Poslední stav
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {([
                  ["Money", formatMoney(stats.money)],
                  ["Employees", stats.employees],
                  ["Reputation", stats.reputation],
                  ["Morale", stats.morale],
                ] as const).map(([label, value]) => (
                  <article
                    key={label}
                    className="rounded-3xl border border-white/10 bg-black/20 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-300">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {value}
                    </p>
                  </article>
                ))}
              </div>
            </article>
          </section>
        )}
      </section>
    </main>
  );
}