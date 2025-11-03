import React from "react";

export function ConfiguratorPanel({
  numStalls,
  setNumStalls,
  doorWidth,
  setDoorWidth,
  lightPosition,
  setLightPosition,
  swingOutward,
  setSwingOutward,
  wireframe,
  setWireframe,
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
      <h2 className="mb-4 text-lg font-semibold">Configurator</h2>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Number of Stalls: <span className="font-bold">{numStalls}</span>
        </label>
        <input
          type="range"
          min={1}
          max={8}
          value={numStalls}
          onChange={(e) => setNumStalls(parseInt(e.target.value, 10))}
          className="w-full cursor-pointer accent-cyan-400"
        />
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Door Width (in): <span className="font-bold">{doorWidth}</span>
        </label>
        <input
          type="range"
          min={15}
          max={25}
          step={0.5}
          value={doorWidth}
          onChange={(e) => setDoorWidth(parseFloat(e.target.value))}
          className="w-full cursor-pointer accent-cyan-400"
        />
        <p className="mt-1 text-xs text-slate-300">Standard ≈ 20″</p>
      </div>

      <div className="mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={swingOutward}
            onChange={(e) => setSwingOutward(e.target.checked)}
            className="mr-2 h-4 w-4 cursor-pointer accent-cyan-400"
          />
          <span className="text-sm font-medium text-slate-200">
            Door Swings Outward
          </span>
        </label>
        <p className="mt-1 text-xs text-slate-300 ml-6">
          {swingOutward ? "Swings away from stall" : "Swings into stall"}
        </p>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Light Position: <span className="font-bold">{lightPosition}</span>
        </label>
        <input
          type="range"
          min={-100}
          max={100}
          step={5}
          value={lightPosition}
          onChange={(e) => setLightPosition(parseFloat(e.target.value))}
          className="w-full cursor-pointer accent-cyan-400"
        />
        <p className="mt-1 text-xs text-slate-300">Adjust shadow direction</p>
      </div>

      <div className="mb-2 border-t border-white/10 pt-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(e) => setWireframe(e.target.checked)}
            className="mr-2 h-4 w-4 cursor-pointer accent-orange-400"
          />
          <span className="text-sm font-medium text-slate-200">
            Wireframe Mode (Debug)
          </span>
        </label>
      </div>
    </div>
  );
}

