/*!
 * vcui.ui.Accordion
 * @license MIT License
 */
(function ($, core, global, undefined) {
    "use strict";
    if (core.ui.Accordion) { return; }

    var ui  = core.ui,
        name = 'accordion',
        eventBeforeColapse = name + 'beforecollapse',
        eventCollapse = name + 'collapse',
        eventBeforeExpand = name + 'beforeexpand',
        eventExpand = name + 'expand';

    /**
     * @class
     * @description 아코디언 컴포넌트
     * @name vcui.ui.Accordion
     * @extends vcui.ui.View
     */
    var Accordion = ui('Accordion', /**@lends vcui.ui.Accordion# */{
        $statics: {
            ON_BEFORE_COLLAPSE: eventBeforeColapse,
            ON_COLLAPSE: eventCollapse,
            ON_BEFORE_EXPAND: eventBeforeExpand,
            ON_EXPAND: eventExpand
        },
        bindjQuery: name,
        defaults: {
            singleOpen: false,
            duration: 200,
            activeClass: "active",
            selectedClass: 'on',
            itemClosest: 'li',
            itemSelector: '>ul>li',
            toggleSelector: ">.head>.ui_accord_toggle",
            contentSelector: ">.ui_accord_content"
        },

        /**
         * 생성자
         * @param el 모듈 요소
         * @param {object} [options] 옵션(기본값: defaults 속성 참조)
         * @param {boolean} [options.singleOpen = false] 단일열림 / 다중열림 여부
         * @param {number} [options.duration = 200] 펼쳐지거나 닫혀지거나 할 때 애니메이션 속도
         * @param {string} [options.activeClass = 'active'] 활성화됐을 때 추가할 css 클래스명
         * @param {string} [options.selectedClass = 'on'] 버튼이 토글될 때 추가할 css 클래스명
         * @param {string} [options.itemClosest = 'li']
         * @param {string} [options.itemSelector = '>ul>li']
         * @param {string} [options.toggleSelector = '>.head>.ui_accord_toggle'] 토글버튼
         * @param {string} [options.contentSelector = '>.ui_accord_content'] 컨텐츠
         */
        initialize: function (el, options) {
            var self = this;

            if (self.supr(el, options) === false ) {
                return;
            }

            self._bindEvent();

            var openIndex = self.options.openIndex;
            if (openIndex !== undefined) {
                if(openIndex === 'all') {
                    self.expandAll();
                } else {
                    self.collapseAll();
                    var indexes = [].concat(openIndex);
                    if (self.options.singleOpen) {
                        self.expand(indexes[0])
                    } else {
                        core.each(indexes, function (index) {
                            self.expand(index);
                        });
                    }
                }
            }
        },


        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvent: function () {
            var self = this,
                o = self.options;

            // 토글버튼 클릭됐을 때
            //@gurumii: 선택자 조합에 해당하는 태그 구성요소에 대한 이벤트 ( click, dbclick ) 발생시
            self.on("click dblclick", o.itemSelector + o.toggleSelector, function (e) {
                e.preventDefault();

                //self.updateSelectors();
                var $item = $(this).closest(o.itemClosest),			//@gurumii: 이벤트 객체에서 부모 li 까지 search > default: li
                    $items = self._findItems(),								//@gurumii: 하위객체들 검색후 리턴
                    index = $items.index($item);							//@gurumii: 클릭 이벤트의 해당 하는 item index
                    
                if ($item.hasClass(o.selectedClass)) {					//@gurumii: on클랙스가 없으면 index에 해당하는 구성요소를 show
                    self.collapse(index, true, function(){					//@gurumii: 닫은후 active 클래스 할당 ( css style 정의후 시각적 표현 가능 )
                        $item.addClass(o.activeClass);
                    });
                } else {
                    self.expand(index, true);
                }
            });

			/**
			 * @gurumii: 
			 * accordion:beforeCollapse 이벤트 ( 닫기전 )가 발생될때
			 * data-accord-group attribute 그룹으로 묶여 있는 요소중
			 * 선택된 요소를 제외한 나머지 그룹요소들을 닫은후
			 * 하위 컨텐츠 ( li )에 해당하는 요소들에 on 클래스를 제거
			 *  */
            if (o.accordGroup && o.singleOpen) {						
                // 아코디언 요소가 따로 떨어져 있는 것을 data-accord-group속성을 묶고,
                // 하나가 열리면 그룹으로 묶여진 다른 아코디언에 열려진게 있으면 닫아준다.
                self.on(eventBeforeColapse, function (e) {
                    $('.ui_accordion[data-accord-group=' + o.accordGroup + '], ' +
                        '.ui_accordion_list[data-accord-group=' + o.accordGroup + ']')
                        .not(self.$el).vcAccordion('collapse')
                        .find(o.itemSelector)
                        .removeClass(o.selectedClass);
                });
            }
        },

		//@gurumii: 선택되어져 있는 items중 on클래스가 있는요소를 리턴 
        _findSelected: function() {
            return this.$items.filter('.'+self.options.selectedClass);
        },

        // 재정의
        _findItems: function() {
            var self = this,
                o = self.options,
                $items;

			//@gurumii: detailview의 정의?
            if(o.accordType === 'detailview') {
                $items = self.$el;
            } else {
                $items = o.itemSelector ? self.$(o.itemSelector) : self.$el;
            }
            return $items;
        },

        /**
         * @param {number} index 인댁스
         * @param {boolean} isAni 애니메이션 여부
         * @param {function} callback 콜백함수
         * @fires vcui.ui,Accordion#accordion:beforeCollapse
         * @fires vcui.ui,Accordion#accordion:collapse
         */
        collapse: function (index, isAni, cb) {
            var self = this,
                opts = self.options,
                data = {},           // 애니메이션 시간		//@gurumii: callback 이벤트에 전달할 파라미터 객체
                $items = self._findItems();

			//@gurumii: 파라미터나 선택된 index가 없을때 on클래스가 들어가 있는 요소의 index를 리턴
            if (arguments.length === 0 || index === null) {
                // index가 안넘어보면 현재 활성화된 패널의 index를 갖고 온다.
                index = $items.filter('.' + opts.selectedClass).index();
            }

            if (index < 0) { return; }
            
            data.index = index;							//@gurumii: 선택된 요소의 index
            data.header = $items.eq(index);		//@gurumii: 선택 index에 대한 li
            data.content = data.header.find(opts.contentSelector);			//@gurumii: 선택된 li의 하위의 보여지는 ( 시각적 ) contents 구성요소

            /**
             * 닫히기 전에 발생하는 이벤트
             * @event vcui.ui.Accordion#accordionbeforecollapse
             * @type {object}
             * @property {number} index 접혀질 인덱스번호
             */
            var ev = $.Event(eventBeforeColapse);
            self.$el.triggerHandler(ev, data);
            if (ev.isDefaultPrevented()) { return; }

            /**
             * 닫힌 후에 발생하는 이벤트
             * @event vcui.ui.Accordion#accordioncollapse
             * @type {object}
             * @property {number} index 닫힌 인덱스 번호
             */
            if(isAni !== false) {
                // 애니메이션 모드
                //if(this.isAnimate) { return; }
                data.header.removeClass(opts.selectedClass);					//@gurumii: li에 on클래스 제거 style effect
                data.content.slideUp(opts.duration, function () {				//@gurumii: 닫히는 에니메이션에 대한 모션이 끝난후
                    // 닫혀진 후에 이벤트 발생
                    self.trigger(eventCollapse, data);									//@gurumii: slideUp 모션 종료후 accordion:collapse 이벤트 발생
                    self._updateButton(index, false);									//@gurumii: 대체 텍스트및 타이틀 치환
                    cb && cb();																	//@gurumii: callback 함수 실행
                });
            } else {
                // 일반 모드
                data.header.removeClass(opts.selectedClass);					//@gurumii: li에 on클래스 제거
                data.content.hide();															//@gurumii: content 숨김
                // 닫혀진 후에 이벤트 발생
                self.trigger(eventCollapse, data);										//@gurumii: accordion:collapse 이벤트 발생
                self._updateButton(index, false);										//@gurumii: 대체 텍스트및 타이틀 치환
                cb && cb();																		//@gurumii: callback 함수 실행
            }
        },


        /**
         * 확장시키기
         * @param {number} index 인댁스
         * @param {boolean} isAni 애니메이션 여부
         * @param {function} callback 콜백함수
         * @fires vcui.ui,Accordion#accordion:beforeExpand
         * @fires vcui.ui,Accordion#accordion:expand
         */
        expand: function (index, isAni, callback) {
            var self = this,
                opts = self.options,
                $items, oldItem, oldIndex, newItem, data;

            if (arguments.length === 0) {
                return;
            }

            $items = self._findItems();
            newItem = $items.eq(index);
            oldItem = $items.filter('.'+opts.selectedClass);
            oldIndex = oldItem.index();
            data = {
                index: index,
                header: newItem,
                oldIndex: oldIndex,
                oldHeader: oldIndex < 0 ? null : oldItem
            };

            if (data.index === data.oldIndex) { return; }

            data.content = newItem.find(opts.contentSelector);
            data.oldContent = oldIndex < 0 ? null : oldItem.find(opts.contentSelector);

            /**
             * 열리기 전에 이벤트 발생
             * @event vcui.ui.Accordion#accordionbeforeexpand
             * @type {object}
             * @property {number} index 열린 인덱스
             */
            var ev = $.Event(eventBeforeExpand);
            self.triggerHandler(ev, data);
            if (ev.isDefaultPrevented()) { return; }
            /**
             * @event vcui.ui.Accordion#accordionexpand
             * @type {object}
             * @property {number} index 열린 인덱스.
             */
            if(isAni !== false) {
                // 애니메이션 사용
                self.isAnimate = true;
                if (opts.singleOpen && data.oldHeader) {
                    // 하나만 열리는 모드
                    data.oldHeader.removeClass(opts.selectedClass);
                    data.oldContent.slideUp(opts.duration, function () {
                        self._updateButton(data.oldIndex, false);
                        callback && callback();
                    });
                }
                data.header.addClass(opts.selectedClass)
                data.content.slideDown(opts.duration, function () {
                    self.isAnimate = false;
                    // 열려진 후에 이벤트 발생
                    self.trigger(eventExpand, data);
                    self._updateButton(index, true);
                    callback && callback();
                });
            } else {
                // 에니메이션 미사용
                if (opts.singleOpen && data.oldHeader) {
                    // 하나만 열리는 모드
                    data.oldHeader.removeClass(opts.selectedClass);
                    data.oldContent.hide();
                }
                data.header.addClass(opts.selectedClass);
                data.content.show();

                // 열려진 후에 이벤트 발생
                self.trigger(eventExpand, data);
                self._updateButton(index, true);
                callback && callback();
            }
        },

        getActivate: function () {
            var self = this,
                o = self.options,
                item = self._findItems().filter('.'+o.selectedClass);

            if (item.length === 0) {
                return {
                    index: -1,
                    header: null,
                    content: null
                }
            } else {
                return {
                    index: item.index(),
                    header: item,
                    content: item.find(o.contentSelector)
                };
            }
        },

        _updateButton: function(index, toggle) {
            var self = this,
                options = self.options,
                activeClass = options.activeClass,
                toggleClass = options.toggleButtonClass,
                $btn = self._findItems().eq(index).find(options.toggleSelector);

            if ($btn.is('a')) {
                if(toggle) {
                    $btn.parent().parent().removeClass(activeClass).addClass(toggleClass);
                    $btn.find('.btn_txt').html('닫기');
                    $btn.find('.ui_accord_text').html(function () {
                        return $btn.attr('data-close-text');
                    }).parent().parent().replaceClass('btn_open', 'btn_close');
                } else {
                    $btn.parent().parent().removeClass(toggleClass);
                    $btn.find('.btn_txt').html('상세보기');
                    $btn.find('.ui_accord_text').html(function () {
                        return $btn.attr('data-open-text');
                    }).parent().parent().replaceClass('btn_close', 'btn_open');
                }
            } else {
                if(toggle) {
                    $btn.find('.btn_txt').html('닫기');
                    $btn.replaceClass('btn_open', 'btn_close')
                        .parent().parent().removeClass(activeClass).addClass(toggleClass);
                    $btn.find('.ui_accord_text').html(function () {
                        return $btn.attr('data-close-text');
                    });
                } else {
                    $btn.find('.btn_txt').html('상세보기');
                    $btn.replaceClass('btn_close', 'btn_open')
                        .parent().parent().removeClass(toggleClass);
                    $btn.find('.ui_accord_text').html(function () {
                        return $btn.attr('data-open-text');
                    });
                }
            }
        },

        collapseAll: function() {
            var self = this,
                count = self._findItems().size();

            self.collapseMode = 'all';
            for(var i = 0; i < count; i++) {
                self.collapse(i, false);
            }
            self.collapseMode = null;
        },

        expandAll: function() {
            if(this.options.singleOpen){ return; }
            var self = this,
                count = self._findItems().size();

            self.expandMode = 'all';
            for(var i = 0; i < count; i++) {
                self.expand(i, false);
            }
            self.expandMode = null;
        }
    });


    if (typeof define === "function" && define.amd) {
        define([], function ($) {
            return Accordion;
        });
    }

})(jQuery, window[LIB_NAME]);