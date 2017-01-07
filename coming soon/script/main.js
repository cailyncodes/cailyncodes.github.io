$(document).ready(function() {
  // scroll settings
  $('body').smoothScroll({
    delegateSelector: 'nav a',
    speed: 'auto',
    autoCoefficient: 2.5,
    easing: 'swing'
  });
});
