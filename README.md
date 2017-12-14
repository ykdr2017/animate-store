NOTE: Source code comments and README are under development.

# animate-store

[![Build Status](https://travis-ci.org/ykdr2017/animate-store.svg?branch=master)](https://travis-ci.org/ykdr2017/animate-store)

## ABOUT animate-store

This is a TypeScript/JavaScript library for website's animated expression.
This library does not depend on DOM operation directly, so that it is acceptable to most of view libraries (e.g. React, jQuery) .

## INSTALL

```Shell
$ npm install animate-store
```

## USAGE (TypeScript & React)

With running `anim.move()`, `render()` will be called at each timing of `window.requestAnimationFrame` . 

```TypeScript
import * as Animate from 'animate-store';
import * as ReactDOM from 'react-dom';

let anim: Animate.Animation = new Animate.Animation([0], (p) => {
	render({ x: p[0] });
});

let _x: number;
function render(state?: { x: number }): void {
	_x = _x ? _x : 0;
	let x = state ? state.x : _x;
	ReactDOM.render(
		<div style={{ position: 'relative', left: Math.floor(x) }}>
			This will move 200px left 0.5 seconds.
		</div>,
		document.querySelector('.app')
	);
	_x = x;
}

anim.move(
	{
		next: { value: 200, curve: Animate.Curve.linear  },
		duration: 500
	}
);
```

NOTE: In actual development with React,
`state, _x` had better be defined in established place, such as state in React.Component.

## DEVELOP

```Shell
$ npm install
$ npm run build:main
```

## TEST

```Shell
$ npm test
```
