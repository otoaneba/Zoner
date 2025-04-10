import { NapEntry } from '@/components/SleepTracker';

interface RegressionData {
  age: number;
  lastWakeWindow: number;
  lastNapDuration: number;
  wakeWindow: number;
}

interface SleepWindow {
  bedtime: string; // Formatted as HH:MM
  wakeTime: string; // Formatted as HH:MM
}

class NapPredictor {
  private beta0: number = 0;
  private beta1: number = 0;
  private beta2: number = 0;
  private beta3: number = 0;

  // Get default wake window based on age (in months)
  private getDefaultWakeWindow(age: number): number {
    if (age <= 3) return 1.125; // 0–3 months: 45–90 minutes (average 67.5 minutes)
    if (age <= 6) return 2.0; // 4–6 months: 1.5–2.5 hours (average 2 hours)
    if (age <= 12) return 3.0; // 7–12 months: 2–4 hours (average 3 hours)
    if (age <= 24) return 5.0; // 1–2 years: 4–6 hours (average 5 hours)
    return 6.0; // 3–5 years: 6+ hours (assume 6 hours)
  }

  // Predict nighttime sleep window based on age
  predictNighttimeSleep(age: number): SleepWindow {
    let bedtimeHour: number;
    let sleepDuration: number;

    if (age <= 3) {
      // 0–3 months: Bedtime 18:00, sleep 8–11 hours
      bedtimeHour = 18; // 6:00 PM
      sleepDuration = 9.5; // Average of 8–11 hours
    } else if (age <= 11) {
      // 4–11 months: Bedtime 19:00, sleep 9–12 hours
      bedtimeHour = 19; // 7:00 PM
      sleepDuration = 10.5; // Average of 9–12 hours
    } else if (age <= 24) {
      // 1–2 years: Bedtime 19:30, sleep 9–12 hours
      bedtimeHour = 19.5; // 7:30 PM
      sleepDuration = 10.5; // Average of 9–12 hours
    } else {
      // 3–5 years: Bedtime 20:00, sleep 9–12 hours
      bedtimeHour = 20; // 8:00 PM
      sleepDuration = 10.5; // Average of 9–12 hours
    }

    // Calculate bedtime and wake time
    const bedtime = new Date();
    bedtime.setHours(Math.floor(bedtimeHour), (bedtimeHour % 1) * 60, 0, 0);
    const wakeTime = new Date(bedtime.getTime() + sleepDuration * 60 * 60 * 1000);

    // If bedtime is in the past (e.g., it's 21:00 and bedtime is 19:00), move to next day
    const now = new Date();
    if (bedtime < now) {
      bedtime.setDate(bedtime.getDate() + 1);
      wakeTime.setDate(wakeTime.getDate() + 1);
    }

    return {
      bedtime: bedtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wakeTime: wakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  fit(data: RegressionData[]): void {
    if (data.length < 2) {
      this.beta0 = 2;
      this.beta1 = 0.1;
      this.beta2 = 0.5;
      this.beta3 = -0.2;
      return;
    }

    const n = data.length;
    const meanX1 = data.reduce((sum, d) => sum + d.age, 0) / n;
    const meanX2 = data.reduce((sum, d) => sum + d.lastWakeWindow, 0) / n;
    const meanX3 = data.reduce((sum, d) => sum + d.lastNapDuration, 0) / n;
    const meanY = data.reduce((sum, d) => sum + d.wakeWindow, 0) / n;

    let numerator1 = 0,
      numerator2 = 0,
      numerator3 = 0,
      denominator1 = 0,
      denominator2 = 0,
      denominator3 = 0;

    for (const d of data) {
      const x1 = d.age - meanX1;
      const x2 = d.lastWakeWindow - meanX2;
      const x3 = d.lastNapDuration - meanX3;
      const y = d.wakeWindow - meanY;

      numerator1 += x1 * y;
      numerator2 += x2 * y;
      numerator3 += x3 * y;
      denominator1 += x1 * x1;
      denominator2 += x2 * x2;
      denominator3 += x3 * x3;
    }

    this.beta1 = numerator1 / (denominator1 || 1);
    this.beta2 = numerator2 / (denominator2 || 1);
    this.beta3 = numerator3 / (denominator3 || 1);
    this.beta0 = meanY - this.beta1 * meanX1 - this.beta2 * meanX2 - this.beta3 * meanX3;
  }

  predict(age: number, lastWakeWindow: number, lastNapDuration: number, useDefault: boolean = false): number {
    if (useDefault) {
      return this.getDefaultWakeWindow(age);
    }
    const wakeWindow =
      this.beta0 +
      this.beta1 * age +
      this.beta2 * lastWakeWindow +
      this.beta3 * lastNapDuration;
    return Math.max(wakeWindow, 0.5);
  }

  prepareData(napHistory: NapEntry[], babyAge: number): RegressionData[] {
    const data: RegressionData[] = [];
    for (let i = 1; i < napHistory.length; i++) {
      const prevNap = napHistory[i - 1];
      const currentNap = napHistory[i];

      const prevEnd = new Date(prevNap.endTime);
      const currentStart = new Date(currentNap.startTime);
      const wakeWindow = (currentStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60);

      const prevStart = new Date(prevNap.startTime);
      const lastNapDuration = (prevEnd.getTime() - prevStart.getTime()) / (1000 * 60 * 60);

      const age = prevNap.ageInMonths || babyAge;

      let lastWakeWindow = wakeWindow;
      if (i > 1) {
        const prévPrevNap = napHistory[i - 2];
        const prevStartTime = new Date(prévPrevNap.endTime);
        lastWakeWindow = (prevStart.getTime() - prevStartTime.getTime()) / (1000 * 60 * 60);
      }

      data.push({
        age,
        lastWakeWindow,
        lastNapDuration,
        wakeWindow,
      });
    }
    return data;
  }
}

export const napPredictor = new NapPredictor();