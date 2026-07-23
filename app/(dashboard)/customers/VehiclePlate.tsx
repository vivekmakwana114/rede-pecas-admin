import type { Vehicle } from './types';

/**
 * Renders a single vehicle's make, model and year as a compact inline label.
 */
export function VehiclePlate({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
       - {vehicle.make} | {vehicle.model} | {vehicle.year}
      </span>
    </div>
  );
}
