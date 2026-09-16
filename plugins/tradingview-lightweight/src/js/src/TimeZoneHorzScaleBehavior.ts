import {
  defaultHorzScaleBehavior,
  type IHorzScaleBehavior,
  type InternalHorzScaleItem,
  type LocalizationOptions,
  type TickMark,
  type Time,
  type TimeScalePoint,
} from 'lightweight-charts';
import { getTimezoneOffsetSeconds } from './TradingViewUtils';

/**
 * lightweight-charts has no timezone support: it derives axis labels AND tick
 * placement from the raw numeric time read as UTC. Shifting the data by the
 * zone offset gets local labels, but makes the chart coordinate local
 * wall-clock time, which is not unique across a DST "fall back" — both
 * instants in the repeated hour collapse onto one coordinate and one row is
 * lost.
 *
 * Applying the same shift here instead keeps the coordinate true UTC while
 * still grouping and labelling ticks by the local calendar.
 */

// Mirrors the library's intraday weights; see weightByTime in its source.
const INTRADAY_DIVISORS: Array<{ divisor: number; weight: number }> = [
  { divisor: 1, weight: 10 }, // second
  { divisor: 60, weight: 20 }, // minute
  { divisor: 60 * 5, weight: 21 },
  { divisor: 60 * 30, weight: 22 },
  { divisor: 3600, weight: 30 }, // hour
  { divisor: 3600 * 3, weight: 31 },
  { divisor: 3600 * 6, weight: 32 },
  { divisor: 3600 * 12, weight: 33 },
];

const WEIGHT_YEAR = 70;
const WEIGHT_MONTH = 60;
const WEIGHT_DAY = 50;
const WEIGHT_LESS_THAN_SECOND = 0;

/**
 * Weight of `current` relative to `prev`, both already shifted into the target
 * zone so the UTC accessors read local calendar fields.
 */
export function weightByShiftedSeconds(
  currentSec: number,
  prevSec: number
): number {
  const current = new Date(currentSec * 1000);
  const prev = new Date(prevSec * 1000);
  if (current.getUTCFullYear() !== prev.getUTCFullYear()) return WEIGHT_YEAR;
  if (current.getUTCMonth() !== prev.getUTCMonth()) return WEIGHT_MONTH;
  if (current.getUTCDate() !== prev.getUTCDate()) return WEIGHT_DAY;
  for (let i = INTRADAY_DIVISORS.length - 1; i >= 0; i -= 1) {
    const { divisor, weight } = INTRADAY_DIVISORS[i];
    if (Math.floor(prevSec / divisor) !== Math.floor(currentSec / divisor)) {
      return weight;
    }
  }
  return WEIGHT_LESS_THAN_SECOND;
}

export interface TimeZoneAware {
  setTimeZone: (timeZone: string | undefined) => void;
}

export type ZonedHorzScaleBehavior = IHorzScaleBehavior<Time> & TimeZoneAware;

/**
 * Built from an injected base class so tests can supply the real library's
 * behavior while the rest of the suite keeps the module mock.
 */
export function createBehaviorClass(
  Base: new () => IHorzScaleBehavior<Time>
): new () => ZonedHorzScaleBehavior {
  return class TimeZoneHorzScaleBehavior extends Base {
    private timeZone: string | undefined;

    setTimeZone(timeZone: string | undefined): void {
      this.timeZone = timeZone;
    }

    /** Epoch seconds shifted so UTC accessors yield local calendar fields. */
    private shift(utcSeconds: number): number {
      return (
        utcSeconds + getTimezoneOffsetSeconds(utcSeconds * 1000, this.timeZone)
      );
    }

    /** `key()` is public and returns epoch seconds, so no internals are read. */
    private shiftedSecondsOf(item: InternalHorzScaleItem): number {
      const seconds = this.key(item) as unknown as number;
      return this.shift(seconds);
    }

    fillWeightsForPoints(
      sortedTimePoints: readonly TimeScalePoint[],
      startIndex: number
    ): void {
      if (sortedTimePoints.length === 0) return;

      const points = sortedTimePoints as unknown as Array<{
        time: InternalHorzScaleItem;
        timeWeight: number;
      }>;
      const shiftedAt = (i: number): number =>
        this.shiftedSecondsOf(points[i].time);

      let prevSec = startIndex === 0 ? null : shiftedAt(startIndex - 1);
      let totalTimeDiff = 0;

      for (let i = startIndex; i < points.length; i += 1) {
        const currentSec = shiftedAt(i);
        if (prevSec !== null) {
          points[i].timeWeight = weightByShiftedSeconds(currentSec, prevSec);
          totalTimeDiff += currentSec - prevSec;
        }
        prevSec = currentSec;
      }

      // Same first-point guess the library makes: pretend the previous point
      // sat one average step back, else the leading tick never gets a weight.
      if (startIndex === 0 && points.length > 1) {
        const averageTimeDiff = Math.ceil(totalTimeDiff / (points.length - 1));
        const firstSec = shiftedAt(0);
        points[0].timeWeight = weightByShiftedSeconds(
          firstSec,
          firstSec - averageTimeDiff
        );
      }
    }

    formatHorzItem(item: InternalHorzScaleItem): string {
      const shifted = this.convertHorzItemToInternal(
        this.shiftedSecondsOf(item) as Time
      );
      return super.formatHorzItem(shifted);
    }

    formatTickmark(
      tickMark: TickMark,
      localizationOptions: LocalizationOptions<Time>
    ): string {
      const shiftedSeconds = this.shiftedSecondsOf(tickMark.time) as Time;
      return super.formatTickmark(
        {
          ...tickMark,
          time: this.convertHorzItemToInternal(shiftedSeconds),
          originalTime: shiftedSeconds,
        },
        localizationOptions
      );
    }
  };
}

let ProductionBehavior: (new () => ZonedHorzScaleBehavior) | null = null;

export default function createTimeZoneHorzScaleBehavior(
  timeZone: string | undefined
): ZonedHorzScaleBehavior {
  if (ProductionBehavior == null) {
    ProductionBehavior = createBehaviorClass(defaultHorzScaleBehavior());
  }
  const behavior = new ProductionBehavior();
  behavior.setTimeZone(timeZone);
  return behavior;
}
