// 게임 화면: 캔버스 월드(70%+) + 미니멀 오버레이 UI(접이식 패널/핫바/조이스틱/모달)

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWorld } from '../hooks/useWorld';
import { CROP_LIST } from '../game/crops';
import { PLACEABLES } from '../game/world/worldgen';
import { WEATHERS, RANKS } from '../game/constants';
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

export default function GameCanvas({ state, derived, time, actions, onSave, slot, saveToSlot, loadFromSlot, newGameInSlot, slotTick }) {
  const w = useWorld({ state, time, actions });
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [win, setWin] = useState(null); // 'inv' | 'craft' | 'quest' | 'slots'
  const [classSkipped, setClassSkipped] = useState(false); // 이번 세션 직업선택 건너뜀
  // 새 게임(1일차 + 직업 미선택)일 때만 직업 선택 표시 — 기존 세이브는 영향 없음
  const showClassSelect = !classSkipped && state.day === 1 && (state.class == null || state.class === 'none');

  // 단축키로 창 열기 (이동키와 충돌 없음)
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'i') setWin((v) => (v === 'inv' ? null : 'inv'));
      else if (k === 'c') setWin((v) => (v === 'craft' ? null : 'craft'));
      else if (k === 'q') setWin((v) => (v === 'quest' ? null : 'quest'));
      else if (k === 'h') setWin((v) => (v === 'hunt' ? null : 'hunt'));
      else if (k === 'g') setWin((v) => (v === 'war' ? null : 'war'));
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

      {/* 상단 좌: 자원 칩 */}
      <div className="hud hud-tl">
        <span className="hud-chip">💰 {fmt(Math.floor(state.money))}</span>
        <span className="hud-chip">🪵 {fmt(state.wood)}</span>
        <span className="hud-chip">🪨 {fmt(state.stone)}</span>
        <span className="hud-chip">👥 {Math.floor(state.population)}/{derived.maxPop}</span>
        <span className="hud-chip">{w.mapId === 'village' ? '🏡' : '🌲'} {w.mapName}</span>
        <span className="hud-chip">🎖️ Lv.{state.level} · ⭐{fmt(state.fame)}</span>
      </div>

      {/* 상단 우: 시간/계절/날씨/직위 + 컨트롤 */}
      <div className="hud hud-tr">
        <span className="hud-chip">{w.hud.night ? '🌙' : '☀️'} {w.hud.clock}</span>
        <span className="hud-chip">{time.season.icon} {time.year}년차 {time.dayOfSeason}일</span>
        <span className="hud-chip">{weather.icon}</span>
        <span className="hud-chip">{rank.icon} {rank.name}</span>
        <span className="hud-chip">🏘️ 마을 Lv.{state.villageLevel} · {derived.grade.name}</span>
        <div className="hud-btns">
          {['pause', 'x1', 'x2'].map((s) => (
            <button key={s} className={'mini-btn' + (w.speedId === s ? ' on' : '')} onClick={() => w.setSpeedId(s)}>
              {s === 'pause' ? '⏸' : s === 'x1' ? '▶' : '⏩'}
            </button>
          ))}
          <button className="mini-btn" onClick={() => w.setZoom((z) => Math.min(2.6, z + 0.2))}>➕</button>
          <button className="mini-btn" onClick={() => w.setZoom((z) => Math.max(0.8, z - 0.2))}>➖</button>
          <button className={'mini-btn' + (w.showMap ? ' on' : '')} onClick={() => w.setShowMap((v) => !v)}>🗺️</button>
          <button className={'mini-btn' + (win === 'inv' ? ' on' : '')} onClick={() => setWin((v) => v === 'inv' ? null : 'inv')}>🎒</button>
          <button className={'mini-btn' + (win === 'craft' ? ' on' : '')} onClick={() => setWin((v) => v === 'craft' ? null : 'craft')}>⚒️</button>
          <button className={'mini-btn' + (win === 'quest' ? ' on' : '')} onClick={() => setWin((v) => v === 'quest' ? null : 'quest')}>📜</button>
          <button className={'mini-btn' + (win === 'hunt' ? ' on' : '')} onClick={() => setWin((v) => v === 'hunt' ? null : 'hunt')}>⚔️</button>
          <button className={'mini-btn' + (win === 'war' ? ' on' : '')} onClick={() => setWin((v) => v === 'war' ? null : 'war')}>🏰</button>
          <button className="mini-btn" onClick={() => setMenuOpen((v) => !v)}>☰</button>
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
          <button className="mini-btn wide" onClick={() => { onSave(); setMenuOpen(false); }}>💾 빠른 저장</button>
          <button className="mini-btn wide" onClick={() => { setWin('slots'); setMenuOpen(false); }}>🗂️ 세이브 슬롯</button>
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

      {/* 핫바 (도구 + 씨앗 작물 + 배치) */}
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
        {w.tool === 'seeds' && !w.placeType && (
          <div className="seed-strip">
            {CROP_LIST.map((c) => (
              <button
                key={c.id}
                className={'seed' + (w.selectedCrop === c.id ? ' on' : '')}
                onClick={() => w.setSelectedCrop(c.id)}
                title={`${c.name} 씨앗 ${c.seedCost}G`}
              >{c.icon}</button>
            ))}
          </div>
        )}
        <div className="build-strip">
          {Object.values(PLACEABLES).map((p) => {
            const locked = state.villageLevel < (p.unlock || 1);
            return (
              <button
                key={p.id}
                className={'slot small' + (w.placeType === p.id ? ' on' : '') + (locked ? ' locked' : '')}
                disabled={locked}
                onClick={() => w.setPlaceType(w.placeType === p.id ? null : p.id)}
                title={locked ? `${p.name} — 마을 Lv.${p.unlock} 해금` : `${p.name} · ${p.desc}`}
              >{locked ? '🔒' : p.icon}</button>
            );
          })}
        </div>
      </div>

      {/* 진행 로그 토스트 */}
      {toast && <div className={'game-toast log-' + toast.kind}>{toast.text}</div>}

      {/* 모바일 조이스틱 + 액션 + 달리기 */}
      <Joystick joy={w.joy} />
      <button className="action-btn" onClick={w.interactFront} aria-label="행동">✋</button>
      <button
        className={'run-btn' + (w.run ? ' on' : '')}
        onClick={() => w.setRun((v) => !v)}
        title="빠른 달리기 (PC: Shift)"
        aria-label="달리기"
      >🏃</button>

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
          <p className="npc-line">“안녕하세요! 마침 장이 섰어요. 가져온 물건 있으면 팔아보세요.”</p>
          <MarketPanel state={state} derived={derived} time={time} actions={actions} />
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
