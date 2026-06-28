// 2D 오버월드: 캐릭터를 걸어다니며 건물에 들어가 콘텐츠를 조작한다.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MAP,
  WORLD_BUILDINGS,
  DECOR_TREES,
  PLAYER_START,
  isWater,
  inBounds,
  buildingAt,
} from '../../game/worldMap';
import Modal from './Modal';
import FarmPanel from '../panels/FarmPanel';
import FishingPanel from '../panels/FishingPanel';
import LivestockPanel from '../panels/LivestockPanel';
import BuildPanel from '../panels/BuildPanel';
import ResearchPanel from '../panels/ResearchPanel';
import MarketPanel from '../panels/MarketPanel';
import TradePanel from '../panels/TradePanel';

// 패널 id → 컴포넌트
const PANELS = {
  farm: FarmPanel,
  fishing: FishingPanel,
  livestock: LivestockPanel,
  build: BuildPanel,
  research: ResearchPanel,
  market: MarketPanel,
  trade: TradePanel,
};

const cellW = 100 / MAP.cols;
const cellH = 100 / MAP.rows;

export default function WorldMap({ state, derived, time, actions }) {
  const [pos, setPos] = useState(PLAYER_START);
  const [building, setBuilding] = useState(null); // 진입한 건물
  const posRef = useRef(pos);
  posRef.current = pos;
  const modalRef = useRef(null);
  modalRef.current = building;

  const open = useCallback((b) => setBuilding(b), []);
  const close = useCallback(() => setBuilding(null), []);

  // 인접한 건물 (스페이스로 진입 가능)
  const nearby = WORLD_BUILDINGS.find(
    (b) => Math.abs(b.x - pos.x) + Math.abs(b.y - pos.y) === 1
  );
  const nearbyRef = useRef(nearby);
  nearbyRef.current = nearby;

  // 이동 시도
  const move = useCallback((dx, dy) => {
    if (modalRef.current) return;
    const p = posRef.current;
    const nx = p.x + dx;
    const ny = p.y + dy;
    if (!inBounds(nx, ny)) return;
    const b = buildingAt(nx, ny);
    if (b) {
      open(b); // 건물로 걸어들어가면 진입
      return;
    }
    if (isWater(ny)) return; // 물은 통과 불가
    setPos({ x: nx, y: ny });
  }, [open]);

  // 키보드 입력
  useEffect(() => {
    const onKey = (e) => {
      // 모달이 열려있으면 ESC만 처리
      if (modalRef.current) {
        if (e.key === 'Escape') close();
        return;
      }
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); move(0, -1); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); move(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); move(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); move(1, 0); break;
        case ' ': case 'Enter':
          e.preventDefault();
          if (nearbyRef.current) open(nearbyRef.current);
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, open, close]);

  const ActivePanel = building ? PANELS[building.panel] : null;

  return (
    <section className="panel world-panel">
      <div className="world-head">
        <span className="world-hint">
          ⌨️ 방향키 / WASD로 이동 · 건물에 들어가거나 스페이스로 진입
        </span>
        {nearby && <span className="enter-prompt">⏎ {nearby.icon} {nearby.name} 들어가기</span>}
      </div>

      <div className="world-board" style={{ aspectRatio: `${MAP.cols} / ${MAP.rows}` }}>
        {/* 지형 타일 */}
        {Array.from({ length: MAP.rows }).map((_, y) =>
          Array.from({ length: MAP.cols }).map((_, x) => (
            <div
              key={`${x}-${y}`}
              className={'terrain ' + (isWater(y) ? 'water' : 'grass')}
              style={{
                left: `${x * cellW}%`,
                top: `${y * cellH}%`,
                width: `${cellW}%`,
                height: `${cellH}%`,
              }}
            />
          ))
        )}

        {/* 장식 나무 */}
        {DECOR_TREES.map((t, i) => (
          <div
            key={'tree' + i}
            className="decor"
            style={{ left: `${t.x * cellW}%`, top: `${t.y * cellH}%`, width: `${cellW}%`, height: `${cellH}%` }}
          >
            🌳
          </div>
        ))}

        {/* 집 개수 시각화 (인구/집 레벨에 따라) */}
        {Array.from({ length: Math.min(state.buildings.house, 6) }).map((_, i) => (
          <div
            key={'house' + i}
            className="decor"
            style={{
              left: `${(i % 3) * cellW}%`,
              top: `${(3 + Math.floor(i / 3)) * cellH}%`,
              width: `${cellW}%`,
              height: `${cellH}%`,
            }}
          >
            🏠
          </div>
        ))}

        {/* 건물(시설) */}
        {WORLD_BUILDINGS.map((b) => (
          <button
            key={b.id}
            className={'world-building' + (nearby && nearby.id === b.id ? ' near' : '')}
            style={{
              left: `${b.x * cellW}%`,
              top: `${b.y * cellH}%`,
              width: `${cellW}%`,
              height: `${cellH}%`,
              background: b.color,
            }}
            onClick={() => open(b)}
            title={b.name}
          >
            <span className="bld-icon">{b.icon}</span>
            <span className="bld-label">{b.name}</span>
          </button>
        ))}

        {/* 플레이어 */}
        <div
          className="player"
          style={{
            left: `${pos.x * cellW}%`,
            top: `${pos.y * cellH}%`,
            width: `${cellW}%`,
            height: `${cellH}%`,
          }}
        >
          🧑‍🌾
        </div>
      </div>

      {/* 모바일/터치용 조작 패드 */}
      <div className="dpad-area">
        <div className="dpad">
          <button className="dbtn up" onClick={() => move(0, -1)}>▲</button>
          <button className="dbtn left" onClick={() => move(-1, 0)}>◀</button>
          <button
            className="dbtn act"
            onClick={() => nearby && open(nearby)}
            disabled={!nearby}
          >
            {nearby ? '들어가기' : '●'}
          </button>
          <button className="dbtn right" onClick={() => move(1, 0)}>▶</button>
          <button className="dbtn down" onClick={() => move(0, 1)}>▼</button>
        </div>
      </div>

      {/* 진입 모달 */}
      {building && (
        <Modal title={building.name} icon={building.icon} onClose={close}>
          <ActivePanel state={state} derived={derived} time={time} actions={actions} />
        </Modal>
      )}
    </section>
  );
}
