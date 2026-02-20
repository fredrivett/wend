import { type ChangeEvent, useState } from 'react';

export interface LayoutOptions {
  'elk.algorithm': string;
  'elk.direction': string;
  'elk.spacing.nodeNode': string;
  'elk.layered.spacing.nodeNodeBetweenLayers': string;
  'elk.layered.crossingMinimization.strategy': string;
  'elk.layered.nodePlacement.strategy': string;
  'elk.layered.edgeRouting': string;
}

export const defaultLayoutOptions: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '40',
  'elk.layered.spacing.nodeNodeBetweenLayers': '60',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.edgeRouting': 'ORTHOGONAL',
};

const algorithms = [
  { value: 'layered', label: 'Layered (hierarchical)' },
  { value: 'mrtree', label: 'Mr. Tree' },
  { value: 'force', label: 'Force-directed' },
  { value: 'stress', label: 'Stress' },
  { value: 'box', label: 'Box packing' },
];

const directions = [
  { value: 'DOWN', label: 'Down' },
  { value: 'UP', label: 'Up' },
  { value: 'RIGHT', label: 'Right' },
  { value: 'LEFT', label: 'Left' },
];

const crossingStrategies = [
  { value: 'LAYER_SWEEP', label: 'Layer sweep' },
  { value: 'INTERACTIVE', label: 'Interactive' },
];

const nodePlacementStrategies = [
  { value: 'BRANDES_KOEPF', label: 'Brandes-Koepf (compact)' },
  { value: 'LINEAR_SEGMENTS', label: 'Linear segments' },
  { value: 'NETWORK_SIMPLEX', label: 'Network simplex (balanced)' },
  { value: 'SIMPLE', label: 'Simple' },
];

const edgeRoutingOptions = [
  { value: 'ORTHOGONAL', label: 'Orthogonal (right angles)' },
  { value: 'POLYLINE', label: 'Polyline' },
  { value: 'SPLINES', label: 'Splines' },
];

const selectClasses =
  'w-full px-1.5 py-1 border border-gray-200 rounded text-xs bg-white text-gray-800';

const labelClasses = 'text-[11px] font-medium text-gray-500 mb-0.5';

interface LayoutSettingsProps {
  options: LayoutOptions;
  onChange: (options: LayoutOptions) => void;
}

export function LayoutSettings({ options, onChange }: LayoutSettingsProps) {
  const [open, setOpen] = useState(false);

  const isLayered = options['elk.algorithm'] === 'layered';

  function update(key: keyof LayoutOptions, value: string) {
    onChange({ ...options, [key]: value });
  }

  return (
    <div className="absolute top-3 right-3 z-10">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer shadow-sm ${
          open ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
        }`}
      >
        Layout
      </button>

      {open && (
        <div className="mt-2 bg-white rounded-xl p-3.5 shadow-lg border border-gray-200 w-[220px] flex flex-col gap-2.5">
          <div>
            <div className={labelClasses}>Algorithm</div>
            <select
              className={selectClasses}
              value={options['elk.algorithm']}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                update('elk.algorithm', e.target.value)
              }
            >
              {algorithms.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className={labelClasses}>Direction</div>
            <select
              className={selectClasses}
              value={options['elk.direction']}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                update('elk.direction', e.target.value)
              }
            >
              {directions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className={labelClasses}>Node spacing</div>
            <input
              type="range"
              min="10"
              max="120"
              value={options['elk.spacing.nodeNode']}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                update('elk.spacing.nodeNode', e.target.value)
              }
              className="w-full"
            />
            <div className="text-[10px] text-gray-400 text-right">
              {options['elk.spacing.nodeNode']}px
            </div>
          </div>

          <div>
            <div className={labelClasses}>Layer spacing</div>
            <input
              type="range"
              min="20"
              max="200"
              value={options['elk.layered.spacing.nodeNodeBetweenLayers']}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                update('elk.layered.spacing.nodeNodeBetweenLayers', e.target.value)
              }
              className="w-full"
            />
            <div className="text-[10px] text-gray-400 text-right">
              {options['elk.layered.spacing.nodeNodeBetweenLayers']}px
            </div>
          </div>

          {isLayered && (
            <>
              <div>
                <div className={labelClasses}>Edge routing</div>
                <select
                  className={selectClasses}
                  value={options['elk.layered.edgeRouting']}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    update('elk.layered.edgeRouting', e.target.value)
                  }
                >
                  {edgeRoutingOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className={labelClasses}>Node placement</div>
                <select
                  className={selectClasses}
                  value={options['elk.layered.nodePlacement.strategy']}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    update('elk.layered.nodePlacement.strategy', e.target.value)
                  }
                >
                  {nodePlacementStrategies.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className={labelClasses}>Crossing minimization</div>
                <select
                  className={selectClasses}
                  value={options['elk.layered.crossingMinimization.strategy']}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    update('elk.layered.crossingMinimization.strategy', e.target.value)
                  }
                >
                  {crossingStrategies.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => onChange({ ...defaultLayoutOptions })}
            className="px-2 py-1 border border-gray-200 rounded bg-gray-50 text-[11px] text-gray-500 cursor-pointer mt-0.5"
          >
            Reset defaults
          </button>
        </div>
      )}
    </div>
  );
}
