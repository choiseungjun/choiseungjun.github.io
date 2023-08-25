/*!
 * @module vcui.ui.Tab
 * @license MIT License
 */
(function ($, core) {
    "use strict";

    var name = 'tab',
        eventBeforeChange = name + 'beforechange',
        eventChanged = name + 'change',
        selectedClass = 'on';
    /**
     * @class
     * @name vcui.ui.Tab
     * @description 페이징모듈
     * @extends vcui.ui.View
     */
    var Tab = core.ui('Tab', /** @lends vcui.ui.Tab# */{
        bindjQuery: 'tab',
        $statics: /** @lends vcui.ui.Tab */{
            ON_CHANGE: eventBeforeChange,
            ON_CHANGED: eventChanged
        },
        defaults: {
            selectedIndex: 0,
            selectedClass: selectedClass,
            selectedText: '선택됨'
        },

        selectors: {
            tabs: '.ui_tab_nav'
        },
        /**
         * 생성자
         * @param {string|Element|jQuery} el 해당 엘리먼트(노드, id, jQuery 어떤 형식이든 상관없다)
         * @param {object} [options] 옵션값
         * @param {number} [options.selectedIndex = 0]  초기선택값
         * @param {string} [options.selectedClass = 'on'] 활성 css클래스명
         * @param {string} [options.tabType = 'inner'] 탭형식(inner | outer)
         */
        initialize: function (el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            self.$srText = $('<em class="hide">' + self.options.selectedText + '</em>'); // screen reader text element

            self._findControls();
            self._buildARIA();
            self._bindEvents();

            var index = self.$tabs.filter('.' + selectedClass).index();
            if (index >= 0) {
                self.options.selectedIndex = index;
            }
            self.select(self.options.selectedIndex);
        },

        _findControls: function () {
            var self = this;
            var selectors = [];

            // 탭버튼의 href에 있는 #아이디 를 가져와서 컨텐츠를 조회
            self.$tabs.each(function () {
                var href = $(this).find('a').attr('href');
                if (href && /^(#|\.)\w+/.test(href)) {
                    selectors.push(href);
                }
            });

            if (selectors.length) {
                self.isOuterPanel = true;
                self.$contents = $(selectors.join(', '));
            } else {
                self.$contents = self.$('.ui_tab_panel');
            }
        },

        /**
         * @private
         */
        _bindEvents: function () {
            var self = this;

            self.$tabs.on('click', '>a, >button', function (e) {
                e.preventDefault();

                self.select($(e.currentTarget).parent().index());
            }).on('keydown', '>a', function (e) {
                var index = self.$tabs.filter('.' + selectedClass).index(),
                    newIndex;

                switch (e.which) {
                    case core.keyCode.RIGHT:
                        newIndex = Math.min(self.$tabs.size() - 1, index + 1);
                        break;
                    case core.keyCode.LEFT:
                        newIndex = Math.max(0, index - 1);
                        break;
                    default:
                        return;
                }
                self.select(newIndex);
                self.$tabs.eq(self.selectedIndex).find('>a').focus();
            });
        },

        /**
         * aria 속성 빌드
         * @private
         */
        _buildARIA: function () {
            var self = this,
                tablistid = 'tab_' + self.cuid,
                tabid;

            self.$el.attr('role', 'tablist');
            self.$tabs.each(function (i) {
                if (!self.$contents.eq(i).attr('id')) {
                    self.$contents.eq(i).attr('id', tabid = (tablistid + '_' + i));
                }

                self.$contents.eq(i).attr({
                    'aria-labelledby': tabid,
                    'role': 'tabpanel',
                    'aria-hidden': 'true'
                });

                $(this).attr({
                    'id': tabid,
                    'role': 'tab',
                    'aria-selected': 'false',
                    'aria-controls': tabid
                });
            });

            self.on(eventChanged, function (e, data) {
                self.$tabs
                    .attr('aria-selected', 'false')
                    .eq(data.selectedIndex)
                    .attr('aria-selected', 'true');

                self.$contents
                    .attr('aria-hidden', 'true')
                    .eq(data.selectedIndex)
                    .attr('aria-hidden', 'false');
            });

        },

        /**
         * index에 해당하는 탭을 활성화
         * @param {number} index 탭버튼 인덱스
         * @fires vcui.ui.Tab#tabbeforechange
         * @fires vcui.ui.Tab#tabchange
         * @example
         * $('#tab').tab('select', 1);
         * // or
         * $('#tab').tab('instance').select(1);
         */
        select: function (index) {
            var self = this, e;
            if (index < 0 || (self.$tabs.length && index >= self.$tabs.length)) {
                throw new Error('index 가 범위를 벗어났습니다.');
            }

            /**
             * 탭이 바뀌기 직전에 발생. e.preventDefault()를 호출함으로써 탭변환을 취소할 수 있다.
             * @event vcui.ui.Tab#tabbeforechange
             * @type {object}
             * @property {number} selectedIndex 선택된 탭버튼의 인덱스
             */
            self.triggerHandler(e = $.Event(eventBeforeChange), {
                selectedIndex: index,
                relatedTarget: self.$tabs.get(index)
            });
            if (e.isDefaultPrevented()) {
                return;
            }

            self.selectedIndex = index;

            self.$tabs.not(self.$tabs.eq(index)).find('>a .hide').text("");

            self.$tabs
                .removeClass(selectedClass)
                .attr('aria-selected', false)
                .eq(index)
                .addClass(selectedClass)
                .attr('aria-selected', true)
                .find('>a .hide').text(self.options.selectedText);
                //.append(self.$srText);


            // 컨텐츠가 li바깥에 위치한 탭인 경우
            if (self.isOuterPanel && self.$contents) {
                self.$contents.hide().eq(index).show();
            }

            /**
             * 탭이 바뀌기 직전에 발생. e.preventDefault()를 호출함으로써 탭변환을 취소할 수 있다.
             * @event vcui.ui.Tab#tabchange
             * @type {object}
             * @property {number} selectedIndex 선택된 탭버튼의 인덱스
             */
            self.triggerHandler(eventChanged, {selectedIndex: index});
        }
    });
    ///////////////////////////////////////////////////////////////////////////////////////

    if (typeof define === "function" && define.amd) {
        define([], function () {
            return Tab;
        });
    }

})(jQuery, window[LIB_NAME]);