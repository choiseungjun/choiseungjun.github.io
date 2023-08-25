/*!
 * @author vcui.ui.placeholder.js
 * @email comahead@gmail.com
 * @create 2013-11-25
 * @license MIT License
 */
(function ($, core, undefined) {
    "use strict";

    var $doc = core.$doc,
        ui = core.ui,
        detect = core.detect,
        isTouch = detect.isTouch;


    //Placeholder /////////////////////////////////////////////////////////////////////////
    /**
     * placeholder를 지원하지 않는 IE7~8상에서 placeholder효과를 처리하는 클래스
     * @class
     * @name vcui.ui.Placeholder
     * @extends vcui.ui.View
     * @example
     * new vcui.ui.Placeholder('input[placeholder]', {});
     * // 혹은 jquery 플러그인 방식으로도 호출 가능
     * $('input[placeholder]').placeholder({});
     */
    var Placeholder = ui('Placeholder', /** @lends vcui.ui.Placeholder# */{
        bindjQuery: 'placeholder',
        defaults: {
            foreColor: '',
            placeholderClass: 'placeholder'
        },
        /**
         * 생성자
         * @param {string|Element|jQuery} el 해당 엘리먼트(노드, id, jQuery 어떤 형식이든 상관없다)
         * @param {Object} [options] 옵션값
         * @param {string} [options.foreColor = ''] placeholder 폰트색
         * @param {string} [options.placeholderClass = 'placeholder'] placeholder 클래스명
         */
        initialize: function (el, options) {
            var self = this,
                is = ('placeholder' in core.tmpInput);

            if ( (options && options.force !== true) && is ) { return; }
            if(self.supr(el, options) === false) { return; }

            self.placeholder = self.$el.attr('placeholder');
            self.$el.removeAttr('placeholder').attr('ori-placeholder', self.placeholder);
            self._foreColor = self.options.foreColor;

            self.isPassword = self.$el.attr('type') === 'password';
            if(!self.$el[0].value){
                if(self.isPassword) {
                    // 암호인풋인 경우 백그라운으로 처리
                    self.$el.addClass(self.options.placeholderClass);
                } else {
                    self.$el[0].value = self.placeholder;
                }
                self.$el.addClass('placeholder');
            }
            self._bindEvents();
        },

        _bindEvents: function () {
            var self = this;

            self.on('focusin click', function () {
                var val = self.options.force === true ? this.value.replace(/\r/g, '') : this.value;
                if (val === self.placeholder || !$.trim(val)) {
                    self.$el.removeClass(self._foreColor);
                    // 암호요소인 경우 백그라운드로 처리
                    if(self.isPassword) {
                        self.$el.removeClass(self.options.placeholderClass);
                    }
                    this.value = '';
                    self.$el.removeClass('placeholder');
                }
            });
            self.on('focusout', function () {
                var val = self.options.force === true ? this.value.replace(/\r/g, '') : this.value;
                if (val === '' || val === self.placeholder) {
                    if(self.isPassword) {
                        self.$el.val('').addClass(self.options.placeholderClass);
                    } else {
                        self.$el.val(self.placeholder).addClass(self._foreColor);
                    }
                    self.$el.addClass('placeholder');
                }
            }).triggerHandler('focusout');
        },

        /**
         * placeholder 갱신(only ie9 이하)
         */
        update: function(){
            var self = this;
            self.$el.val(self.placeholder);
        },

        /**
         * 파괴자 : 자동으로 호출되지 않으므로, 필요할 때는 직접 호출해주어야 한다.
         */
        destroy: function () {
            var self = this;

            self.$el.removeData();
            self.supr();
        }
    });

    if(!('placeholder' in core.tmpInput)) {
        $doc.on('submit.placeholder', 'form', function(e) {
            $('input[placeholder], input[ori-placeholder], textarea[placeholder], textarea[ori-placeholder]').each(function() {
                var $el = $(this),
                    txtPlaceholder = $el.getPlaceholder();
                if (txtPlaceholder === this.value) {
                    $el.removeClass(Placeholder.prototype.defaults.foreColor);
                    this.value = '';
                }
            });
        });
    }
    ///////////////////////////////////////////////////////////////////////////////////////

    if (typeof define === "function" && define.amd) {
        define([], function() {
            return Placeholder;
        });
    }

})(jQuery, window[LIB_NAME]);