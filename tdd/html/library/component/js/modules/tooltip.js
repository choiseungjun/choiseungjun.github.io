/*!
 * @module scui.ui.Tooltip
 * @author dududu1
 * @email dududu1@vi-nyl.com
 * @create
 * @license MIT License
 */

(function ($, core, undefined) {
	"use strict";
	if (core.ui.Tooltip) { return; }

	/**
	 * 툴팁 레이어
	 * @class
	 * @name scui.ui.Tooltip
	 * @extends scui.ui.View
	 */
	var Tooltip = core.ui('Tooltip', /** @lends scui.ui.Tooltip# */{
		bindjQuery: 'tooltip',
		defaults: {
			interval: 200,
			tipClass:""
		},

		initialize: function (el, options) {
			var self = this;

			if (self.supr(el, options) === false) {
				return;
			}

			self.$tooltip = self.$el.find("input[data-tooltip]");
			if(self.$tooltip.length > 0) self._bindEvents();
		},

		/**
		 * 이벤트 바인딩
		 * @private
		 */
		_bindEvents: function () {
			var self= this;

			self.$tooltip.on('mouseenter', function(e){
				e.preventDefault();
				self._show(this);
			});


			self.$tooltip.on('mouseleave', function(e){

				e.preventDefault();
				self._hide(this);
			});
		},

		_hide:function(element){
			var self = this;
			var tipId = $(element).data("tooltipId");
			$("#" + tipId).clearQueue().stop().animate({
			    opacity: 0
			  }, self.options.interval, function() {
			    	$("#" + tipId).remove();
			  });
		},

		_show:function(element){
			var self = this;
			self._buildTooltip(element);

			var tipId = $(element).data("tooltipId");

			$("#" + tipId).clearQueue().stop().animate({
			    opacity: 1
			  }, self.options.interval, function() {
			  });
		},

		_buildTooltip:function(element){

			var self = this;

			var $element = $(element);
			var str = $element.data("tooltip");
			var top = $element.position().top + $element.height() + 20;
			var left = $element.position().left;

			var tipId = "ui-tooltip-" + new Date().getTime();
			$element.data("tooltipId", tipId);

			var style = "";
			if(self.options.tipClass!= undefined && self.options.tipClass!=""){
				style = "style='position:absolute; left:"+left+"px; top:"+top+"px; opacity:0;' class='ui-tooltip "+self.options.tipClass+"'";
			}else{
				style = "class='ui-tooltip' style='position:absolute; max-width:300px; left:"+left+"px; top:"+top+"px; opacity:0; background-color:rgba(255,255,255,1); box-shadow: 0px 0px 2px 2px lightgray; border-radius: 4px; padding: 8px 10px;'";
			}
			var ele = "<div "+style+" id='"+tipId+"'>"+str+"</div>";
			self.$el.append(ele);

		}
	});

	if (typeof define === "function" && define.amd) {
		define('modules/tooltip', [], function () {
			return Tooltip;
		});
	}
})(jQuery, window[LIB_NAME]);
