import type { Vehicle } from './types';

// The one deliberately "designed" element on this grid: the plate reads like
// a plate — tracked-out mono digits in a bordered chip — because a plate
// number is the one field here that's genuinely an identifier, not prose.
export function VehiclePlate({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-xs font-bold tracking-widest text-slate-800">
        {vehicle.plate}
      </span>
      <span className="text-xs text-slate-500">
        {vehicle.make} {vehicle.model}
        <span className="text-slate-400"> · {vehicle.year}</span>
      </span>
    </div>
  );
}
