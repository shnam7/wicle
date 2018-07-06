/**
 *  Wicle scripts
 *
 *  @module Nav
 *
 */

import {Options} from "../core/types";
import {MQChangeEventData} from "../core/MediaQuery";

export type MQEventHandler = (nav:Nav, event:CustomEvent<MQChangeEventData>)=>void;

export interface NavOptions {
  speed?: number;
  showDelay?: number;
  hideDelay?: number;
  parentLink?: boolean;
  singleOpen?: boolean;
  breakPoint?: number;
  mqChangeToMobile?: MQEventHandler;
  mqChangeToNormal?: MQEventHandler;
}

class Nav {
  static defaultOptions: NavOptions = {
    speed: 200,
    showDelay: 0,
    hideDelay: 0,
    parentLink: false,
    singleOpen: false,
    breakPoint: 640,
    mqChangeToMobile: undefined,
    mqChangeToNormal: undefined,
  };

  protected static dynamicClasses = 'w-nav,w-nav-item,w-nav-item-wrapper'
    + 'w-nav-parent,w-nav-child,w-nav-divider'
    + 'aria-flip, aria-state-active';
  protected static dynamicElements = 'w-nav-parent-marker,w-nav-accordion-click-area';
  protected static mqStateChangedEventName = 'mqstatechanged';

  protected options: Options;
  protected element: Element;
  protected classes: string;

  // reset out-of-viewport status on window resize
  protected flipHandler = function (e: JQuery.Event) {
    $('.w-nav').find('[aria-flip]').removeAttr('aria-flip');
  };

  // detect and respond to media query changes
  protected mqChangeHandler = (e: CustomEvent<MQChangeEventData>) => {
    let width = e.detail.width;
    let prevWidth = e.detail.prevWidth;
    let breakPoint = this.options.breakPoint;
    if (this.classes.indexOf('wo-responsive') < 0) return;
    console.debug('mqChanged:', e.detail);

    if (width >= breakPoint && prevWidth < breakPoint) {
      console.log('state=', e.detail.state, 'chanjge to normal');
      if (this.options.mqChangeToNormal) this.options.mqChangeToNormal(this, e);
      // $(this.element).attr('class', this.classes);
    }
    if (width < breakPoint && prevWidth >= breakPoint) {
      console.log('state=', e.detail.state, 'change to mobile');
      if (this.options.mqChangeToMobile) this.options.mqChangeToMobile(this, e);
      // $(this.element).attr('class', 'wz-nav w-nav wo-accordion').show();
    }
  };

  // accordion click event handler
  protected accordionClickEventHandler = (e: JQuery.Event) => {
    e.stopPropagation();
    e.preventDefault();

    let opts = this.options;
    let $target = $(e.target);
    let href = $target.attr('href');

    // set target to w-nav-parent
    $target = $target.parent();

    let $sub = $target.children('.w-nav-child');
    let $subAll = $target.find('.w-nav-child');
    if ($sub.length > 0) {
      if ($sub.css("display") === "none") {
        $sub.slideDown(opts.speed).siblings("a").addClass('aria-state-active');
        if (opts.singleOpen) {
          $target.siblings().find('.w-nav-child').slideUp(opts.speed)
            .end().find("a").removeClass('aria-state-active');
        }
      }
      else {
        $subAll.delay(opts.hideDelay).slideUp(opts.speed)
          .siblings('a').removeClass('aria-state-active');
      }
    }
    if (opts.parentLink && href) window.location.href = href;
  };


  constructor(el: Element, options: Options = {}) {
    this.element = el;
    this.options = $.extend(true, {}, Nav.defaultOptions, options);
    this.create();
  }

  public create() {
    let $nav = $(this.element);
    $.data(this.element, 'w-nav', this);
    this.classes = $nav.attr('class');

    // set basic classes
    $nav.addClass('w-nav')
      .find('li').addClass('w-nav-item')
      .children('a,div').addClass('w-nav-item-wrapper');

    // set parent/child settings for multi-level menus
    $nav.filter('.wo-dropdown,.wo-default,.wo-accordion')
      .find('ul').addClass('w-nav-child') // set parent/child classes, add parent marker
      .parent().addClass('w-nav-parent');

    // $nav.filter(':not(.wo-icon)').find('.w-nav-parent')
    $nav.find('.w-nav-parent')
      .children('.w-nav-item-wrapper').each((idx, el) => {
      let $el = $(el);
      // Do not add parent-marker if wo-icon is set for the item
      if ($el.hasClass('wo-icon')) return;

      // Do not add top-level parent marker if wo-icon is set
      if ($el.parent().parent().hasClass('wo-icon')) return;

      if ($el.children('.w-nav-parent-marker').length === 0)
        $el.append('<span class="w-nav-parent-marker">');
    });

    //--- dropdown settings
    let $dropdown = $nav.filter('.wo-dropdown, .wo-default');

    // check divider items: item text only with '-' or unicode dashes or spaces
    $dropdown.find('.w-nav-item').each(function (index, el) {
      let $el = $(el);
      // if (!/[^\-\u2014\u2013\s]/.test($el.text())) $el.addClass('w-nav-divider');
      // text should starts with one or more dashes
      if (/^[\-\u2014\u2013]+/.test($el.text())) $el.addClass('w-nav-divider');
    });

    // check out-of-viewport status
    $dropdown.find('.w-nav-parent')
      .off('mouseenter').on('mouseenter', function () {
      let $sub = $(this).children('.w-nav-child');
      // check element position if it exceeds viewport
      // ref: http://stackoverflow.com/questions/8897289/how-to-check-if-an-element-is-off-screen
      // ref: http://stackoverflow.com/questions/1567327/using-jquery-to-get-elements-position-relative-to-viewport
      // ref: http://stackoverflow.com/questions/36175336/get-element-position-relative-to-top-of-the-viewport
      let rect = $sub.get(0).getBoundingClientRect();
      let flip = undefined;
      // window.innerWidth includes scrollbars. so, use document.body.clientWidth for horizontal check
      if (rect.right >= document.body.clientWidth) flip = 'x';
      if (rect.bottom >= window.innerHeight) flip += 'y';
      if (flip) $sub.attr('aria-flip', flip);
    });

    // accordion settings
    let $accordion = $nav.filter('.wo-accordion');
    // add accordion click area to avoid link activation
    $accordion.find('.w-nav-item-wrapper').each(function (idx, el) {
      let $el = $(el);
      if ($el.children('.w-nav-accordion-click-area').length === 0)
        $el.after($('<span class="w-nav-accordion-click-area"></span>'));
    });

    // check manually activated items
    $nav.find('.w-state-active').addClass('aria-state-active');

    // set event handlers
    $accordion.find('.w-nav-item-wrapper,.w-nav-accordion-click-area')
      .off('click', this.accordionClickEventHandler)
      .on('click', this.accordionClickEventHandler);

    $(window).off('resize', this.flipHandler).on('resize', this.flipHandler);

    if (this.options.mqChangeToNormal || this.options.mqChangeToMobile) {
      window.removeEventListener(Nav.mqStateChangedEventName, this.mqChangeHandler);
      window.addEventListener(Nav.mqStateChangedEventName, this.mqChangeHandler);
    }
  }

  public destroy() {
    let $nav = $(this.element);

    // remove dynamic elements
    $nav.find(Nav.dynamicElements).remove();

    // remove dynamic classes
    $nav.find(Nav.dynamicClasses).removeClass(Nav.dynamicClasses);

    // remove event handlers
    $(window).off('resize', this.flipHandler);
    window.removeEventListener(Nav.mqStateChangedEventName, this.mqChangeHandler);
    $nav.filter('.wo-accordion').find('.w-nav-parent,.w-nav-accordion-click-area').off('click');

    // remove nav object
    $.removeData(this.element, 'w-nav');
  }

  static start(selector: string, options: Options = {}) {
    $(selector).each(function (idx, el) {
      new Nav(el, options);
    });
  }
}

export default Nav;