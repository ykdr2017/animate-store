import { setTimeout as st } from 'timers';
import * as Animate from '@src/ts/main';

import * as mocha from 'mocha';
import * as chai from 'chai';

// Headless Firefox is temporarily ignored 
// because it does not run requestAnimationFrame correctly.
const IS_FF: boolean =
		(typeof window !== 'undefined') ?
		(window.navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) : 
		false;

function test(): void {
	const render = (state?: { x: number }) => {
		console.log('render done', x);
		x = state ? state.x : x;
	};
	let anim: Animate.Animation;
	let x: number = 0;
	let moveOngoing: boolean = false;
	let callbackCalled: boolean = false;
	let thenCalled: boolean = false;
	describe('@src/ts/main', () => {
		describe('Animation constructor', () => {
			before((done) => {
				anim = new Animate.Animation([100], (p) => {
					render({ x: p[0] });
				});
				console.log('constructor done');
				done();
			});
			it('renderer initialized.', (done) => {
				chai.assert.strictEqual(x, 100);
				done();
			});
		});
		if (!IS_FF) {
			describe('Animation move()', () => {
				before((done) => {
					const chk = () => {
						moveOngoing = (x < 200) && (x > 0);
					};
					x = 0;
					anim = new Animate.Animation([100], (p) => {
						render({ x: p[0] });
					});
					anim.move({
						next: { value: 200, curve: Animate.Curve.linear },
						duration: 100,
						callback: () => {
							console.log('callback done');
							callbackCalled = true;
						},
					}).then(() => {
						thenCalled = true;
						console.log('thenCalled done');
						done();
					});
					if (typeof(window) === 'undefined') {
						setTimeout(chk, 50);
					} else {
						st(chk, 50);
					}
				});
				it('function works and x is animated.', (done) => {
					chai.assert.strictEqual(moveOngoing, true);
					done();
				});
				it('callback works.', (done) => {
					chai.assert.strictEqual(callbackCalled, true);
					done();
				});
				it('then() works.', (done) => {
					chai.assert.strictEqual(thenCalled, true);
					done();
				});
			});
		}
	});
}

/**
 * Constants.
 *
 */
namespace c {
	
}

test();
