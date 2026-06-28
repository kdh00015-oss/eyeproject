// 게임 화면: 캔버스 월드(70%+) + 미니멀 오버레이 UI(접이식 패널/핫바/조이스틱/모달)

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWorld } from '../hooks/useWorld';
import { CROP_LIST } from '../game/crops';
import { PLACEABLES } from '../game/world/worldgen';
import { WEATHERS, RANKS, RECLAIM_BASE_COST, FARM_PLOTS_MAX, FARM_PLOTS_START } from '../game/constants';
import { fmt } from '../game/util';
import Modal from './world/Modal';
import ResourcePanel from './ResourcePanel';
import InfoPanel from './InfoPanel';
import FishingPanel from './panels/FishingPanel';
import LivestockPanel from './panels/LivestockPanel';
import BuildPanel from './panels/BuildPanel';
import ResearchPanel from './panels/ResearchPanel';
import MarketPanel from './panels/MarketPanel';
import TradePanel from './panels/TradePanel';
import WorkersPanel from './panels/WorkersPanel';
import InventoryWindow from './windows/InventoryWindow';
import CraftingWindow from './windows/CraftingWindow';
import QuestWindow from './windows/QuestWindow';
import HuntWindow from './windows/HuntWindow';
import MilitaryWindow from './windows/MilitaryWindow';
import SaveSlots from './windows/SaveSlots';
import ClassSelect from './windows/ClassSelect';
import WorldMap from './windows/WorldMap';
import NpcDialog from './windows/NpcDialog';
import CollectionWindow from './windows/CollectionWindow';
import DashboardWindow from './windows/DashboardWindow';

const PANELS = {
  fishing: FishingPanel, livestock: LivestockPanel, build: BuildPanel,
  research: ResearchPanel, market: MarketPanel, trade: TradePanel, workers: WorkersPanel,
};
const TOOLS = [
  { id: 'axe', icon: '🪓', name: '도끼' },
  { id: 'pickaxe', icon: '⛏️', name: '곡괭이' },
  { id: 'rod', icon: '🎣', name: '낚싯대' },
  { id: 'seeds', icon: '🌱', name: '씨앗' },
];

// HUD 칩을 누르면 보여줄 상세 설명
const INFO = {
  money: { t: '💰 골드', b: '작물·생선·축산물·광물을 시장(또는 상인 NPC)에 팔아 법니다. 한 번에 많이 팔면 시세가 내려가니 여러 번 나눠 파는 게 이득이에요. 시장엔 판매 수수료가 있습니다.' },
  wood: { t: '🪵 목재', b: '도끼(1번 도구)로 나무를 베어 모읍니다. 건설·제작의 기본 재료. 벤 나무는 3일 뒤 다시 자랍니다.' },
  stone: { t: '🪨 돌', b: '곡괭이(2번 도구)로 바위를 캐서 모읍니다. 산에서는 철광석·마력수정도 나옵니다. 바위는 4일 뒤 다시 생깁니다.' },
  pop: { t: '👥 인구', b: '행복도 60% 이상 + 식량 충분 + 주거 여유(집🏠으로 최대인구↑)이면 매일 늘어납니다. 행복도가 35% 아래면 떠납니다.' },
  level: { t: '🎖️ 레벨 · 명성', b: '제작·전투·퀘스트·업적으로 플레이어 레벨과 명성이 오릅니다. 명성은 직위 승급에도 쓰입니다.' },
  map: { t: '🗺️ 현재 지역', b: '도시·마을·들판·산을 오갑니다. 우측 상단 🌐(전체 지도)에서 한 번에 빠르게 이동할 수 있어요.' },
  time: { t: '🕗 시간', b: '하루가 흐르면 생산·급여·세금·이벤트가 정산됩니다. 속도(⏸▶⏩)로 흐름을 조절하세요.' },
  season: { t: '🌸 계절', b: '봄·여름·가을·겨울. 작물마다 심을 수 있는 계절이 다르고, 제철이 아니면 시세가 오릅니다.' },
  weather: { t: '☀️ 날씨', b: '맑음·비·폭풍·가뭄이 작물 성장과 어획량에 영향을 줍니다. 폭풍엔 낚시가 잘 안 됩니다.' },
  rank: { t: '🎖️ 직위', b: '인구·자산·영향력·건물 등을 모으면 자동 승급합니다. 평민 → … → 국왕. 촌장부터 장수·전쟁이 열립니다.' },
  village: { t: '🏘️ 마을 레벨 · 등급', b: '건물·인구·명성·영향력으로 마을 점수가 오르며 레벨업합니다. 레벨이 오르면 새 건물이 해금되고 최대인구가 늘어요.' },
};

export default function GameCanvas({ state, derived, time, actions, onSave, slot, saveToSlot, loadFromSlot, newGameInSlot, slotTick }) {
  const w = useWorld({ state, time, actions });
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [win, setWin] = useState(null); // 'inv' | 'craft' | 'quest' | 'slots'
  const [classSkipped, setClassSkipped] = useState(false); // 이번 세션 직업선택 건너뜀
  const [worldOpen, setWorldOpen] = useState(false); // 전체 지도 오버레이
  const [info, setInfo] = useState(null); // HUD 칩 상세 팝업
  // 새 게임(1일차 + 직업 미선택)일 때만 직업 선택 표시 — 기존 세이브는 영향 없음
  const showClassSelect = !classSkipped && state.day === 1 && (state.class == null || state.class === 'none');
  // 모달/창이 열려 있으면 월드 조작 UI(핫바·조이스틱·버튼)를 숨겨 겹침 방지(특히 모바일)
  const overlayOpen = !!(win || worldOpen || showClassSelect || w.activeBuilding || w.talkNpc);

  // 단축키로 창 열기 (이동키와 충돌 없음)
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'i') setWin((v) => (v === 'inv' ? null : 'inv'));
      else if (k === 'c') setWin((v) => (v === 'craft' ? null : 'craft'));
      else if (k === 'q') setWin((v) => (v === 'quest' ? null : 'quest'));
      else if (k === 'h') setWin((v) => (v === 'hunt' ? null : 'hunt'));
      else if (k === 'g') setWin((v) => (v === 'war' ? null : 'war'));
      else if (k === 'b') setWin((v) => (v === 'dex' ? null : 'dex'));
      else if (k === 'v') setWin((v) => (v === 'dash' ? null : 'dash'));
      else if (k === 'escape') setWin(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const WINDOWS = {
    inv: { title: '인벤토리', icon: '🎒', el: <InventoryWindow state={state} actions={actions} /> },
    craft: { title: '제작', icon: '⚒️', el: <CraftingWindow state={state} actions={actions} /> },
    quest: { title: '퀘스트', icon: '📜', el: <QuestWindow state={state} derived={derived} actions={actions} /> },
    hunt: { title: '사냥', icon: '⚔️', el: <HuntWindow state={state} actions={actions} /> },
    war: { title: '군사·전쟁', icon: '🏰', el: <MilitaryWindow state={state} actions={actions} /> },
    dex: { title: '도감·업적', icon: '📖', el: <CollectionWindow state={state} /> },
    dash: { title: '대시보드', icon: '📊', el: <DashboardWindow state={state} derived={derived} /> },
    slots: { title: '세이브 슬롯', icon: '💾', el: <SaveSlots current={slot} slotTick={slotTick} onSave={saveToSlot} onLoad={loadFromSlot} onNew={(i, cls) => { newGameInSlot(i, cls); setClassSkipped(false); }} /> },
  };

  // 최신 진행 로그를 토스트로 표시
  const [toast, setToast] = useState(null);
  const lastLog = useRef(state.log[0]);
  useEffect(() => {
    const top = state.log[0];
    if (top && top !== lastLog.current) {
      lastLog.current = top;
      setToast(top);
      const id = setTimeout(() => setToast(null), 2400);
      return () => clearTimeout(id);
    }
  }, [state.log]);

  const weather = WEATHERS[state.weather];
  const rank = RANKS[state.rankIndex];
  const ActivePanel = w.activeBuilding ? PANELS[w.activeBuilding.panel] : null;

  const onWheel = useCallback((e) => {
    w.setZoom((z) => Math.max(0.8, Math.min(2.6, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  }, [w]);

  return (
    <div className="game-root">
      {/* 월드 캔버스 */}
      <div className="canvas-wrap" ref={w.wrapRef}>
        <canvas ref={w.canvasRef} onClick={w.onCanvasClick} onWheel={onWheel} />
      </div>

      {/* 상단 좌: 자원 칩 (누르면 상세 설명) */}
      <div className="hud hud-tl">
        <button className="hud-chip tappable" onClick={() => setInfo('money')}>💰 {fmt(Math.floor(state.money))}</button>
        <button className="hud-chip tappable" onClick={() => setInfo('wood')}>🪵 {fmt(state.wood)}</button>
        <button className="hud-chip tappable" onClick={() => setInfo('stone')}>🪨 {fmt(state.stone)}</button>
        <button className="hud-chip tappable" onClick={() => setInfo('pop')}>👥 {Math.floor(state.population)}/{derived.maxPop}</button>
        <button className="hud-chip tappable" onClick={() => setInfo('happy')}>😊 {Math.round(state.happiness)}%</button>
        <button className="hud-chip tappable" onClick={() => setInfo('map')}>{w.mapIcon} {w.mapName}</button>
        <button className="hud-chip tappable" onClick={() => setInfo('level')}>🎖️ Lv.{state.level} · ⭐{fmt(state.fame)}</button>
      </div>

      {/* 상단 우: 시간/계절/날씨/직위 + 컨트롤 */}
      <div className="hud hud-tr">
        <button className="hud-chip tappable" onClick={() => setInfo('time')}>{w.hud.night ? '🌙' : '☀️'} {w.hud.clock}</button>
        <button className="hud-chip tappable" onClick={() => setInfo('season')}>{time.season.icon} {time.year}년차 {time.dayOfSeason}일</button>
        <button className="hud-chip tappable" onClick={() => setInfo('weather')}>{weather.icon}</button>
        <button className="hud-chip tappable" onClick={() => setInfo('rank')}>{rank.icon} {rank.name}</button>
        <button className="hud-chip tappable" onClick={() => setInfo('village')}>🏘️ 마을 Lv.{state.villageLevel} · {derived.grade.name}</button>
        <div className="hud-btns">
          {['pause', 'x1', 'x2'].map((s) => (
            <button key={s} className={'mini-btn' + (w.speedId === s ? ' on' : '')} onClick={() => w.setSpeedId(s)}>
              {s === 'pause' ? '⏸' : s === 'x1' ? '▶' : '⏩'}
            </button>
          ))}
          <button className="mini-btn" onClick={() => w.setZoom((z) => Math.min(2.6, z + 0.2))}>➕</button>
          <button className="mini-btn" onClick={() => w.setZoom((z) => Math.max(0.8, z - 0.2))}>➖</button>
          <button className={'mini-btn' + (w.showMap ? ' on' : '')} onClick={() => w.setShowMap((v) => !v)} title="현재 맵 미니맵 (M)">🗺️</button>
          <button className={'mini-btn' + (worldOpen ? ' on' : '')} onClick={() => setWorldOpen((v) => !v)} title="전체 지도 · 빠른 이동">🌐</button>
          <button className={'mini-btn' + (menuOpen ? ' on' : '')} onClick={() => setMenuOpen((v) => !v)} title="메뉴 (인벤토리·제작·퀘스트 등)">☰</button>
        </div>
      </div>

      {/* 미니맵 */}
      {w.showMap && (
        <div className="minimap-wrap">
          <canvas ref={w.miniRef} width={220} height={160} className="minimap" />
          <button className="minimap-close" onClick={() => w.setShowMap(false)}>✕</button>
        </div>
      )}

      {menuOpen && (
        <div className="menu-pop">
          <div className="menu-grid">
            {[
              { id: 'inv', icon: '🎒', name: '인벤토리' },
              { id: 'craft', icon: '⚒️', name: '제작' },
              { id: 'quest', icon: '📜', name: '퀘스트' },
              { id: 'hunt', icon: '⚔️', name: '사냥' },
              { id: 'war', icon: '🏰', name: '군사' },
              { id: 'dex', icon: '📖', name: '도감' },
              { id: 'dash', icon: '📊', name: '대시보드' },
              { id: 'slots', icon: '🗂️', name: '세이브' },
            ].map((b) => (
              <button key={b.id} className={'menu-item' + (win === b.id ? ' on' : '')}
                onClick={() => { setWin((v) => (v === b.id ? null : b.id)); setMenuOpen(false); }}>
                <span className="menu-ic">{b.icon}</span><span className="menu-lb">{b.name}</span>
              </button>
            ))}
          </div>
          <button className="mini-btn wide" onClick={() => { onSave(); setMenuOpen(false); }}>💾 빠른 저장</button>
        </div>
      )}

      {/* 좌측 토글 버튼 + 드로어 */}
      <button className={'drawer-tab left' + (leftOpen ? ' open' : '')} onClick={() => setLeftOpen((v) => !v)}>{leftOpen ? '✕' : '📊'}</button>
      <div className={'drawer left' + (leftOpen ? ' open' : '')}>
        <ResourcePanel state={state} derived={derived} />
      </div>

      {/* 우측 토글 버튼 + 드로어 */}
      <button className={'drawer-tab right' + (rightOpen ? ' open' : '')} onClick={() => setRightOpen((v) => !v)}>{rightOpen ? '✕' : '🏛️'}</button>
      <div className={'drawer right' + (rightOpen ? ' open' : '')}>
        <InfoPanel state={state} derived={derived} />
      </div>

      {/* 배치 모드 팔레트 */}
      {w.placeType ? (() => {
        const d = PLACEABLES[w.placeType]; const c = d.cost || {};
        return (
          <div className="place-bar">
            <span className="place-info">📦 {d.icon} {d.name} — {d.desc} ·
              {c.gold ? ` 💰${c.gold}` : ''}{c.wood ? ` 🪵${c.wood}` : ''}{c.stone ? ` 🪨${c.stone}` : ''}</span>
            <span className="place-hint">🟩설치가능 / 🟥불가 — 정면 클릭/스페이스</span>
            <button className="mini-btn" onClick={() => w.setPlaceType(null)}>취소 ✕</button>
          </div>
        );
      })() : null}

      {/* 이동/철거 모드 안내 */}
      {w.removeMode && !w.placeType && (
        <div className="place-bar">
          <span className="place-info">🔨 이동/철거 모드 — 설치한 건물을 클릭(또는 ✋)하면 철거하고 자원을 돌려받습니다.</span>
          <span className="place-hint">다른 곳에 다시 지으면 = 이동</span>
          <button className="mini-btn" onClick={() => w.setRemoveMode(false)}>끄기 ✕</button>
        </div>
      )}

      {/* 핫바 (도구 + 씨앗 작물 + 배치) */}
      {!overlayOpen && (
      <div className="hotbar">
        {TOOLS.map((t, i) => (
          <button
            key={t.id}
            className={'slot' + (w.tool === t.id && !w.placeType ? ' on' : '')}
            onClick={() => { w.setPlaceType(null); w.setTool(t.id); }}
            title={t.name}
          >
            <span className="slot-key">{i + 1}</span>
            <span className="slot-icon">{t.icon}</span>
          </button>
        ))}
        {w.tool === 'seeds' && !w.placeType && (() => {
          const canReclaim = state.farm.length < FARM_PLOTS_MAX;
          const reclaimCost = RECLAIM_BASE_COST * Math.max(1, state.farm.length - FARM_PLOTS_START + 1);
          return (
            <div className="seed-strip">
              {CROP_LIST.map((c) => (
                <button
                  key={c.id}
                  className={'seed' + (w.selectedCrop === c.id ? ' on' : '')}
                  onClick={() => w.setSelectedCrop(c.id)}
                  title={`${c.name} 씨앗 ${c.seedCost}G`}
                >{c.icon}</button>
              ))}
              <button
                className="seed reclaim"
                disabled={!canReclaim || state.money < reclaimCost}
                onClick={() => actions.reclaim()}
                title={canReclaim ? `밭 개간 — ${reclaimCost}G (잠긴 🔒 칸을 늘립니다)` : '밭이 최대 크기입니다'}
              >{canReclaim ? `🪓${reclaimCost}` : '🪓MAX'}</button>
            </div>
          );
        })()}
        <div className="build-strip">
          <button
            className={'slot small' + (w.removeMode ? ' on' : '')}
            onClick={() => { w.setRemoveMode((v) => !v); w.setPlaceType(null); }}
            title="이동/철거 모드: 설치한 건물을 눌러 철거(자원 환급). 다른 곳에 다시 지으면 이동됩니다."
          >🔨</button>
          {Object.values(PLACEABLES).map((p) => {
            const locked = state.villageLevel < (p.unlock || 1);
            return (
              <button
                key={p.id}
                className={'slot small' + (w.placeType === p.id ? ' on' : '') + (locked ? ' locked' : '')}
                disabled={locked}
                onClick={() => { w.setRemoveMode(false); w.setPlaceType(w.placeType === p.id ? null : p.id); }}
                title={locked ? `${p.name} — 마을 Lv.${p.unlock} 해금` : `${p.name} · ${p.desc}`}
              >{locked ? '🔒' : p.icon}</button>
            );
          })}
        </div>
      </div>
      )}

      {/* 진행 로그 토스트 */}
      {toast && <div className={'game-toast log-' + toast.kind}>{toast.text}</div>}

      {/* HUD 칩 상세 설명 팝업 */}
      {info && (INFO[info] || info === 'happy') && (
        <div className="info-pop-backdrop" onClick={() => setInfo(null)}>
          <div className="info-pop" onClick={(e) => e.stopPropagation()}>
            {info === 'happy' ? (
              <>
                <h3 className="info-pop-title">😊 행복도 {Math.round(state.happiness)}%</h3>
                <p className="info-pop-body">행복도는 아래 5가지 <b>만족도의 평균</b>에서 세율을 뺀 값으로 정해집니다. 60% 이상이면 인구가 늘고, 35% 미만이면 떠납니다.</p>
                <ul className="sat-list">
                  {[['food', '🍗 배고픔'], ['safety', '🛡️ 안전'], ['culture', '🎭 문화'], ['education', '📚 교육'], ['hygiene', '🚿 위생']].map(([k, name]) => {
                    const v = Math.round(state.satisfaction[k]);
                    return (
                      <li key={k} className="sat-row">
                        <span className="sat-name">{name}</span>
                        <span className="sat-bar"><span className="sat-fill" style={{ width: `${v}%`, background: v > 60 ? '#6dd36d' : v > 35 ? '#f4c542' : '#e0604a' }} /></span>
                        <span className="sat-val">{v}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="info-pop-body" style={{ marginTop: 8 }}>세율 {state.taxRate}% · 올리려면: 식량 확보, 우물🚿·학교📚·화단🎭·경비탑🛡️ 등을 설치하세요.</p>
                <button className="mini-btn wide" onClick={() => setInfo(null)}>알겠어요</button>
              </>
            ) : (
              <>
                <h3 className="info-pop-title">{INFO[info].t}</h3>
                <p className="info-pop-body">{INFO[info].b}</p>
                <button className="mini-btn wide" onClick={() => setInfo(null)}>알겠어요</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 모바일 조이스틱 + 액션 + 달리기 (창이 열려 있으면 숨김) */}
      {!overlayOpen && (
        <>
          <Joystick joy={w.joy} />
          <button className="action-btn" onClick={w.interactFront} aria-label="행동">✋</button>
          <button
            className={'run-btn' + (w.run ? ' on' : '')}
            onClick={() => w.setRun((v) => !v)}
            title="빠른 달리기 (PC: Shift)"
            aria-label="달리기"
          >🏃</button>
        </>
      )}

      {/* 건물 진입 모달 */}
      {w.activeBuilding && ActivePanel && (
        <Modal title={w.activeBuilding.name} icon="🏠" onClose={() => w.setActiveBuilding(null)}>
          <ActivePanel state={state} derived={derived} time={time} actions={actions} />
        </Modal>
      )}

      {/* 인벤토리/제작/퀘스트/세이브 창 */}
      {win && WINDOWS[win] && (
        <Modal title={WINDOWS[win].title} icon={WINDOWS[win].icon} onClose={() => setWin(null)}>
          {WINDOWS[win].el}
        </Modal>
      )}

      {/* 전체 지도 (빠른 이동) */}
      {worldOpen && (
        <WorldMap current={w.mapId} onTravel={w.travelTo} onClose={() => setWorldOpen(false)} />
      )}

      {/* 시작 직업 선택 */}
      {showClassSelect && (
        <ClassSelect
          onPick={(cls) => { actions.newGame(cls); setClassSkipped(true); }}
          onSkip={() => setClassSkipped(true)}
        />
      )}

      {/* NPC 대화/거래 */}
      {w.talkNpc && (
        <Modal title={`${w.talkNpc.name}`} icon="🧑" onClose={() => w.setTalkNpc(null)}>
          <NpcDialog npc={w.talkNpc} state={state} derived={derived} time={time} actions={actions} />
        </Modal>
      )}
    </div>
  );
}

// 터치 조이스틱
function Joystick({ joy }) {
  const ref = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);

  const start = (e) => { dragging.current = true; joy.joyStart(); move(e); };
  const move = (e) => {
    if (!dragging.current) return;
    const el = ref.current; const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const pt = e.touches ? e.touches[0] : e;
    let dx = pt.clientX - cx, dy = pt.clientY - cy;
    const max = rect.width / 2;
    const len = Math.hypot(dx, dy) || 1;
    const cl = Math.min(len, max);
    dx = (dx / len) * cl; dy = (dy / len) * cl;
    setKnob({ x: dx, y: dy });
    joy.joyMove(dx / max, dy / max);
  };
  const end = () => { dragging.current = false; setKnob({ x: 0, y: 0 }); joy.joyEnd(); };

  return (
    <div
      className="joystick"
      ref={ref}
      onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
      onTouchStart={start} onTouchMove={move} onTouchEnd={end}
    >
      <div className="knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
