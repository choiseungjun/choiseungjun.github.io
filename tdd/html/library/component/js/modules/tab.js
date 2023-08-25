/*!
 * @module scui.ui.Tab
 * @author 김승일 책임(comahead@vi-nyl.com)
 * @create 2014-12-08
 * @license MIT License
 */
(function ($, core) {
	"use strict";

	if(core.ui.Tab){ return; }

	// 탭에 대한 퍼블리싱 케이스가 너무 많아 타입별로 클래스 작성
	var BaseTab = core.ui.View.extend({
		name: 'BaseTab',
		defaults: {
			tabSelector: '>li',
			btnSelector: '>a'
		},
		initialize: function (el, options) {
			var self = this, index;
			if (self.supr(el, options) === false) { return }

			self.$el[0].selectedIndex = 0;

			self._findControls();
			self._bindEvents();
			self._initTab();

			console.log('asdfasfd');
		},
		_initTab: function (){
			var self = this, index;
			//console.log(self.$tabs.filter('.on').index());
			if ((index = self.$tabs.filter('.on').index()) >= 0) {
				self.selectTab(index);
				

			}
		},
		_findControls: function () {
			var self = this,
				selectors = [],
				contents = [];

			self.$tabs = self.$(self.options.tabSelector);
			self.$tabs.each(function () {
				var $el = self.options.btnSelector ? $(this).find(self.options.btnSelector) : $(this),
					cont = $el.attr('href') || $el.attr('data-href');
				if (cont && cont.length > 1 && cont.substr(0, 1) === '#') {
					selectors.push(cont);
				} else {
					// '#' 만 있으면 inner content
					contents.push($el.next().is('div')  ? $el.next() : {});
				}
			});

			if (selectors.length > 0) {
				self.$contents = $(selectors.join(', '));
			} else {
				self.$contents = $(contents);
			}
		},
		_bindEvents: function () {
			var self = this;
			self.$el.on('click', self.options.tabSelector + self.options.btnSelector, function (e) {
				e.preventDefault();
				if (self.getState('disabled')
					|| self.getState('readonly')
					|| $(this).hasClass('disabled')
					|| $(this).prop('disabled') === true) { return; }

				var index = self.$tabs.index(self.options.btnSelector ? self.$tabs.has(this) : this);
				self.selectTab(index);
			}).on('statechange', function (e, data) {
				switch(data.name) {
					case 'disabled':
					case 'readonly':
						if (data.value) {
							self.$tabs.find(':focusable').attr('tabindex', -1);
						} else {
							self.$tabs.find(':focusable').removeAttr('tabindex');
						}
						break;
				}
			});
		},

		// 별도의 처리가 필요한거는 오버라이드
		_selectTab: function (index) {},
		_toggleText: function (index) {
			var self = this,
				txtSpan = (self.options.btnSelector ? self.options.btnSelector + ' ' : '')+'span.hide';

			self.$tabs.find(txtSpan).html(' ');
			//self.$tabs.eq(index).find(txtSpan).html('선택됨');
		},
		_getEventTarget: function (index) {
			var self = this;
			return self.options.btnSelector ? self.$tabs.eq(index).find(self.options.btnSelector) : self.$tabs.eq(index);
		},
		/**
		 * index에 해당하는 탭을 활성화
		 * @param {number} index 탭버튼 인덱스
		 */
		selectTab: function(index) {
			var self = this, e, param;
			if (self.getState('disabled') || self.getState('readonly')) { return; }
			if(index < 0 || (self.$tabs.length && index >= self.$tabs.length)) {
				index = self.options.selectedIndex;
			}

			param = {
				selectedIndex: index,
				tab: self.$tabs.get(index),
				content: self.$contents.get(index),
				sender: self._getEventTarget(index)
			};

			self.$el[0].selectedIndex = index;
			self.trigger(e = $.Event('tabchange'), param);
			if(e.isDefaultPrevented()) { self.$el[0].selectedIndex = self.selectedIndex; return false; }

			self.$el[0].selectedIndex = self.selectedIndex = index;
			self._selectTab(index);
			self._toggleText(index);

			self.$tabs.removeClass('on').eq(index).addClass('on');
			self.$contents.hide().eq(index).show();

			self.trigger('tabchanged', param);
		}
	});

	/**
	 * 다음 네항목 중에서 type에 따라 필요한걸 구현해주면 된다.
	 * defaults: 기본 옵션값
	 * _toggleText: 탭이 선택여부에 따른 숨김문구 변경하는 함수
	 * _selectTab: 선택될 때 호출되는 함수
	 * _initTab: 초기화 함수
	 */
	var TabTypes = {
		'type01': BaseTab,
		'type02': BaseTab.extend({ // 바로 하위에 버튼이 있는 경우
			defaults: {
				tabSelector: '>a, >button',
				btnSelector: ''
			},
			// overide
			_toggleText: function (index) {
				var self = this;
				self.$tabs.find('span.hide').html(' ');
				//self.$tabs.eq(index).find('span.hide').html('선택됨');
			}
		}),
		'type03': BaseTab.extend({  // 탭이 탭영역을 벗어날 경우 좌우로 스와이핑 되는 탭
			defaults: {
				tabSelector: '>.tab_hbox>ul>li',
				btnSelector: '>a'
			},
			selectors: {
				tabBox: '>.tab_hbox',
				scroller: '>.tab_hbox>ul'
			},
			// overide
			_initTab: function(){
				var self = this, html, $ul, size;

				html = ['<div class="tab_nav" style="display:none;">',
					'<a href="#" class="prev_tab"><span class="hide">이전 탭보기</span></a>',
					'<a href="#" class="next_tab"><span class="hide">다음 탭보기</span></a>',
					'</div>'].join('');

				size = self._getTabsWidth();

				self.$scroller.css({'width': 1000});
				self.$tabBox.css({'margin': 0});
				self.$el.prepend(self.$tabNavi = $(html));

				var move = function(val, isAni) {
					if(isAni) {
						self.$scroller.stop().animate({'margin-left': val}, function(e) {
							enabled();
						});
					} else {
						self.$scroller.stop().css({'margin-left': val});
						enabled();
					}
				};
				var enabled = function(size) {
					var margin = parseInt(self.$scroller.css('margin-left'), 10) || 0;

					size = size || self._getTabsWidth();

					if(!size.isOver) {
						self.$tabNavi.hide();
						self.$tabBox.css({'margin': 0});
						self.$scroller.css('margin-left', 0);
					} else {
						self.$tabNavi.show();
						self.$tabBox.css({'margin': '0 ' + (self.$tabNavi.find('>a').width()) + 'px'});

						self.$tabNavi.find('>.prev_tab').toggleClass('on', margin !== 0 && size.tabWidth < size.tabsWidth);
						self.$tabNavi.find('>.next_tab').toggleClass('on', margin !== size.tabWidth - size.tabsWidth  && size.tabWidth < size.tabsWidth);
					}

				};

				// 탭 클릭
				self.on('click', '.tab_nav a', function(e) {
					e.preventDefault();

					var $el = $(this),
						size = self._getTabsWidth(),
						marginLeft = parseInt(self.$scroller.css('margin-left'), 10) || 0;

					if($el.hasClass('prev_tab')) {
						move(Math.min(0, marginLeft + (size.tabWidth * 0.5)), true);
					} else {
						move(Math.max(size.tabWidth - size.tabsWidth, marginLeft - (size.tabWidth * 0.5)), true);
					}
				});
				var marginLeft;
				self.$tabBox.swipeGesture().on('swipegesturestart', function () {
					if(!size.isOver) {
						return;
					}
					marginLeft = parseInt(self.$scroller.css('margin-left'), 10) || 0;
				}).on('swipegesturemove', function (e, data) {
					if(!size.isOver) {
						return;
					}
					if(data.direction === 'left') {
						move(Math.max(size.tabWidth - size.tabsWidth, marginLeft + data.diff.x));
					} else if(data.direction === 'right') {
						move(Math.min(0, marginLeft + data.diff.x));
					}
				});


				$(window).on('resizeend.'+self.cid, function() {
					size = self._getTabsWidth();
					if(size.isOver) {
						move(0);
					}
					enabled(size);
				});
				enabled(size);

				self.supr();
			},

			/**
			 * 탭 너비 구하기
			 * @returns {{isOver: boolean, tabWidth: *, tabsWidth: (number|tabsWidth)}}
			 * @private
			 */
			_getTabsWidth: function(){
				var self = this,
					tabsWidth = 0;

				self.$tabs.each(function(){
					tabsWidth += $(this).width() + 1;
				});

				var result = {
					tabWidth: self.$tabBox.width(),
					tabsWidth: tabsWidth
				};

				return {
					isOver: result.tabWidth < result.tabsWidth,
					tabWidth: result.tabWidth,
					tabsWidth: result.tabsWidth
				};
			}
		}),
		'type04': BaseTab.extend({  // 라디오박스
			defaults: {
				tabSelector: '>li',
				btnSelector: '>span>a'
			},
			// overide
			_initTab: function (){
				var self = this,
					index = self.$tabs.index(self.$tabs.has('>span>:radio:checked'));
				if (index < 0) {
					index = self.options.selectedIndex;
				}
				self.selectTab(index);
			},
			// overide
			_bindEvents: function () {
				var self = this;
				self.$el.on('checkedchanged', '>li>span>:radio', function (e) {
					e.preventDefault();
					if (self.getState('disabled')
						|| self.getState('readonly')
						|| $(this).prop('disabled') === true
						|| $(this).hasClass('disabled')) { return; }

					var index = self.$tabs.index($(this).closest('li').eq(0));
					self.selectTab(index, false);
				});
			},
			// overide
			selectTab: function (index, isOut) {
				var self = this;
				self.supr(index);
				if (isOut !== false) {
					self.$tabs.eq(index).find(':radio').checked(true, false);
				}
			},
			// overide
			_toggleText: function (index) {
				return false;
			}
		})
	};

	var Tab = core.ui('Tab', {
		bindjQuery: 'tab',
		defaults: {
			selectedIndex: 0
		},
		initialize: function (el, options) {
			var self = this,
				tabType, TabClass;

			tabType = $(el).data('tabType') || 'type01'; //'scrollTab';
			if (TabClass = TabTypes[tabType]) {
				var tab = new TabClass(el, $.extend({}, options, self.defaults));
				$.extend(self, tab);
			} else {
				throw new Error('탭가이드에 없는 형식입니다.');
			}
		}
	});

	if (typeof define === "function" && define.amd) {
		define('modules/tab',[], function() {
			return Tab;
		});
	}


})(jQuery, window[LIB_NAME]);

