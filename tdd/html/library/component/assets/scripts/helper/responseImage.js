;(function ($, core, global, undefined) {
    "use strict";

    /**
     * class vcui.helper.ResponseImage
     * 창 사이드에 따라 img 태그의 data-src-small, data-src-medium, data-src-large 속성에서 알맞는 이미지로 교체
     */
    core.helper('ResponseImage', {
        $singleton: true, // 싱글톤 모드로 생성
        defaults: {
            breakpoints: {
                small: 320,
                medium: 640,
                large: 100000
            }
        },
        initialize: function (options) {
            this.options = core.extend({}, this.defaults, options);
            this._bindEvents();
        },

        _bindEvents: function () {
            var self = this;

            $(window).on('resize.responseimage orientationchange.responseimage load.responseimage',
                core.throttle(self._handleResize.bind(self), 50)
            );
        },

        _handleResize: function () {
            var self = this;
            var $imgs = $('img[data-src],img[data-src-small],img[data-src-medium],img[data-src-large]');
            var dataName;

            var windowWidth = core.dom.getWinWidth();
            core.each(self.options.breakpoints, function (maxWidth, name) {
                if (maxWidth >= windowWidth) {
                    dataName = 'src' + name.substr(0, 1).toUpperCase() + name.substr(1);
                    return false;
                }
            });

            $imgs.each(function (i) {
                var src = $imgs.eq(i).data(dataName);
                if (!src || this.src === src) { return; }
                this.src = src;
            });
        }
    });

})(jQuery, window[LIB_NAME], window);