
var onScroll;

// Scroll
$(window).scroll(function(){
	// Top button
	var btnTop = $(".move_top span").offset().top;
	var botFixed = $(document).height() - 70;
	
	if ( btnTop > botFixed) {
		$("aside.other_conts").addClass("on");
	} else {
		$("aside.other_conts").removeClass("on");
	};

	onScroll = true;
});

$(document).ready(function() {
	// Sidebar
	onScroll = true;
	
	setInterval(function() { 
		if (onScroll) { 
			$(".btn_sidebar").addClass('on');
			onScroll = false; 
		} else {
			$(".btn_sidebar").removeClass('on');
		}
	}, 500);
	
	$('.btn_sidebar').on('swiperight', function(e) { 
		$("#sidebar").addClass("open");
		$(".sidebar_dim").fadeIn();
	});
	$('.btn_sidebar').on('swipeleft', function(e) { 
		$("#sidebar").removeClass("open");
		$(".sidebar_dim").fadeOut();
	});

	$("#sidebar li.depth ul li a").on('click', function() {
		$(this).parent().addClass('on').siblings().removeClass('on');
	});
	
	// All Nav
	//$(".nav_all_wrap").load("/tdd/html/include/nav_all.html");

	$(".btn_nav_all").on('click', function() {
		$(this).toggleClass('on');
		$("html").toggleClass('hidden');
		$(".nav_all_wrap").toggleClass('open');
		$(".sidebar_dim").toggleClass('open');
	});

	$(".btn_sidebar").on('click', function() {
		$("#sidebar").toggleClass('open');
		$("html").toggleClass('hidden');
		$(".sidebar_dim").fadeToggle();
	});
	$(".sidebar_dim").on('click', function() {
		$("#sidebar").removeClass('open');
		$("html").removeClass('hidden');
		$(".sidebar_dim").fadeOut();
	});
	
	// Top button
	var duration = 500;

	$('.move_top').click(function(event) {
		event.preventDefault();
		jQuery('html, body').animate({scrollTop: 0}, duration);
		return false;
	});

	// Resize
	$(window).resize(resizeContents);
});

// Nav resize
function resizeContents() {
	var navWidth = 0;
	var navEl = $('#header .nav > ul > li');

	if ( $(window).width() < 768 )
	{
		// Mobile Nav width size
		navEl.each(function(){
			navWidth = navWidth + $(this)[0].getBoundingClientRect().width;
		});
		$('#header .nav > ul').css('width', Math.ceil(navWidth)); // 소수점 올림적용
		
		// Sidebar
		$("#sidebar > ul > li.depth > a").unbind('click');
		$("#sidebar > ul > li.depth > a").on('click', function() {
			$(this).parent().toggleClass('on');
			return false;
		});
	} else {
		$('#header .nav > ul').css('width', 'auto');

		// Sidebar
		$("#sidebar > ul > li.depth > a").unbind('click');
		$("#sidebar > ul > li.depth > a").on('click', function() {
			$(this).parent().toggleClass('on').siblings().removeClass('on');
			return false;
		});
	}
}

window.onload = function() {
	resizeContents();
};





