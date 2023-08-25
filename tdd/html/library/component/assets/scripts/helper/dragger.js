/**
 * @author 김승일(comahead@gmail.com)
 */
(function($, core, undefined) {
    "use strict";

    var context = window;
    var getPageScroll = function(){
        return {
            x: (context.pageXOffset !== undefined) ? context.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft,
            y: (context.pageYOffset !== undefined) ? context.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop
        };
    };

    document.onselectstart = function(){ return false; }

    var Dragger = ui('Dragger', {
        defaults: {
            start: null,
            drag: null,
            stop: null,
            initX: 0,
            initY: 0,
            allowVerticalScrolling: true,
            allowHorizontalScrolling: true,

            bounds: {
                minX: null,
                maxX: null,
                minY: null,
                maxY: null
            }
        },
        initialize: function(el, options) {
            var self = this;

            if(self.supr(el, options) === false){ return; }

            self.bounds = $.extend({}, self.defaults.bounds, self.options.bounds);
            self.dragStart = { x: 0, y: 0, diffX: 0, diffY: 0, scrollX: 0, scrollY: 0 };
            self.isDragging = false;
            self.isScrolling = false;

            self.$el.css('msTouchAction', 'none');
            self.bindEvents();
            self.enabled = true;
        },
        bindEvents: function () {
            var self = this;
            self.$el.on('mousedown', self._handleMouseDown = self._eventMouseDown.bind(self));
            core.$doc.on('mousemove', self._handleMouseMove = self._eventMouseMove.bind(self));
            core.$doc.on('mouseup', self._handleMouseUp = self._eventMouseUp.bind(self));
            self.$el.on('touchstart', self._handleTouchStart = self._eventTouchStart.bind(self));
            self.$el.on('touchmove', self._handleTouchMove = self._eventTouchMove.bind(self));
            self.$el.on('touchend', self._handleTopuchEnd = self._eventTouchEnd.bind(self));
            self.$el.on('click', self._handleClick = self._preventClickWhenDrag.bind(self));
        },
        unbindEvents: function () {
            var self = this;
            self.$el.off('mousedown', self._handleMouseDown);
            core.$doc.off('mousemove', self._handleMouseMove);
            core.$doc.off('mouseup', self._handleMouseUp);
            self.$el.off('touchstart', self._handleTouchStart);
            self.$el.off('touchmove', self._handleTouchMove);
            self.$el.off('touchend', self._handleTopuchEnd);
            self.$el.off('click', self._handleClick);
        },
        setBounds: function (newBounds) {
            $.extend(this.bounds, newBounds);
        },
        preventDragStart: function (e) {
            e.preventDefault();
        },
        hasDragged: function () {
            return (this.dragStart.diffX !== 0 || this.dragStart.diffY !== 0);
        },
        getNewPos: function (pointPos) {
            var diffX, diffY, newX, newY;

            diffX = pointPos.x - this.dragStart.x;
            diffY = pointPos.y - this.dragStart.y;

            this.dragStart.diffX = diffX;
            this.dragStart.diffY = diffY;

            newX = diffX;
            newY = diffY;

            if (typeof this.bounds.minX === 'number') {
                newX = Math.max(newX, this.bounds.minX);
            }
            if (typeof this.bounds.maxX === 'number') {
                newX = Math.min(newX, this.bounds.maxX);
            }
            if (typeof this.bounds.minY === 'number') {
                newY = Math.max(newY, this.bounds.minY);
            }
            if (typeof this.bounds.maxY === 'number') {
                newY = Math.min(newY, this.bounds.maxY);
            }

            return {
                x: newX,
                y: newY
            };
        },
        _startDrag: function(pointPos) {
            var self = this,
                pageScroll = getPageScroll();

            self.dragStart = {
                x: pointPos.x,
                y: pointPos.y,
                diffX: 0,
                diffY: 0,
                scrollX: pageScroll.x,
                scrollY: pageScroll.y
            };

            self.triggerHandler('dragstart', {pos: pointPos});
        },

        _moveHandle: function(pointPos) {
            var self = this,
                newPos = self.getNewPos(pointPos);

            self.triggerHandler('dragmove', {pos: newPos, x: newPos.x, y: newPos.y});
        },

        _stopDrag: function(pointPos) {
            var self = this;

            var newPos = self.getNewPos(pointPos);
            var dragSuccess = (self.hasDragged() || !self.isScrolling);
            self.triggerHandler('dragend', {dragSuccess: dragSuccess, pos: newPos, x: newPos.x, y: newPos.y});
            self.isDragging = false;
        },

        _didPageScroll: function() {
            var self = this;
            var pageScroll = getPageScroll();
            if (self.options.allowVerticalScrolling && pageScroll.y !== self.dragStart.scrollY) {
                return true;
            }
            if (self.options.allowHorizontalScrolling && pageScroll.x !== self.dragStart.scrollX) {
                return true;
            }
            return false;
        },
        _didDragEnough: function(pos) {
            var self = this,
                opts = self.options;

            if (!opts.allowVerticalScrolling && Math.abs(pos.y - self.dragStart.y) > 10) {
                return true;
            }
            if (!opts.allowHorizontalScrolling && Math.abs(pos.x - self.dragStart.x) > 10) {
                return true;
            }
            return false;
        },
        _eventMouseDown: function (e) {
            this.isDragging = true;
            this._startDrag({ x: e.clientX, y: e.clientY });
        },

        _eventMouseMove: function (e) {
            if (!this.isDragging) return;
            this._moveHandle({x: e.clientX, y: e.clientY});
        },

        _eventMouseUp: function (e) {
            if (!this.isDragging) return;
            this._stopDrag({x: e.clientX, y: e.clientY});
        },
        _eventTouchStart: function (e) {
            this.isDragging = false;
            this._startDrag({x: e.touches[0].clientX, y: e.touches[0].clientY});
        },
        _eventTouchMove: function(e){
            var self = this;
            if (self.isScrolling) return true;
            var pos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
            if (!self.isDragging) {
                if (self._didPageScroll()) {
                    self.isScrolling = true;
                    return true;
                }
                if (self._didDragEnough(pos)) {
                    self.isDragging = true;
                } else {
                    return true;
                }
            }
            e.preventDefault();
            self._moveHandle(pos);
        },
        _eventTouchEnd: function(e){
            var self = this,
                pos = {
                    x: (self.isScrolling) ? self.dragStart.x : e.changedTouches[0].clientX,
                    y: (self.isScrolling) ? self.dragStart.y : e.changedTouches[0].clientY
                };
            self._stopDrag(pos);
            self.isScrolling = false;
        },
        _preventClickWhenDrag: function (e) {
            if (this.hasDragged()) {
                e.preventDefault();
            }
        },
        relase: function(){
            if (!this.enabled) return;
            this.unbindEvents();
            delete this.dragStart;
            delete this.isDragging;
            delete this.isScrolling;
            this.el.style.msTouchAction = undefined;
            delete this.enabled;
        }
    });

    if (typeof define === "function" && define.amd) {
        define([], function() {
            return Dragger;
        });
    }

})(jQuery, window[LIB_NAME]);