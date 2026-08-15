// The 2026 competitive year in Europe, as Epic scheduled it.
//
// Read off Tracker's own event pages — every window carries a real BeginTime —
// by asking each event of the year for its windows from an open Tracker tab,
// the same route the Reload harvest used, because Cloudflare refuses a
// server-side fetch. Nothing here is typed from memory: a date that is not in
// this file was not found, rather than guessed.
//
// Three seasons make the year: S39 runs from December into March, S40 from
// March into June, S41 from June into August.
//
//   [from, to, id, what it is]
const FN_YEAR_2026 = [
  // ---- S38, the season that opens the year ------------------------------
  ['2025-11-04', '2025-11-19', 'S38_PerformanceEvaluation',        'Performance Evaluation, three nights'],

  // ---- S39 --------------------------------------------------------------
  ['2025-12-04', '2026-03-12', 'S39_PerformanceEvaluation',        'Performance Evaluation, weekly, two rounds a night'],
  ['2026-01-08', '2026-01-16', 'S39_ReloadEliteSeries1Opens',      'Reload Elite Series 1 — Opens, two sessions'],
  ['2026-01-23', '2026-01-28', 'S39_ReloadEliteSeries1PlayIn',     'Reload Elite Series 1 — Play-Ins, two days'],
  ['2026-02-01', '2026-02-01', 'S39_ReloadEliteSeries1Heats',      'Reload Elite Series 1 — four heats in a night'],
  ['2026-02-07', '2026-02-07', 'S39_ReloadEliteSeries1Final',      'Reload Elite Series 1 — Final'],
  ['2026-02-02', '2026-03-14', 'S39_FNCSDivisionalCup',            'FNCS divisional cups, Divisions 1-5, weekly'],
  ['2026-02-13', '2026-02-15', 'S39_ReloadEliteSeries2Opens',      'Reload Elite Series 2 — Opens'],
  ['2026-02-20', '2026-02-22', 'S39_ReloadEliteSeries2PlayIn',     'Reload Elite Series 2 — Play-Ins'],
  ['2026-02-27', '2026-02-27', 'S39_ReloadEliteSeries2Heats',      'Reload Elite Series 2 — heats'],
  ['2026-03-01', '2026-03-01', 'S39_ReloadEliteSeries2Final',      'Reload Elite Series 2 — Final'],
  ['2026-03-08', '2026-03-15', 'S39_SoloVictoryCup',               'Solo Victory Cup'],

  // ---- S40 --------------------------------------------------------------
  ['2026-03-20', '2026-06-03', 'S40_PerformanceEvaluation',        'Performance Evaluation'],
  ['2026-03-22', '2026-04-12', 'S40_SoloVictoryCup',               'Solo Victory Cup'],
  ['2026-03-23', '2026-05-23', 'S40_FNCSDivisionalCup',            'FNCS divisional cups, Divisions 1-5, weekly'],
  ['2026-04-06', '2026-04-07', 'S40_FNCSMajor1_PlayInStage',       'FNCS Major 1 — Play-In, two days'],
  ['2026-04-17', '2026-04-19', 'S40_FNCSMajor1_HeatsStage',        'FNCS Major 1 — Heats, three days'],
  ['2026-04-20', '2026-04-21', 'S40_FNCSMajor1_LastChanceQualifier','FNCS Major 1 — Last Chance Qualifier'],
  ['2026-04-25', '2026-04-26', 'S40_FNCSMajor1_Final',             'FNCS Major 1 — Finals'],
  ['2026-04-25', '2026-05-23', 'S40_RankedCupReloadDuos',          'Duos Ranked Cup (Reload)'],
  ['2026-04-26', '2026-05-24', 'S40_RankedCupDuos',                'Duos Ranked Cup (Battle Royale)'],
  ['2026-04-27', '2026-05-25', 'S40_RankedCupSolo',                'Solo Ranked Cup (Battle Royale)'],
  ['2026-05-01', '2026-05-03', 'S40_ReloadEliteSeries3Opens',      'Reload Elite Series 3 — Opens'],
  ['2026-05-08', '2026-05-10', 'S40_ReloadEliteSeries3PlayIn',     'Reload Elite Series 3 — Play-Ins'],
  ['2026-05-15', '2026-05-15', 'S40_ReloadEliteSeries3Heats',      'Reload Elite Series 3 — heats'],
  ['2026-05-17', '2026-05-17', 'S40_ReloadEliteSeries3Final',      'Reload Elite Series 3 — Final'],

  // ---- S41 --------------------------------------------------------------
  ['2026-06-07', '2026-08-13', 'S41_PerformanceEvaluation',        'Performance Evaluation'],
  ['2026-06-08', '2026-07-19', 'S41_FNCSDivisionalCup',            'FNCS divisional cups, Divisions 1-5, weekly'],
  ['2026-06-08', '2026-08-17', 'S41_RankedCupSolo',                'Solo Ranked Cup (Battle Royale)'],
  ['2026-06-09', '2026-08-15', 'S41_RankedCupReloadDuos',          'Duos Ranked Cup (Reload)'],
  ['2026-06-12', '2026-06-14', 'S41_ReloadEliteSeries4Opens',      'Reload Elite Series 4 — Opens'],
  ['2026-06-13', '2026-07-25', 'S41_SoloVictoryCup',               'Solo Victory Cup'],
  ['2026-06-14', '2026-08-16', 'S41_RankedCupDuos',                'Duos Ranked Cup (Battle Royale)'],
  ['2026-06-16', '2026-08-18', 'S41_RankedCupSoloReload',          'Solo Ranked Cup (Reload)'],
  ['2026-06-19', '2026-06-21', 'S41_ReloadEliteSeries4PlayIn',     'Reload Elite Series 4 — Play-Ins'],
  ['2026-06-26', '2026-06-26', 'S41_ReloadEliteSeries4Heats',      'Reload Elite Series 4 — heats'],
  ['2026-06-28', '2026-06-28', 'S41_ReloadEliteSeries4Final',      'Reload Elite Series 4 — Final'],
  ['2026-07-18', '2026-07-19', 'S41_FNCSMajor2_PlayInStage',       'FNCS Major 2 — Play-In'],
  ['2026-07-24', '2026-07-26', 'S41_FNCSMajor2_HeatsStage',        'FNCS Major 2 — Heats'],
  ['2026-07-27', '2026-07-28', 'S41_FNCSMajor2_LastChanceQualifier','FNCS Major 2 — Last Chance Qualifier'],
  ['2026-08-01', '2026-08-02', 'S41_FNCSMajor2_Final',             'FNCS Major 2 — Finals'],
  ['2026-08-03', '2026-08-14', 'S41_FNCSLastChanceMajor',          'FNCS Global Championship — Last Chance Finals'],
  ['2026-08-18', '2026-08-21', 'Escargo_Official',                 'Reload Elite Series Championship, Paris']
];


// The Performance Evaluation, night by night rather than as a span, because it
// is the one event that runs every week of the year and the career calendar has
// to put it on the right evening. Its own page states the two rules that matter:
// "You must be Duos Division 1 to participate in this event" and "This event
// will occur over two rounds, with the top 40 teams advancing to Round 2".
// So it is Division 1 only, two rounds in one night, and it pays.
const FN_PERF_EVAL_NIGHTS = {
  S38: ['2025-11-04', '2025-11-11', '2025-11-19'],
  S39: ['2025-12-04', '2025-12-11', '2025-12-18', '2026-01-09', '2026-01-15', '2026-01-22', '2026-01-29', '2026-02-05', '2026-02-12', '2026-02-19', '2026-02-26', '2026-03-05', '2026-03-12'],
  S40: ['2026-03-20', '2026-03-26', '2026-04-01', '2026-04-09', '2026-04-16', '2026-04-23', '2026-05-07', '2026-05-14', '2026-05-21', '2026-06-03'],
  S41: ['2026-06-07', '2026-06-11', '2026-06-18', '2026-07-16', '2026-07-23', '2026-07-30', '2026-08-06', '2026-08-13']
};
// How the evaluation is actually scored, off its own windows rather than
// assumed — and the two rounds are not the same tournament twice.
//
// Round 1 is eight games on the ordinary duo ladder: a Victory Royale is worth
// nine on top of everything below it, reaching each of the top five is four,
// each of the top twenty-five is two, and a kill is one. Banked, that comes to
// 65 for a win, 56 for second, 52, 48, 44, 40 and down to 2 for twenty-fifth —
// the same table the FNCS duo modes use, but paying one a kill rather than four.
//
// Round 2 is four games and scores nothing but wins: a Victory Royale is 100
// points and an elimination is 0. The rewards are read straight off that —
// 100, 200, 300 and 400 points, which is one, two, three and four wins. A
// simulation that treats it as an ordinary points cup gets it completely wrong:
// there is no placement to farm and no kills to bank, only wins.
const FN_PERF_EVAL_RULES = {
  division: 1,
  round1: {games: 8, tiers: {vr: 9, top2to5: 4, top6to25: 2}, killPts: 1,
           banked: [65,56,52,48,44,40,38,36,34,32,30,28,26,24,22,20,18,16,14,12,10,8,6,4,2]},
  // And it pays by the win, in cash: $400 a Victory Royale, so 100 points is
  // $400, 200 is $800, 300 is $1,200 and all four games is $1,600. Round 1 pays
  // nothing but the token into Round 2 — the money is entirely on winning.
  round2: {games: 4, winPts: 100, killPts: 0, rewardAt: [100, 200, 300, 400],
           cashAt: {100: 400, 200: 800, 300: 1200, 400: 1600}, perWin: 400, currency: 'USD'},
  // The cut into Round 2 is the season's, not a constant: S41 pays a token to
  // the top fifty, while S38's own description says the top forty.
  round2Cut: {S38: 40, S41: 50},
  playlist: 'Playlist_ShowdownTournament_NPM_Duos'
};

// The weekly rhythm inside those blocks, counted off the window names rather
// than assumed: a divisional cup is Monday and Tuesday, Division 1 adds a
// Sunday final; the Performance Evaluation is one night of two rounds; a Reload
// cup is Opens on two evenings, Play-Ins over two days, four heats in one night
// and the final two days later.
const FN_YEAR_RHYTHM = {
  divisionalCup: {days: [0, 1], d1Final: 6},
  performanceEval: {day: 3, rounds: 2},
  reloadHeats: {day: 4},
  reloadFinal: {day: 6}
};

if (typeof module !== 'undefined')
  module.exports = {FN_YEAR_2026, FN_YEAR_RHYTHM, FN_PERF_EVAL_NIGHTS, FN_PERF_EVAL_RULES};
