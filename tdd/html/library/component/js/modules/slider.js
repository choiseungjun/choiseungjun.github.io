/*!
 * @module vcui.ui.Slider
 * @author dududu1
 * @create 
 * @license MIT License
 *
 */
(function ($, core, undefined) {
    "use strict";

    if(core.ui.Slider) { return; }

    var $doc = $(document),
        browser = core.browser,
        isTouch = browser.isTouch;

    /**
     * @class
     * @description
     * @name
     * @extends vcui.ui.View
     */

    var Slider = core.ui('Slider', /** @lends vcui.ui.Slider# */{
        bindjQuery: 'slider',
        defaults: {
            values:[0,100],
            range:false,
            min:0,
            max:100

        },
        selectors: {
            bg : '.ui_slider_bg',
            btnMin:'.ui_slider_min_btn',   
            btnMax: '.ui_slider_max_btn',  
            rangeBar : '.ui_slider_range',
            values: '.ui_slider_value'   
        },

        initialize: function(el, options) {
            var self = this;
            if (self.supr(el, options) === false) return; 
            
            self._build();
            self._resize();
            self._syncInput();
            self._bindEvents();
            
        },

        _build:function(){

            var self = this;
            self.isMouseDown = false; 
            self.originValue = null;  

            self.valuesArr = self.$values.children().map(function(){ return $(this).data('value'); }).get();
            self.minValue = self.valuesArr.length == 0? self.options.min : self.valuesArr[0];
            self.maxValue = self.valuesArr.length == 0? self.options.max : self.valuesArr[self.valuesArr.length-1];  
            self.startValue = self.options.minInput == undefined? self.options.values[0] : self.options.minInput;
            self.endValue = self.options.maxInput == undefined? self.options.values[1] : self.options.maxInput;  

            if(!core.type(self.startValue, 'number')){
                self.$minInput = $(self.startValue);
                self.startValue = self.$minInput.val();                
            }

            if(!core.type(self.endValue, 'number')){
                self.$maxInput = $(self.endValue);
                self.endValue = self.$maxInput.val();  
            }

            if(self.endValue - self.startValue < 0) self.endValue = self.maxValue;
            self.isSnap = self.valuesArr.length > 0? true : false;  
            self.$el.css('-webkit-tap-highlight-color','rgba(0,0,0,0)');             
            
        },


        _setValue:function(start, end){

            var self = this;
            var idx;
            var sMin = self._getDistance(start);  
            var sMax = self._getDistance(end);

            if(sMin == sMax){

                idx = self._getSnapIndex(start);
                if(self.valuesArr.length-1 > idx && idx > 0){
                    sMin = self._getDistance(self.valuesArr[idx]);
                    sMax = self._getDistance(self.valuesArr[idx+1]); 
                }else{
                    sMin = self._getDistance(self.valuesArr[0]);
                    sMax = self._getDistance(self.valuesArr[1]);
                }              
            } 
            
            if(self.$btnMin[0]) self.$btnMin.css('left', sMin);  
            else sMin = 0;
            
            if(self.$btnMax[0]) self.$btnMax.css('left', sMax);
            else sMax = self.rangeWidth;
               
            self.$rangeBar.css({left:sMin+ self.btnSize/2, width:sMax-sMin});  
            if(self.isSnap) self._snapMove();

        },
        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvents: function(){
            var self = this;

            self.on('click', function(e) {

                e.preventDefault();
                if(isTouch) e.stopPropagation();
                self._move(self._getX(e));
                if(self.isSnap) self._snapMove();
                self._syncInput();
                self.$el.triggerHandler('sliderChanged', [self.getValue()]);
                self.triggerHandler('sliderChanged.'+self.cid, [self.getValue()]); 
                
            });

            $(window).on('resizeend', function (e){
                self.originValue = self.getValue();
                self._resize();
            })


            self.on('mousedown touchstart', '.ui_slider_handler', function(e) {

                e.preventDefault();
                if(isTouch) e.stopPropagation();

                var $activeBtn = $(this);
                self.isMouseDown = true;

                $(document).off('.'+self.cid).on('mouseup.'+self.cid+' touchend.'+self.cid+' mousemove.'+self.cid+' touchmove.'+self.cid, function(e){
                    if(!self.isMouseDown){ $(document).off('.'+self.cid); return; }

                    switch(e.type){
                        case 'mouseup':
                        case 'touchend':                            
                            self.isMouseDown = false;
                            if(self.isSnap) self._snapMove($activeBtn);
                            self._syncInput();
                            self.$el.triggerHandler('sliderChanged', [self.getValue()]); 
                            self.triggerHandler('sliderChanged.'+self.cid, [self.getValue()]); 
                            $(document).off('.'+self.cid);
                            break;
                        case 'mousemove':
                        case 'touchmove':
                            self._move(self._getX(e), $activeBtn);
                            e.preventDefault();
                            break
                    }
                });

                return false;

            }).on('keydown', '.ui_slider_handler', function(e){

                var $btn = $(this);
                var idx;

                if(self.valuesArr.length > 0) idx = self._getSnapIndex(self._convertValue($btn.position().left + self.elLeft + self.btnSize/2));
                else idx = $btn.position().left + self.elLeft + self.btnSize/2;  

                switch(e.keyCode){
                    case 37: // left
                        idx -= self.distance;                        
                        e.stopPropagation();
                        e.preventDefault();
                        break;
                    case 39:	// right
                        idx += self.distance;
                        e.stopPropagation();
                        e.preventDefault();
                        break;
                }

                self._move(self.valuesArr.length > 0? self._getDistance(self.valuesArr[idx]) : idx, $btn);
                if(self.isSnap) self._snapMove($btn);
                self._syncInput();
                self.$el.triggerHandler('sliderChanged', [self.getValue()]);
                self.triggerHandler('sliderChanged.'+self.cid, [self.getValue()]); 
            });

        },

	    /**
	     * 변경된 값을 연결된 히든인풋에 동기화 해준다
	     * @private
	     */
        _syncInput: function(){
            var self = this;
            var val = self.getValue();
            var minIdx = self._getSnapIndex(val.minValue);
            var maxIdx = self._getSnapIndex(val.maxValue);

            var minStr = minIdx>-1? self.$values.children().eq(minIdx).data('title') : val.minValue;
            var maxStr = maxIdx>-1? self.$values.children().eq(maxIdx).data('title') : val.maxValue;

            
            if(self.$btnMin[0] && self.$btnMax[0]){

                self.$btnMin.find('span.hide').text(minStr+"에서");
                self.$btnMax.find('span.hide').text(maxStr+"까지");
                
            }else if(self.$btnMin[0]){
                self.$btnMin.find('span.hide').text(minStr+"에서"+maxStr+"까지");
            }else{
                self.$btnMax.find('span.hide').text(maxStr);
            }

            if(self.$minInput) self.$minInput.val(minStr);
            if(self.$maxInput) self.$maxInput.val(maxStr);

            // 설정된 버튼 위치의 li에 on 클래스 추가
            self.$values.children().removeClass('on').eq(minIdx).addClass('on').end().eq(maxIdx).addClass('on');
            //console.log(self.$values.children().eq(minIdx).data('title'), self.$values.children().eq(maxIdx).data('title'));


        },

	    /**
	     * x 좌표 반환
	     * @param e
	     * @returns {*}
	     * @private
	     */
        _getX: function(e) {
            if(isTouch && e.originalEvent.touches) e = e.originalEvent.touches[0];            
            return e.pageX;
        },

        // 가장 가까운 배열 인텍스를 구함.
        _getSnapIndex:function(value) {
            var self = this;
            var near = Infinity;            
            var np = Infinity;
            var idx = -1;

            for (var i = 0; i<self.valuesArr.length; i++){                
                np = Math.abs(parseFloat(self.valuesArr[i]) - parseFloat(value));                
                if(near >= np) {
                    near = np; 
                    idx =  i;  
                }              
            }  
            return idx            
        },

        // 실제 거리로 계산
        _getDistance:function(value){ 
            var self = this;
            return (value - self.minValue)/((self.maxValue - self.minValue)/self.rangeWidth);
        },

        // value 값으로 변환
        _convertValue:function(distance){            
            var self = this;   
            return ((self.maxValue - self.minValue)/self.rangeWidth)*distance + self.minValue;
        },

        _getSnapDistance:function(value) {
            var self = this;
            var idx = self._getSnapIndex(value);
            var output = self.valuesArr[idx];
            return idx<0? 0 : self._getDistance(output);            
        },

        _snapMove:function(target){
            var self = this;
            var obj = self.getValue();
            var minX = obj.minValue;
            var maxX = obj.maxValue;            
            var sMin = self._getSnapDistance(minX);            
            var sMax = self._getSnapDistance(maxX);

            if(target){
                if(sMin == sMax && self.isRangeSlider){
                    if (target[0] == self.$btnMax[0]) sMax = self._getDistance(self.valuesArr[self._getSnapIndex(maxX) + 1]);
                    else sMin = self._getDistance(self.valuesArr[self._getSnapIndex(minX) - 1]);                   
                } 
            }else{

                if(sMin == sMax && self.isRangeSlider) return;
            }
            
            if(self.$btnMin[0]) self.$btnMin.css('left', sMin);  
            if(self.$btnMax[0]) self.$btnMax.css('left', sMax);  
            self.$rangeBar.css({left:sMin+ self.btnSize/2, width:sMax-sMin}); 
        },

	    /**
	     * 버튼을 실제 움직여 준다
	     * @param distance, target
	     * @private
	     */
        _move: function(distance, target) {

            var self = this;
            var xpos = distance - self.elLeft - self.btnSize/2;
            
            if(xpos > self.rangeWidth) xpos = self.rangeWidth;
            if(xpos < 0) xpos = 0;

            var minX = self.$btnMin[0]? self.$btnMin.position().left : 0;
            var maxX = self.$btnMax[0]? self.$btnMax.position().left : self.rangeWidth;

            if(target){

                if (target[0] == self.$btnMax[0]){
                    if( xpos <= minX ) xpos = minX;
                    if(self.$btnMax[0]) self.$btnMax.css("left",xpos);

                }else if(target[0] == self.$btnMin[0]){                    
                    if( xpos >= maxX ) xpos = maxX;
                    if(self.$btnMin[0]) self.$btnMin.css("left",xpos);
                }

            }else{

                if(Math.abs(minX - xpos) < Math.abs(maxX - xpos)){
                    if(self.$btnMin[0]) self.$btnMin.css("left",xpos);
                    else if(self.$btnMax[0]) self.$btnMax.css("left",xpos);
                }else{
                    if(self.$btnMax[0]) self.$btnMax.css("left",xpos);
                    else if(self.$btnMin[0]) self.$btnMin.css("left",xpos);
                }   
                
            }

            var bm = self.$btnMin[0]? self.$btnMin.position().left : 0;
            var bx = self.$btnMax[0]? self.$btnMax.position().left : self.rangeWidth;
            self.$rangeBar.css({left:bm+ self.btnSize/2, width:bx-bm});


        },


        _resize: function () {

            var self = this;
            var wd, ht, bh, dt, st = self.$el.height()/2;

            self.isRangeSlider = (self.$btnMin[0] && self.$btnMax[0])? true : false;   
            if(self.$btnMax[0]) self.btnSize = self.$btnMax.width();
            else if(self.$btnMin[0]) self.btnSize = self.$btnMin.width();
            else self.btnSize = 20;

            self.rangeWidth = self.$el.width()-self.btnSize;
            self.elLeft = self.$el.offset().left;    
            self.distance = self.valuesArr.length > 0? 1 : Math.round(self.rangeWidth/10);            
            self.$values.css({'position':'absolute', 'left':self.btnSize/2});

            bh = self.$bg.height()/2;
            self.$bg.css({width:self.rangeWidth,left:self.btnSize/2, 'top':st-bh});  
            self.$rangeBar.css({'top':st-bh}); 

            ht = self.$btnMin.height()/2;            
            self.$btnMin.css({'top':st - ht + bh});

            ht = self.$btnMax.height()/2;
            self.$btnMax.css({'top':st - ht + bh});
            
            self.$values.children().each(function (idx, item) {
                wd = $(item).width()/2;
                ht = $(item).height()/2;
                dt = self._getDistance(self.valuesArr[idx]);
                $(item).css({'position':'absolute', 'left':dt - wd});
            });

            if(self.originValue) self._setValue(self.originValue.minValue, self.originValue.maxValue); 
            else self._setValue(self.startValue, self.endValue);
        },


        getValue: function () {
            var self = this            
            var minX = self.$btnMin[0]? self.$btnMin.position().left : 0;
            var maxX = self.$btnMax[0]? self.$btnMax.position().left : self.rangeWidth;

            return {
                'minValue': Math.round(((self.maxValue - self.minValue)/self.rangeWidth)*minX + self.minValue),
                'maxValue': Math.round(((self.maxValue - self.minValue)/self.rangeWidth)*maxX + self.minValue)
            }
        },

	    
        update: function (dontTrigger) {

            var self = this;
            self._build();
            self._resize();
            self._syncInput();

            if(!dontTrigger){
                self.$el.triggerHandler('sliderChanged', [self.getValue()]); 
                self.triggerHandler('sliderChanged.'+self.cid, [self.getValue()]); 
            } 
        }
    });
    ///////////////////////////////////////////////////////////////////////////////////////

    if (typeof define === "function" && define.amd) {
        define([], function() {
            return Slider;
        });
    }

})(jQuery, window[LIB_NAME]);