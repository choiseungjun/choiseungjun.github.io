/*!
 * @module scui.ui.Accordion
 * @author orodyseek
 * @email odyseek@vi-nyl.com
 * @create 2015-01-29
 * @license MIT License
 *
 * @modifier (김승일책임)comahead@vi-nyl.com
 */
(function ($, core, undefined) {
	"use strict";
	if (core.ui.Accordion) { return; }

	var ctx = window,
		ui  = core.ui

	var Accordion = ui('Accordion', /**@lends scui.ui.Accordion */{
		bindjQuery: 'accordion',
		defaults: {
			singleOpen: false,               // 단일열림 / 다중열림 여부
			duration: 200,                   // 펼쳐지거나 닫혀지거나 할 때 애니메이션 속도
			activeClass: "active",        // 활성화됐을 때 추가할 css 클래스명
			selectedClass: 'on',        // 버튼이 토글될 때 추가할 css 클래스명
			itemClosest: 'li',
			itemSelector: '>ul>li',
			toggleSelector: ">.head>.ui_accord_toggle",  // 토글버튼
			contentSelector: ">.ui_accord_content"       // 컨텐츠
		},

		/**
		 * 생성자
		 * @param el 모듈 요소
		 * @param options 옵션(기본값: defaults 속성 참조)
		 */
		initialize: function (el, options) {
			var self = this;

			if (self.supr(el, options) === false ) {
				return;
			}

			self._bindEvent();			

			var openIndex = self.$el.data('openIndex');

			if (openIndex !== undefined) {
				if(openIndex === 'all') {
					self.expandAll();
				} else {

					self.collapseAll();
					var indexes = [].concat(openIndex);
					if (self.options.singleOpen) {
						self.expand(indexes[0], false)
					} else {
						core.each(indexes, function (index) {
							self.expand(index, false);
						});
					}
				}
			}
		},


		/**
		 * 이벤트 바인딩
		 */
		_bindEvent: function () {
			var self = this,o;

			// 토글버튼 클릭됐을 때
			self.on("click dblclick", self.options.itemSelector + self.options.toggleSelector, function (e) {
				e.preventDefault();

				//self.updateSelectors();
				var $item = $(this).closest(self.options.itemClosest),
					$items = self._findItems(),
					index = $items.index($item);

				if ($item.hasClass(self.options.selectedClass)) {
					self.collapse(index, true, function(){
						$item.addClass(self.options.activeClass);
					});
				} else {
					self.expand(index, true);
				}
			});


			o = self.options.accordGroup;

			if (o && self.options.singleOpen) {
				// 아코디언 요소가 따로 떨어져 있는 것을 data-accord-group속성을 묶고,
				// 하나가 열리면 그룹으로 묶여진 다른 아코디언에 열려진게 있으면 닫아준다.
				//console.log(o);
				self.on('accordionbeforeexpand', function (e) {

					$('.ui_accordion[data-accord-group=' + o + '], .ui_accordion_list[data-accord-group=' + o+ ']')
						.not(self.$el).vcAccordion('collapse').find(self.options.itemSelector).removeClass(self.options.selectedClass);
				});
			}
		},

		_findSelected: function() {
			return this.$items.filter('.'+self.options.selectedClass);
		},

		// 재정의
		_findItems: function() {
			var self = this, $items;

			if(self.options.accordType === 'detailview') {
				$items = self.$el;
			} else {
				$items = self.options.itemSelector ? self.$(self.options.itemSelector) : self.$el;
			}
			return $items;
		},

		/**
		 * slide effect collapse handler
		 * @private
		 * @param { }
		 */
		collapse: function (index, isAni, cb) {
			var self = this,
				opts = self.options,
				data = {},           // 애니메이션 시간
				$items = self._findItems();

			if (arguments.length === 0 || index === null) {
				// index가 안넘어보면 현재 활성화된 패널의 index를 갖고 온다.
				index = $items.filter('.' + opts.selectedClass).index();
			}

			if (index < 0) { return; }

			data.index = index;
			data.header = $items.eq(index);
			data.content = data.header.find(opts.contentSelector);

			// 닫히기 전에 이벤트 발생
			//if (self.triggerHandler('accordionbeforecollapse', data) === false){ return; }
			var ev = $.Event('accordionbeforecollapse');
			self.$el.triggerHandler(ev, data);
			if (ev.isDefaultPrevented()) { return; }

			if(isAni !== false) {
				// 애니메이션 모드
				//if(this.isAnimate) { return; }
				data.header.removeClass(opts.selectedClass);
				data.content.slideUp(opts.duration, function () {
					// 닫혀진 후에 이벤트 발생
					self.trigger('accordioncollapse', data);
					self._updateButton(index, false);
					cb && cb();
				});
			} else {
				// 일반 모드
				data.header.removeClass(opts.selectedClass);
				data.content.hide();
				// 닫혀진 후에 이벤트 발생
				self.trigger('accordioncollapse', data);
				self._updateButton(index, false);
				cb && cb();
			}
		},


		/**
		 * slide effect expand handler
		 * @param { }
		 */
		expand: function (index, isAni, cb) {
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

			// 열리기 전에 이벤트 발생
			//if (self.triggerHandler('accordionbeforeexpand', data) === false) { return; }
			var ev = $.Event('accordionbeforeexpand');
			self.$el.triggerHandler(ev, data);
			if (ev.isDefaultPrevented()) { return; }

			if(isAni !== false) {
				// 애니메이션 사용
				self.isAnimate = true;
				if (opts.singleOpen && data.oldHeader) {
					// 하나만 열리는 모드
					data.oldHeader.removeClass(opts.selectedClass);
					data.oldContent.slideUp(opts.duration, function () {
						self._updateButton(data.oldIndex, false);
						cb && cb();
					});
				}
				data.header.addClass(opts.selectedClass)
				data.content.slideDown(opts.duration, function () {
					self.isAnimate = false;
					// 열려진 후에 이벤트 발생
					self.trigger('accordionexpand', data);
					self._updateButton(index, true);
					cb && cb();
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
				self.trigger('accordionexpand', data);
				self._updateButton(index, true);
				cb && cb();
			}
		},

		getActivate: function () {
			var self = this,
				opts = self.options,
				item = self._findItems().filter('.'+opts.selectedClass);

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
					content: item.find(opts.contentSelector)
				};
			}
		},

		_updateButton: function(index, toggle) {
			var self = this,
				sc = self.options.activeClass,
				tc = self.options.toggleButtonClass,
				$btn = self._findItems().eq(index).find(self.options.toggleSelector);

			if ($btn.is('a')) {
				if(toggle) {
					$btn.parent().parent().removeClass(sc).addClass(tc);
					$btn.find('span.btn_txt').html('닫기');
					$btn.find('span.ui_accord_text').html(function () {
						return $btn.attr('data-close-text');
					}).parent().parent().replaceClass('btn_open', 'btn_close');
				} else {
					$btn.parent().parent().removeClass(tc);
					$btn.find('span.btn_txt').html('상세보기');
					$btn.find('span.ui_accord_text').html(function () {
						return $btn.attr('data-open-text');
					}).parent().parent().replaceClass('btn_close', 'btn_open');
				}
			} else {
				if(toggle) {
					$btn.find('span.btn_txt').html('닫기');
					$btn.replaceClass('btn_open', 'btn_close')
						.parent().parent().removeClass(sc).addClass(tc);
					$btn.find('span.ui_accord_text').html(function () {
						return $btn.attr('data-close-text');
					});
				} else {
					$btn.find('span.btn_txt').html('상세보기');
					$btn.replaceClass('btn_close', 'btn_open')
						.parent().parent().removeClass(tc);
					$btn.find('span.ui_accord_text').html(function () {
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
		define('modules/accordion', [], function ($) {
			return Accordion;
		});
	}

})(jQuery, window[LIB_NAME]);