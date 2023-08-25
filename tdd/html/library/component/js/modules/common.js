/*!
 * @module SmoothScroll, SwipeGesture, CheckboxAllChecker, Formatter
 */

/*!
 * @module vcui.ui.SmoothScroll
 * @author 김승일 책임(comahead@vinylc.com)
 * momentum benchmark: iScroll v5.1.2 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license
 */
(function ($, core, undefined) {
	"use strict";
	if (core.ui.SmoothScroll) { return; }

	var rAF = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
	var _elementStyle = document.createElement('div').style;
	var _vendor = (function () {
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;

		for (; i < l; i++) {
			transform = vendors[i] + 'ransform';
			if (transform in _elementStyle) {
				return vendors[i].substr(0, vendors[i].length - 1);
			}
		}

		return false;
	})();

	function _prefixStyle(style) {
		if (_vendor === false) return false;
		if (_vendor === '') return style;
		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}

	var _transform = _prefixStyle('transform');

	var getTime = Date.now || function getTime() {
			return new Date().getTime();
		};

	// 위치와 속도에 따라 이동크기와 걸리는 시간 게산
	var momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {
		var distance = current - start,
			speed = Math.abs(distance) / time,
			destination,
			duration;

		deceleration = deceleration === undefined ? 0.0006 : deceleration;

		destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
		duration = speed / deceleration;

		if (destination < lowerMargin) {
			destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
			distance = Math.abs(destination - current);
			duration = distance / speed;
		} else if (destination > 0) {
			destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
			distance = Math.abs(current) + destination;
			duration = distance / speed;
		}

		return {
			destination: Math.round(destination),
			duration: duration
		};
	};

	var browser = {
		hasTransform: _transform !== false,
		hasPerspective: _prefixStyle('perspective') in _elementStyle,
		hasTouch: 'ontouchstart' in window,
		hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
		hasTransition: _prefixStyle('transition') in _elementStyle
	};

	var easingType = {
		quadratic: {
			style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			fn: function (k) {
				return k * ( 2 - k );
			}
		},
		circular: {
			style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
			fn: function (k) {
				return Math.sqrt(1 - ( --k * k ));
			}
		},
		back: {
			style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			fn: function (k) {
				var b = 4;
				return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
			}
		},
		bounce: {
			style: '',
			fn: function (k) {
				if (( k /= 1 ) < ( 1 / 2.75 )) {
					return 7.5625 * k * k;
				} else if (k < ( 2 / 2.75 )) {
					return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
				} else if (k < ( 2.5 / 2.75 )) {
					return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
				} else {
					return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
				}
			}
		},
		elastic: {
			style: '',
			fn: function (k) {
				var f = 0.22,
					e = 0.4;

				if (k === 0) {
					return 0;
				}
				if (k == 1) {
					return 1;
				}

				return ( e * Math.pow(2, -10 * k) * Math.sin(( k - f / 4 ) * ( 2 * Math.PI ) / f) + 1 );
			}
		}
	};

	var eventType = {
		touchstart: 1,
		touchmove: 1,
		touchend: 1,

		mousedown: 2,
		mousemove: 2,
		mouseup: 2,

		pointerdown: 3,
		pointermove: 3,
		pointerup: 3,

		MSPointerDown: 3,
		MSPointerMove: 3,
		MSPointerUp: 3
	};

	function eventButton(e) {
		if (!e.which && e.button) {
			if (e.button & 1) {return 1; }
			else if (e.button & 4) { return 2; }
			else if (e.button & 2) { return 3; }
		}
		return e.button;
	}

	var style = {
		transform: _transform,
		transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
		transitionDuration: _prefixStyle('transitionDuration'),
		transitionDelay: _prefixStyle('transitionDelay'),
		transformOrigin: _prefixStyle('transformOrigin')
	};

	/**
	 * 부드러운 스크롤러 모듈
	 * @class vcui.ui.SmoothScroll
	 * @extends vcui.ui.View
	 * @fires vcui.ui.SmoothScroll#smoothscrollstart
	 * @fires vcui.ui.SmoothScroll#smoothscrollmove미
	 * @fires vcui.ui.SmoothScroll#smoothscrollend
	 */
	var SmoothScroll = core.ui('SmoothScroll', {
		bindjQuery: 'smoothScroll',
		defaults: {
			startX: 0,                      // 첫 x 위치
			startY: 0,                      // 첫 y 위치
			scrollX: false,                // 가로스크롤 허용여부
			scrollY: true,                  // 세로스크롤 허용여부
			directionLockThreshold: 5,  //
			scrollByWheel: true,            // 마우스 휠 허용여부
			scrollType: 'style',            // 'scroll', 'style' 중 택일
			mouseWheelSpeed: 20,            // 마우스휠 속도
			momentum: true,                 // 던지는 효과사용

			bounce: true,                   // 튕기는 효과사용
			bounceTime: 600,                // 튕기는 속도
			bounceEasing: '',

			preventDefault: true,
			preventDefaultException: { tagName: /^(INPUT|TEXTAREA|SELECT)$/i },

			HWCompositing: true,            // 하드웨어 가속 사용
			useTransition: true,            // 트랜지션 사용
			useTransform: true,             // 트랜스폼 사용
			resizeRefresh: false,           // 리사이징시에 자동으로 레이아웃사이즈를 재계산 할 것인가
			resizePolling: 60,               // 재계산 최소 시간

			snap: ''                          // 스냅대상 셀렉터
		},
		selectors: {
			//wrapper: '.ui_wrapper',
			scroller: '.ui_scroller'
		},
		/**
		 * 생성자
		 * @param {string} el
		 * @param {Object} options
		 */
		initialize: function(el, options) {
			var me = this, opts;
			if (me.supr(el, options) === false) { return; }
			if (!me.$scroller[0]){ return; }

			opts = me.options;
			me.$wrapper = me.$el;
			me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));
			me.translateZ = opts.HWCompositing && browser.hasPerspective ? ' translateZ(0)' : '';
			opts.useTransition = browser.hasTransition && opts.useTransition && opts.scrollType === 'style';
			opts.useTransform = browser.hasTransform && opts.useTransform;
			opts.eventPassthrough = opts.eventPassthrough === true ? 'vertical' : opts.eventPassthrough;
			opts.preventDefault = !opts.eventPassthrough && opts.preventDefault;
			opts.scrollY = opts.eventPassthrough == 'vertical' ? false : opts.scrollY;
			opts.scrollX = opts.eventPassthrough == 'horizontal' ? false : opts.scrollX;
			opts.freeScroll = opts.freeScroll && !opts.eventPassthrough;
			opts.directionLockThreshold = opts.eventPassthrough ? 0 : opts.directionLockThreshold;
			opts.bounceEasing = typeof opts.bounceEasing == 'string' ? easingType[opts.bounceEasing] || easingType.circular : opts.bounceEasing;
			opts.invertWheelDirection = opts.invertWheelDirection ? -1 : 1;  // 마우스휠 반대 방향

			me._startX = 0;
			me._startY = 0;
			me.x = 0;   // 현재 x 위치
			me.y = 0;   // 현재 y 위치
			me.directionX = 0;
			me.directionY = 0;
			me.scrollerStyle = me.$scroller[0].style;

			if (opts.snap) {
				// 스냅대상 검색
				me.$snapItems = me.$(opts.snap);
			}

			me._init();
			me.refresh();

			me.scrollTo(opts.startX, opts.startY);
			me.enable();
		},

		/**
		 * 활성화
		 */
		enable: function(){
			this.isEnabled = true;
		},

		/**
		 * 비활성화
		 * @param flag
		 */
		setDisabled: function (flag) {
			this.isEnabled = !flag;
		},

		/**
		 * 초기 작업
		 * @private
		 */
		_init: function() {
			this._initEvents();
		},

		/**
		 * 이벤트 바인딩
		 * @private
		 */
		_initEvents: function() {
			var me = this;

			me._handle(me.$wrapper, 'mousedown');
			me._handle(me.$wrapper, 'touchstart');
			me._handle(me.$wrapper, 'selectstart');
			me._handle(me.$wrapper, 'dragstart');
			me._handle(me.$wrapper, 'click');

			if(me.options.useTransition) {
				me._handle(me.$scroller, 'transitionend');
				me._handle(me.$scroller, 'webkitTransitionEnd');
				me._handle(me.$scroller, 'oTransitionEnd');
				me._handle(me.$scroller, 'MSTransitionEnd');
			}

			if (me.options.scrollByWheel){
				me._initWheel();
			}

			if (me.options.resizeRefresh) {
				$(window).on('resize.' + me.cid, function (){
					me.refresh();
				});
			}
		},

		/**
		 * 마우스휠 이벤트 바인딩
		 * @private
		 */
		_initWheel: function () {
			var me = this;

			me._handle(me.$wrapper, 'wheel');
			me._handle(me.$wrapper, 'mousewheel');
			me._handle(me.$wrapper, 'DOMMouseScroll');
		},

		/**
		 * 휠이벤트 핸들러
		 * @param e
		 * @private
		 */
		_wheel: function (e) {
			var me = this;
			if ( !me.isEnabled ) {
				return;
			}

			e.preventDefault ? e.preventDefault() : e.returnValue = false;
			e.stopPropagation ? e.stopPropagation() : e.cancalBubble = true;

			var wheelDeltaX, wheelDeltaY,
				newX, newY;

			if ( me.wheelTimeout === undefined ) {
				me._startX = me.x;
				me._startY = me.y;
				var ev = $.Event('smoothscrollstart');
				me.triggerHandler(ev, {x: me.x, y: me.y});
				if (ev.isDefaultPrevented()) {
					return;
				}
			}

			clearTimeout(me.wheelTimeout);
			me.wheelTimeout = setTimeout(function () {
				me._triggerEnd();
				me.wheelTimeout = undefined;
			}, 400);

			e = e.originalEvent || e;
			if ( 'deltaX' in e ) {
				if (e.deltaMode === 1) {
					wheelDeltaX = -e.deltaX * me.options.mouseWheelSpeed;
					wheelDeltaY = -e.deltaY * me.options.mouseWheelSpeed;
				} else {
					wheelDeltaX = -e.deltaX;
					wheelDeltaY = -e.deltaY;
				}
			} else if ( 'wheelDeltaX' in e ) {
				wheelDeltaX = e.wheelDeltaX / 120 * me.options.mouseWheelSpeed;
				wheelDeltaY = e.wheelDeltaY / 120 * me.options.mouseWheelSpeed;
			} else if ( 'wheelDelta' in e ) {
				wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * me.options.mouseWheelSpeed;
			} else if ( 'detail' in e ) {
				wheelDeltaX = wheelDeltaY = -e.detail / 3 * me.options.mouseWheelSpeed;
			} else {
				return;
			}

			wheelDeltaX *= me.options.invertWheelDirection;
			wheelDeltaY *= me.options.invertWheelDirection;

			if ( !me.hasVerticalScroll ) {
				wheelDeltaX = wheelDeltaY;
				wheelDeltaY = 0;
			}

			newX = me.x + Math.round(me.hasHorizontalScroll ? wheelDeltaX : 0);
			newY = me.y + Math.round(me.hasVerticalScroll ? wheelDeltaY : 0);

			if ( newX > 0 ) {
				newX = 0;
			} else if ( newX < me.maxScrollX ) {
				newX = me.maxScrollX;
			}

			if ( newY > 0 ) {
				newY = 0;
			} else if ( newY < me.maxScrollY ) {
				newY = me.maxScrollY;
			}

			me.scrollTo(newX, newY, 0);
		},

		/**
		 * el에 eventName 이벤트 바인딩
		 * @param {jQuery} $el
		 * @param {string} eventName
		 * @param {boolean} isBind
		 * @private
		 */
		_handle: function($el, eventName, isBind) {
			var me = this;
			if(isBind !== false) {
				$el.on(eventName+'.'+me.cid, me.handleEvent.bind(me));
			} else {
				$el.off(eventName+'.'+me.cid);
			}
		},

		/**
		 * 이벤트 핸들러
		 * @param e
		 */
		handleEvent: function(e) {
			var me = this;

			switch(e.type) {
				case 'mousedown':
				case 'touchstart':
					if (me.moved) {
						e.preventDefault();
					}
					me._start(e);
					break;
				case 'selectstart':
				case 'dragstart':
					e.preventDefault ? e.preventDefault : e.returnValue = false;
					break;
				case 'mousemove':
				case 'touchmove':
					me._move(e);
					break;
				case 'mouseup':
				case 'mousecancel':
				case 'touchend':
				case 'touchcancel':
					me._end(e);
					break;
				case 'transitionend':
				case 'webkitTransitionEnd':
				case 'oTransitionEnd':
				case 'MSTransitionEnd':
					me._transitionEnd(e);
					break;
				case 'wheel':
				case 'mousewheel':
				case 'DOMMouseScroll':
					me._wheel(e);
					break;
				case 'click':
					if (me.moved) {
						e.preventDefault();
						e.stopPropagation();
					} else {
						me._click(e);
					}
					break;
			}
		},

		/**
		 * 현재 위치 조회
		 * @returns {{x: *, y: *}}
		 */
		getPosition: function () {
			var x, y;

			if (this.options.scrollType === 'style') {
				var pos = core.dom.position(this.$scroller);
				x = pos.x;
				y = pos.y;
			} else if (this.options.scrollType === 'scroll') {
				x = -this.$scroller.parent().scrollLeft();
				y = -this.$scroller.parent().scrollTop();
			}
			return { x: x, y: y };
		},

		/**
		 * 애니메이션
		 * @param {number} destX
		 * @param {number} destY
		 * @param {number} duration
		 * @param {function} easingFn
		 * @private
		 */
		_animate: function (destX, destY, duration, easingFn) {
			var me = this,
				startX = this.x,
				startY = this.y,
				startTime = getTime(),
				destTime = startTime + duration;

			function step () {
				var now = getTime(),
					newX, newY,
					easing;

				if ( now >= destTime ) {
					me.isAnimating = false;
					me._translate(destX, destY);

					if (!me.resetPosition(me.options.bounceTime) ) {
						me._triggerEnd();
					}

					return;
				}

				now = ( now - startTime ) / duration;
				easing = easingFn(now);
				newX = ( destX - startX ) * easing + startX;
				newY = ( destY - startY ) * easing + startY;
				me._translate(newX, newY);

				if ( me.isAnimating ) {
					rAF(step);
				}
			}

			this.isAnimating = true;
			step();
		},
		/**
		 * 애니메이션 시간 설정
		 * @param {number} time
		 * @private
		 */
		_transitionTime: function (time) {
			if (!this.options.useTransition) { return; }

			time = time || 0;
			this.scrollerStyle[style.transitionDuration] = time + 'ms';

			/*if ( !time && utils.isBadAndroid ) {
			 this.scrollerStyle[style.transitionDuration] = '0.001s';
			 }*/

		},
		/**
		 * easing  설정
		 * @param {string} easing
		 * @private
		 */
		_transitionTimingFunction: function (easing) {
			if (!this.options.useTransition) { return; }

			this.scrollerStyle[style.transitionTimingFunction] = easing;
		},

		/**
		 * 이동
		 * @param {number} x
		 * @param {number} y
		 * @private
		 */
		_translate: function (x, y) {
			var me = this;

			var ev = $.Event('smoothscrollmove');
			me.triggerHandler(ev, {x: x, y: y});
			if (ev.isDefaultPrevented()) {
				return;
			}

			if ( me.options.scrollType === 'style') {
				if (me.options.useTransform) {
					me.scrollerStyle[style.transform] = 'translate(' + x + 'px,' + y + 'px)' + me.translateZ;
				} else {
					x = Math.round(x);
					y = Math.round(y);
					me.scrollerStyle.left = x + 'px';
					me.scrollerStyle.top = y + 'px';
				}
			} else if (me.options.scrollType === 'scroll') {
				me.$scroller.parent().scrollLeft(-x);
				me.$scroller.parent().scrollTop(-y);
			}

			me.scrollSizeX = me.x - x;
			me.scrollSizeY = me.y - y;
			me.x = x;
			me.y = y;
			//me.triggerHandler('smoothscrollmove', {x: me.x, y: me.y});
		},

		/**
		 * 튕기는 효과
		 * @param time
		 * @returns {boolean}
		 */
		resetPosition: function (time) {
			var me = this,
				x = me.x,
				y = me.y;

			time = time || 0;

			if ( !me.hasHorizontalScroll || me.x > 0 ) {
				x = 0;
			} else if ( me.x < me.maxScrollX ) {
				x = me.maxScrollX;
			}

			if ( !me.hasVerticalScroll || me.y > 0 ) {
				y = 0;
			} else if ( me.y < me.maxScrollY ) {
				y = me.maxScrollY;
			}

			if ( x == me.x && y == me.y ) {
				return false;
			}

			me.scrollTo(x, y, time, me.options.bounceEasing);

			return true;
		},

		/**
		 * 이전으로 스크롤
		 * @param {string} dir 'x', 'y'
		 * @param {number} time
		 * @param {function} easing
		 */
		scrollPrev: function (dir, time, easing) {
			var me = this,
				x = 0, y = 0;

			if (dir === 'x') {
				x = Math.min(0, me.x + me.wrapperWidth);
			} else {
				y = Math.min(0, me.y + me.wrapperHeight);
			}

			me.scrollTo(x, y, time, easing);
		},

		/**
		 * 이후로 스크롤
		 * @param {string} dir 'x', 'y'
		 * @param {number} time
		 * @param {function} easing
		 */
		scrollNext: function (dir, time, easing) {
			var me = this,
				x = 0, y = 0;

			if (dir === 'x') {
				x = Math.max(me.maxScrollX, me.x - me.wrapperWidth);
			} else {
				y = Math.max(me.maxScrollY, me.y - me.wrapperHeight);
			}

			me.scrollTo(x, y, time, easing);
		},

		/**
		 * 지정한 위치로 스크롤링
		 * @param {number} x
		 * @param {number} y
		 * @param {float} time
		 * @param easing
		 */
		scrollTo: function (x, y, time, easing) {
			var me = this;
			easing = easing || easingType.circular;

			if (typeof x === 'string') {
				if (/^-=/.test(x)) {
					x = me.x - parseInt(x.substr(2), 10);
				} else if (/^\+=/.test(x)) {
					x = me.x + parseInt(x.substr(2));
				}
			}

			if (typeof y === 'string') {
				if (/^-=/.test(y)) {
					y = me.y - parseInt(y.substr(2), 10);
				} else if (/^\+=/.test(y)) {
					y = me.y + parseInt(y.substr(2), 10);
				}
			}

			if (!me.options.momentum) {
				x = Math.max(me.maxScrollX, Math.min(x, 0));
				y = Math.max(me.maxScrollY, Math.min(y, 0));
			}
			me.isInTransition = me.options.useTransition && time > 0;

			if ( !time || (me.options.useTransition && easing.style) ) {
				me._transitionTimingFunction(easing.style);
				me._transitionTime(time);
				me._translate(x, y);
			} else {
				me._animate(x, y, time, easing.fn);
			}
		},

		/**
		 * el이 위치한 곳으로 스크롤링
		 * @param {Element} el
		 * @param {float} time
		 * @param {number} offsetX
		 * @param {number} offsetY
		 * @param easing
		 */
		scrollToElement: function (el, time, offsetX, offsetY, easing) {
			var me = this;
			el = el.nodeType ? el : me.$scroller.find(el);

			if ( !el ) {
				return;
			}

			var pos = $(el).position();
			pos.left *= -1;
			pos.top *= -1;

			/*pos.left -= me.wrapperOffset.left;
			 pos.top  -= me.wrapperOffset.top;

			 // if offsetX/Y are true we center the element to the screen
			 if ( offsetX === true ) {
			 offsetX = Math.round(el.offsetWidth / 2 - me.$wrapper.offsetWidth / 2);
			 }
			 if ( offsetY === true ) {
			 offsetY = Math.round(el.offsetHeight / 2 - me.$wrapper.offsetHeight / 2);
			 }

			 pos.left -= offsetX || 0;
			 pos.top  -= offsetY || 0;*/

			pos.left = pos.left > 0 ? 0 : pos.left < me.maxScrollX ? me.maxScrollX : pos.left;
			pos.top  = pos.top  > 0 ? 0 : pos.top  < me.maxScrollY ? me.maxScrollY : pos.top;

			time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(me.x-pos.left), Math.abs(me.y-pos.top)) : time;

			me.scrollTo(pos.left, pos.top, time, easing);
		},

		_isDragable: function(el){
			if (core.browser.isTouch) { return true; }

			if(el && el.tagName && this.options.preventDefaultException.tagName.test(el.tagName)){
				return false;
			} else {
				return true;
			}
		},

		/**
		 * pc에서 드래그후의 클릭이벤트를 무효화
		 * @param e
		 * @private
		 */
		_click: function(e) {

			var me = this,
				point = core.dom.getEventPoint(e);

			if(!(me.downX === point.x && me.downY === point.y)) {
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
				e.stopPropagation ? e.stopPropagation() : e.cancalBubble = true;
			}
		},

		/**
		 * 터치 스타트 핸들러
		 * @param ev
		 * @private
		 */
		_start: function(ev) {
			var me = this;
			var e = ev.originalEvent || ev;

			if ( eventType[e.type] != 1 ) {
				if (core.dom.getMouseButton(e) !== 'left') {
					return;
				}
			}

			// 160113_삭제 버튼 미동작 - 버튼 클래스에 input_del이 있는 경우 무시
			if ((!me.isEnabled || (me.initiated && eventType[e.type] !== me.initiated)) && !$(ev.target).hasClass('input_del')) {
				return;
			}

			var $doc = $(document),
				point = core.dom.getEventPoint(e),
				pos;

			/***if(!me._isDownable($(e.target).closest(':focusable').get(0))) {
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
            }***/
			if (!me._isDragable(ev.target)) {
				return;
			}

			me._handle($doc, 'mousemove');
			me._handle($doc, 'touchmove');
			me._handle($doc, 'touchend');
			me._handle($doc, 'mouseup');
			me._handle($doc, 'mousecancel');
			me._handle($doc, 'tocuchcancel');

			me.initiated	= eventType[e.type];
			me.moved		= false;
			me.distX		= 0;
			me.distY		= 0;
			me.directionX = 0;
			me.directionY = 0;
			me.directionLocked = 0;

			me._transitionTime();

			me.startTime = getTime();
			if ( me.options.useTransition && me.isInTransition ) {
				me.isInTransition = false;
				pos = me.getPosition();
				me._translate(Math.round(pos.x), Math.round(pos.y));
				me._triggerEnd();
			} else if ( !me.options.useTransition && me.isAnimating ) {
				me.isAnimating = false;
				me._triggerEnd();
			}

			me.startX    = me.x;
			me.startY    = me.y;
			me.absStartX = me.x;
			me.absStartY = me.y;
			me.pointX    = me.downX = point.x;
			me.pointY    = me.downY = point.y;
		},

		/**
		 * 터치무브 핸들러
		 * @param e
		 * @private
		 */
		_move: function(e) {
			var me = this;

			e = e.originalEvent || e;
			if ( !me.isEnabled || eventType[e.type] !== me.initiated ) {
				return;
			}

			if ( me.options.preventDefault ) {	// increases performance on Android? TODO: check!
				e.preventDefault ? e.preventDefault() : e.defaultValue = false;
			}

			var point		= core.dom.getEventPoint(e),
				deltaX		= point.x - me.pointX,
				deltaY		= point.y - me.pointY,
				timestamp	= getTime(),
				newX, newY,
				absDistX, absDistY;


			me.pointX		= point.x;
			me.pointY		= point.y;

			me.distX		+= deltaX;
			me.distY		+= deltaY;
			absDistX		= Math.abs(me.distX);
			absDistY		= Math.abs(me.distY);

			// We need to move at least 10 pixels for the scrolling to initiate
			if ( timestamp - me.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
				return;
			}

			// If you are scrolling in one direction lock the other
			if ( !me.directionLocked && !me.options.freeScroll ) {
				if ( absDistX > absDistY + me.options.directionLockThreshold ) {
					me.directionLocked = 'h';		// lock horizontally
				} else if ( absDistY >= absDistX + me.options.directionLockThreshold ) {
					me.directionLocked = 'v';		// lock vertically
				} else {
					me.directionLocked = 'n';		// no lock
				}
			}


			if ( me.directionLocked == 'h' ) {
				if ( me.options.eventPassthrough == 'vertical' ) {
					e.preventDefault ? e.preventDefault() : e.defaultValue = false;
				} else if ( me.options.eventPassthrough == 'horizontal' ) {
					me.initiated = false;
					return;
				}

				deltaY = 0;
			} else if ( me.directionLocked == 'v' ) {
				if ( me.options.eventPassthrough == 'horizontal' ) {
					e.preventDefault ? e.preventDefault() : e.defaultValue = false;
				} else if ( me.options.eventPassthrough == 'vertical' ) {
					me.initiated = false;
					return;
				}

				deltaX = 0;
			}


			deltaX = me.hasHorizontalScroll ? deltaX : 0;
			deltaY = me.hasVerticalScroll ? deltaY : 0;

			newX = me.x + deltaX;
			newY = me.y + deltaY;

			// Slow down if outside of the boundaries
			if ( newX > 0 || newX < me.maxScrollX ) {
				newX = me.options.bounce ? me.x + deltaX / 3 : newX > 0 ? 0 : me.maxScrollX;
			}
			if ( newY > 0 || newY < me.maxScrollY ) {
				newY = me.options.bounce ? me.y + deltaY / 3 : newY > 0 ? 0 : me.maxScrollY;
			}

			me.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
			me.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

			if ( !me.moved ) {
				me._startX = me.x;
				me._startY = me.y;
				var ev = $.Event('smoothscrollstart');
				me.triggerHandler(ev, {x: me.x, y: me.y});
				if (ev.isDefaultPrevented()) {
					return;
				}
			}
			me.moved = true;
			me._translate(newX, newY);

			if ( timestamp - me.startTime > 300 ) {
				me.startTime = timestamp;
				me.startX = me.x;
				me.startY = me.y;
			}
		},

		/**
		 * 터치이벤트 핸들러
		 * @param e
		 * @private
		 */
		_end: function(e) {
			var me = this;

			if ( !me.isEnabled || eventType[e.type] !== me.initiated ) {
				return;
			}

			var $doc = $(document),
			//point = e.changedTouches ? e.changedTouches[0] : e,
				momentumX,
				momentumY,
				duration = getTime() - me.startTime,
				newX = Math.round(me.x),
				newY = Math.round(me.y),
			//distanceX = Math.abs(newX - me.startX),
			//distanceY = Math.abs(newY - me.startY),
				time = 0,
				easing = '';

			$doc.off('.'+me.cid);

			me.isInTransition = 0;
			me.initiated = 0;
			me.endTime = getTime();

			// reset if we are outside of the boundaries
			if ( me.resetPosition(me.options.bounceTime) ) {
				return;
			}

			me.scrollTo(newX, newY);	// ensures that the last position is rounded

			if ( !me.moved ) {
				return;
			}

			// start momentum animation if needed
			if ( me.options.momentum && duration < 300 ) {
				momentumX = me.hasHorizontalScroll ? momentum(me.x, me.startX, duration, me.maxScrollX, me.options.bounce ? me.wrapperWidth : 0, me.options.deceleration) : { destination: newX, duration: 0 };
				momentumY = me.hasVerticalScroll ? momentum(me.y, me.startY, duration, me.maxScrollY, me.options.bounce ? me.wrapperHeight : 0, me.options.deceleration) : { destination: newY, duration: 0 };
				newX = momentumX.destination;
				newY = momentumY.destination;
				time = Math.max(momentumX.duration, momentumY.duration);
				me.isInTransition = 1;
			}

			if ( newX != me.x || newY != me.y ) {
				// change easing function when scroller goes out of the boundaries
				if ( newX > 0 || newX < me.maxScrollX || newY > 0 || newY < me.maxScrollY ) {
					easing = easingType.quadratic;
				}

				me.scrollTo(newX, newY, time, easing);
				return;
			}

			me._triggerEnd();
		},

		/**
		 * 재배치 된 요소들을 대계산
		 */
		refresh: function() {
			//var rf = this.$wrapper[0].offsetHeight;		// Force reflow
			var me = this;

			me.wrapperWidth	= me.options.getWrapperWidth ? me.options.getWrapperWidth() : me.$wrapper.width();
			me.wrapperHeight	= me.options.getWrapperHeight ? me.options.getWrapperHeight() : me.$wrapper.height();

			me.scrollerWidth	= me.options.getScrollerWidth ? me.options.getScrollerWidth() : me.$scroller.width();
			me.scrollerHeight	= me.options.getScrollerHeight ? me.options.getScrollerHeight() : me.$scroller.height();

			me.maxScrollX		= me.wrapperWidth - me.scrollerWidth;
			me.maxScrollY		= me.wrapperHeight - me.scrollerHeight;

			me.hasHorizontalScroll	= me.options.scrollX && me.maxScrollX < 0;
			me.hasVerticalScroll		= me.options.scrollY && me.maxScrollY < 0;

			if ( !me.hasHorizontalScroll ) {
				me.maxScrollX = 0;
				me.scrollerWidth = me.wrapperWidth;
			}

			if ( !me.hasVerticalScroll ) {
				me.maxScrollY = 0;
				me.scrollerHeight = me.wrapperHeight;
			}

			me.endTime = 0;
			me.directionX = 0;
			me.directionY = 0;

			me.resetPosition();
			me.options.snap && me._refreshSnapPos();
		},

		/**
		 * 스내핑 대상들의 위치 재계산
		 * @private
		 */
		_refreshSnapPos: function () {
			var me = this;
			if (!me.options.snap) { return; }

			me.snapItemsPos = [];
			me.$snapItems.each(function (){
				me.snapItemsPos.push($(this).position());
			});
		},

		/**
		 * 애니메이션이 끝났을 때 발생
		 * @param e
		 * @private
		 */
		_transitionEnd: function(e) {
			var me = this;
			if ( e.target != me.$scroller[0] || !me.isInTransition ) {
				return;
			}

			me._transitionTime();
			if ( !me.resetPosition(me.options.bounceTime) ) {
				me.isInTransition = false;
				this._triggerEnd();
			}
		},

		/**
		 * 스냅 처리
		 * @returns {boolean}
		 * @private
		 */
		_snap: function () {
			var me = this;
			if (!me.options.snap) { return; }
			if (me._isSnap) {
				me._isSnap = false;
			} else if (me.maxScrollX != me.x) {
				var x = me._startX - me.x,
					prevX = 0, isMoved = false;

				me._isSnap = true;
				x && core.each(me.snapItemsPos, function (item) {
					var left = item.left;
					if (x > 0) {
						if (left > Math.abs(me.x)) {
							isMoved = true;
							me._animate(-left, 0, 200, easingType.circular.fn);
							return false;
						}
					} else if (x < 0) {
						if (left > Math.abs(me.x)) {
							isMoved = true;
							me._animate(-prevX, 0, 200, easingType.circular.fn);
							return false;
						}
					}
					prevX = left;
				});
				if (isMoved) {
					return true;
				}
			}

			me._isSnap = false;
		},

		/**
		 * smoothscrollend  트리거
		 * @private
		 */
		_triggerEnd: function () {
			var me = this;

			me.moved = false;
			if (me.options.snap && me._snap() === true) { return; }
			me.triggerHandler('smoothscrollend', {
				x: me.x,
				y: me.y,
				dir: {x: me._startX - me.x, y: me._startY - me.y},
				wrapWidth: me.wrapperWidth,
				wrapHeight: me.wrapperHeight,
				scrollWidth: me.scrollerWidth,
				scrollHeight: me.scrollerHeight
			});
		},

		getCurrentX: function (){ return this.x; },
		getCurrentY: function (){ return this.y; },
		getMaxScrollX: function(){ return this.maxScrollX; },
		getMaxScrollY: function(){ return this.maxScrollY; }
	});


	if (typeof define === "function" && define.amd) {
		define([], function() {
			return SmoothScroll;
		});
	}

})(jQuery, window[LIB_NAME]);

/*!
 * @module vcui.ui.Scrollview
 * @author 김승일 책임((comahead@vi-nyl.com)
 * @create 2014-12-11
 * @license MIT License
 */
(function ($, core, undefined) {
	"use strict";
	if (core.ui.Scrollview) { return; }

	$.easing.smooth = function (x, t, b, c, d) {
		var ts = (t /= d) * t, tc = ts * t;
		return b + c * (-1 * ts * ts + 4 * tc + -6 * ts + 4 * t);
	};

	var cssTransform = core.css3.prefix('transform');

	var Scrollview = core.ui('Scrollview', {
		bindjQuery: 'scrollview',
		selectors: {
			wrapper: '>.ui_scrollarea',
			scroller: '>.ui_scrollarea>.ui_content',
			vscrollbar: '>.ui_scrollbar'
		},
		defaults: {
			duration: 600,
			speedLimit: 1.2,
			moveThreshold: 100,
			offsetThreshold: 30,
			startThreshold: 5,
			acceleration: 0.1,
			accelerationT: 250,
			watch: true,
			watchInterval: 400,
			preventScroll: true
		},
		initialize: function (el, options) {
			var me = this;

			if (me.supr(el, options) === false) {
				return;
			}

			me.maxScrollY = 0;
			me.scrollHeight = 0;
			me.wrapperHeight = 0;
			me.visibleScroll = false;

			if (me.$vscrollbar.size() === 0) {
				// 스크롤바가 없으면 자동 생성해 준다.
				me.$vscrollbar = $('<div class="scroll ui_scrollbar">' +
					'<span class="bg_top"></span><span class="bg_mid"></span>' +
					'<span class="bg_btm"></span></div>');
				me.$el.append(me.$vscrollbar);
			}

			me.scrollbarStyle = me.$vscrollbar[0].style;
			me.scrollbarStyle.display = 'none';
			var $inner = me.$vscrollbar.find('span.bg_mid');
			if ($inner.length) {
				me.scrollbarInnerStyle = $inner[0].style;
				me.scrollbarInnerStyle.paddingBottom = 0;
			}

			//me.$el.addClass('strack');
			me.$el.attr('tabindex', 0);
			me._bindEvents();
		},

		_bindEvents: function () {
			var me = this;

			if (me.$vscrollbar.size()){
				me.$wrapper.on('scroll', function () {
					var rate = (me.wrapperHeight - me.scrollbarHeight) / (me.scrollHeight - me.wrapperHeight);
					me._moveScrollbar(me.$wrapper[0].scrollTop * rate);
				});

				if (me.options.watch === true) {
					// 사이즈 변화 감시
					var totalTime = 0, dur = me.options.watchInterval;
					me.updateTimer = setInterval(function () {
						// 40초에 한번씩 dom에서 제거 됐건지 체크해서 타이머를 멈춘다.
						if (totalTime > 40000) {
							totalTime = 0;
							if (!$.contains(document, me.$el[0])) {
								clearInterval(me.updateTimer);
								me.updateTimer = null;
								return;
							}
						} else {
							totalTime += dur;
						}
						me.update();
					}, dur);
				}
			}
			/*if (core.browser.isTouch) {
			 me._bindContentScroll();
			 } else {
			 me._bindScrollbar();
			 me._bindKeys();
			 me._bindWheel();
			 }*/
		},

		_watchStart: function () {
			var me = this;

		},
		/**
		 * 터치기반 디바이스에서 터치로 컨텐츠를 스크롤할 수 있도록 바인딩
		 * @private
		 */
		_bindContentScroll: function () {
			var me = this,
				times = {}, multiplier = 1,
				util = core.util,
				distance, startY, startX, acc, scrollableY, wrapHeight, maxScrollY, startScrollTop, pos, isScrolling;

			me.$el.on('touchstart touchmove touchend touchcancel', function (e) {
				var isMove, touchTime, maxOffset, offset, scrollTop, duration, pointY;
				times[e.type] = e.timeStamp;

				pos = util.getEventPoint(e);
				pointY = pos.y;
				switch (e.type) {
					case 'touchstart':
						wrapHeight = me.wrapperHeight;
						maxScrollY = me.$wrapper[0].scrollHeight - wrapHeight;
						scrollableY = maxScrollY > 0;

						if (!scrollableY) { return; }

						startScrollTop = me.$wrapper[0].scrollTop;
						//pos = util.getEventPoint(e).y;
						startX = pos.x;
						startY = pos.y;
						multiplier = 1;
						isScrolling = false;

						if (me.$wrapper.is(":animated")
							&& (times['touchstart'] - times['touchend'] < me.options.accelerationT)) {
							multiplier += me.options.acceleration;
						} else {
							multiplier = 1;
						}

						me.$wrapper
							.stop(true, false)
							.data('scrollTop', me.$wrapper.scrollTop());

						break;
					case 'touchmove':
						if (!isScrolling && Math.abs(startX - pos.x) > Math.abs(startY - pos.y)) { scrollableY = false; }
						if (!scrollableY) { return; }

						if (me.options.preventScroll) { e.preventDefault(); }
						else {
							if (startY < pointY && startScrollTop === 0) { return; }
							if (startY > pointY && startScrollTop === maxScrollY) { return; }
							e.preventDefault();
						}

						distance = startY - pointY;
						acc = Math.abs(distance / (times['touchmove'] - times['touchstart']));
						scrollTop = me.$wrapper.data('scrollTop') + distance;
						duration = 0;
						multiplier = 1;
						isScrolling = true;

						if (scrollTop < 0) { scrollTop = 0; }
						else if (scrollTop > maxScrollY) { scrollTop = maxScrollY; }
						me.$wrapper.stop(true, false).scrollTop(scrollTop);

						e.stopPropagation();
						break;
					case 'touchend':
					case 'touchcancel':
						if (!scrollableY || !isScrolling) { return; }
						isMove = (Math.abs(startY - pointY) > me.options.startThreshold);
						if (isMove) {
							touchTime = times['touchend'] - times['touchmove'];
							maxOffset = wrapHeight * me.options.speedLimit;
							offset = Math.pow(acc, 2) * wrapHeight;
							offset = offset > maxOffset ? maxOffset : multiplier * offset;
							offset = (multiplier * offset) * ((distance < 0) ? -1 : 1);

							if ((touchTime < me.options.moveThreshold) && offset != 0 && Math.abs(offset) > me.options.offsetThreshold) {
								scrollTop = me.$wrapper.data('scrollTop') + distance + offset;
								duration = me.options.duration;

								if (scrollTop < 0) { scrollTop = 0; }
								else if (scrollTop > maxScrollY) { scrollTop = maxScrollY; }

								me.$wrapper.stop(true, false).animate({
									scrollTop: scrollTop
								}, {
									duration: duration,
									easing: 'smooth',
									complete: function () {
										multiplier = 1;
									}
								});
							}
						}
						break;
				}
			});

		},

		/**
		 * pc에서 상하키로 스크롤할 수 있도록 바인딩
		 * @private
		 */
		_bindKeys: function () {
			var me = this;

			me.$el.on('keydown', function (e) {
				var keyCode = e.keyCode || e.which,
					wrapperHeight = me.$wrapper.innerHeight(),
					scrollTop = me.$wrapper.prop('scrollTop'),
					maxScrollY = me.$wrapper.prop('scrollHeight') - wrapperHeight,
					newY;

				switch (keyCode) {
					case 38: // up
						e.preventDefault();
						if (scrollTop <= 0) {
							return;
						}
						newY = scrollTop - wrapperHeight;
						break;
					case 40: // down
						e.preventDefault();
						if (scrollTop >= maxScrollY) {
							return;
						}
						newY = scrollTop + wrapperHeight;
						break;
					default:
						return;
				}
				if (newY) {
					me.$wrapper.stop(true, false)
						.animate({
							scrollTop: newY
						}, {
							duration: me.options.duration,
							easing: 'smooth'
						});
				}
			});
		},

		/**
		 * pc에서 스크롤바로 컨텐츠를 스크롤할 수 있도록 바인딩
		 * @private
		 */
		_bindScrollbar: function () {
			var me = this,
				$doc = $(document),
				isTouch = core.browser.isTouch,
				currY, downY, moveY;

			function getY(e){
				if (isTouch && e.originalEvent.touches) {
					e = e.originalEvent.touches[0];
				}
				return e.pageY;
			}

			me.$vscrollbar.on('mousedown touchstart', function (e) {
				e.preventDefault();
				if (isTouch) {
					e.stopPropagation();
				}

				me.isMouseDown = true;
				currY = core.css3.position(me.$vscrollbar).y;
				downY = getY(e);

				$doc.on('mouseup.' + me.cid + ' mousecancel.' + me.cid +
					' touchend.' + me.cid + ' mousemove.' + me.cid +
					' touchmove.' + me.cid + ' touchcancel.' + me.cid, function (e) {
					if (!me.isMouseDown) {
						$doc.off('.' + me.cid);
						return;
					}

					switch (e.type) {
						case 'mouseup':
						case 'touchend':
						case 'mousecancel':
						case 'touchcancel':
							me.isMouseDown = false;
							if (!me.isScrollbarActive) {
								me.$vscrollbar.removeClass('active');
							}
							moveY = 0;
							$doc.off('.' + me.cid);
							break;
						case 'mousemove':
						case 'touchmove':
							moveY = getY(e);

							var top = currY - (downY - moveY),
								scrollHeight = me.wrapperHeight - me.scrollbarHeight,
								y;

							me.scrollbarStyle.top = (top = Math.max(0, Math.min(top, scrollHeight)));
							y = (me.scrollHeight - me.wrapperHeight) * (top / scrollHeight);
							me.$wrapper.scrollTop(y);
							e.preventDefault();
							break;
					}
				});
				return false;
			}).on('mouseenter mouseleave', function(e) {
				me.isScrollbarActive = e.type === 'mouseenter';
				me.$vscrollbar.toggleClass('active', me.isScrollbarActive || me.isMouseDown);
			});
		},

		/**
		 * pc에서 마우스로 스크롤할 수 있도록 바인딩
		 * @private
		 */
		_bindWheel: function () {
			var me = this;
			me.$wrapper.on('mousewheel DOMMouseScroll wheel', function (ev) {
				var e = ev.originalEvent;
				var delta     = core.util.getDeltaY(e) * 100,
					scrollTop = me.$wrapper[0].scrollTop;

				me.$wrapper.scrollTop(scrollTop - delta); // -: down +: up
				if (me.options.preventScroll) {
					ev.preventDefault();
					ev.stopPropagation();
				} else {
					if (me.$wrapper[0].scrollTop != scrollTop) {
						ev.preventDefault();
						ev.stopPropagation();
					}
				}
			});
		},


		/**
		 * 스크롤바를 움직여주는 함수
		 * @param top
		 * @param height
		 * @private
		 */
		_moveScrollbar: function (top, height) {
			var me = this;

			if (!me.visibleScroll) { return; }
			if (isNaN(top)) { top = 0; }
			if (height !== undefined && me.scrollbarHeight != height) {
				height = Math.max(height, 18);
				if (me.scrollbarInnerStyle){
					var roundSize = me.$vscrollbar.children().eq(0).height();
					me.scrollbarInnerStyle.top = roundSize + 'px';
					me.scrollbarInnerStyle.bottom = roundSize + 'px';
				}
				me.scrollbarStyle.height = height+'px';
				me.scrollbarHeight = height;
			} else {
				height = me.scrollbarHeight;
			}
			if (me.wrapperHeight < height + top) {
				top = me.wrapperHeight - height;
			}
			if (core.css3.support) {
				me.scrollbarStyle[cssTransform] = 'translate(0px, ' + top + 'px)';
			} else {
				me.scrollbarStyle.top = top + 'px';
			}
		},

		/**
		 * 사이즈 변화에 따른 UI 갱신
		 */
		update: function (){
			var me = this,
				wrapperHeight, scrollHeight, visibleScroll, scrollbarHeight, rate;

			wrapperHeight = me.$wrapper[0].offsetHeight;
			if (wrapperHeight === 0){
				me.wrapperHeight = 0;
				return;
			}

			scrollHeight = me.$wrapper[0].scrollHeight;
			visibleScroll = wrapperHeight < scrollHeight - 1;
			if (visibleScroll && !me._bindedEventOver) {
				me._bindedEventOver = true;
				// 실질적으로 컨텐츠가 래퍼를 오버했을 때만 스크롤을 붙인다.
				if (core.browser.isTouch) {
					me._bindContentScroll();
				} else {
					me._bindScrollbar();
					me._bindKeys();
					me._bindWheel();
				}
			}
			// 160217 - 영역보다 내용이 작을 경우 스크롤바 감추기
			me.scrollbarStyle.display = visibleScroll ? '' : 'none';
			if (visibleScroll !== me.visibleScroll) {
				me.visibleScroll = visibleScroll;
				me.$el.toggleClass('strack', visibleScroll);
			}
			if (visibleScroll && (scrollHeight !== me.scrollHeight || wrapperHeight !== me.wrapperHeight)) {
				me.wrapperHeight = wrapperHeight;
				me.scrollHeight = scrollHeight;
				me.scrollRate = wrapperHeight / scrollHeight;
				rate = (me.wrapperHeight - me.scrollbarHeight) / (me.scrollHeight - me.wrapperHeight);
				me._moveScrollbar(me.$wrapper[0].scrollTop * rate, wrapperHeight * me.scrollRate);
			}
		},

		/**
		 * scrollTop 설정
		 * @param top
		 * @returns {*}
		 */
		scrollTop: function (top) {
			var me = this;
			if (arguments.length > 0) {
				me.$wrapper.scrollTop(top);
				me.update();
			} else {
				return me.$wrapper.scrollTop();
			}
		},

		release: function () {
			var me = this;

			me.updateTimer && (clearInterval(me.updateTimer), me.updateTimer = null);
			me.supr();
		}
	});

	if (typeof define === 'function' && define.amd) {
		define('mobules/scrollview', [], function (){
			return Scrollview;
		})
	}

})(jQuery, window[LIB_NAME]);


/*!
 * @module vcui.ui.SwipeGesture
 * @author 김승일 책임(comahead@vi-nyl.com)
 * @create 2014-12-11
 * @license MIT License
 */
(function($, core, undefined) {
	"use strict";
	if (core.ui.SwipeGesture) { return; }

	var util = core.util;
	var SwipeGesture = core.ui('SwipeGesture', {
		defaults: {
			container: document,
			threshold: 50,
			direction: 'horizontal',
			swipeStart: null,
			swipeMove: null,
			swipeEnd: null
		},
		initialize: function(el, options) {
			var me = this;
			if (me.supr(el, options) === false) {
				return;
			}

			me.isHoriz = me.options.direction === 'horizontal' || me.options.direction === 'both';
			me.isVerti = me.options.direction === 'vertical' || me.options.direction === 'both';
			me._bindSwipeEvents();
		},
		_bindSwipeEvents: function() {
			var me = this,
				touchStart,
				downPos,
				isSwipe = false,
				isScroll = false;

			me.$el[0].onselectstart = function (){ return false; };
			me.$el.attr('unselectable', 'on');
			me.$el.on('mousedown.swipegesture, touchstart.swipegesture', function(downEvent) {
				if (downEvent.type === 'mousedown') {
					downEvent.preventDefault();
				}
				downPos = touchStart = util.getEventPoint(downEvent);
				isSwipe = isScroll = false;


				$(me.options.container).on('mousemove.swipegesture'+me.cid+' touchmove.swipegesture'+me.cid, function (moveEvent) {
					var touch = util.getEventPoint(moveEvent),
						diff, slope, swipeY, swipeX;
					if (!touchStart || isScroll) {
						return;
					}

					diff = util.getDiff(touch, touchStart);
					if (!isSwipe ) {
						swipeX = Math.abs(diff.y) / (Math.abs(diff.x) || 1);
						swipeY = Math.abs(diff.x) / (Math.abs(diff.y) || 1);
						if ((swipeX < 1 && me.isHoriz) || (swipeY < 1 && me.isVerti)) {
							touch.event = moveEvent;
							if (me._swipeCallback('start', touch) === false){ return; };
							if (me.triggerHandler('swipegesturestart', touch) === false){ return; };
							isSwipe = true;
						} else {
							if ((me.isHoriz && swipeX > 1) || (me.isVerti && swipeY > 1)) {
								isScroll = true;
							}
						}
					}


					if (isSwipe) {
						moveEvent.stopPropagation();
						moveEvent.preventDefault();

						touch.diff = diff;
						touch.direction = util.getDirection(touchStart, touch,  me.options.direction);
						touch.event = moveEvent;
						if (me._swipeCallback('move', touch) === false) { return; }
						if (me.triggerHandler('swipegesturemove', touch) === false) { return; }
					}
				}).on('mouseup.swipegesture'+me.cid+' mousecancel.swipegesture'+me.cid+' touchend.swipegesture'+me.cid+' touchcancel.swipegesture'+me.cid, function (upEvent) {
					if (isSwipe && touchStart) {
						var touch = util.getEventPoint(upEvent, 'end');
						touch.diff = util.getDiff(touch, touchStart);

						touch.direction = util.getDirection(touchStart, touch, me.options.direction);
						touch.event = upEvent;
						if(Math.abs(touch.diff.x) > me.options.threshold
							|| Math.abs(touch.diff.y) > me.options.threshold) {
							me._swipeCallback('end', touch);
							me.triggerHandler('swipegestureend', touch);
						} else {
							me._swipeCallback('cancel', touch);
							me.triggerHandler('swipegesturecancel', touch);
						}
						switch(touch.direction) {
							case 'left':
							case 'right':
								if(Math.abs(touch.diff.x) > me.options.threshold && me.isHoriz){
									me._swipeCallback(touch.direction, touch);
									me.triggerHandler('swipegesture'+touch.direction);
								}
								break;
							case 'up':
							case 'down':
								if(Math.abs(touch.diff.y) > me.options.threshold && me.isVerti){
									me._swipeCallback(touch.direction, touch);
									me.triggerHandler('swipegesture'+touch.direction);
								}
								break;
						}
					}/* else {
					 var pos = util.getEventPoint(upEvent, 'end');
					 if(downPos.x === pos.x || downPos.y === pos.y) {
					 $(upEvent.target).trigger('click', {fake: true});
					 }
					 }*/

					touchStart = null;
					isScroll = false;

					$(me.options.container).off('.swipegesture'+me.cid)
				});
			}).on('click.swipegesture', 'a, button', function(e) {
				if(!downPos){ return; }
				var pos = util.getEventPoint(e);
				if(downPos.x != pos.x || downPos.y != pos.y) {
					e.preventDefault();
					e.stopPropagation();
				}
			});
		},

		_swipeCallback: function (type, data) {
			var me = this, ret;
			me.options['swipe' + type] && (ret = me.options['swipe' + type].call(me, data));
			me.options['swipe'] && (ret = me.options['swipe'].call(me, type, data));
			return ret;
		},

		release: function(){
			this.$el.off('.swipegesture'+this.cid).off('.swipegesture');
			$(this.options.container).off('.swipegesture'+this.cid);
			this.supr();
		}
	});

	core.ui.bindjQuery(SwipeGesture, 'swipeGesture');
	if (typeof define === 'function' && define.amd) {
		define('modules/swipe-gesture', [], function (){
			return SwipeGesture;
		});
	}
})(jQuery, window[LIB_NAME]);

/*!
 * @module vcui.ui.CheckboxAllChecker
 * @author 김승일 책임(comahead@vi-nyl.com)
 * @create 2015-03-31
 * @license MIT License
 * @modifier comahead@vi-nyl.com
 */
(function ($, core, undefined) {
	"use strict";
	if (core.ui.CheckboxAllChecker) {
		return;
	}

	var CheckboxAllChecker = core.ui('CheckboxAllChecker', {
		bindjQuery: 'checkboxAllChecker',
		defaults: {
			mode: ''
		},
		initialize: function (el, options) {
			var me = this;

			if (me.supr(el, options) === false) {
				return;
			}

			me.allCheck = true;
			me.$wrapper = $(me.$el.attr('data-check-all'));
			me.checkOnce = me.$el.data('checkOnce');
			me.limit = me.$el.data('checkLimit');
			if (me.$wrapper.size() === 0) { return; }

			me._bindEvents();
		},
		_bindEvents: function () {
			var me = this,
				selector = ':checkbox:enabled:not(.ui_checkall_ignore)';

			// 전체선택 체크박스 선택시
			me.on('change', function (e) {
				//me.$wrapper.find(selector).not(this).checked(this.checked);
				// 속도걔선을 위해 querySelectorAll를 지원하는 브라우저서는 querySelectorAll를 사용해서 조회
				setTimeout(function () {
					if (me.limit > 0) {
						me.allCheck = false;
						me.$wrapper.find('[type=checkbox]:enabled:not(.ui_checkall_ignore):lt(' + me.limit + ')').not(this).checked(this.checked);
					} else if (me.$wrapper[0].querySelectorAll) {
						$(me.$wrapper[0].querySelectorAll('[type=checkbox]'))
							.filter(':enabled:not(.ui_checkall_ignore)').not(this).checked(this.checked);
					} else {
						me.$wrapper.find('[type=checkbox]:enabled:not(.ui_checkall_ignore)').not(this).checked(this.checked);
					}
				}.bind(this));
			});

			var i = 0,
				oldCount;
			// 소속 체크박스를 선택시
			me.$wrapper.on('checkedchanged', ':checkbox', function (e) {
				if (this === me.$el[0]) { return; }
				var count = me.$wrapper.find(selector + ':not(:checked)').not(me.$el[0]).length,
					checkedCount = me.$wrapper.find(selector + ':checked').not(me.$el[0]).length,
					allCount = me.$wrapper.find(selector).not(me.$el[0]).length;

				if (me.checkOnce) {
					me.$el.checked(checkedCount > 0, false);
				} else if (oldCount !== count && me.allCheck) {
					oldCount = count;
					me.$el.checked(count === 0, false); // 전체가 선택되어 있는지 여부에 따라 전체선택 checked
				} else if (checkedCount > me.limit) {
					$(this).checked(false, false);
					core.showMessage('N0000003', [me.limit]);
					oldCount = count;
					me.$el.checked(checkedCount === me.limit, false); // 전체가 선택되어 있는지 여부에 따라 전체선택 checked
				} else {
					me.$el.checked(checkedCount === me.limit || checkedCount === allCount, false); // 전체가 선택되어 있는지 여부에 따라 전체선택 checked
				}
			});
		}
	});

	if (typeof define === 'function' && define.amd) {
		define('', [], function (){
			return CheckboxAllChecker;
		});
	}

})(jQuery, window[LIB_NAME]);


/**
 * @module vcui.ui.Formatter
 * @author 김승일 책임(comahead@vi-nyl.com)
 * @description 형식입력폼
 * @modifier (강태진수석)odyseek@vi-nyl.com
 * @date 160928 수정
 * Benchmark
 * github: https://github.com/firstopinion/formatter.js
 * License: The MIT License (MIT) Copyright (c) 2013 First Opinion
 */
(function ($, core) {
	"use strict";

	// {{9999}}-{{9999}}-{{9999}}
	// comma
	// tel
	// mobile
	// email

	// 캐얼 모듈
	var inputSel = {
		// 캐럿 위치 반환
		get: function(el) {
			if(core.is(el.selectionStart, 'number')) {
				return {
					begin: el.selectionStart,
					end: el.selectionEnd
				};
			}

			var range = document.selection.createRange();
			if(range && range.parentElement() === el) {
				var inputRange = el.createTextRange(), endRange = el.createTextRange(), length = el.value.length;
				inputRange.moveToBookmark(range.getBookmark());
				endRange.collapse(false);

				if(inputRange.compareEndPoints('StartToEnd', endRange) > -1) {
					return {
						begin: length,
						end: length
					};
				}

				return {
					begin: -inputRange.moveStart('character', -length),
					end: -inputRange.moveEnd('character', -length)
				};
			}

			return {
				begin: 0,
				end: 0
			};
		},
		// 캐럿 위치 설정
		set: function(el, pos) {
			if(!core.is(pos, 'object')) {
				pos = {
					begin: pos,
					end: pos
				};
			}

			if(el.setSelectionRange) {
				//el.focus();
				el.setSelectionRange(pos.begin, pos.end);
			} else if(el.createTextRange) {
				var range = el.createTextRange();
				range.collapse(true);
				range.moveEnd('character', pos.end);
				range.moveStart('character', pos.begin);
				range.select();
			}
		}
	};

	var utils = {
		numRegex: /[^0-9]/g,
		decimalRegex: /[^0-9.]/g,
		engRegex: /[^a-zA-Z\s]/g,
		alphaRegex: /[^a-zA-Z]/g,
		alnumRegex: /[^a-zA-Z0-9]/g,
		engnumRegex: /[^a-zA-Z0-9\s]/g,

		isPressedMetaKey: function (e) {
			return e.ctrlKey || e.shiftKey || e.altKey;
		},
		numKey: function (e) {
			var kc = e.keyCode;
			return (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);
		},
		decimalKey: function (e) {
			var kc = e.keyCode;
			return (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105) || e.keyCode === 110 || e.keyCode === 190;
		},
		engKey: function (e) {
			var kc = e.keyCode;
			return (kc >= 65 && kc <=90) || (kc >= 97 && kc <=122) || kc === 32; // 32: space bar
		},
		alphaKey: function (e) {
			var kc = e.keyCode;
			return (kc >= 65 && kc <=90) || (kc >= 97 && kc <=122);
		},
		alnumKey: function (e) {
			var kc = e.keyCode;
			return (kc >= 65 && kc <= 90) || (kc >= 97 && kc <= 122) || (kc >= 48 && kc <= 57);
		},
		engnumKey: function (e) {
			var kc = e.keyCode;
			return (kc >= 65 && kc <= 90) || (kc >= 97 && kc <= 122) || (kc >= 48 && kc <= 57) || kc === 32; // 32: space bar
		},
		isInvalidKey: function (e, type, ignoreKeys) {
			if (e.keyCode !== 0 && e.keyCode !== 229) {
				return !utils.isPressedMetaKey(e) && !utils[type+'Key'](e) && !core.array.include(ignoreKeys, e.keyCode);
			}
		},
		cleanChars: function (type, el, focusin) {
			if (!supportPlaceholder && el.value === el.getAttribute('placeholder')) { return; }

			var caret = inputSel.get(el);
			el.value = el.value.replace(utils[type+'Regex'], '');
			if (focusin) {
				inputSel.set(el, Math.min(caret.begin, el.value.length));
			}
		},

		forceKeyup: function (el) {
			// 파이어폭스에서 한글을 입력할 때 keyup이벤트가 발생하지 않는 버그가 있어서
			// 타이머로 value값이 변경된걸 체크해서 강제로 keyup 이벤트를 발생시켜 주어야 한다.
			var me = this,
				$el = $(el),
				prevValue, nowValue,
				win = window,
				doc = document,

				// keyup 이벤트 발생함수: 크로스브라우징 처리
				fireEvent = (function(){
					if (doc.createEvent) {
						// no ie
						return function(oldValue){
							var e;
							if (win.KeyEvent) {
								e = doc.createEvent('KeyEvents');
								e.initKeyEvent('keyup', true, true, win, false, false, false, false, 65, 0);
							} else {
								e = doc.createEvent('UIEvents');
								e.initUIEvent('keyup', true, true, win, 1);
								e.keyCode = 65;
							}
							el.dispatchEvent(e);
						};
					} else {
						// ie: :(
						return function(oldValue) {
							var e = doc.createEventObject();
							e.keyCode = 65;
							el.fireEvent('onkeyup', e);
						};
					}
				})();

			var timer = null;
			$el.on('focusin', function(){
				if (timer){ return; }
				timer = setInterval(function() {
					nowValue = el.value;
					if (prevValue !== nowValue) {
						prevValue = nowValue;
						fireEvent();
					}
				}, 60);
			}).on('focuout', function(){
				if (timer){
					clearInterval(timer);
					timer = null;
				}
			});
		}
	};

	/**
	 * 한글 전용 입력폼
	 */
	var KorInput = core.ui.View.extend({
		name: 'korInput',
		initialize: function (el, options) {
			var me = this;

			if (me.supr(el, options) === false) { return; }

			me.$el = $(el);
			me._bindEvents();
		},
		_bindEvents: function () {
			var me = this,
				caret,
				regNotKor = /[^ㄱ-ㅎ|ㅏ-ㅣ|가-힝 ]+/;

			me.$el.on('keyup paste change', function (e) {
				var val = me.$el.val();

				if (regNotKor.test(val)) {
					val = val.replace(regNotKor, '');
					if (caret.start > 0){ caret.start -= 1; }
					me.$el.val(val);
					if (me.$el.is(':focus')){
						core.dom.setCaretPos(me.$el[0], caret);
					}
				}
			}).on('keydown  focusin', function(e){
				caret = core.dom.getCaretPos(me.$el[0]);
			});
		},
		release: function () {
			var me = this;
			clearInterval(me.timer);
			me.supr();
		}
	});

	/**
	 * 소수점 전용 입력폼 - 160928 추가
	 */
	var DecimalInput = core.ui.View.extend({
		name: 'decimalInput',
		initialize: function (el, options) {
			var me = this;

			if (me.supr(el, options) === false) { return; }

			me.$el = $(el);
			me._bindEvents();
		},
		_bindEvents: function () {
			var me = this,
				caret,
				oldVal = 0,
				regDecimalPrev = /^\d*[.]$/,
				regDecimalNext = /^[-]?\d+(?:[.]?[\d]?[\d])?$/;

			me.$el.on('keydown keyup paste change', function (e) {
				var val = me.$el.val();

				// 숫자 밑 소수점 제외 입력 금지
				if (e.type === 'keydown') {
					if(utils.isInvalidKey(e, me.options.format, [].concat(FormatInput.byPassKeys, 16))) {
						e.preventDefault();
					}
				}

				caret = inputSel.get(me.el).begin; // 캐럿 위치를 보관
				if (val && val !== oldVal && !regDecimalPrev.test(val)) { // 값이 존재하고 소수점이 있는 경우
					if (regDecimalNext.test(val)) { // 소수점 두자리까지만 입력 받고 나머지는 버린다.
						oldVal = val;
					}

					if (caret.start > 0) {
						caret.start -= 1;
					}

					me.$el.val(oldVal);
					if (me.$el.is(':focus')){
						core.dom.setCaretPos(me.$el[0], caret);
					}
				} else {
					oldVal = val;
				}
			}).on('keydown  focusin', function(e){
				caret = core.dom.getCaretPos(me.$el[0]);
			});
		},
		release: function () {
			var me = this;
			clearInterval(me.timer);
			me.supr();
		}
	});

	/*
	 * 영숫자 전용 입력폼
	 */
	var AlnumInput = core.ui.View.extend({
		name: 'alnumInput',
		initialize: function (el, options) {
			var me = this;
			if (me.supr(el, options) === false) { return; }

			if (core.browser.isGecko) {
				utils.forceKeyup(me.el);
			}

			var old, format = me.options.format;
			me.$el.on('keydown focusin keyup focusout paste change', function(e) {
				var el = this, change;
				switch (e.type) {
					case 'keydown':
						if(utils.isInvalidKey(e, format, [].concat(FormatInput.byPassKeys, 16))) {
							e.preventDefault();
						}
						break;
					case 'focusin':
						//old = this.value;
						break;
					case 'keyup':
						if (old != el.value) {
							setTimeout(function () {
								utils.cleanChars(format, el, false);
							});
						}
						old = el.value;
						break;
					case 'paste':
					case 'focusout':
					case 'change':
						utils.cleanChars(format, el, e.type === 'paste');
						break;
				}
			});
		}
	});

	// placeholder 지원여부
	var supportPlaceholder = ('placeholder' in document.createElement('input'));

	/**
	 * 형식 입력폼 모듈
	 * @class
	 * @name vcui.ui.FormatInput
	 * @extends vcui.ui.View
	 */
	var FormatInput = core.ui('FormatInput', /** @lends vcui.ui.Formatter# */{
		$statics: {
			// 허용할 기능키
			byPassKeys: [8, 9, 16, 17, 18, 35, 36, 37, 38, 39, 40, 46, 91, 116],
			// 각 코드에 대한 정규식
			translation: {
				'0': {pattern: /\d/},
				'9': {pattern: /\d/, optional: true},
				'#': {pattern: /\d/, recursive: true},
				'A': {pattern: /[a-zA-Z0-9]/},
				'a': {pattern: /[a-zA-Z]/},
				'o': {pattern: /[0-1]/},    // 월 앞자리
				'm': {pattern: /[0-2]/},    // 월 뒷자리
				'M': {pattern: /[0-3]/},
				'n': {pattern: /[1-9]/},
				'e': {pattern: /[0-8]/}, // 2월 28
				'E': {pattern: /[0-9]/}, // 2월 29
				'Z': {pattern: /0/},
				'Y': {pattern: /[1-2]/}
			},
			// 마스킹 타입
			masks: {
				// 현금
				comma: {
					format: '000,000,000,000,000,000,000,000,000',
					valid: function (value, field, options) {
						value = value.replace(/\D/g, '');

						// 금액은 0으로 시작할 수 없기에..... -> 160107 0원을 입력하는 경우도 있으므로 수정.
						// if (value.substr(0, 1) === '0') { return '';}
						if (value.substr(0, 1) === '0' && value.length > 1) { return value.substr(1);}

						var len = value.length;
						if (len <= 3) {
							return value;
						}
						var maxlength = parseInt(field.getAttribute('maxlength') || 13, 10),
							mod = maxlength - Math.floor((len - 1) / 3);

						return value.substr(0, mod);
					},
					reverse: true
				},
				// 전화번호
				tel: {
					format: function(val, field, options) {
						return val.replace(/\D/g, '').length < 8 ? '000-0000' : '0000-0000';
					}
				},
				// 핸드폰 번호
				mobile: {
					format: function(val, field, options) {
						var maxlength = parseInt(field.getAttribute('maxlength') || 9, 10);

						val = val.replace(/\D/g, '');
						if (maxlength > 9) {
							return val.length < 11 ? '000-000-0000' : '000-0000-0000';
						} else {
							return val.length < 8 ? '000-0000' : '0000-0000';
						}
					}
				},
				// 숫자
				num: {format: '0000000000000000000'},
				// 소수점
				decimal: {format: '00000000000000000.00'},
				// 카드
				card: {format: '0000-0000-0000-0000'},
				// 아멕스카드
				amexcard: {format: '0000-000000-00000'},
				// 카드 자동인식
				allcard: {
					format: function (val, field, options) {

						if (val.substr(0, 4) === '3791' || val.substr(0, 4) === '3779' || val.substr(0, 4) === '3762') { // 160607 개발 추가		    
							//if (val.substr(0, 4) === '3791') {
							// 아멕스 카드
							return '0000-000000-00000';
						}
						return '0000-0000-0000-0000';
					}
				},
				// 카드 마스킹된 값
				cardmarsking: {format: '0000-****-****-0000'},
				// 아멕스카드 마스킹된 값
				amexcardmarsking: {format: '0000-******-**000'},
				// 카드 자동인식 마스킹된 값
				allcardmarsking: {
					format: function (val, field, options) {
						if (val.substr(0, 4) === '3791' || val.substr(0, 4) === '3779' || val.substr(0, 4) === '3762') { // 160607 개발 추가   
							//if (val.substr(0, 4) === '3791') {
							// 아멕스 카드
							return '0000-******-**000';
						}
						return '0000-****-****-0000';
					}
				},
				// 운전면허번호
				driverno: {format: '00-000000-00'},
				// 주민등록번호
				personalno: {format: '000000-0000000'},
				// 사업자번호
				bizno: {format:'000-00-00000'},
				// 법인번호
				corpno: {format:'000000-0000000'},
				// 날짜
				date: {
					format: function (val, field, options) { //'0000.M0.m0'
						val = val.replace(/[^0-9]/g, '').substr(0, 8);
						var len = val.length, ch, y, m, d;
						switch(len) {
							case 5:
								return 'Y000.o';
							case 6:
								ch = val.substr(4, 1);
								if (ch === '1') {
									return 'Y000.om';
								} else if (ch === '0') {
									return 'Y000.on';
								}
							case 7:
								if (val.substr(4, 2) === '02') {
									return 'Y000.o0.m';
								}
								return 'Y000.oE.M';
							case 8:
								y = parseInt(val.substr(0, 4), 10);
								m = parseInt(val.substr(4, 2), 10);
								d = parseInt(val.substr(6, 2), 10);

								if (m === 2) {
									if (core.date.isLeapYear(y, m)) {
										return 'Y000.Zm.0E';
									} else {
										return 'Y000.oE.0e';
									}
								} else if (d >= 30) {
									if (m === 1 || m === 3 || m === 5 || m === 7 || m === 8 || m === 10 || m === 12) {
										return 'Y000.oE.0o';
									} else {
										return 'Y000.oE.0Z';
									}
								} else if (d === 0) {
									return 'Y000.oE.Zn';
								}
						}
						return 'Y000.oE.ME';
					}
				},
				// 영문
				eng: {format: 'a'}
			}
		},
		bindjQuery: 'formatter',
		defaults: {
			format: 'comma', // 기본 포맷
			watch: false,    // 수정을 감시할건가
			watchInterval: 300 // 감시 인터벌
		},
		/**
		 * 생성자
		 * @param el
		 * @param options
		 * @returns {boolean}
		 */
		initialize: function(el, options) {
			var me = this;

			if(me.supr(el, options) === false) { return false; }

			// 자동완성 끜
			me.$el.attr('autocomplete', 'off');

			// card인지 확인
			me.isCard = (me.options.format.indexOf('card') > -1) ? true : false;

			// 원래 이게 여기 있으면 안되는데, 퍼블리싱에서 파일을 전부 다 바꿔야 된대서..걍 스크립트단에서 해줌
			if (me.options.format === 'allcard' || me.options.format === 'card') {
				me.$el.attr('maxlength', 19);
			}


			// IME mode 설정
			me._setIMEMode();

			// 숫자 와 같이 단순한 포맷은 걍 키만 막고 빠져나간다
			if(me._isSimpleFormat() === true) {
				me.clean = function () { return me.$el.val() === me.txtPlaceholder ? '' : me.$el.val(); };
				me.update = function (){ me.inputModule.update(); };
				return;
			}

			me.oldValue = me.$el.val(); // 원래 값
			me.byPassKeys = FormatInput.byPassKeys; // alias
			me.translation = core.extend({}, FormatInput.translation, me.options.translation);  // alias
			me.invalid = [];

			if(!supportPlaceholder) {
				// placeholder를 지원하지 않는 브라우저면 placeholder 문구를 보관하고 있는다.
				me.notSupportPlaceholder = true;
				me.txtPlaceholder = me.$el.attr('placeholder');
			}

			if (core.browser.isGecko) {
				//utils.forceKeyup(me.el);
			}

			me._reloadMask();
			if(me.$el.is(':focus')) {
				var caret = inputSel.get(me.el).begin; // 캐럿 위치를 보관
				me.update();
				inputSel.set(me.el, caret + me._getMCharsBeforeCount(caret, true));
			} else {
				// 최초 로딩시에만 true
				me.update(true);
				// 값이 변경됐는지 감시
				if (me.options.watch) {
					me._watchStart();
				}
			}

			me.regexMask = me._getRegexMask();    // 마스킹에 대한 전체 정규식을 가져온다

			// 이벤트 바인딩
			me._bindEvents();
		},

		/**
		 * 이벤트 바인딩
		 * @private
		 */
		_bindEvents: function() {
			var me = this;

			me.$el
				.on('keyup', function(e) {

					// 바이널 마스크 패턴 사용을 위해 '*' => '0' 으로 변환 : 160119 김건우 선임 요청으로 마스킹 처리 관려 코드 추가 START
					if (me.isCard && location.href.indexOf('.html') === -1) {
						me.$el.val( me.$el.val().replace(/\*/g, '0'));
					}

					me._reloadMask();
					me._process(e);

					// scard.masking.genMask() 함수로 마스킹 적용
					if (me.isCard && location.href.indexOf('.html') === -1) {
						me.$el.val( scard.masking.genMask(me.$el.val(), 'CDNO') );
					}
					// 바이널 마스크 패턴 사용을 위해 '*' => '0' 으로 변환 : 160119 김건우 선임 요청으로 마스킹 처리 관려 코드 추가 - END
				})
				.on('paste drop', function() {
					setTimeout(function() {
						me.$el.keydown().keyup();
					});
				})
				.on('keydown blur', function() {
					me.oldValue = me.$el.val();
				})
				.on('change', function () {
					me.$el.data('changed', true);
				})
				.on('blur', function (){
					if (me.oldValue !== me.$el.val() && !me.$el.data('changed')) {
						me.$el.triggerHandler('change');
					}
					me.oldValue = me.$el.val();
					me.$el.data('changed', false);
				})
				.on('focusin', function() {
					// 포커싱될 때 셀렉트시킬 것인가..
					if(me.options.selectOnFocus === true) {
						$(e.target).select();
					}
					me._watchStop();
				})
				.on('focusout', function() {
					me._watchStart();

					// 포커스가 나갈 때 안맞는 값을 지울것인가
					if(me.options.clearIfNotMatch && !me.regexMask.test(me.$el.val())) {
						me.$el.val('');
					}
				});

			me.$el.on('optionchange', function (e, data) {
				if(data.name === 'format') {
					me.$el.attr('data-format', data.value);
					me.update();
				}
			});

			// comma 형식일 땐 ,가 제거된 상태로 넘어가게
			me.options.format === 'comma' && $(me.el.form).on('submit', function(e) {
				me.remove();
				me.oldValue = '';
			});
		},

		_setIMEMode: function () {
			var me = this;

			switch(me.$el.data('format')) {
				case 'eng':
				case 'num':
				case 'decimal':
				case 'alnum':
				case 'tel':
				case 'mobile':
				case 'allcard':
				case 'card':
				case 'amexcard':
				case 'comma':
				case 'driverno':
				case 'personalno':
				case 'corpno':
				case 'bizno':
				case 'date':
					me.$el.css('ime-mode', 'disabled');
					break;
				case 'kor':
					me.$el.css('ime-mode', 'active');
					break;
			}
		},

		/**
		 * 숫자, 영문자 만 입력하는거면 마스킹 처리는 하지 않고 키보드만 막는다.
		 * @returns {boolean}
		 * @private
		 */
		_isSimpleFormat: function(){
			var me = this,
				format = me.options.format;

			if(format === 'eng' || format === 'alnum' || format === 'num') {
				me.inputModule = new AlnumInput(me.$el[0], {format: format});
				if (core.browser.isMobile && (format === 'num' && me.el.type !== 'password')) {
					me.$el.attr('type', 'tel');
				}
				return true;  // 마스킹은 처리안하도록 true 반환
			} else if(core.array.include(['allcard', 'card', 'amexcard',
					'tel', 'mobile', 'driverno', 'personalno', 'bizno', 'corpno', 'comma', 'date'], format)) {

				if (core.browser.isMobile && me.el.type !== 'password') {
					me.$el.attr('type', 'tel');
				}
				// 숫자
				me.$el.on('keydown', function(e) {
					if (utils.isInvalidKey(e, 'num', FormatInput.byPassKeys)) {
						e.preventDefault();
					}
				});
			} else if (format === 'kor') {
				me.inputModule = new KorInput(me.$el[0]);
				return true;
				// 160927 - 추가
			} else if (format === 'decimal') {
				me.inputModule = new DecimalInput(me.$el[0]);
				return true;
				// 160927 - 추가
			}
		},

		/**
		 * 값이 변경됐는지 감시 시작
		 * @private
		 */
		_watchStart: function(){
			var me = this;
			me._watchStop();

			if(!me.options.watch || me.$el.prop('readonly') || me.$el.prop('disabled')) { return; }

			var totalTime = 0, dur = me.options.watchInterval;
			me.watchTimer = setInterval(function() {
				// 40초에 한번씩 dom에서 제거 됐건지 체크해서 타이머를 멈춘다.
				if (totalTime > 40000){
					totalTime = 0;
					if (!$.contains(document, me.$el[0])) {
						clearInterval(me.watchTimer);
						me.watchTimer = null;
						return;
					}
				} else {
					totalTime += dur;
				}
				if (!me.$el){ clearInterval(me.watchTimer); me.watchTimer = null; return; }
				if (me.$el[0].disabled || 0 <= me.$el[0].className.indexOf('disabled')) { return; }

				var val = me.$el.val();
				if(val && me.oldValue != val){
					me.update();
				}
			}, dur);
		},

		/**
		 * 값 변경 감시 중지
		 * @private
		 */
		_watchStop: function() {
			var me = this;
			clearInterval(me.watchTimer);
			me.watchTimer = null;
		},

		/**
		 * 마스킹에 대한 정규식 반환
		 * @returns {RegExp}
		 * @private
		 */
		_getRegexMask: function() {
			var me = this,
				maskChunks = [],
				translation, pattern, optional, recursive, oRecursive, r, ch;

			for(var i = 0, len = me.mask.length; i < len; i++) {
				ch = me.mask.charAt(i);
				if(translation = me.translation[ch]){
					pattern = translation.pattern.toString().replace(/.{1}$|^.{1}/g, '');
					optional = translation.optional;
					if(recursive = translation.recursive){
						maskChunks.push(ch);
						oRecursive = {digit: ch, pattern: pattern};
					} else {
						maskChunks.push(!optional ? pattern : (pattern + '?'));
					}
				} else {
					maskChunks.push(ch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
				}
			}

			r = maskChunks.join('');
			// 기준을 끝으로 했을 때
			if(oRecursive) {
				r = r.replace(new RegExp('(' + oRecursive.digit + '(.*' + oRecursive.digit + ')?)'), '($1)?')
					.replace(new RegExp(oRecursive.digit, 'g'), oRecursive.pattern);
			}

			return new RegExp(r);
		},
		/**
		 * index위치의 마스킹처리된 문자수
		 * @param index
		 * @param onCleanVal
		 * @returns {number}
		 * @private
		 */
		_getMCharsBeforeCount: function(index, onCleanVal) {
			var me = this, mask = me.mask;
			for (var count = 0, i = 0, maskL = mask.length; i < maskL && i < index; i++) {
				if (!me.translation[mask.charAt(i)]) {
					index = onCleanVal ? index + 1 : index;
					count++;
				}
			}
			return count;
		},
		/**
		 * 캐럿 위치
		 * @param originalCaretPos
		 * @param oldLength
		 * @param newLength
		 * @param maskDif
		 * @returns {*}
		 * @private
		 */
		_caretPos: function (originalCaretPos, oldLength, newLength, maskDif) {
			var me = this,
				mask = me.mask,
				translation = me.translation[mask.charAt(Math.min(originalCaretPos - 1, mask.length - 1))];

			return !translation ? me._caretPos(originalCaretPos + 1, oldLength, newLength, maskDif)
				: Math.min(originalCaretPos + newLength - oldLength - maskDif, newLength);
		},
		/**
		 * 마스킹처리
		 * @param e
		 * @returns {*}
		 * @private
		 */
		_process: function(e) {
			var me = this,
				keyCode = e.keyCode;
			// TODO
			if (keyCode === 17 || (keyCode === 65 && e.ctrlKey)) { return; }

			me.invalid = [];
			if ($.inArray(keyCode, me.byPassKeys) === -1 || keyCode === 46 || keyCode === 8) {
				var caretPos = inputSel.get(me.el).begin,
					currVal = me.maskOption.valid ? me.maskOption.valid(me.$el.val(), me.$el[0]) : me.$el.val(),
					currValL = currVal.length,
					changeCaret = caretPos < currValL,
					newVal = me._getMasked(currVal),
					newValL = newVal.length,
					isFocusin = me.$el.is(':focus'),
					maskDif;

				me.el.value = newVal;
				if (isFocusin && changeCaret && !(keyCode === 65 && e.ctrlKey)) {
					if (!(keyCode === 8 || keyCode === 46)) {
						maskDif = me._getMCharsBeforeCount(newValL - 1) - me._getMCharsBeforeCount(currValL - 1);
						//TODO caretPos = me._caretPos(caretPos, currValL, newValL, maskDif);
						if (newValL != currValL) {
							caretPos += 1;
						}
					}
					inputSel.set(me.el, caretPos);
				}
				return me._callbacks(e);
			}
		},

		/**
		 * 마스킹 옵션이 변경됐을 수도 있기 때문에 다시 정규화 한다.
		 * @private
		 */
		_reloadMask: function() {
			var me = this,
				m, mask;

			me.$el.data('format', me.options.format = me.$el.data('format'));

			// 서버 기본 세팅용 마스킹 패턴
			if (me.isCard) {
				if(m = FormatInput.masks[me.options.format + 'marsking']) {
					me.maskOption = m;
					if(core.is(m.format, 'function')) {
						me.serverMask = m.format.call(me, me.$el.val(), me.$el[0], me.options);
					} else {
						me.serverMask = m.format;
					}
					me.options.reverse = !!m.reverse;
				} else {
					me.serverMask = core.is(me.options.format, 'function') ? me.options.format.call(me) : me.options.format;
				}
			}

			if(m = FormatInput.masks[me.options.format]) {
				me.maskOption = m;
				if(core.is(m.format, 'function')) {
					me.mask = m.format.call(me, me.$el.val(), me.$el[0], me.options);
				} else {
					me.mask = m.format;
				}
				me.options.reverse = !!m.reverse;
			} else {
				me.mask = core.is(me.options.format, 'function') ? me.options.format.call(me) : me.options.format;
			}
		},

		/**
		 * 마스킹처리 코어부분
		 * @param skipMaskChars
		 * @returns {string}
		 * @private
		 */
		_getMasked: function(value, skipMaskChars, isFirst) {
			this._reloadMask();

			if (!value) { return ''; }
			var me = this,
				mask = (me.isCard && isFirst) ? me.serverMask : me.mask,
				buf = [],
				m = 0, maskLen = mask.length,
				v = 0, valLen = value.length,
				offset = 1, addMethod = 'push',
				resetPos = -1,
				lastMaskChar,
				check;

			if (me.options.reverse) {
				addMethod = 'unshift';
				offset = -1;
				lastMaskChar = 0;
				m = maskLen - 1;
				v = valLen - 1;
				check = function () {
					return m > -1 && v > -1;
				};
			} else {
				lastMaskChar = maskLen - 1;
				check = function () {
					return m < maskLen && v < valLen;
				};
			}

			while (check()) {
				var maskDigit = mask.charAt(m),
					valDigit = value.charAt(v),
					translation = me.translation[maskDigit];

				if (translation) {
					if (valDigit.match(translation.pattern)) {
						buf[addMethod](valDigit);
						if (translation.recursive) {
							if (resetPos === -1) {
								resetPos = m;
							} else if (m === lastMaskChar) {
								m = resetPos - offset;
							}

							if (lastMaskChar === resetPos) {
								m -= offset;
							}
						}
						m += offset;
					} else if (translation.optional) {
						m += offset;
						v -= offset;
					} else if (translation.fallback) {
						buf[addMethod](translation.fallback);
						m += offset;
						v -= offset;
					} else {
						me.invalid.push({p: v, v: valDigit, e: translation.pattern});
					}
					v += offset;
				} else {
					if (!skipMaskChars) {
						buf[addMethod](maskDigit);
					}

					if (valDigit === maskDigit) {
						v += offset;
					}

					m += offset;
				}
			}

			var lastMaskCharDigit = mask.charAt(lastMaskChar);
			if (maskLen === valLen + 1 && !me.translation[lastMaskCharDigit]) {
				buf.push(lastMaskCharDigit);
			}

			return buf.join('');
		},

		/**
		 * 콜백함수 바인딩
		 * @param e
		 * @private
		 */
		_callbacks: function (e) {
			var me = this,
				mask = me.mask,
				val = me.$el.val(),
				changed = val !== me.oldValue,
				defaultArgs = [val, e, me.el, me.options],
				callback = function(name, criteria, args) {
					if (typeof me.options[name] === 'function' && criteria) {
						me.options[name].apply(this, args);
					}
				};

			callback('onChange', changed === true, defaultArgs);
			callback('onKeyPress', changed === true, defaultArgs);
			callback('onComplete', val.length === mask.length, defaultArgs);
			callback('onInvalid', me.invalid.length > 0, [val, e, me.el, me.invalid, me.options]);
		},
		/**
		 * 지우기
		 */
		remove: function() {
			var me = this,
				caret = inputSel.get(me.el).begin;
			me._watchStop();
			me.$el.off();
			me.$el.val(me.clean());
			if(me.$el.is(':focus')) {
				inputSel.set(me.el, caret - me._getMCharsBeforeCount(caret));
			}
		},
		/**
		 * 마스킹 제거
		 * @returns {*|string}
		 */
		clean: function() {
			return this._getMasked(this.$el.val(), true);
		},

		/**
		 * 마스킹처리된 값을 인풋에 넣어준다
		 */
		update: function(isFirst) {
			var me = this,
				val = me.$el.val();

			if (val) {
				me.$el.val(me._getMasked(val, '', isFirst));
			}
		},

		release: function (){
			clearInterval(this.watchTimer);
			this.watchTimer = null;

			if (me.inputModule) {
				try { this.inputModule.release(); this.inputModule = null; } catch(e){}
			}
			this.supr();
		}
	});

	if (typeof define === "function" && define.amd) {
		define([], function() {
			return FormatInput;
		});
	}

})(jQuery, window[LIB_NAME]);