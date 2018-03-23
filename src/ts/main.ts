import deepcopy from 'ts-deepcopy';
import { Promise } from 'es6-promise';

const raf: typeof requestAnimationFrame = require('raf');

/**
 * Definition of next motion unit.
 */
export interface MoveNext {
	value: number;
	curve?: ((t: number) => number);
}
/**
 * Configuration for a motion set.
 */
export interface MoveConf {
	next: MoveNext[] | MoveNext;
	duration?: number;
	callback?: (() => void);
}
/**
 * Variables for processing a motion.
 */
export interface MoveProcess {
	delta: number;
	offset: number;
}
/**
 * Functions that defines potential value of each time.
 */
export const Curve = {
	linear: (t: number): number => {
		return t;
	},
	quad: (t: number): number => {
		if (t < 0.5) return 2 * t * t;
		t--; return -2 * t * t + 1;
	},
	quadin: (t: number): number => {
		return t * t;
	},
	quadout: (t: number): number => {
		return Math.sqrt(t);
	},
	sin: (t: number): number => {
		return Math.sin(Math.PI / 2 * t);
	},
};
/**
 * Store of animation data.
 */
export class Animation {
	/**
	 * @constructor
	 * @param pos Values of initial position.
	 * @param renderer Function called when the position moved.
	 */
	constructor(pos: number[], renderer?: ((p: number[]) => void)) {
		this.pos = pos;
		if (renderer) {
			this.renderer = renderer;
			this.renderer(this.pos);
		}
	}
	/**
	 * Moves positions with animation.
	 * Promise is available after the animation completed.
	 * @param conf Configuration for a motion set.
	 * @return {Promise<{}>}
	 */
	public move(conf: MoveConf): Promise<{}> {
		let movStamp: number = this.movStamp = new Date().getTime();
		this.setConf(conf);
		if (this.duration > 0) {
			return new Promise<{}>((resolve, reject) => {
				raf((t) => {
					this.requested(
						t, movStamp, 
						(() => { this.callback(); resolve({}); }),
					);
				});
			});
		}
		return this.moveImmediateCurrentConf(movStamp);
	}
	/**
	 * Moves positions immediately (without animation).
	 * Promise is available after the move completed.
	 * @param conf Configuration for a motion set.
	 * @return {Promise<{}>}
	 */
	public moveImmediate(conf: MoveConf): Promise<{}> {
		let movStamp: number = this.movStamp = new Date().getTime();
		this.setConf(conf);
		this.duration = 0;
		return this.moveImmediateCurrentConf(movStamp);
	}
	/**
	 * Runs multiple animations sequentially.
	 * Promise is available after the last animation completed.
	 * @param arr Configurations array for a motion set.
	 * @return {Promise<{}>}
	 */
	public sequence(arr: MoveConf[]): Promise<{}> {
		let idx: number = 0;
		let len: number = arr.length;
		return new Promise<{}>((resolve, reject) => {
			const runUnit = () => {
				this.move(arr[idx]).then(() => {
					idx++;
					if (idx < len) {
						raf((t) => { runUnit(); });
					} else {
						resolve({});
					}
				});
			};
			if (len > 0) runUnit(); else resolve({});
		});
	}
	/**
	 * Runs multiple animations endlessly.
	 * When the last motion completed, the first one will run.
	 * @param arr Configurations array for a motion set.
	 * @return {void}
	 */
	public loop(arr: MoveConf[]): void {
		let idx: number = 0;
		let len: number = arr.length;
		const runUnit = () => {
			this.move(arr[idx]).then(() => {
				idx++;
				if (idx >= len) idx = 0;
				raf((t) => { runUnit(); });
			});
		};
		if (len > 0) runUnit();
	}
	/**
	 * Runs multiple animations endlessly.
	 * When the last motion completed, the second from the last will run.
	 * @param arr Configurations array for a motion set.
	 * @return {void}
	 */
	public alternate(arr: MoveConf[]): void {
		let idx: number = 0;
		let len: number = arr.length;
		let isBack: boolean = false;
		const runUnit = () => {
			this.move(arr[idx]).then(() => {
				if (len >= 2) {
					if (isBack) {
						idx--;
						if (idx < 0) {
							idx = 1;
							isBack = false;
						}
					} else {
						idx++;
						if (idx >= len) {
							idx = len - 2;
							isBack = true;
						}
					}
				}
				raf((t) => { runUnit(); });
			});
		};
		if (len >= 2) {
			this.moveImmediate(arr[0]).then(() => {
				idx++;
				runUnit();
			});
		} else if (len > 0) runUnit();
	}
	/**
	 * Stops the current animation forcely.
	 * Promise is available after the animation stopped.
	 * @return {Promise<{}>}
	 */
	public stop(): Promise<{}> {
		let movStamp: number = this.movStamp = new Date().getTime();
		return new Promise<{}>((resolve, reject) => {
			raf((t) => { resolve({}); });
		});
	}
	/**
	 * Redefines renderer function.
	 * @param renderer Function called when the position moved.
	 * @return {Animation}
	 */
	public setRenderer(renderer: (p: number[]) => void): Animation {
		this.renderer = renderer;
		return this;
	}
	/**
	 * Timestamp when the motion started.
	 */
	private movStamp: number = 0;
	/**
	 * Current positions.
	 */
	private pos: number[];
	/**
	 * Parameters for the motions.
	 */
	private next: MoveNext[];
	/**
	 * Parameters for processing the motions.
	 */
	private process: MoveProcess[];
	/**
	 * Time ratio for completion rate of the motion (max: 1.0).
	 */
	private tRatio: number = 1;
	/**
	 * Duration of current motion unit.
	 */
	private duration: number = 0;
	/**
	 * The last value of time that requestAnimationFrame provides.
	 */
	private ct: number = 0;
	/**
	 * Function called when the position moved.
	 */
	private renderer: ((p: number[]) => void);
	/**
	 * Function called after the last animation completed.
	 */
	private callback: (() => void);
	/**
	 * Sets the given configuration to this instance.
	 * @param conf Configuration for a motion set.
	 * @return {void}
	 */
	private setConf(conf: MoveConf): void {
		this.next = deepcopy<MoveNext[]>(
			conf.next.hasOwnProperty('length') ? 
					(conf.next as MoveNext[]) : ([conf.next as MoveNext]),
		);
		this.process = this.pos.map<MoveProcess>((v, i) => ({
			delta: this.next[i].value - v,
			offset: v,
		}));
		this.tRatio = 0;
		this.duration = conf.duration ? conf.duration : 0;
		this.callback = conf.callback ? conf.callback : (() => {});
		this.ct = 0;
	}
	/**
	 * Moves positions immediately with current configuration.
	 * Promise is available after the move completed.
	 * @param stmp Timestamp when the motion started.
	 * @return {Promise<{}>}
	 */
	private moveImmediateCurrentConf(stmp: number): Promise<{}> {
		return new Promise<{}>((resolve, reject) => {
			if (stmp === this.movStamp) {
				this.pos = this.next.map<number>((v) => v.value);
				this.tRatio = 1;
				if (this.renderer) this.renderer(deepcopy<number[]>(this.pos));
				raf((t) => {
					this.callback(); resolve({});
				});
			}
		});
	}
	/**
	 * Handles requestAnimationFrame and gives values to renderer.
	 * @param t Time value given by requestAnimationFrame.
	 * @param stmp Timestamp when the motion started.
	 * @param cb Function called after the animation completed.
	 * @return {void}
	 */
	private requested(t: number, stmp: number, cb: (() => void)): void {
		let dtRatio: number;
		if (stmp === this.movStamp) {
			if (this.ct === 0) this.ct = t;
			dtRatio = (t - this.ct) / this.duration;
			this.ct = t;
			if (this.tRatio <= (1 - dtRatio)) {
				this.tRatio += dtRatio;
				this.pos = this.process.map<number>((process, i) => 
					process.offset + this.next[i].curve(this.tRatio) * process.delta,
				);
				if (this.renderer) {
					this.renderer(deepcopy<number[]>(this.pos));
				}
				raf((t) => { this.requested(t, stmp, cb); });
			} else {
				this.tRatio = 1;
				this.pos = this.next.map<number>((v) => v.value);
				if (this.renderer) {
					this.renderer(deepcopy<number[]>(this.pos));
				}
				raf((t) => { cb(); });
			}
		}
	}
}
