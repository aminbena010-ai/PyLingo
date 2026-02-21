import { useMemo } from 'react';

interface LevelData {
  id: number;
  unit: number;
  label: string;
  isLocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface Props {
  levels: LevelData[];
  onSelectLevel: (id: number) => void;
}

export const LevelMap = ({ levels, onSelectLevel }: Props) => {
  const layout = useMemo(() => {
    const centerX = 210;
    const wave = 92;
    const stepY = 96;
    const unitGap = 30;
    const layoutData = levels.reduce(
      (acc, level, index) => {
        const isUnitStart = index === 0 || levels[index - 1].unit !== level.unit;
        const baseY = isUnitStart && index !== 0 ? acc.cursorY + unitGap : acc.cursorY;
        const x = centerX + Math.sin(index * 0.9) * wave;
        const y = baseY;

        return {
          cursorY: baseY + stepY,
          nodes: [...acc.nodes, { ...level, index, x, y, isUnitStart }]
        };
      },
      { cursorY: 70, nodes: [] as Array<LevelData & { index: number; x: number; y: number; isUnitStart: boolean }> }
    );

    const height = Math.max(420, layoutData.cursorY + 20);
    const nodes = layoutData.nodes;
    return { nodes, height };
  }, [levels]);

  return (
    <div className="map-wrap">
      <h1 className="map-title">Ruta Python</h1>

      <div className="map-canvas" style={{ height: `${layout.height}px` }}>
        <svg className="map-svg" viewBox={`0 0 420 ${layout.height}`} preserveAspectRatio="none" aria-hidden="true">
          {layout.nodes.slice(1).map((node) => {
            const prev = layout.nodes[node.index - 1];
            const controlX = (prev.x + node.x) / 2 + (node.index % 2 === 0 ? 24 : -24);
            const controlY = (prev.y + node.y) / 2;
            const d = `M ${prev.x} ${prev.y} Q ${controlX} ${controlY} ${node.x} ${node.y}`;
            return <path key={`path-${node.id}`} className="map-path" d={d} />;
          })}
        </svg>

        {layout.nodes.map((node) => (
          <div key={node.id} className="map-node-layer" style={{ left: `${node.x}px`, top: `${node.y}px` }}>
            {node.isUnitStart && <div className="unit-badge">Unidad {node.unit}</div>}
            <button
              type="button"
              disabled={node.isLocked}
              onClick={() => onSelectLevel(node.id)}
              className={`map-node duo-button ${
                node.isLocked ? 'is-locked' : node.isCompleted ? 'is-completed' : 'is-open'
              } ${node.isCurrent ? 'is-current' : ''}`}
            >
              {node.isCompleted ? 'OK' : node.id}
            </button>
            {!node.isLocked && <span className="map-node-label">{node.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
