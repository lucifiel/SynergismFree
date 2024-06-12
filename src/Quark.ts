/* Functions which Handle Quark Gains,  */

import { DOMCacheGetOrSet } from './Cache/DOM'
import { calculateCubeQuarkMultiplier, calculateQuarkMultiplier } from './Calculate'
import { format, player } from './Synergism'
import { Alert } from './UpdateHTML'

export const quarkHandler = () => {
  let maxTime = 90000 // In Seconds
  if (player.researches[195] > 0) {
    maxTime += 18000 * player.researches[195] // Research 8x20
  }

  // Part 2: Calculate quark gain per hour
  let baseQuarkPerHour = 5

  const quarkResearches = [99, 100, 125, 180, 195]
  for (const el of quarkResearches) {
    baseQuarkPerHour += player.researches[el]
  }

  baseQuarkPerHour *= +player.octeractUpgrades.octeractExportQuarks.getEffect().bonus

  const quarkPerHour = baseQuarkPerHour

  // Part 3: Calculates capacity of quarks on export
  const capacity = Math.floor(quarkPerHour * maxTime / 3600)

  // Part 4: Calculate how many quarks are to be gained.
  const quarkGain = Math.floor(player.quarkstimer * quarkPerHour / 3600)

  // Part 5 [June 9, 2021]: Calculate bonus awarded to cube quarks.
  const cubeMult = calculateCubeQuarkMultiplier()
  // Return maxTime, quarkPerHour, capacity and quarkGain as object
  return {
    maxTime,
    perHour: quarkPerHour,
    capacity,
    gain: quarkGain,
    cubeMult
  }
}

export class QuarkHandler {
  /** Global quark bonus */
  public BONUS = 0
  /** Quark amount */
  private QUARKS = 0

  private interval: ReturnType<typeof setInterval> | null = null

  constructor ({ bonus, quarks }: { bonus?: number; quarks: number }) {
    this.QUARKS = quarks

    if (bonus) {
      this.BONUS = bonus
    } else {
      void this.getBonus()
    }

    if (this.interval) clearInterval(this.interval)

    // although the values are cached for 15 mins, refresh every 5
    this.interval = setInterval(this.getBonus.bind(this), 60 * 1000 * 5)
  }

  /*** Calculates the number of quarks to give with the current bonus. */
  applyBonus (amount: number) {
    const nonPatreon = calculateQuarkMultiplier()
    return amount * (1 + (this.BONUS / 100)) * nonPatreon
  }

  /** Subtracts quarks, as the name suggests. */
  add (amount: number, useBonus = true) {
    this.QUARKS += useBonus ? this.applyBonus(amount) : amount
    player.quarksThisSingularity += useBonus ? this.applyBonus(amount) : amount
    return this
  }

  /** Add quarks, as suggested by the function's name. */
  sub (amount: number) {
    this.QUARKS -= amount
    if (this.QUARKS < 0) {
      this.QUARKS = 0
    }

    return this
  }

  async getBonus () {
    const el = DOMCacheGetOrSet('currentBonus')

    if (localStorage.getItem('quarkBonus') !== null) { // is in cache
      const { bonus, fetched } = JSON.parse(localStorage.getItem('quarkBonus')!) as { bonus: number; fetched: number }
      if (Date.now() - fetched < 60 * 1000 * 15) { // cache is younger than 15 minutes
        el.textContent = `Generous patrons give you a bonus of ${bonus}% more Quarks!`
        return this.BONUS = bonus
      }
    }

    const b = 80

    if (b === null) {
      return
    } else if (Number.isNaN(b) || typeof b !== 'number') {
      return Alert('No bonus could be applied, a network error occurred! [Invalid Bonus] :(')
    } else if (!Number.isFinite(b)) {
      return Alert('No bonus could be applied, an error occurred. [Infinity] :(')
    } else if (b < 0) {
      return Alert('No bonus could be applied, an error occurred. [Zero] :(')
    }

    el.textContent = `Generous patrons give you a bonus of ${b}% more Quarks!`
    localStorage.setItem('quarkBonus', JSON.stringify({ bonus: b, fetched: Date.now() }))
    this.BONUS = b
  }

  public toString (val: number): string {
    return format(Math.floor(this.applyBonus(val)), 0, true)
  }

  /**
   * Resets the amount of quarks saved but keeps the bonus amount.
   */
  public reset () {
    this.QUARKS = 0
  }

  [Symbol.toPrimitive] = (t: string) => t === 'number' ? this.QUARKS : null
}
