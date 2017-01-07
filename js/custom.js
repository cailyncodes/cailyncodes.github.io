(function ($) {
    // Init Wow
    wow = new WOW({
        animateClass: 'animated',
        offset:       100
    });
    wow.init();
    
    // Navigation scrolls
    $('.navbar-nav li a').bind('click', function (event) {
        $('.navbar-nav li').removeClass('active');
        $(this).closest('li').addClass('active');
        var $anchor = $(this), nav = $($anchor.attr('href'));
        if (nav.length) {
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top
            }, 1500, 'easeInOutExpo');

            event.preventDefault();
        }
    });
    
    $('a.page-scroll').bind('click', function (event) {
        $('.navbar-nav li').removeClass('active');
        $('.navbar-nav li').next().first().addClass('active');
        var $anchor = $(this), nav = $($anchor.attr('href'));
        if (nav.length) {
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top
            }, 1500, 'easeInOutExpo');

            event.preventDefault();
        }
    });
    
    
    //jQuery to collapse the navbar on scroll
    $(window).scroll(function () {
        var offset = $("h3.title").offset().top;
        if ($(".navbar-default").offset().top > 50 && $(".navbar-default").offset().top <= offset + 25) {
            $(".navbar-fixed-top").addClass("top-nav-collapse");
            $(".navbar-brand").addClass("hidden");
        } else if ($(".navbar-default").offset().top > offset + 25) {
            $(".navbar-fixed-top").addClass("top-nav-collapse");
            $(".navbar-brand").removeClass("hidden");
        } else {
            $(".navbar-fixed-top").removeClass("top-nav-collapse");
            $(".navbar-brand").addClass("hidden");
        }
        
    });
    
})(jQuery);