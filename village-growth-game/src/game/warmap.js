// 삼국지식 영토 전역(캠페인)
//  - 성(영토)마다 병력 + 수비 장수를 두고, 인접한 영토끼리 공방
//  - 일기토(무력) · 계략(지력) · 통솔 보너스로 전투 판정
//  - 위/촉/오 라이벌 세력이 매 턴 AI로 진군·확장
//  기존 '인근 마을 정복'(state.villages) 시스템과 별개의 새 레이어.

export const FACTIONS = {
  player: { id: 'player', name: '아군', color: '#5fc36a' },
  wei: { id: 'wei', name: '위(魏)', color: '#e0584f' },
  shu: { id: 'shu', name: '촉(蜀)', color: '#4f8ff0' },
  wu: { id: 'wu', name: '오(吳)', color: '#d2a52f' },
  neutral: { id: 'neutral', name: '재야', color: '#8a93a3' },
};
export function factionName(id) { return (FACTIONS[id] || { name: id }).name; }
export function factionColor(id) { return (FACTIONS[id] || { color: '#8a93a3' }).color; }

// 영토(성) 정적 정보: 위치(col,row) · 인접(nb) · 수입(income/턴) · 영향력(inf/턴)
export const TERRITORIES = [
  { id: 'home', name: '본거지', col: 0, row: 1, nb: ['boknyang', 'jinryu'], income: 0, inf: 0 },
  { id: 'boknyang', name: '복양', col: 1, row: 0, nb: ['home', 'jinryu', 'gwandong'], income: 25, inf: 3 },
  { id: 'jinryu', name: '진류', col: 1, row: 2, nb: ['home', 'boknyang', 'wan'], income: 30, inf: 3 },
  { id: 'gwandong', name: '관도', col: 2, row: 0, nb: ['boknyang', 'heochang', 'eopseong'], income: 45, inf: 5 },
  { id: 'heochang', name: '허창', col: 2, row: 1, nb: ['gwandong', 'wan', 'eopseong'], income: 60, inf: 7 },
  { id: 'wan', name: '완성', col: 2, row: 2, nb: ['jinryu', 'heochang', 'jiangling'], income: 45, inf: 5 },
  { id: 'eopseong', name: '업성', col: 3, row: 0, nb: ['gwandong', 'heochang', 'northgate'], income: 65, inf: 8 },
  { id: 'northgate', name: '북평', col: 4, row: 0, nb: ['eopseong'], income: 55, inf: 6 },
  { id: 'jiangling', name: '강릉', col: 3, row: 2, nb: ['wan', 'chengdu', 'jianye'], income: 55, inf: 6 },
  { id: 'jianye', name: '건업', col: 4, row: 1, nb: ['jiangling'], income: 90, inf: 10 },
  { id: 'chengdu', name: '성도', col: 4, row: 3, nb: ['jiangling'], income: 90, inf: 10 },
];
const TERR_MAP = {};
for (const t of TERRITORIES) TERR_MAP[t.id] = t;
export function territoryById(id) { return TERR_MAP[id]; }
export const WAR_COLS = 5;
export const WAR_ROWS = 4;

function gen(name, might, command, intellect) { return { name, might, command, intellect }; }

// 초기 세력 배치 (state.war.terr 동적 상태)
export function makeInitialWar() {
  return {
    turn: 1,
    unified: false,
    terr: {
      home: { owner: 'player', troops: 220, gen: gen('아군 주장', 62, 64, 58) },
      boknyang: { owner: 'neutral', troops: 90, gen: gen('산적 두목', 55, 40, 30) },
      jinryu: { owner: 'neutral', troops: 110, gen: gen('호족 장수', 58, 48, 42) },
      gwandong: { owner: 'wei', troops: 200, gen: gen('장합', 82, 80, 70) },
      heochang: { owner: 'wei', troops: 300, gen: gen('하후돈', 88, 82, 66) },
      wan: { owner: 'neutral', troops: 140, gen: gen('장수(張繡)', 76, 70, 72) },
      eopseong: { owner: 'wei', troops: 240, gen: gen('서황', 84, 78, 64) },
      northgate: { owner: 'wei', troops: 180, gen: gen('악진', 78, 72, 60) },
      jiangling: { owner: 'wu', troops: 220, gen: gen('감녕', 85, 74, 68) },
      jianye: { owner: 'wu', troops: 300, gen: gen('주유', 80, 86, 95) },
      chengdu: { owner: 'shu', troops: 320, gen: gen('관우', 97, 90, 75) },
    },
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// 통솔 보너스 배율
export function commanderMult(g) { return g ? 1 + (g.command || 0) / 180 : 1; }
// 표시용 영토 전투력
export function garrisonPower(t) { return Math.round((t.troops || 0) * commanderMult(t.gen)); }

export function ownedIds(war, faction) {
  return Object.keys(war.terr).filter((id) => war.terr[id].owner === faction);
}
// 특정 영토를 공격할 수 있는, faction 소유의 인접 영토(병력>0)
export function attackOrigins(war, targetId, faction) {
  const t = territoryById(targetId);
  if (!t) return [];
  return t.nb.filter((nid) => war.terr[nid] && war.terr[nid].owner === faction && war.terr[nid].troops > 0);
}

// 전투 판정: att/def = { troops, gen }
export function resolveBattle(att, def) {
  const logs = [];
  let attMorale = 1, defMorale = 1;
  const ag = att.gen, dg = def.gen;
  // 일기토
  if (ag && dg) {
    const a = ag.might + Math.random() * 30;
    const d = dg.might + Math.random() * 30;
    if (a >= d) { defMorale *= 0.82; logs.push(`🤺 일기토: ${ag.name}(무${ag.might}) 승리! ${dg.name} 부상 — 적 사기 저하`); }
    else { attMorale *= 0.82; logs.push(`🤺 일기토: 적장 ${dg.name}(무${dg.might}) 승리! ${ag.name} 부상 — 아군 사기 저하`); }
  } else if (ag && !dg) { defMorale *= 0.9; logs.push('🎖️ 적은 지휘할 장수가 없습니다.'); }
  else if (!ag && dg) { attMorale *= 0.9; logs.push('🎖️ 출정군에 장수가 없어 사기가 낮습니다.'); }

  let attP = att.troops * commanderMult(ag) * attMorale * (0.85 + Math.random() * 0.3);
  let defP = def.troops * commanderMult(dg) * defMorale * (0.85 + Math.random() * 0.3);
  // 계략 (지력)
  if (ag && Math.random() < (ag.intellect || 0) / 220) { defP *= 0.78; logs.push(`🧠 ${ag.name}의 계략 적중! 적 진영 혼란`); }
  if (dg && Math.random() < (dg.intellect || 0) / 220) { attP *= 0.78; logs.push(`🧠 적장 ${dg.name}의 계략! 아군 피해`); }

  const win = attP > defP;
  const total = attP + defP || 1;
  const attLoss = clamp(0.12 + (defP / total) * 0.6, 0.08, 0.9);
  const defLoss = clamp(0.12 + (attP / total) * 0.7, 0.08, 0.96);
  const attLeft = Math.max(0, Math.round(att.troops * (1 - attLoss)));
  let defLeft = Math.max(0, Math.round(def.troops * (1 - defLoss)));
  if (win && defLeft >= attLeft) defLeft = Math.max(0, attLeft - 1);
  logs.push(win
    ? `⚔️ 승리! (아군 ${att.troops}→${attLeft}, 적 ${def.troops}→${defLeft})`
    : `⚔️ 패배… (아군 ${att.troops}→${attLeft}, 적 ${def.troops}→${defLeft})`);
  return { win, logs, attLeft, defLeft };
}

// 적 세력 AI 1턴: 각 세력이 가장 유리한 인접 영토 1곳을 공격 + 병력 증강
export function enemyTurn(war) {
  const logs = [];
  const terr = { ...war.terr };
  for (const id of Object.keys(terr)) terr[id] = { ...terr[id] };
  for (const fac of ['wei', 'shu', 'wu']) {
    const myIds = Object.keys(terr).filter((id) => terr[id].owner === fac);
    let best = null;
    for (const id of myIds) {
      const st = terr[id];
      if (st.troops <= 0) continue;
      for (const nbId of territoryById(id).nb) {
        const nb = terr[nbId];
        if (!nb || nb.owner === fac) continue;
        const myP = st.troops * commanderMult(st.gen);
        const nbP = nb.troops * commanderMult(nb.gen);
        if (myP > nbP * 1.15) {
          const score = myP - nbP;
          if (!best || score > best.score) best = { from: id, to: nbId, score };
        }
      }
    }
    if (best) {
      const att = terr[best.from], def = terr[best.to];
      const res = resolveBattle({ troops: att.troops, gen: att.gen }, { troops: def.troops, gen: def.gen });
      const fromN = territoryById(best.from).name, toN = territoryById(best.to).name;
      const wasPlayer = def.owner === 'player';
      if (res.win) {
        terr[best.to] = { owner: fac, troops: Math.max(1, res.attLeft), gen: att.gen };
        terr[best.from] = { owner: fac, troops: 0, gen: null };
        logs.push(`${factionName(fac)}: ${fromN} → ${toN} 점령${wasPlayer ? ' ⚠️ 아군 영토 상실!' : ''}`);
      } else {
        terr[best.from] = { ...att, troops: res.attLeft };
        terr[best.to] = { ...def, troops: res.defLeft };
        logs.push(`${factionName(fac)}: ${fromN} → ${toN} 공격이 격퇴됨`);
      }
    }
  }
  // 적·세력 영토 병력 증강
  for (const id of Object.keys(terr)) {
    const o = terr[id].owner;
    if (o !== 'player' && o !== 'neutral') {
      terr[id] = { ...terr[id], troops: Math.min(800, terr[id].troops + Math.round(territoryById(id).income / 5) + 8) };
    }
  }
  return { terr, logs };
}

// 천하통일 여부 (적 세력이 남아있지 않음)
export function isUnified(war) {
  return !Object.values(war.terr).some((t) => t.owner === 'wei' || t.owner === 'shu' || t.owner === 'wu' || t.owner === 'neutral');
}

export const WAR_TROOP_COST = 4; // 모병 1명당 골드
