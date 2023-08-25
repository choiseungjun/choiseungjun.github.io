PR.prettyPrint();

$(document).on('click', '.tab-nav a', function (e) {
    e.preventDefault();

    var $links = $(this).closest('.tab-nav').find('a');
    $links.each(function () {
        $(this.getAttribute('href')).removeClass('active');
    });
    $(this).parent().addClass('active').siblings().removeClass('active');
    $(this.getAttribute('href')).addClass('active');
}).on('click', '.demo-list a', function (e) {
    var a = $(e.currentTarget);
    var href = a.attr('href');
    var detailLink = href.replace('.', '_source.');

    $.ajax({
        url: detailLink
    }).done(function (html) {
        $('#tabcontent_01').html(html);
        a.parent().addClass('on').siblings().removeClass('on');
        PR.prettyPrint();
    });
});

$.ajax({
    url: 'api.html'
}).done(function (html) {
    $('#tabcontent_02').html(html);
});

$('.demo-list a:first').click();