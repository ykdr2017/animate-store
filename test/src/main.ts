import { setTimeout as st } from 'timers';
import * as Animate from '@src/ts/main';

import * as mocha from 'mocha';
import * as chai from 'chai';

function test(): void {
	let anim: Animate.Animation = new Animate.Animation([100], (p) => {
		render({ x: p[0] });
	});
	let x: number;
	function render(state?: { x: number }): void {
		let _x: number;
		x = x ? x : 0;
		_x = state ? state.x : x;
		x = _x;
	}
	describe('@src/ts/main', () => {
		describe('Animation', () => {
			it('renderer initialized.', (done) => {
				chai.assert.strictEqual(x, 100);
				done();
			});
			it('move works.', (done) => {
				anim.move({
					next: { value: 200, curve: Animate.Curve.linear },
					duration: 100,
				}).then(() => {
					chai.assert.strictEqual(x, 200);
					done();
				});
				const chk = () => { chai.assert.strictEqual((x < 200), true); };
				if (typeof(window) === 'undefined') {
					setTimeout(chk, 50);
				} else {
					st(chk, 50);
				}
			});
		});
	});
}

/**
 * Constants.
 *
 */
namespace c {
	
}

test();
