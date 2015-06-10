eg.module("persist", [jQuery, window, document], function($, global, doc){
	"use strict";
	/**
	* Support persist event in jQuery
	* @ko jQuery custom persist 이벤트 지원
	* @name jQuery#persist
	* @event
	* @param {Event} e event <ko>이벤트 객체</ko>
	* @param {Object} e.state state info to be restored <ko>복원되어야 하는 상태의 정보</ko>
	* @example
	$(window).on("persist",function(e){
		// restore state
		if(e.state.flickingPage)
			oSlideFlicking.moveTo(e.state.flickingPage);
		
		if(e.state.scrollTop)
			document.scrollTo(e.state.scrollTop);
	});
	*/
	var wp = global.performance,
	history = global.history,
	location = global.location,
	JSON = global.JSON,
	
	isBackForwardNavigated = (wp && wp.navigation && (wp.navigation.type === wp.navigation.TYPE_BACK_FORWARD)),
	isPersisted,
	hasReplaceState = "replaceState" in history,
	hasStateProperty = "state" in history;
	

	/*
	 * If page is persisted(bfCache hit) return true else return false.
	 */
	isPersisted = function(e) {
		var _isPersisted;
		if(e !== undefined) {
			_isPersisted = !!e.persisted;
			isPersisted = function() {
				return _isPersisted;
			};
			return _isPersisted;
		}	
	};
	
	function onPageshow(e) {
		if(!isPersisted(e.originalEvent) && isBackForwardNavigated) {
			$(global).trigger("persist");
		} else {
			reset();
		}
	}

	 
	/*
	 * flush current history state
	 */

	function reset() {
		setState(null);
	}

	function clone(state) {
		return (state === null) ? null : $.extend(true, {}, state);
	}

	/*
	 * Getter for state
	 */	
	function getState() {
		if(hasStateProperty && hasReplaceState) {
			return clone(history.state);
		} else {
			var stateStr = sessionStorage.getItem("persist");
			if(stateStr) {
				if(stateStr === "null") {
					return null;	
				} else {
					return JSON.parse(stateStr);
				}
			}	
			return undefined;			
		}		
	}
	
	/*
	 * Setter for state
	 */
	function setState(state) {
		if(hasStateProperty && hasReplaceState) {
			history.replaceState(state, doc.title, location.href);
		} else {
			if((state && typeof state === "object") || state === null) {
				sessionStorage.setItem("persist", JSON.stringify(state));
			}
		}	
	}
	
	/**
	* Saves state and returns current state.
	* @ko 인자로 넘긴 현재 상태정보를 저장하고, 저장되어있는 현재 상태 객체를 반환한다.
	* @method jQuery.persist
    * @param {Object} state State object to be stored in order to restore UI component's state <ko>UI 컴포넌트의 상태를 복원하기위해 저장하려는 상태 객체</ko>
	* @return {Object} state Stored state object <ko>복원을 위해 저장되어있는 상태 객체</ko>
	* @example
	$("a").on("click",function(e){
		e.preventdefault()	
		// get state
		var state = $.persist();
		
		// update state
		state.scrollTop = document.scrollTop;
		
		// save state
		$.persist(state);
		
		location.href = this.attr("href");
	});
	*/
	$.persist = function(state) {
		if(state) {
			setState(state);
		}			
		return getState();
	};

	/**
	* Restore state with callback function
	* @ko 인자로 받은 상태복원함수에 상태객체를 인자로 전달하여 호출한다.
	* @method jQuery.restore
    * @param {Function} state state info to be restored
	* @example
	$.restore(
		$.proxy(function(state) {
			if( state && state.newsList ) {
				this.oFlicker.goto(state.newsList.pageIndex);
			}
		}, this)
	);
	*/
	$.restore = function(callback) {
		callback(this._getState());
	};
		
	$.event.special.persist = {
		setup: function() {
			$(global).on("pageshow", onPageshow);
		},
		teardown: function() {
			$(global).off("pageshow", onPageshow);
		},
		trigger: function(e) {
			e.state = clone(history.state);
		}
	};
	
	return {
		"isPersisted": isPersisted,
		"isBackForwardNavigated": isBackForwardNavigated,
		"onPageshow": onPageshow,
		"reset": reset,
		"clone": clone,
		"getState": getState,
		"setState": setState,
		"persist": $.persist
	};
});