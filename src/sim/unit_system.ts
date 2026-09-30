export interface UnitSystemConfig {
    domainWidthMeters: number;
    gridWidthCells: number;
    obstacleDiameterCells: number;
    safeLatticeVelocity: number;
    minTau: number;
    maxTau: number;
}

export class UnitSystem {
    private dx: number
    private obstacleDiameterCells: number;
    private safeLatticeVelocity: number;

    private minTau: number;
    private maxTau: number;
    
    // real air kinematic viscocity at sea lvl
    private nuPhysical: number = 1.5e-5;

    constructor(config: UnitSystemConfig) {
        this.dx = config.domainWidthMeters / config.gridWidthCells;
        this.obstacleDiameterCells = config.obstacleDiameterCells;
        this.safeLatticeVelocity = config.safeLatticeVelocity;
        this.minTau = config.minTau;
        this.maxTau = config.maxTau;
    }

    setPhysicalViscocity(nuPhysical: number): void {
        this.nuPhysical = nuPhysical;
    }

    get obstacleDiameterMeters(): number {
        return this.obstacleDiameterCells * this.dx;
    }

    reynoldsNumber(realVelocityMs: number): number {
        return (realVelocityMs * this.obstacleDiameterMeters) / this.nuPhysical;
    }    

    solveForTau(realVelocityMs: number): { tau: number; clamped: boolean; reynolds: number } {
        const re = this.reynoldsNumber(realVelocityMs);

        if (re <= 0) {
            return { tau: this.minTau, clamped: false, reynolds: re};
        }

        const numLattice = (this.safeLatticeVelocity * this.obstacleDiameterCells) / re;
        const rawTau = 3.0 * numLattice + 0.5;

        const tau = Math.min(Math.max(rawTau, this.minTau), this.maxTau);
        const clamped = tau !== rawTau;

        return { tau, clamped, reynolds: re };
    }

    achievedReynolds(tau: number): number {
        const nuLattice = (tau - 0.5) / 3.0;
        if (nuLattice <= 0) return Infinity; // tau at exactly 0.5, undefined/unstable
        return (this.safeLatticeVelocity * this.obstacleDiameterCells) / nuLattice;
    }

    get latticeVelocity(): number {
        return this.safeLatticeVelocity;
    }

    kmhToMs(kmh: number): number {
        return kmh / 3.6;
    }

    msToKmh(ms: number): number {
        return ms * 3.6;
    }
} 