var app = app || {};

/* ***************************************************************
 * UI components

 * 1. 공통
 *	1) app.tabs : 탭메뉴
 *	2) app.bottomSheet : 바텀시트
 *	3) app.fullPopup : 풀팝업
 *	4) app.accordion : 아코디언
 *	5) app.inputs : form - 텍스트
 *	6) app.inputAddFile : form - 파일첨부
 *	7) app.togglePassword : 토글버튼 - 눈(eye)
 *	8) app.selects : form - 셀렉트
 *	9) app.switchBtn : 토글버튼 - 스위치
 *	10) app.fixedBottomBtn : 레이아웃 하단공간

 * 2. 개별
 *	1) app.backgroundCustom_RA1 : RA1-대회목록 배경 스크립트
 *	2) app.backgroundCustom_MY3_2 : MY3.2-알림 내용 배경 스크립트
 *	3) app.ui_TR1_1 : TR1.1-트래킹 메인

 * 3. 관리자
 *	1) app.editorSwiper : 관리자 에디터 내 스와이퍼
*************************************************************** */

// Tab menu
app.tabs = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.uiTabs';
		this.ctrlName = '.btn_tab';
		this.contName = '.tabs_cont';
		this.$wrap = app.body.find(this.wrapName);
		this.$ctrl = this.$wrap.find(this.ctrlName);
		this.$cont = this.$wrap.find(this.contName);
	},
	addEvent: function() {
		this.handleClick = this.handleClick.bind(this);
		this.$ctrl.on('click touchend', this.handleClick);
	},
	handleClick: function(e) {
		var that = this;
		var $parent = $(e.target).closest('li');
		var tabIndex = $parent.index();
		
		e.preventDefault();
		$parent.addClass('active').siblings().removeClass('active');
		that.$cont.eq(tabIndex).addClass('active').siblings().removeClass('active');
	},
};

// Bottom sheet
app.bottomSheet = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.bs_wrap';
		this.contName = '.bs_container';
		this.dimName = '.bs_dim';
		this.$wrap = app.body.find(this.wrapName);
	},
	addEvent: function() {
		this.calcSetPosition();
	},
	setOpen: function(id) {
		if (!id) return;
		var $bsLayer = $(id).find(this.contName);
		$bsLayer.addClass('active');
	},
	setClose: function(id) {
		if (!id) return;
		var $bsLayer = $(id).find(this.contName);
		$bsLayer.removeClass('active');
	},
	calcSetPosition: function() {
		var $targetEl = app.body.find(this.wrapName + '.uiCalcPosition');
		if (!$targetEl) return;
		$targetEl.find('.bs_container').css('bottom', '66px');
	}
};

// Full Popup
app.fullPopup = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.layer_popup_full';
		this.$wrap = app.body.find(this.wrapName);
	},
	addEvent: function() {
		// console.log('init fullPopup.');
	},
	setOpen: function(id) {
		if (!id) return;
		$(id).addClass('active');
		this._addHistoryBack(id, function() {
			app.fullPopup.setClose(id);
		});
	},
	setClose: function(id) {
		if (!id) return;
		$(id).removeClass('active');
		this._removeHistoryBack(id);
	},
	_addHistoryBack: function(cid, callbackFn) {
		var evtName = '.history-back-' + cid;
		$(window).off('popstate' + evtName).on('popstate' + evtName, function() {
			var state = window.history.state;
			if (state && state.data && state.data == evtName) {
				$(window).off('popstate' + evtName);
				if (callbackFn instanceof Function) {
					callbackFn.call(this);
				}
			}
		});
		window.history.replaceState({
			data: evtName
		}, null, null);
		window.history.pushState({
			data: evtName + '-open'
		}, null, null);
	},
	_removeHistoryBack: function(cid) {
		var evtName = '.history-back-' + cid;
		var state = window.history.state;
		if(state && state.data && state.data == evtName + '-open'){
			window.history.back();
			$(window).off('popstate' + evtName);
		}
	},
};

// Accordion
app.accordion = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.uiAccordion';
		this.ctrlName = '.btn_acc';
		this.contName = '.acc_info';
		this.$wrap = app.body.find(this.wrapName);
		this.$ctrl = this.$wrap.find(this.ctrlName);
	},
	addEvent: function() {
		this.handleClick = this.handleClick.bind(this);
		this.$ctrl.on('click', this.handleClick);
	},
	handleClick: function(e) {
		var that = this;
		var $btn = $(e.currentTarget);
		var $parent = $btn.closest(that.wrapName);
		var $li = $btn.closest('li');
		var $cont = $li.find(that.contName);

		var tabsHeight = $('.tabs_wrap').length ? $('.tabs_wrap').outerHeight() : null;
		var anchorPoint = $btn.offset().top
						+ $('#content').scrollTop()
						- parseInt($('#container').css('padding-top'))
						- tabsHeight;

		if ($li.hasClass('active')) {
			$li.removeClass('active');
			$cont.slideUp();
		} else {
			$parent.find('>li').removeClass('active');
			$li.addClass('active');
			$parent.find('>li>' + that.contName).slideUp();
			$cont.slideDown();
			$('#content').stop().animate({scrollTop: anchorPoint}, 300);
		}
	},
};

// Form - input, textarea
app.inputs = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.input_box';
		this.clearName = '.btn_input_clear'
		this.$wrap = app.body.find(this.wrapName);
		this.$input = app.body.find('input:not([readonly], [type=file], [type=checkbox], [type=radio]), textarea');
		this.$clear = this.$wrap.find(this.clearName);
	},
	addEvent: function() {
		this.checkInputs = this.checkInputs.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleKeyup = this.handleKeyup.bind(this);
		this.handleClickClear = this.handleClickClear.bind(this);

		this.checkInputs();
		this.$input.on('focus.INPUT_FOCUS', this.handleFocus);
		this.$input.on('blur.INPUT_BLUR', this.handleBlur);
		this.$input.on('keyup.INPUT_KEYUP input.INPUT_BASE paste.INPUT_PASTE', this.handleKeyup);
		this.$clear.on('click.INPUT_CLICK', this.handleClickClear);
	},
	checkInputs: function() {
		var that = this;
		$('.input_box input:not([readonly]), .input_box textarea').each(function(idx, e) {
			if ($(e).val() !== '') {
				$(e).closest('.input_inner').find(that.clearName).show();
			}
		});
	},
	handleFocus: function(e) {
		if ( $(e.target).prop('type') == 'radio' || $(e.target).prop('type') == 'checkbox') {
			return;
		}

		var that = this;
		var $parent = $(e.target).closest(that.wrapName);
		$parent.addClass('focus');
	},
	handleBlur: function(e) {
		var that = this;
		var $parent = $(e.target).closest(that.wrapName);
		$parent.removeClass('focus');
	},
	handleKeyup: function(e) {
		var that =this;
		var $input = $(e.target);
		var $inner = $input.closest('.input_inner');
		if ($input.val() !== '') {
			$inner.find(that.clearName).show();
		} else {
			$inner.find(that.clearName).hide();
		}
	},
	handleClickClear: function(e) {
		var $clear = $(e.currentTarget);
		var $input = $clear.closest('.input_inner').find('input, textarea');
		var $inputBox = $clear.closest('.input_box');

		$input.val('');
		$clear.hide();
		$inputBox.removeClass('error');
	},
};

// Form - input add file
app.inputAddFile = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.type_file'
		this.fileInputName = 'input[type=file]';
		this.textInputName = 'input[type=text]';
		this.ctrlName = '.ctrlFile';

		this.$wrap = app.body.find(this.wrapName);
		this.$fileInput = this.$wrap.find(this.fileInputName);
		this.$ctrl = this.$wrap.find(this.ctrlName);
	},
	addEvent: function() {
		this.handleChange = this.handleChange.bind(this);
		this.$fileInput.on('change', this.handleChange);
	},
	handleChange: function(e) {
		var that = this;
		var fileName = $(e.target).val();
		$(e.target).closest(that.wrapName).find(that.textInputName).val(fileName);
	},
	reset: function(cid) {
		$(cid).val('');
		$(cid).closest(this.wrapName).find(this.textInputName).val('');
	},
}

// Form - input toggle password
app.togglePassword = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.uiTogglePassword';
		this.ctrlName = '.btn_pw_view';
		this.$wrap = app.body.find(this.wrapName);
		this.$ctrl = this.$wrap.find(this.ctrlName);
	},
	addEvent: function() {
		this.handleClick = this.handleClick.bind(this);
		this.$ctrl.on('click', this.handleClick);
	},
	handleClick: function(e) {
		var that = this;
		var $btn = $(e.currentTarget);
		var $input = $btn.closest(that.wrapName).find('.input_item input');
		var $iconView = $btn.find('[class*=icon_]');
		var type = $input.attr('type');

		if (type === 'password') {
			$input.attr('type', 'text');
			$iconView.removeClass('icon_view_on').addClass('icon_view_off');
			$iconView.siblings('.hide').text('비밀번호 감추기');
		} else if (type === 'text') {
			$input.attr('type', 'password');
			$iconView.removeClass('icon_view_off').addClass('icon_view_on');
			$iconView.siblings('.hide').text('비밀번호 보기');
		}
	},
};

// Form - select
app.selects = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.select_box';
		this.ctrlName = 'select';
		this.valueName = '.select_txt';
		this.$wrap = app.body.find(this.wrapName);
		this.$ctrl = this.$wrap.find(this.ctrlName);
	},
	addEvent: function() {
		this.handleChange = this.handleChange.bind(this);
		this.$ctrl.on('change', this.handleChange);
	},
	handleChange: function(e) {
		var selectVal = $(e.target).find('option:selected').text();
		var $value = $(e.target).siblings(this.valueName);
		$value.text(selectVal);
	},
};

// Switch button
app.switchBtn = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.toggle_wrap';
		this.ctrlName = '.btn_toggle';
		this.$wrap = app.body.find(this.wrapName);
		this.$ctrl = this.$wrap.find(this.ctrlName);
	},
	addEvent: function() {
		var that = this;
		this.$wrap.each(function(idx) {
			var offText = $(this).data('off-text');
			var onText = $(this).data('on-text');
			if ($(this).find(that.ctrlName).hasClass('active')) {
				$(this).find('.handle').text(onText);
			} else {
				$(this).find('.handle').text(offText);
			}
		});

		this.handleClick = this.handleClick.bind(this);
		this.$ctrl.on('click', this.handleClick);
	},
	handleClick: function(e) {
		var $this = $(e.currentTarget);
		var offText = $this.closest(this.wrapName).data('off-text');
		var onText = $this.closest(this.wrapName).data('on-text');

		if ($this.hasClass('active')) {
			$this.removeClass('active');
			$this.find('.handle').text(offText);
		} else {
			$this.addClass('active');
			$this.find('.handle').text(onText);
		}
	},
};

// Fixed bottom button area
app.fixedBottomBtn = {
	init: function() {
		this.addEvent();
	},
	addEvent: function() {
		var hadCondition = $('#container > .fixed_bottom_area').length > 0
						|| $('#container .fixed_bottom_area.hasFixedForce').length > 0;
		if (hadCondition) {
			$('#content').css('padding-bottom', '96px');
		}

		$('.layer_popup_full .popup_body > .fixed_bottom_area').each(function(idx, el) {
			$(el).siblings('.popup_scroll').css('padding-bottom', '120px');
		});
	},
};

// RA1-대회목록 배경 스크립트
app.backgroundCustom_RA1 = {
	init: function() {
		this.addEvent();
	},
	addEvent: function() {
		$('html, body').css('background', '#0132fd');
		$('#content').on('scroll', function() {
			if ($(this).scrollTop() > 10) {
				$('.type_profile.bg_blue').addClass('setBg');
			} else {
				$('.type_profile.bg_blue').removeClass('setBg');
			}
		});
	},
};

// MY3.2-알림 내용 배경 스크립트
app.backgroundCustom_MY3_2 = {
	init: function() {
		this.addEvent();
	},
	addEvent: function() {
		$('html, body, #wrap').css('background', '#f5f5f5');
	},
};

// TR1.1-트래킹 메인
app.ui_TR1_1 = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.swiperWrapName = '.swiper-container';
		this.coachWrapName = '.coachmark_wrap';
		this.coachTipName = '.tooltip_wrap';
		this.$swiperWrap = app.body.find(this.swiperWrapName);
		this.$coachWrap = app.body.find(this.coachWrapName);
	},
	addEvent: function() {
		this.handleInitSwiper();
		this.calcHeightCoachmark();
		this.handleInitCoachmark();
	},
	handleInitSwiper: function() {
		if ( !this.$swiperWrap.find('.swiper-slide').length ) return;
		new Swiper('.swiper-container',{
			direction: 'horizontal',	// 가로 방향
			spaceBetween: 12,			// 아이템 간격
			resistanceRatio: 0,			// 처음,끝 바운스 제거
		});
	},
	handleInitCoachmark: function() {
		var that = this;
		if ( !this.$coachWrap.length || this.$coachWrap.css('display') === 'none' ) return;
		$('body').addClass('fixedDocument');
		$(document).on('click', 'body', function(e) {
			var $this = $(e.target);
			var hasWrap = $this.is('.tooltip_wrap') || $this.is('.tooltip_wrap *');
			if (!hasWrap) {
				if (!$(that.coachTipName).length) return false;
				that.$coachWrap.stop().animate({'opacity': 0}, 300, function() {
					$(this).hide();
					$('body').removeClass('fixedDocument');
				});
			}
		});
	},
	calcHeightCoachmark: function() {
		var that = this;
		setTimeout(function() {
			var activeSlideHeight = $('.swiper-container').find('.swiper-slide-active').outerHeight();
			$(that.coachTipName + '[data-tooltip=2]').css({'height': activeSlideHeight});
			$(that.coachTipName).addClass('active');
		}, 100);
	}
};

/* 관리자 에디터 내 스와이퍼 */
app.editorSwiper = {
	init: function() {
		this.createSelector();
		this.addEvent();
	},
	createSelector: function() {
		this.wrapName = '.uiEditorSwiper';
		this.popName = '.editor_popup';
		this.$wrap = app.body.find(this.wrapName);
		this.$pop = this.$wrap.find(this.popName);
		this.$popClose = this.$wrap.find('.editor_popup .btn_pop_close');
	},
	addEvent: function() {
		var swiper = new Swiper('.uiEditorSwiper .swiper-container',{
			direction: 'horizontal',	// 가로 방향
			resistanceRatio: 0,			// 처음,끝 바운스 제거
			observer: true,
			observeParents: true,
			observeSlideChildren: true,
			navigation: {
				nextEl: '.swiper-button-next',
				prevEl: '.swiper-button-prev',
			},
			pagination: {
				el: '.swiper-pagination',
				type: 'bullets',
			},
			on: {
				afterInit: function (swiper) {
					if (swiper.slides.length == 1) {
						swiper.pagination.$el.addClass('hide');
					}
				},
				observerUpdate: function(swiper) {
					swiper.update();
				}
			},
		});

		this.handlePopupClose = this.handlePopupClose.bind(this);
		this.$popClose.on('click', this.handlePopupClose);
	},
	popupOpen: function(cid) {
		$(cid).addClass('active');
		var videoUrl = $(cid).data('url');
		var html = '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + videoUrl + '?playsinline=0" title="YouTube video player" frameborder="0"></iframe>';
		$(cid).find('.video_container').html(html);

		$('body').addClass('fixedDocument');
		$('#content').css('overflow-y', 'hidden');
	},
	handlePopupClose: function(e) {
		$(e.currentTarget).closest(this.popName).removeClass('active');
		$(e.currentTarget).closest(this.popName).find('iframe').remove();
		$('body').removeClass('fixedDocument');
		$('#content').css('overflow-y', 'auto');
	}
};

/* ***************************************************************
 * UI init
*************************************************************** */

/* Has jquery object */
function hasJqueryObject(el) {
	return $(el).length > 0;
}

/* UI init */
function init() {
	if(hasJqueryObject('.uiTabs')) app.tabs.init();
	if(hasJqueryObject('.bs_wrap')) app.bottomSheet.init();
	if(hasJqueryObject('.layer_popup_full')) app.fullPopup.init();
	if(hasJqueryObject('.uiAccordion')) app.accordion.init();
	if(hasJqueryObject('.input_box')) app.inputs.init();
	if(hasJqueryObject('.input_box.type_file')) app.inputAddFile.init();
	if(hasJqueryObject('.uiTogglePassword')) app.togglePassword.init();
	if(hasJqueryObject('.select_box')) app.selects.init();
	if(hasJqueryObject('.select_box')) app.selects.init();
	if(hasJqueryObject('.uiSwitchBtn')) app.switchBtn.init();
	if(hasJqueryObject('.fixed_bottom_area')) app.fixedBottomBtn.init();
	if(hasJqueryObject('.uiBgRA1')) app.backgroundCustom_RA1.init();
	if(hasJqueryObject('.uiBgMY3_2')) app.backgroundCustom_MY3_2.init();
	if(hasJqueryObject('.uiTR1_1')) app.ui_TR1_1.init();
	if(hasJqueryObject('.uiEditorSwiper')) app.editorSwiper.init();
}

$(function() {
	app.body = $('body');
	init();
});