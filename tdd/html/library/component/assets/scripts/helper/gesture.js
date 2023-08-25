/*!
 * @module vcui.ui.Gesture
 * @author 김승일 책임(comahead@vi-nyl.com)
 * @create 2017-09-08
 * @license MIT License
 */
(function($, core, undefined) {
	"use strict";
	if (core.ui.Gesture) return;
	var Gesture = core.ui('Gesture', {
        bindjQuery : 'Gesture',
		defaults: {
			container: document,
			threshold: 50,
			direction: 'horizontal',
            gesture : null,
			gestureStart: null,
			gestureMove: null,
			gestureEnd: null
		},
		initialize: function(el, options) {
			var self = this;
			if (self.supr(el, options) === false) {
				return;
			}
			self.isHoriz = self.options.direction === 'horizontal' || self.options.direction === 'both';
			self.isVerti = self.options.direction === 'vertical' || self.options.direction === 'both';
			self._bindGestureEvents();
		},

        _getEventPoint: function (ev, type) {
			var e = ev.originalEvent || ev;
			if (type === 'end' || ev.type === 'touchend') e = e.changedTouches && e.changedTouches[0] || e;
			else e = e.touches && e.touches[0] || e;
			return { x: e.pageX || e.clientX, y: e.pageY || e.clientY};
		},

        _getAngle: function (startPoint, endPoint) {
            var x = startPoint.x - endPoint.x;
            var y = endPoint.y - startPoint.y;
            var r = Math.atan2(y, x); //radians
            var angle = Math.round(r * 180 / Math.PI); //degrees
            if (angle < 0) angle = 360 - Math.abs(angle);
            return angle;
        },

        _getDirection: function (startPoint, endPoint, direction) {
            var angle,
                isHoriz = !direction || direction === 'horizontal' || direction === 'both',
                isVert = !direction || direction === 'vertical' || direction === 'both';

            if (isHoriz != isVert) {
                if (isHoriz) {
                    if (startPoint.x > endPoint.x) { return 'left'; }
                    else if(startPoint.x == endPoint.x) { return '';}
                    else {return 'right'; }
                } else {
                    if (startPoint.y > endPoint.y) { return 'down'; }
                    else if(startPoint.y == endPoint.y){ return '';}
                    else { return 'up'; }
                }
            }

            angle = this._getAngle(startPoint, endPoint);
            if ((angle <= 45) && (angle >= 0)) {
                return 'left';
            } else if ((angle <= 360) && (angle >= 315)) {
                return 'left';
            } else if ((angle >= 135) && (angle <= 225)) {
                return 'right';
            } else if ((angle > 45) && (angle < 135)) {
                return 'down';
            } else {
                return 'up';
            }
        },

        _getDiff: function (a, b) {
            return { x: a.x - b.x, y: a.y - b.y};
        },

		_bindGestureEvents: function() {
			var self = this,
				touchStart,
				downPos,
				isSwipe = false,
				isScroll = false;

			//self.$el[0].onselectstart = function (){ return false; };
			//self.$el.attr('unselectable', 'on');

			self.$el.on('mousedown.gesture, touchstart.gesture', function(downEvent) {
				if (downEvent.type === 'mousedown') {
					downEvent.preventDefault();
				}
				downPos = touchStart = self._getEventPoint(downEvent);
				isSwipe = isScroll = false;

				$(self.options.container).on('mousemove.gesture'+self.cid+' touchmove.gesture'+self.cid, function (moveEvent) {
					var touch = self._getEventPoint(moveEvent),
						diff, slope, swipeY, swipeX;

					if (!touchStart || isScroll) return;
					diff = self._getDiff(touch, touchStart);

					if (!isSwipe ) {
						swipeX = Math.abs(diff.y) / (Math.abs(diff.x) || 1);
						swipeY = Math.abs(diff.x) / (Math.abs(diff.y) || 1);
						if ((swipeX < 1 && self.isHoriz) || (swipeY < 1 && self.isVerti)) {
							touch.event = moveEvent;
							if (self._gestureCallback('start', touch) === false){ return; };
							if (self.triggerHandler('gesturestart', touch) === false){ return; };
							isSwipe = true;
							self.$el.on('mousemove.gesture touchmove.gesture', function(e){ e.preventDefault();});

						} else {
							if ((self.isHoriz && swipeX > 1) || (self.isVerti && swipeY > 1)) {
								isScroll = true;
							}
						}
					}

					if (isSwipe) {
						moveEvent.stopPropagation();
						moveEvent.preventDefault();

						touch.diff = diff;
						touch.direction = self._getDirection(touchStart, touch,  self.options.direction);
						touch.event = moveEvent;
						if (self._gestureCallback('move', touch) === false) { return; }
						if (self.triggerHandler('gesturemove', touch) === false) { return; }
					}
				}).on('mouseup.gesture'+self.cid+' mousecancel.gesture'+self.cid+' touchend.gesture'+self.cid+' touchcancel.gesture'+self.cid, function (upEvent) {
					if (isSwipe && touchStart) {
						var touch = self._getEventPoint(upEvent, 'end');
						touch.diff = self._getDiff(touch, touchStart);

						touch.direction = self._getDirection(touchStart, touch, self.options.direction);
						touch.event = upEvent;
						if(Math.abs(touch.diff.x) > self.options.threshold
							|| Math.abs(touch.diff.y) > self.options.threshold) {
							self._gestureCallback('end', touch);
							self.triggerHandler('gestureend', touch);
						} else {
							self._gestureCallback('cancel', touch);
							self.triggerHandler('gesturecancel', touch);
						}

						self.$el.off('mousemove.gesture touchmove.gesture');

						switch(touch.direction) {
							case 'left':
							case 'right':
								if(Math.abs(touch.diff.x) > self.options.threshold && self.isHoriz){
									self._gestureCallback(touch.direction, touch);
									self.triggerHandler('gesture'+touch.direction);
								}
								break;
							case 'up':
							case 'down':
								if(Math.abs(touch.diff.y) > self.options.threshold && self.isVerti){
									self._gestureCallback(touch.direction, touch);
									self.triggerHandler('gesture'+touch.direction);
								}
								break;
						}
					}

					touchStart = null;
					isScroll = false;
					$(self.options.container).off('.gesture'+self.cid);
				});
			}).on('click.gesture', 'a, button', function(e) {
				if(!downPos){ return; }
				var pos = self._getEventPoint(e);
				if(downPos.x != pos.x || downPos.y != pos.y) {
					e.preventDefault();
					e.stopPropagation();
				}
			});
		},

		_gestureCallback: function (type, data) {
			var self = this, ret;
			self.options['gesture' + type] && (ret = self.options['gesture' + type].call(self, data));
			self.options['gesture'] && (ret = self.options['gesture'].call(self, type, data));
			return ret;
		},

		release: function(){
			this.$el.off('.gesture'+this.cid).off('.gesture');
			$(this.options.container).off('.gesture'+this.cid);
			this.supr();
		}
	});
    core.ui.Gesture = Gesture;
	
})(jQuery, window[LIB_NAME]);
