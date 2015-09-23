// ==UserScript==
// @name           NB SG filter
// @namespace      http://github.com/oubeichen/
// @version        1.0
// @description    filter non-bundle games in steamgifts.com
// @downloadURL    https://raw.githubusercontent.com/oubeichen/sgtools/master/NBSGFilter.user.js
// @include        http://www.steamgifts.com/*
// @match          http://www.steamgifts.com/*
// @copyright      2015, oubeichen
// ==/UserScript==

function wrapper() {

window.nbsgft = function() {};

window.nbsgft.filter = [];
// Key for localStorage
window.nbsgft.KEY_FILTER = 'nbsgft-filter';

// Toggle class 'nbsgft-hide' on entry to contorl hide or show
window.nbsgft.runFilter = function() {
  $('div.giveaway__row-inner-wrap').each(function() {
    var appid = $(this).find('div.giveaway__summary > h2.giveaway__heading > a.giveaway__icon').first().attr("href").substring(30);
    var isHide = nbsgft.filter.indexOf(appid) !== -1;
    $(this).toggleClass('nbsgft-hide', isHide);
  });
}

function MaskIt(obj){
   var hoverdiv = '<div class="divMask" style="position: absolute; width: 100%; height: 100%; left: 0px; top: 0px; background: #fff; opacity: 0; filter: alpha(opacity=0);z-index:5;"></div>';
   $(obj).wrap('<div class="position:relative;"></div>');
   $(obj).before(hoverdiv);
   $(obj).data("mask",true);
}
function UnMaskIt(obj){
   if($(obj).data("mask")==true){
       $(obj).parent().find(".divMask").remove();
       $(obj).unwrap();
       $(obj).data("mask",false);
   }
   $(obj).data("mask",false);
}

window.nbsgft.reloadBundleGames = function() {
   $('.nbsgft-reload')[0].innerHTML = 'Reloading...';
   MaskIt($('.nbsgft-reload'));
   var filter = [];
   var count = 1;
   var maxcount = 153;
   var xhr ;
   var url ;
   
   var max_bundle_games = parseInt($('.pagination__results').find('strong').eq(2).html().replace(/,/g,''));
   console.log(max_bundle_games);
   maxcount = Math.floor(max_bundle_games / 25) + 1;
   
   var ExecuteRequest = function(){
       $('.nbsgft-reload')[0].innerHTML = 'Reload ' + count + '/' + maxcount;
       url = 'http://www.steamgifts.com/bundle-games/search?page=' + count;
	   xhr = $.get(url,function(data,status){
			 var doms = $.parseHTML( data );
			 $(doms).find('.table__column__secondary-link').each(function() {
				 var appid = $(this).html().substring(30);
				 var index = filter.indexOf(appid);
					
				 if(index === -1) {
					filter.push(appid);
				 }
			 });
			 if(count >= maxcount){
			    nbsgft.storeLocal(nbsgft.KEY_FILTER, filter);
			    $('.nbsgft-reload')[0].innerHTML = 'Reload finished';
				UnMaskIt($('.nbsgft-reload'));
			 } else {
			    count++;
			    ExecuteRequest();
			 }
	   });
   }
   setTimeout( ExecuteRequest, 1500 );
   
}

window.nbsgft.addCSS = function() {
  $("<style>")
    .attr("type", "text/css")
    .html("\
      .nbsgft-hide {\
        padding: 1px 0;\
      }\
      .nbsgft-hide .giveaway__summary {\
        display: none;\
      }\
      .nbsgft-hide a {\
        display: none;\
      }\
      .nbsgft-hide .nbsgft-unhide-link {\
        display: block;\
      }\
      .nbsgft-hide .nbsgft-unhide-link {\
        display: block;\
      }\
      .nbsgft-hide-link {\
        color: #c9cdcf;\
        padding: 0 5px;\
        cursor: pointer;\
      }\
      .nbsgft-unhide-link {\
        display: none;\
        font-size: x-small;\
        color: #999d9f;\
        cursor: pointer;\
      }\
    ")
    .appendTo("head");
}

window.nbsgft.attachEvents = function() {
  // Add link and run filter after list of game updated
  $('.page__inner-wrap').ajaxComplete(function() {
    nbsgft.addLinks();
    nbsgft.runFilter();
  });
  
  // Event for adding filter
  $('.page__inner-wrap').delegate('.nbsgft-hide-link', 'click.sgHide', function(e) {
    nbsgft.addFilter(String($(this).data('title')));
  });
  
  // Event for removing filter
  $('.page__inner-wrap').delegate('.nbsgft-unhide-link', 'click.sgUnhide', function(e) {
    nbsgft.removeFilter(String($(this).data('title')));
  });
  
  // Event for reload bundle games
  $('.nav__left-container').delegate('.nbsgft-reload', 'click.sgReload', function(e) {
    nbsgft.reloadBundleGames();
  });
}

window.nbsgft.addLinks = function() {
  // Add 'Hide' link
  $('div.giveaway__row-inner-wrap > div.giveaway__summary > h2.giveaway__heading').each(function() {
    if($(this).children('.nbsgft-hide-link').length === 0) {
      var appid = $(this).children('a.giveaway__icon').first().attr("href").substring(30);
      $(this).append('<span class="nbsgft-hide-link" data-title="' + appid + '">Hide</span>');
    }
  });
  
  // Add 'Unhide' link
  $('div.giveaway__row-inner-wrap').each(function() {
    if($(this).children('.nbsgft-unhide-link').length === 0) {
      var appid = $(this).find('div.giveaway__summary > h2.giveaway__heading > a.giveaway__icon').first().attr("href").substring(30);
     var title = $(this).find('div.giveaway__summary > h2.giveaway__heading > a').first().html();
      $(this).append('<div class="nbsgft-unhide-link" data-title="' + appid + '">' + title + ' (Click to unhide)</div>');
    }
  });
  
  // Add 'Reload Bundle Games' link
  if(window.location.href.indexOf("bundle-games") != -1){
     $('div.nav__left-container').append('\
     <div class="nav__button-container">\
      <span class="nav__button nbsgft-reload">Reload Bundle Games</span>\
     </div>\
     ');
  }
}

// Call by 'Hide' link
window.nbsgft.addFilter = function(name) {
  var index = nbsgft.filter.indexOf(name);
  if(index === -1) {
    nbsgft.filter.push(name);
    nbsgft.storeLocal(nbsgft.KEY_FILTER, nbsgft.filter);
    nbsgft.runFilter();
  }
}

// Call by 'Unhide' link
window.nbsgft.removeFilter = function(name) {
  var index = nbsgft.filter.indexOf(name);
  if(index !== -1) {
    nbsgft.filter.splice(index, 1);
    nbsgft.storeLocal(nbsgft.KEY_FILTER, nbsgft.filter);
    nbsgft.runFilter();
  }
}

// Store data to localStorage
window.nbsgft.storeLocal = function(key, data) {
  if(typeof(data) !== 'undefined' && data !== null) {
    localStorage[key] = JSON.stringify(data);
  } else {
    localStorage.removeItem(key);
  }
}

// Local data from localStorage
window.nbsgft.loadLocal = function(key) {
  var objectJSON = localStorage[key];
  if(!objectJSON) return null;
  return JSON.parse(objectJSON);
}

// Decode html entities such as &amp; to actual character
window.nbsgft.htmlDecode = function(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

var setup = function() {
  nbsgft.filter = nbsgft.loadLocal(nbsgft.KEY_FILTER) || [];
  nbsgft.addCSS();
  nbsgft.attachEvents();
  nbsgft.addLinks();
  nbsgft.runFilter();
}

setup();

} // wrapper end

// Inject script into page
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
