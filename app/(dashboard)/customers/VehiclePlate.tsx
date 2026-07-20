import type { Vehicle } from './types';

// The one deliberately "designed" element on this grid: the plate reads like
// a plate — tracked-out mono digits in a bordered chip — because a plate
// number is the one field here that's genuinely an identifier, not prose.
export function VehiclePlate({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
       - {vehicle.make} | {vehicle.model} | {vehicle.year}
      </span>
    </div>
  );
}
