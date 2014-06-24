(function($){
    $.widget("ui.tagging", {
        options: {
            source: [],
            maxItemDisplay: 3,
            token: "@",
            onResize : function(){},
            animate : true,
            animateDuration : 150,
            animateCallback : function(){},
            extraSpace : 20,
            limit: 1000
        },
        props:"vertical-align" +			                     
	          " direction" +
	          " font-size-adjust" +
	    	  " font-size" +
	    	  " font-stretch" +
			  " font-style" +
			  " font-family" +
			  " font-variant" +
			  " font-weight" +
			  " letter-spacing" +
			  " word-spacing" +
			  " line-height" +
			  " text-align" +
			  " text-transform" +
			  " text-decoration",
        _createAutoResize: function() {
        	var self = this;
        	var textarea = this.element.css({resize:'none','overflow-y':'hidden'}),
                origHeight = textarea.height(),                
                clone = (function(){
                	 var propOb = {};
                    $.each((self.props + "height width").split(" "), function(i, prop){
                        propOb[prop] = textarea.css(prop);
                    });
                    return textarea.clone().removeAttr('id').removeAttr('name').css({
                        position: 'absolute',
                        top: 0,
                        left: -9999
                    }).css(propOb).attr('tabIndex','-1').insertBefore(textarea);
                })(),
                lastScrollTop = null,
                updateSize = function() {
					clone.height(0).val(self.element.val()).scrollTop(10000);
                    var scrollTop = Math.max(clone.scrollTop(), origHeight) + self.options.extraSpace,
                        toChange = self.element.add(clone);	
                    if (lastScrollTop === scrollTop) { return; }
                    lastScrollTop = scrollTop;
					if ( scrollTop >= self.options.limit ) {
                        self.elemnt.css('overflow-y','');
                        return;
                    }
                    self.options.onResize.call(self.element);
					self.options.animate && textarea.css('display') === 'block' ?
                        toChange.stop().animate({height:scrollTop}, self.options.animateDuration, self.options.animateCallback)
                        : toChange.height(scrollTop);
                };
            textarea
                .bind('keyup', updateSize)
                .bind('keydown', updateSize)
                .bind('change', updateSize);
            
	        },
        _createAutoComplete: function() {
            var self = this;
            
            this.marks = {};
            this.activeSearch = false;
            this.searchTerm = "";
            this.beginFrom = 0;
            
            this.wrapper = $("<div>")
                .addClass("ui-tagging-wrap");
            
            this.highlight = $("<span></span>");
            var css = {};
            $.each(self.props.split(" "), function(i, prop){
            	css[prop] = self.element.css(prop);
            });
            this.highlight.css(css);
            
	        this.highlightWrapper = $("<mark></mark>")
            	.addClass("ui-corner-all");
            
            this.highlightContainer = $("<div>")
            	.css({paddingLeft: '1px'})
            	.width(this.element.width()-1)
                .addClass("ui-tagging-highlight")
                .append(this.highlight);
            
            this.meta = $("<input>")
                .attr("type", "hidden")
                .addClass("ui-tagging-meta");
            
            this.container = $("<div></div>")
                .width(this.element.width())
                .insertBefore(this.element)
                .addClass("ui-tagging")
                .append(
                    this.highlightContainer,
                    this.element.wrap(this.wrapper).parent(),
                    this.meta
                );
                
            this.element.keypress(function(e) {
                // activate on token
                if (e.which == self.options.token.charCodeAt() && !self.activeSearch) {
                    self.activeSearch = true;
                    self.beginFrom = e.target.selectionStart + 1;
                }
                // deactivate on space(32) or escape(0 or 27)
                if ((e.which == 32 || e.which == 27 || e.which == 0) && self.activeSearch) {
                	self.activeSearch = false;
                    self.element.autocomplete("close");
                }
            });
            
            this.element.bind("expand keydown keyup change", function(e) {
                var val = self.element.val();
                for (mark in self.marks) {
                	val = val.replace(new RegExp(mark, 'g'), self.marks[mark]);
                }
                self.highlight.html(val);                                      
            });
            
            this.element.autocomplete({
            	autoFocus: true,
                minLength: 0,
                delay: 0,
                maxDisplay: this.options.maxItemDisplay,
                position : { my: "left top", at: "left bottom", of: self.container },
                source: function(request, response) {
                    if (self.activeSearch) {
                        self.searchTerm = request.term.substring(self.beginFrom);
                        if (request.term.substring(self.beginFrom - 1, self.beginFrom) != self.options.token) {
                            self.activeSearch = false;
                            self.beginFrom = 0;
                            self.searchTerm = "";
                        }
                        if (self.searchTerm != "") {
                            if ($.type(self.options.source) == "function") {
                                self.options.source(request, response);                   
                            } else {
                                var re = new RegExp("^" + escape(self.searchTerm) + ".+", "i");
                                var matches = [];
                                $.each(self.options.source, function() {
                                    if (this.label.match(re)) {
                                        matches.push(this);
                                    }
                                });
                                response(matches);
                            }
                        }
                    }
                },
                focus: function() {
                    return false;
                },
                select: function(event, ui) {
                    self.activeSearch = false;
                    this.value = this.value.replace(self.options.token + self.searchTerm, ui.item.label) + ' ';
                    self.marks[ui.item.label] =  $("<div>").append(self.highlightWrapper
                    												   .text(ui.item.label)
                                                                       .clone()).html();
                    self.highlight.html(
                        self.highlight.html()
                            .replace(self.options.token + self.searchTerm, self.marks[ui.item.label] + ' ' )
                    );     
                    self.meta.val((self.meta.val() + " " + self.options.token + "[" + ui.item.value + ":" + ui.item.label +"]").trim());
                    return false;
                }
            });
        },
        _create: function() {
        	if (this.element[0].nodeName.toLowerCase() != "textarea" && this.element.data('ui.tagging') != undefined) return;
        	this.element.data('ui.tagging', true);
        	this._createAutoComplete();
        	this._createAutoResize();
        }
    });
})(jQuery);
