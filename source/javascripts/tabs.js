function showTab(tab) {
  var accordionTabs = $('.tabs');
  accordionTabs.find('.is-open').removeClass('is-open').hide();

  $(accordionTabs).next().toggleClass('is-open').toggle();
  accordionTabs.find('.is-active').removeClass('is-active');
  $(accordionTabs).addClass('is-active');
}
