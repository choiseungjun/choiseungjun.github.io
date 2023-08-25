;(function ($, core, global, undefined) {
    "use strict";

    var $win = $(global);

    /**
     * 해상도에 따라
     * 스크립트를 실행해야 할 경우에 사용
     * @example
     * vcui.responser.add({
     *   id: 'test',
     *   width: [0, 320],
     *   onEnter: function () {
     *      // 0 ~ 320 사이에 진입했을 때 실행하고자 하는 코드 삽입
     *   },
     *   onLeave: function () {
     *      // 0 ~ 320 사이에서 벗어났을 때 실행하고자 하는 코드 삽입
     *   }
     * })
     */
    core.helper('Responser', /**@lends vcui.helper.Responser*/{
        $singleton: true,
        defaults: {
            breakpoints: {
                small: 320,
                medium: 640,
                large: 10000000
            }
        },
        initialize: function (options) {
            var self = this;

            self.breakpoints = options.breakpoints;
            self.states = [];

            self.start();
        },
        start: function () {
            var self = this;

            $(window).on('resize.responser orientationchange.responser', self._resizeHandle.bind(self));
            self._resizeHandle();
        },
        _resizeHandle: function () {
            var self = this;

            core.each(self.states, self.run.bind(self));
        },
        _checkEnter: function (state) {
            var self = this,
                width = $win.width();

            return state.minWidth < width && width <= state.maxWidth;
        },
        run: function (state) {
            var self = this;
            var isEnter = self._checkEnter(state);
            var width = $win.width();

            if (isEnter && state._isEnter !== true) {
                state._isEnter = true;
                state.onEnter(width);
            } else if (!isEnter && state._isEnter !== false) {
                state._isEnter = false;
                state.onLeave(width);
            }
        },
        add: function (state) {
            var self = this;

            core.extend({
                minWidth: 0,
                maxWidth: 100000,
                onEnter: core.noop,
                onLeave: core.noop
            }, state);

            if ('width' in state) {
                state.minWidth = state.width[0];
                state.maxWidth = state.width[1];
            }
            if (core.isString(state.minWidth)) {
                state.minWidth = self.breakpoints[state.minWidth][0];
            }
            if (core.isString(state.maxWidth)) {
                state.maxWidth = self.breakpoints[state.maxWidth][1];
            }

            self.states.push(state);
            self.run(state);
        },
        remove: function (id) {
            core.object.remove(function (item) {
                return item.id === id;
            });
        }
    });

})(jQuery, window[LIB_NAME], window)