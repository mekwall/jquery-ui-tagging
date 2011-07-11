(function($){

    $.widget("ui.tagging", {
        // default options
        options: {
            source: [],
            maxItemDisplay: 3,
            autosize: true,
            animateResize: false,
            animateDuration: 50
        },
        _create: function() {
            var self = this;
            
            this.activeSearch = false;
            this.searchTerm = "";
            this.beginFrom = 0;

            this.wrapper = $("<div>")
                .addClass("ui-tagging-wrap");
            
            this.highlight = $("<div></div>");
            
            this.highlightWrapper = $("<span></span>")
            	.width(this.element.width())
                .addClass("ui-corner-all");

            this.highlightContainer = $("<div>")
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
            
            var initialHeight = this.element.height();
            
            this.element.height(this.element.css('lineHeight'));
            
            this.element.keypress(function(e) {
                // activate on @
                if (e.which == 64 && !self.activeSearch) {
                    self.activeSearch = true;
                    self.beginFrom = e.target.selectionStart + 1;
                }
                // deactivate on space
                if (e.which == 32 && self.activeSearch) {
                    self.activeSearch = false;
                }
            }).bind("expand keyup", function(e) {
                var cur = self.highlight.find("span"),
                    val = self.element.val(),
                    prevHeight = self.element.height(),
                    rowHeight = self.element.css('lineHeight'),
                    newHeight = 0;
            	spans = {}    
                cur.each(function(i) {
                    var s = $(this);
                    if (!(s.text() in spans)) {
                    	val = val.replace(new RegExp(s.text(), 'g'), $("<div>").append(s).html());
                    	spans[s.text()] = 1;
                	}
                });
                self.highlight.html(val);
                newHeight = self.element.height(rowHeight)[0].scrollHeight;
                self.element.height(prevHeight);
                if (newHeight < initialHeight) {
                    newHeight = initialHeight;
                }
                if (!$.browser.mozilla) {
                    if (self.element.css('paddingBottom') || self.element.css('paddingTop')) {
                        var padInt =
                            parseInt(self.element.css('paddingBottom').replace('px', '')) +
                            parseInt(self.element.css('paddingTop').replace('px', ''));
                        newHeight -= padInt;
                    }
                }
                self.options.animateResize ?
                    self.element.stop(true, true).animate({
                            height: newHeight
                        }, self.options.animateDuration) :
                    self.element.height(newHeight);
                
                var widget = self.element.autocomplete("widget");
                    widget.position({
                        my: "left top",
                        at: "left bottom",
                        of: self.container
                    }).width(self.container.width()-4);
                                        
            }).autocomplete({
                minLength: 0,
                delay: 0,
                maxDisplay: this.options.maxItemDisplay,
                open: function(event, ui) {
                    var widget = $(this).autocomplete("widget");
                    widget.position({
                        my: "left top",
                        at: "left bottom",
                        of: self.container
                    }).width(self.container.width()-4);
                },
                source: function(request, response) {
                    if (self.activeSearch) {
                        self.searchTerm = request.term.substring(self.beginFrom);
                        if (request.term.substring(self.beginFrom - 1, self.beginFrom) != "@") {
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
                    // prevent value inserted on focus
                    return false;
                },
                select: function(event, ui) {
                    self.activeSearch = false;
                    this.value = this.value.replace("@" + self.searchTerm, ui.item.label) + ' ';
                    self.highlight.html(
                        self.highlight.html()
                            .replace("@" + self.searchTerm,
                                     $("<div>").append(
                                         self.highlightWrapper
                                             .text(ui.item.label)
                                             .clone()
                                     ).html()+' ')
                    );     
                    self.meta.val((self.meta.val() + " @[" + ui.item.value + ":" + ui.item.label +"]").trim());
                    return false;
                }
            });

        }
    });

})(jQuery);
