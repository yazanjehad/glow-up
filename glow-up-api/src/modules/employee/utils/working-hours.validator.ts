import { BadRequestException } from '@nestjs/common';
import { BreakCustom, BreakWeekly, WorkingDay } from '../../provider/schemas/working-day.schema';
import { WeekDay } from '../../../common/enum/weekday.enum';

export class EmployeeWorkingHoursValidator {
  private static readonly MAX_BREAK_DURATION_MINUTES = 60;
  private static readonly MAX_BREAKS_PER_DAY = 3;

  // ================================
  // Helpers
  // ================================

  private static isValidTimeFormat(time: string): boolean {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  }

  private static toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private static isOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  private static getDayNameFromDate(date: Date): WeekDay {
    const days = [
      WeekDay.SUNDAY,
      WeekDay.MONDAY,
      WeekDay.TUESDAY,
      WeekDay.WEDNESDAY,
      WeekDay.THURSDAY,
      WeekDay.FRIDAY,
      WeekDay.SATURDAY,
    ];
    return days[date.getDay()];
  }

  // ================================
  // Weekly Schedule Validation
  // ================================
  static validateWeeklySchedule(weekly: WorkingDay[]) {
    const seenDays = new Set<string>();

    weekly.forEach((day) => {
      // ===== Duplicate Day =====
      if (seenDays.has(day.day)) {
        throw new BadRequestException({
          message: 'common.errors.DUPLICATE_DAY_ENTRY',
          args: { day: `common.days.${day.day}` },
        });
      }
      seenDays.add(day.day);

      // ===== If Open Day =====
      if (day.isOpen) {
        if (!day.openTime || !day.closeTime) {
          throw new BadRequestException({
            message: 'common.errors.OPEN_DAY_MUST_HAVE_OPEN_CLOSE',
            args: { day: `common.days.${day.day}`},
          });
        }

        if (!this.isValidTimeFormat(day.openTime) ||
            !this.isValidTimeFormat(day.closeTime)) {
          throw new BadRequestException({
            message: 'common.errors.INVALID_TIME_FORMAT_HHMM',
            args: { day: `common.days.${day.day}` },
          });
        }

        const open = this.toMinutes(day.openTime);
        const close = this.toMinutes(day.closeTime);

        if (open >= close) {
          throw new BadRequestException({
            message: 'common.errors.OPEN_BEFORE_CLOSE',
            args: { day: `common.days.${day.day}` },
          });
        }
      }
    });
  }

  // // ================================
  // // Weekly Break Validation
  // // ================================

  // static validateWeeklyBreaks(
  //   weeklySchedule: WorkingDay[],
  //   weeklyBreaks: BreakWeekly[],
  // ) {
  //   const breaksPerDay: Record<string, BreakWeekly[]> = {};

  //   weeklyBreaks.forEach((br) => {
  //     const workingDay = weeklySchedule.find((d) => d.day === br.day);

  //     // If day is closed or not found:
  //     // - New breaks (without _id) are NOT allowed on closed days
  //     // - Existing breaks (with _id) are allowed to stay but cannot be modified
  //     if (!workingDay || !workingDay.isOpen) {
  //       if (!br._id) {
  //         throw new BadRequestException({
  //           message: 'common.errors.CANNOT_ADD_BREAK_CLOSED_DAY',
  //           args: { day: br.day },
  //         });
  //       }
  //       // Existing breaks on closed days: skip validation but keep them
  //       return;
  //     }

  //     const breakStart = this.toMinutes(br.startTime);
  //     const breakEnd = this.toMinutes(br.endTime);
  //     const open = this.toMinutes(workingDay.openTime || '00:00');
  //     const close = this.toMinutes(workingDay.closeTime || '23:59');

  //     if (breakStart >= breakEnd) {
  //       throw new BadRequestException({
  //         message: 'common.errors.BREAK_INVALID_RANGE',
  //         args: { day: br.day, startTime: br.startTime, endTime: br.endTime },
  //       });
  //     }

  //     if (breakEnd - breakStart > this.MAX_BREAK_DURATION_MINUTES) {
  //       throw new BadRequestException({
  //         message: 'common.errors.BREAK_EXCEEDS_MAX_DURATION',
  //         args: { day: br.day, minutes: this.MAX_BREAK_DURATION_MINUTES },
  //       });
  //     }

  //     if (breakStart < open || breakEnd > close) {
  //       throw new BadRequestException({
  //         message: 'common.errors.BREAK_EXCEEDS_WORKING_HOURS',
  //         args: { day: br.day, openTime: workingDay.openTime!, closeTime: workingDay.closeTime! },
  //       });
  //     }

  //     breaksPerDay[br.day] = breaksPerDay[br.day] || [];

  //     if (breaksPerDay[br.day].length >= this.MAX_BREAKS_PER_DAY) {
  //       throw new BadRequestException({
  //         message: 'common.errors.MAX_BREAKS_REACHED',
  //         args: { day: br.day, max: this.MAX_BREAKS_PER_DAY },
  //       });
  //     }

  //     // Overlap check (ignore same _id)
  //     breaksPerDay[br.day].forEach((existing) => {
  //       if (
  //         existing._id &&
  //         br._id &&
  //         existing._id.toString() === br._id.toString()
  //       ) {
  //         return;
  //       }

  //       const exStart = this.toMinutes(existing.startTime);
  //       const exEnd = this.toMinutes(existing.endTime);

  //       if (this.isOverlap(breakStart, breakEnd, exStart, exEnd)) {
  //         throw new BadRequestException({
  //           message: 'common.errors.WEEKLY_BREAK_OVERLAPS',
  //           args: { day: br.day, startTime: existing.startTime, endTime: existing.endTime },
  //         });
  //       }
  //     });

  //     breaksPerDay[br.day].push(br);
  //   });
  // }

  // ================================
  // Custom Break Validation
  // ================================

  static validateCustomBreaks(
    weeklySchedule: WorkingDay[],
    customBreaks: BreakCustom[],
  ) {
    const breaksPerDate: Record<string, BreakCustom[]> = {};

    customBreaks.forEach((br) => {
      const date = new Date(br.date);

    const today = new Date();
today.setHours(0,0,0,0);

if (date < today && !br._id) {
  throw new BadRequestException({
    message: 'common.errors.CUSTOM_BREAK_DATE_IN_PAST',
    args: { date: date.toISOString() }
  });
}

      const dayName = this.getDayNameFromDate(date);
      const workingDay = weeklySchedule.find((d) => d.day === dayName);

      // If day is closed or not found:
      // - New breaks (without _id) are NOT allowed on closed days
      // - Existing breaks (with _id) are allowed to stay but cannot be modified
      if (!workingDay || !workingDay.isOpen) {
        if (!br._id) {
          throw new BadRequestException({
            message: 'common.errors.CANNOT_ADD_CUSTOM_BREAK_CLOSED_DAY',
            args: { dayName: `common.days.${dayName}` },
          });
        }
        // Existing breaks on closed days: skip validation but keep them
        return;
      }

      const breakStart = this.toMinutes(br.startTime);
      const breakEnd = this.toMinutes(br.endTime);
      const open = this.toMinutes(workingDay.openTime || '00:00');
      const close = this.toMinutes(workingDay.closeTime || '23:59');

      if (breakStart >= breakEnd) {
        throw new BadRequestException({
          message: 'common.errors.CUSTOM_BREAK_INVALID_RANGE',
          args: { dayName:`common.days.${dayName}`, date: date.toDateString(), startTime: br.startTime, endTime: br.endTime },
        });
      }

      if (breakStart < open || breakEnd > close) {
        throw new BadRequestException({
          message: 'common.errors.CUSTOM_BREAK_EXCEEDS_HOURS',
          args: { dayName:`common.days.${dayName}`, openTime: workingDay.openTime!, closeTime: workingDay.closeTime! },
        });
      }

      const key = date.toDateString();
      breaksPerDate[key] = breaksPerDate[key] || [];

      // if (breaksPerDate[key].length >= this.MAX_BREAKS_PER_DAY) {
      //   throw new BadRequestException({
      //     message: 'common.errors.MAX_BREAKS_REACHED',
      //     args: { day: dayName, max: this.MAX_BREAKS_PER_DAY },
      //   });
      // }

      breaksPerDate[key].forEach((existing) => {
        if (
          existing._id &&
          br._id &&
          existing._id.toString() === br._id.toString()
        ) {
          return;
        }

        const exStart = this.toMinutes(existing.startTime);
        const exEnd = this.toMinutes(existing.endTime);

        if (this.isOverlap(breakStart, breakEnd, exStart, exEnd)) {
          throw new BadRequestException({
            message: 'common.errors.CUSTOM_BREAK_OVERLAPS_BETWEEN',
            args: { dayName:`common.days.${dayName}`, startTime: existing.startTime, endTime: existing.endTime },
          });
        }
      });

      breaksPerDate[key].push(br);
    });
  }

  // ================================
  // Employee vs Provider Validation
  // ================================

  static validateEmployeeInsideProvider(
    employeeWeekly: WorkingDay[],
    providerWeekly: WorkingDay[],
  ) {
    const providerMap = new Map<WeekDay, WorkingDay>();
    providerWeekly.forEach(d => providerMap.set(d.day, d));

    employeeWeekly.forEach(empDay => {
      const providerDay = providerMap.get(empDay.day);

      if (!providerDay) {
        throw new BadRequestException({
          message: 'common.errors.EMPLOYEE_DAY_NOT_IN_PROVIDER',
          args: { day: `common.days.${empDay.day}` },
        });
      }

      // If employee is open, provider must also be open
      if (empDay.isOpen && !providerDay.isOpen) {
        throw new BadRequestException({
          message: 'common.errors.PROVIDER_CLOSED_EMPLOYEE_CANNOT_OPEN',
          args: { day: `common.days.${empDay.day}` },
        });
      }

      // If both are open, validate time range
      if (empDay.isOpen && providerDay.isOpen && empDay.openTime && empDay.closeTime) {
        const toMinutes = (time: string) => {
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        };

        const empOpen = toMinutes(empDay.openTime);
        const empClose = toMinutes(empDay.closeTime);
        const provOpen = toMinutes(providerDay.openTime || '00:00');
        const provClose = toMinutes(providerDay.closeTime || '23:59');

        if (empOpen < provOpen || empClose > provClose) {
          throw new BadRequestException({
            message: 'common.errors.EMPLOYEE_TIME_INSIDE_PROVIDER',
             args: {
                 day: `common.days.${empDay.day}`,
                 empOpen: empDay.openTime,
                 empClose: empDay.closeTime,
                 provOpen: providerDay.openTime,
                 provClose: providerDay.closeTime,
                  },
      });
        }
      }
    });
  }

  // ================================
  // Main Validation Method
  // ================================

  static validateEmployeeWorkingHours(
    providerWorkingHours: { weekly: WorkingDay[] },
    employeeWorkingHours: { weekly: WorkingDay[] },
  ) {
    // 1. Validate employee weekly schedule format
    this.validateWeeklySchedule(employeeWorkingHours.weekly);

    // 2. Validate employee hours are within provider hours
    this.validateEmployeeInsideProvider(
      employeeWorkingHours.weekly,
      providerWorkingHours.weekly,
    );
  }
}
