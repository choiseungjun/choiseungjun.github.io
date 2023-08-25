;(function (core, global, undefiend) {
    "use strict";

    /**
     * @class
     * @name vcui.helper.Timer
     * @description 타이머 플러그인
     * @example
     * var timer = new vcui.helper.Timer({
     *  interval: 2000,
     *  autoStart: false,
     *  onTiming: function () {
     *      console.log(Date.now()); // 2초마다 출력
     *  }
     * });
     *
     * timer.start();
     * timer.stop();
     */
    var Timer = core.helper(/**@lends vcui.helper.Timer# */{
        /**
         * 타이머
         * @param {object} options  옵션
         * @param {number} options.interval 인터벌 시간
         * @param {function} options.onStart 시작시에 실행될 함수
         * @param {function} options.onStop 정지시에 실행될 함수
         * @param {function} options.onTiming 타이밍마다 실행되는 콜백함수
         * @param {boolean} [options.autoStart=true] 자동시작 여부
         * @returns {{play: Function, stop: Function, start: Function, resume: Function, pause: Function}}
         */
        initialize: function (options/*callback, options, autoStart*/) {
            var self = this,
                opts = {
                    interval: 1000,
                    timing: function () {
                    },
                    autoStart: true
                };

            self.playing = true;
            self.timerId = null;
            self.options = core.extend(opts, options);
            if (opts.autoStart === true) {
                self.play();
            }
        },
        _intervalCallback: function (directRun) {
            var self = this,
                opts = self.options,
                fn;

            clearTimeout(timerId);
            self.timerId = setTimeout(fn = function () {
                opts.timing();
                if (self.playing) {
                    clearTimeout(self.timerId);
                    self.timerId = setTimeout(fn, opts.interval);
                }
            }, opts.interval);
            if (directRun === true) {
                fn();
            }
        },

        play: function (directRun) {
            var self = this,
                opts = self.options;

            self.playing = true;
            opts.onStart && opts.onStart();
            self._intervalCallback(directRun);
        },

        stop: function () {
            var self = this,
                opts = self.options;

            self.playing = false;
            opts.onStop && opts.onStop();
            clearTimeout(self.timerId);
        },
        destroy: function () {
            this.stop();
        }
    });

    core.addon('plugin.Timer', Timer);

})(window[LIB_NAME], window);