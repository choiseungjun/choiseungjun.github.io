/*!
 * @module vcui.ui.RangeSlider
 * @author dududu1
 * @create 
 * @license MIT License
 *
 */
(function ($, core, undefined) {
    "use strict";

    if(core.ui.RangeSlider) { return; }

    var $doc = $(document),
        detect = core.detect,
        isTouch = detect.isTouch;

    /**
     * @class
     * @description
     * @name
     * @extends vcui.ui.View
     */

    var RangeSlider = core.ui('RangeSlider', /** @lends vcui.ui.RangeSlider# */{
        bindjQuery: 'rangeSlider',
        defaults: {
            values:'[]',
            input:'0,25',
            range:'0,100'

        },
        selectors: {
            bg : '.ui-range-slider-bg',
            btnMin:'.ui-range-slider-min-btn',   
            btnMax: '.ui-range-slider-max-btn',  
            rangeBar : '.ui-range-slider-range',
            values: '.ui-range-slider-value'   
        },

        templates: {
            contents:
                    '<div class="ui-range-slider-bg"></div>' +
                    '<div class="ui-range-slider-range"></div>'+
                    '{{#if list.length > 0}}<ul class="ui-range-slider-value">'+
                    '{{#each item in list}}<li data-value="{{item.value}}" data-title="{{item.title}}"></li>{{/each}}'+
                    '</ul>{{/if}}'+
                    '{{#if isMin}}<a href="#" class="ui-range-slider-min-btn ui-range-slider-handler"><span class="hide"></span></a>{{/if}}' + 
                    '<a href="#" class="ui-range-slider-max-btn ui-range-slider-handler"><span class="hide"></span></a>'
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
            
            try {
                if (core.isString(self.options.values)) {
                    self.valuesArr = JSON.parse(self.options.values);
                    console.log(self.options.values);
                } else {
                    self.valuesArr = self.options.values || [];
                }
            } catch (e){
                self.valuesArr = [];    
            }                                       
            
            var rangeArr = self.options.range.toString().split(',');
            if(self.valuesArr.length>0){
                self.minValue = self.valuesArr[0].value;
                self.maxValue = self.valuesArr[self.valuesArr.length-1].value; 
            }else{
                self.minValue = rangeArr[0]!=undefined? rangeArr[0] : 0;
                self.maxValue = rangeArr[1]!=undefined? rangeArr[1] : 100; 
            }

            var inputArr = self.options.input.toString().split(',');            
            self.startValue = inputArr[0]!=undefined? inputArr[0] : self.minValue;
            self.endValue = inputArr[1]!=undefined? inputArr[1] : self.maxValue;   
            
            var isOne = (inputArr.length==1)? true : false;
            if(isOne) self.endValue = self.startValue; 
            
            if(!core.isNumber(parseFloat(self.startValue)) && !core.isNumber(parseFloat(self.endValue))){
                self.$minInput = $(self.startValue);
                self.startValue = self.$minInput.val();  
                self.$maxInput = $(self.endValue);
                self.endValue = self.$maxInput.val();   
                if(self.startValue && self.endValue){
                    isOne = false;
                }else{
                    if(self.startValue){
                        self.endValue = self.startValue; 
                        self.$maxInput = self.$minInput;
                    } 
                    isOne = true;
                }          
            }                          

            self.$el.addClass('ui-range-slider');
            self.$el.append(self.templated.contents({list:self.valuesArr, isMin:!isOne}));
            self.updateSelectors();
            
            if(self.endValue - self.startValue < 0) self.endValue = self.maxValue;
            self.isSnap = self.valuesArr.length > 0? true : false;  
            self.$el.css('-webkit-tap-highlight-color','rgba(0,0,0,0)');      
            
        },

        setValue:function(start,end){
            var self = this;
            
            var minVal = start;
            var maxVal = end;
            
            if(maxVal==undefined){
                minVal = self.minValue;
                maxVal = start;
            } 
            self._setValue(minVal,maxVal);
            self._syncInput();
            self.triggerHandler('rangeSliderchanged', [self.getValue()]);
            
        },


        _setValue:function(start, end){

            var self = this;
            var idx, sIdx, eIdx;
            var sMin = self._getDistance(start);  
            var sMax = self._getDistance(end);            

            sIdx = self._getSnapIndex(start);
            eIdx = self._getSnapIndex(end);

            if(self.valuesArr.length > 0 && sIdx == eIdx){

                if(self.valuesArr.length-1 > sIdx && sIdx > 0){
                    sMin = self._getDistance(self.valuesArr[sIdx-1].value);
                    sMax = self._getDistance(self.valuesArr[sIdx].value); 
                }else{
                    sMin = self._getDistance(self.valuesArr[0].value);
                    sMax = self._getDistance(self.valuesArr[0].value);
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
                self.triggerHandler('rangeSliderchanged', [self.getValue()]);
                
            });

            $(window).on('resizeend.'+self.cid, function (e){
                self.originValue = self.getValue();
                self._resize();
            });


            self.on('mousedown touchstart', '.ui-range-slider-handler', function(e) {

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
                            self.triggerHandler('rangeSliderchanged', [self.getValue()]);
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

            }).on('keydown', '.ui-range-slider-handler', function(e){

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

                self._move(self.valuesArr.length > 0? self._getDistance(self.valuesArr[idx].value) : idx, $btn);
                if(self.isSnap) self._snapMove($btn);
                self._syncInput();
                self.triggerHandler('rangeSliderchanged', [self.getValue()]);
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
                np = Math.abs(parseFloat(self.valuesArr[i].value) - parseFloat(value));                
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
            var output = self.valuesArr[idx].value;
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

                    if (target[0] == self.$btnMax[0]) sMax = self._getDistance(self.valuesArr[self._getSnapIndex(maxX) + 1].value);
                    else sMin = self._getDistance(self.valuesArr[self._getSnapIndex(minX) - 1].value);                   
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
            self.$bg.css({'width':self.rangeWidth, 'left':self.btnSize/2, 'top':st-bh});  
            self.$rangeBar.css({'top':st-bh}); 

            ht = self.$btnMin.height()/2;            
            self.$btnMin.css({'top':st - ht + bh});

            ht = self.$btnMax.height()/2;
            self.$btnMax.css({'top':st - ht + bh});
            
            self.$values.children().each(function (idx, item) {
                wd = $(item).width()/2;
                ht = $(item).height()/2;
                dt = self._getDistance(self.valuesArr[idx].value);
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
                'minValue': Math.round(((self.maxValue - self.minValue)/self.rangeWidth)*minX + parseFloat(self.minValue)),
                'maxValue': Math.round(((self.maxValue - self.minValue)/self.rangeWidth)*maxX + parseFloat(self.minValue))
            }
        },

	    
        update: function (dontTrigger) {

            var self = this;
            self._build();
            self._resize();
            self._syncInput();

            if(!dontTrigger){
                self.triggerHandler('rangeSliderchanged', [self.getValue()]);
            } 
        }
    });
    ///////////////////////////////////////////////////////////////////////////////////////

    if (typeof define === "function" && define.amd) {
        define([], function() {
            return RangeSlider;
        });
    }

})(jQuery, window[LIB_NAME]);