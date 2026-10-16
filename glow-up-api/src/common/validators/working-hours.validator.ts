import { BadRequestException } from '@nestjs/common';
import { WeekDay } from 'src/common/enum/weekday.enum';

interface WorkingDay {
  day: WeekDay;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export function validateTimeFormat(weekly: WorkingDay[]) {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  weekly.forEach((day) => {
    if (day.isOpen) {
      if (!day.openTime || !day.closeTime) {
        throw new BadRequestException(
          `Open day ${day.day} must have openTime and closeTime`,
        );
      }

      if (!regex.test(day.openTime) || !regex.test(day.closeTime)) {
        throw new BadRequestException(
          `Invalid time format for ${day.day}. Use HH:mm`,
        );
      }
    }
  });
}


export function validateDayLogic(weekly: WorkingDay[]) {
  weekly.forEach((day) => {
    if (day.isOpen && day.openTime && day.closeTime) {
      const [openH, openM] = day.openTime.split(':').map(Number);
      const [closeH, closeM] = day.closeTime.split(':').map(Number);

      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      if (openMinutes >= closeMinutes) {
        throw new BadRequestException(
          `openTime must be before closeTime for ${day.day}`,
        );
      }
    }
  });
}


export function validateNoDuplicateDays(weekly: WorkingDay[]) {
  const seen = new Set<WeekDay>();
  weekly.forEach((day) => {
    if (seen.has(day.day)) {
      throw new BadRequestException(`Duplicate day entry: ${day.day}`);
    }
    seen.add(day.day);
  });
}


export function validateEmployeeInsideProvider(
  employeeWeekly: WorkingDay[],
  providerWeekly: WorkingDay[],
) {
  const providerMap = new Map<WeekDay, WorkingDay>();
  providerWeekly.forEach(d => providerMap.set(d.day, d));

  employeeWeekly.forEach(empDay => {
    const providerDay = providerMap.get(empDay.day);

    if (!providerDay) {
      throw new BadRequestException(
        `Employee day ${empDay.day} does not exist in provider schedule`,
      );
    }

   
  

      const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const empOpen = toMinutes(empDay.openTime!);
      const empClose = toMinutes(empDay.closeTime!);
      const provOpen = toMinutes(providerDay.openTime!);
      const provClose = toMinutes(providerDay.closeTime!);

      if (empOpen < provOpen || empClose > provClose) {
        throw new BadRequestException(
          `Employee working time must be inside provider working time for ${empDay.day}`,
        );
      }
})
}

