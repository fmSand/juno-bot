import { UniqueConstraintError, Op } from "sequelize";
import { DateTime } from "luxon";
const TIMEZONE = "Europe/Oslo";

export default class SessionService {
  constructor(db) {
    this.Session = db.Session;
    this.User = db.User;
  }

  getOneActive(userId, { includeUser = false } = {}) {
    const options = { where: { userId, endedAt: null } };

    if (includeUser) {
      options.include = [
        {
          model: this.User,
          as: "user",
          attributes: ["id", "discordId", "name"],
        },
      ];
    }
    return this.Session.findOne(options);
  }

  async getOneActiveByDiscordId(discordId) {
    return this.Session.findOne({
      where: { endedAt: null },
      include: [
        {
          model: this.User,
          as: "user",
          where: { discordId },
          attributes: ["id", "discordId", "name"],
          required: true,
        },
      ],
    });
  }

  getById(sessionId, { includeUser = false } = {}) {
    const options = { where: { id: sessionId } };

    if (includeUser) {
      options.include = [
        {
          model: this.User,
          as: "user",
          attributes: ["id", "discordId", "name"],
        },
      ];
    }
    return this.Session.findOne(options);
  }

  getAllActive() {
    return this.Session.findAll({
      where: { endedAt: null },
      include: [
        {
          model: this.User,
          as: "user",
          attributes: ["id", "discordId", "name"],
          required: true,
        },
      ],
      order: [["startedAt", "ASC"]],
    });
  }

  async start(
    userId,
    { activity = null, startedAt = new Date(), targetDurationMinutes = 120 } = {},
  ) {
    try {
      return await this.Session.create({
        userId,
        activity: this.#normalizeActivity(activity),
        startedAt,
        targetDurationMinutes,
      });
    } catch (err) {
      if (err instanceof UniqueConstraintError) return null;
      throw err;
    }
  }

  async end(userId, { endedAt = new Date(), autoEnded = false } = {}) {
    const [count, rows] = await this.Session.update(
      { endedAt, autoEnded },
      { where: { userId, endedAt: null }, returning: true },
    );

    if (!count) return null;
    const session = rows[0];
    const durationMs = new Date(session.endedAt) - new Date(session.startedAt);
    return { session, durationMs };
  }

  async getWorkedToday() {
    const midnightOslo = DateTime.now().setZone(TIMEZONE).startOf("day").toJSDate();

    const sessions = await this.Session.findAll({
      where: {
        startedAt: { [Op.gte]: midnightOslo },
        endedAt: { [Op.ne]: null },
      },
      include: [
        {
          model: this.User,
          as: "user",
          attributes: ["id", "discordId", "name"],
          required: true,
        },
      ],
      order: [["endedAt", "DESC"]],
    });

    const userTotals = new Map();

    for (const session of sessions) {
      const userId = session.userId;
      const durationMs = new Date(session.endedAt) - new Date(session.startedAt);

      if (userTotals.has(userId)) {
        userTotals.get(userId).totalMs += durationMs;
      } else {
        userTotals.set(userId, {
          user: session.user,
          totalMs: durationMs,
        });
      }
    }
    return Array.from(userTotals.values()).sort((a, b) => b.totalMs - a.totalMs);
  }

  async getMonthStats(userId, { year, month } = {}) {
    const now = DateTime.now().setZone(TIMEZONE);
    const anchor = year && month ? DateTime.fromObject({ year, month }, { zone: TIMEZONE }) : now;
    const isCurrentMonth = anchor.year === now.year && anchor.month === now.month;
    const monthStart = anchor.startOf("month").toJSDate();
    const nextMonthStart = anchor.plus({ months: 1 }).startOf("month").toJSDate();

    const sessions = await this.Session.findAll({
      where: {
        userId,
        startedAt: { [Op.gte]: monthStart, [Op.lt]: nextMonthStart },
        endedAt: { [Op.ne]: null },
      },
      order: [["startedAt", "ASC"]],
    });

    const empty = {
      monthLabel: anchor.toFormat("LLLL yyyy"),
      totalMs: 0,
      sessionCount: 0,
      avgMs: 0,
      longestMs: 0,
      shortestMs: 0,
      activeDays: 0,
      daysElapsed: isCurrentMonth ? now.day : anchor.daysInMonth,
      bestDay: null,
      streak: 0,
      streakActive: false,
    };

    if (sessions.length === 0) return empty;

    let totalMs = 0;
    let longestMs = 0;
    let shortestMs = Infinity;
    const activeDaySet = new Set();
    const dayTotals = new Map();

    for (const session of sessions) {
      const durationMs = new Date(session.endedAt) - new Date(session.startedAt);
      totalMs += durationMs;
      if (durationMs > longestMs) longestMs = durationMs;
      if (durationMs < shortestMs) shortestMs = durationMs;
      const dayKey = DateTime.fromJSDate(new Date(session.startedAt)).setZone(TIMEZONE).toISODate();
      activeDaySet.add(dayKey);
      dayTotals.set(dayKey, (dayTotals.get(dayKey) ?? 0) + durationMs);
    }

    let bestDay = null;
    for (const [day, ms] of dayTotals) {
      if (!bestDay || ms > bestDay.totalMs) bestDay = { day, totalMs: ms };
    }
    const { longest: streak, active } = this.#computeLongestStreak(activeDaySet, now);
    return {
      monthLabel: anchor.toFormat("LLLL yyyy"),
      totalMs,
      sessionCount: sessions.length,
      avgMs: Math.floor(totalMs / sessions.length),
      longestMs,
      shortestMs,
      activeDays: activeDaySet.size,
      daysElapsed: isCurrentMonth ? now.day : anchor.daysInMonth,
      bestDay,
      streak,
      streakActive: active,
    };
  }

  async updateActivity(userId, activity) {
    const [count, rows] = await this.Session.update(
      { activity: this.#normalizeActivity(activity) },
      { where: { userId, endedAt: null }, returning: true },
    );

    return count ? rows[0] : null;
  }

  async setTargetDuration(userId, minutes) {
    const [count, rows] = await this.Session.update(
      { targetDurationMinutes: minutes },
      {
        where: { userId, endedAt: null },
        returning: true,
        validate: true,
      },
    );

    if (!count) return null;
    const session = rows[0];
    const targetEndsAt = minutes
      ? new Date(new Date(session.startedAt).getTime() + minutes * 60000)
      : null;

    return { session, targetEndsAt };
  }

  #computeLongestStreak(activeDaySet, now) {
    if (activeDaySet.size === 0) return { longest: 0, active: false };
    const sortedDays = [...activeDaySet].sort();
    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const prev = DateTime.fromISO(sortedDays[i - 1], { zone: TIMEZONE });
      const curr = DateTime.fromISO(sortedDays[i], { zone: TIMEZONE });
      const isConsecutive = curr.diff(prev, "days").days === 1;

      if (isConsecutive) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }

    const lastDay = DateTime.fromISO(sortedDays[sortedDays.length - 1], { zone: TIMEZONE });
    const daysDiff = now.startOf("day").diff(lastDay.startOf("day"), "days").days;
    const active = daysDiff <= 1;
    return { longest, active };
  }

  #normalizeActivity(input, max = 500) {
    if (input == null) return null;
    const str = String(input).trim();
    return str ? str.slice(0, max) : null;
  }
}
