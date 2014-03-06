/*
 * picaviz
 *
 *
 * Copyright (c) 2014 Jan Graßegger
 * Licensed under the MIT license.
 */

(function ($) {
/** @module */

  /**
   * @class  View that holds the parallel coordinate visualization
   */
  var ParallelView = Backbone.View.extend(
  /** @lends ParallelView.prototype */
  {
    el    :"#parallelView",
    events  : {
      "click .toggle" : "toggleMargin"
    },
    layers  :[],    //former trait

    /**
    * Called on object construction. Binds events and calls render()
    */
    initialize : function(){
      var references = this.model;
      this.layers = ["pos", "posQuelle"];

      _.bindAll(this, "brush","brushend", "brushSources", "getStrokeWidth",
        "selectSource", "render", "checkSize", "createSvgPath", "renderPagesAlongSources");

          //Backbone.event_aggregator.bind("redrawParallelView", this.render);
          this.listenTo(this.model, "reset", this.render);
      this.listenTo(this.model.activeRefs, "change", this.brush);
      this.listenTo(this.model, "change:activeSource", this.brushSources);

      // references.bind("change:", this.brush);

      $(window).resize(this.render);
      $(window).resize(this.checkSize);

      this.$el.html( parallelViewTemplate );

      // fix: click event was triggered multiple times. Maybe could be done more elegant
      //self.$el.off("click", ".toggle").on("click", ".toggle", function(){self.toggleMargin.call(self);});
      this.checkSize();
      this.render();
    },
    /**
    * Paints the view. Called on startup and if window is resizes.
    * Heavy use of d3.js
    */
      render : function (){
        this.$(".toggle").removeClass("open");
          this.renderPagesAlongSources();
          //this.renderCategoriesAlongSources();
      },

    renderPagesAlongSources : function(){

          this.checkSize();

          var self = this;
      var references = this.model;
          var $coordinates = this.$("#coordinates").empty();
        // Clear coordinates  div

          this.layers = ["pos", "posQuelle"];

      this.m = [20, 160, 20, 34];
      this.w = 650 - this.m[1] - this.m[3];
      var windowHeight = $(window).height();
      this.h = windowHeight - this.m[0] - this.m[2];

          var svg = d3.select($coordinates[0]).append("svg:svg")
              .attr("width", this.w + this.m[1] + this.m[3])
              .attr("height", this.h + this.m[0] + this.m[2])
              .append("svg:g")
              .attr("transform", "translate(" + this.m[3] + "," + this.m[0] + ")");

      this.x = d3.scale.ordinal().domain(this.layers).rangePoints([0, this.w]);
        this.y = {};

        //this.line = d3.svg.line(); // necessary
      var axis = d3.svg.axis().orient("left");



          /*
           *  ------------------------------------------------------------------------------
           */

      var referenceArray = references.getDataArrayWithSourceIDs();

        // Create a scale and brush for every layer.
        this.layers.forEach(function(layer) {
          if(layer != "pos"){
            self.y[layer] = d3.scale.linear()
              .domain([self.model.minSources, self.model.maxSources])
              .range([0,self.h]);
          }else{
            self.y[layer] = d3.scale.linear()
              .domain([0, self.model.suspicious.length])// d3.extend gives the max and min value of a given array
              .range([0,self.h]);
          }


          self.y[layer].brush = d3.svg.brush()
              .y(self.y[layer])
              .on("brush", self.brush)
              .on("brushend", self.brushend);
       });

        // Add foreground curves.
        this.foreground = svg.append("svg:g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(referenceArray)
          .enter().append("svg:path")
            .attr("d", this.createSvgPath)
                //.attr("stroke-width", 0.5)
                .attr("stroke-width", this.getStrokeWidth)
            //.attr("class", function(d) { return d.Kategorie.toLowerCase(); });


        // Add a group element for each layers.
        var g = svg.selectAll(".trait")
            .data(this.layers)
            .enter().append("svg:g")
            .attr("class", function(d){return "trait "+d})
            .attr("transform", function(d) { return "translate(" + self.x(d) + ")"; });

        // Add an axis and title.
        g.append("svg:g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(axis.scale(self.y[d]).orient("left")); })
          .append("svg:text")
            .attr("text-anchor", "middle")
            .attr("y", -9)
            .text(function(d){
              if(d == "posQuelle") return "Quelle";
              if(d == "pos") return "Fundstellen";
              //if(d == "pos") return "";
              return d;
            });

        // Add a brush for each axis.
        g.append("svg:g")
            .attr("class", "brush")
            .each(function(d) { d3.select(this).call(self.y[d].brush); })
          .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);



        //gruppen mit Quellen
       var sources = references.sources;
       var yQuellen = self.y["posQuelle"];

       this.gSources = svg.selectAll(".posQuelle");
      _.each(sources, function(source){
        var ystart = yQuellen(source.start);
        var ystop = yQuellen(source.stop);
        var height = Math.abs(ystop-ystart);

        var gSource = self.gSources.append("svg:g")
          .attr("class", "group");

        $(gSource[0]).data("source", source);
          //.click(self.selectSource);

        var rect = gSource.append("svg:rect")
          .attr("height", height)
          .attr("x", 0)
          .attr("y", ystart)
          .attr("width", 7);

        if(references.length*3 < windowHeight || height > 5){

          var finding = new Finding({sourceId : source.name, sourceTimestamp : source.timestamp});

          $.when(finding.getSourceTitle()).then(function(title){
            if(name && name.length >= 25)
            name = name.substring(0,22)+"...";

            var text = gSource.append("svg:text")
              .attr("class", "groupLabel")
              .attr("x", 0)
              .attr("text-anchor", "left")
              .attr("y", ystart)
              .attr("width", 100)
              .attr("height", 200)
              .text(title);
            var $text = $(text[0]);
            var width = $(text[0]).width();
            $text.attr("x", 8);

            var textHeight = $text.height();
            $text.attr("y", function(){
              var y = Number($(this).attr("y"));
              return Math.min(y + (height/2 + textHeight/2),
                y+height);
            });
          });



        }
      });

      $(".group").click(this.selectSource);
    },
    /**
    * Fades out paths that aren't active. Returns active references.
    * Called every the references get changed or class filters are used.
    */
    brush : function() {
      var self  =this;
      var references = this.model;
      var activeRefs = [];
      var activeSource = references.activeSource;

          var actives = this.layers.filter(function(p) { return !self.y[p].brush.empty(); }),
            extents = actives.map(function(p) { return self.y[p].brush.extent(); });

          this.foreground.classed("fade", function(d) {
          if(activeSource != "all" && d.sourceId != activeSource) return true;

          var active = !actives.every(function(p, i) {
            return extents[i][0] <= d[p] && d[p] <= extents[i][1];
          });
          //if(!active) activeRefs.push(d.object.id);
          if(!active) activeRefs.push(d.id);

          return active;
        });
          //references.setActive(activeRefs);        // to slow    .setActive(...); seem to be no fast enough
      return activeRefs;
    },
    /**
    * Called at the end of a filter action. Calls brush and sets active references
    * to filtered
    */
    brushend : function(){
      var references = this.model;
      var activeRefs = this.brush();
      references.setActive(activeRefs);
    },
    /**
    * Called if active sources get changed. Fades out non active.
    */
    brushSources : function(event){
      var references = this.model;
      var activeSource = references.activeSource;

      this.gSources.selectAll(".group").classed("fade", function(d){
        var $this = $(this);
        var source = $this.data("source");

        if(activeSource != source.name && activeSource != "all")
          return true;

        return false;
      });

      this.brush();

    },
    /**
    * Returns the path for a given object d as string.
    * Does not use d3.js build in methods!
    * @return {String} path of d
    */
    createSvgPath: function(reference) {

          //console.log("d: "  + reference["Length"] + " : " + reference["posQuelle"] );

      var self = this;
        var data = this.layers.map(function(layer) {
                      return [self.x(layer), self.y[layer](reference[layer])]; //
          });

  //        console.log("reference[\"Length\"] : " + reference["Length"]
  //                  + "   self.y[\"Length\"](reference[\"Length\"]) :"
  //                  + self.y["Length"](reference["Length"]));

          var turn = [data[1][0]/2, data[0][1]-((data[0][1]-data[1][1])/2)];
      data.splice(1,0,turn);
      // make splines
      return "M"+data[0][0]+", "+data[0][1]+
          "Q"+data[1][0]/2+","+data[0][1]+","+data[1][0]+","+data[1][1]+
          "Q"+data[1][0]*1.5+","+data[2][1]+","+data[2][0]+","+data[2][1];
    },
    getStrokeWidth : function(finding){
      var start = this.y[this.layers[0]](finding["suspiciousStart"]);
      var end = this.y[this.layers[0]](finding["suspiciousEnd"]);
          return end -start;
    },
    /**
    * Triggered if a source is clicked. Sets clicked source active if not and otherwise.
    */
    selectSource : function(event){
      var $target = $(event.target);
      var references = this.model;
      var $group = $target.parent();
      var source = $group.data("source");

      references.setActiveSource(source.name);
    },
    /**
    * Called if window resizes. Checks if window size is wide enough to show or hide the view.
    */
    checkSize : function(){
      var windowWidth = $(window).width();
      var parallelWidth = this.$el.width();
      var contentWidth = $("#content").width();
      var contentMarginLeft = $("#content").css("marginLeft");
      contentMarginLeft =
        Number(contentMarginLeft.substring(0, contentMarginLeft.length -2));

      var newMargin = -590;
      if(windowWidth > parallelWidth + contentWidth +contentMarginLeft + 20){
        this.$(".toggle").hide();
        newMargin = 0;
      }else{
        this.$(".toggle").show();
      }

      this.$el.css({marginRight : newMargin});
    }

}(jQuery));
