/*
 * picaviz
 *
 *
 * Copyright (c) 2014 Jan Graßegger
 * Licensed under the MIT license.
 */

/* globals console */
(function ($) {

    var self = this;

    this.activeSource = 'all';

    $.picaviz = {
        _sortSources : function(sources){
            var sourceValues = [];
            $.each(sources, function(i, sourceValue){
                sourceValues.push(sourceValue);
            });


            sourceValues.sort(function(source1, source2){
                var pos1 = source1.pos;
                var pos2 = source2.pos;
                return pos1 === pos2 ? 0 : (pos1 < pos2 ? -1 : 1);
            });

            var newSources = {};
            $.each(sourceValues, function(j, sourceValue){
                newSources[sourceValue.id] = sourceValue;
            });

            return newSources;
        },
        _parseSources : function(model){
            var sources = {};
            var numSources = 0;
            var numReferences = 0;
            var totalHeight = 1;   // Where is this value from?  Could be arbitrary
            var maxPage = 0;


            // referenzen werden in quellen gruppiert
            // QUESTION: go for each data? Does data means reference ?

            /*
             * iterate over all reference and and generate source representatives for visualization
             */

            $.each(model, function(i, reference) {

                numReferences++;

                maxPage = Math.max(reference.passage.start, maxPage);

                // Creating sources
                // If source object does not exist create it
                // otherwise push a new reference to the existing source object
                var sourceId = reference.source.id;

                if(sources[sourceId] === undefined){
                    sources[sourceId] = {
                        references: [reference],
                        id : sourceId,
                        title: reference.source.title
                    };
                    numSources++;
                }
                else{
                    sources[sourceId].references.push(reference);
                }
            });
            /*
             * set constraints
             * originally there was a
             *  do
             *    tryout values
             *  while (abstandQuellen < 7*heightReferences)
             *    loop
             *  to find out values
             *
             */
            var heightReferences = 0.075;  // fullfils  whyever  // originally
                // Where does this value come from.
            var abstandQuellen = (totalHeight)/(numReferences - numSources * heightReferences);
            /*
             * Sources Crossing Minimization averagely
             */
            var referenceComparator = function(reference1, reference2){
                var start1 = reference1.passage.start;
                var start2 = reference2.passage.start;
                return start1 === start2 ? 0 : (start1 < start2 ? -1 : 1);
            };

            for(var sourceName in sources){
                var source = sources[sourceName];
                var references = source.references;
                var sumPos = 0;

                for(var i in references){
                    var reference = references[i];
                    sumPos += (reference.passage.start / maxPage) * totalHeight;
                }

                source.pos =  sumPos / references.length;   // ????
                //source.pos = sumPos;
                source.height = heightReferences * references.length;
                // source.range = source.height /2 + abstandQuellen/2;
                source.references.sort(referenceComparator);
                sources[sourceName] = source;
            }

            /*
             * Final Position Assignment
             */
            sources = $.picaviz._sortSources(sources);
            self.heightReferences = heightReferences;
            self.abstandQuellen = abstandQuellen;

            return sources;
        },
        _getDataArrayWithSourceIds : function(sources){
            var array = [];
            var referencePosition = 0;

            for(var j in sources){
                var counter = 0;
                var sourceReferences = sources[j].references;

                for(var k in sourceReferences){
                    var sourceReference = sourceReferences[k];

                    if(counter !== 0) { referencePosition += self.heightReferences; }
                    else if(counter === 0) { sources[j].start = referencePosition; }

                    if(counter === sourceReferences.length -1) { sources[j].stop = referencePosition; }

                    sourceReference.sourceid = counter++;
                    sourceReference.posSource = referencePosition;
                    sourceReference.pos = sources[j].pos;
                    array.push(sourceReference);
                }
                referencePosition += self.abstandQuellen;
            }
            return array;
        },
        // _getStrokeWidth(finding)
        _getStrokeWidth : function(){
            /*var start = self.y[self.layers[0]](finding.passage.start);
            var end = self.y[self.layers[0]](finding.passage.end);
            return end -start;*/
            return 1;
        },
        _createSvgPath : function(reference) {

            //console.log("d: "  + reference["Length"] + " : " + reference["posQuelle"] );

            var data = self.layers.map(function(layer) {
                        return [self.x(layer), self.y[layer](reference[layer])]; //
            });

    //        console.log("reference[\"Length\"] : " + reference["Length"]
    //                  + "   self.y[\"Length\"](reference[\"Length\"]) :"
    //                  + self.y["Length"](reference["Length"]));

            var turn = [data[1][0]/2, data[0][1]-((data[0][1]-data[1][1])/2)];
            data.splice(1,0,turn);
            // make splines
            return 'M'+data[0][0]+', '+data[0][1]+
                'Q'+data[1][0]/2+','+data[0][1]+','+data[1][0]+','+data[1][1]+
                'Q'+data[1][0]*1.5+','+data[2][1]+','+data[2][0]+','+data[2][1];
        },
        _render : function(el, model, settings){
            var $el = $(el).empty();
            self.el = el;
            self.$el = $el;

            self.layers = ['pos', 'posSource'];
            self.m = [20, 160, 20, 34];
            self.w = 650 - self.m[1] - self.m[3];


            var windowHeight = $(window).height();
            self.h = windowHeight - self.m[0] - self.m[2];

            var svg = d3.select($el[0]).append('svg:svg')
                .attr('width', self.w + self.m[1] + self.m[3])
                .attr('height', self.h + self.m[0] + self.m[2])
                .append('svg:g')
                .attr('transform', 'translate(' + self.m[3] + ',' + self.m[0] + ')');

            self.x = d3.scale.ordinal().domain(self.layers).rangePoints([0, self.w]);
            self.y = {};

            //this.line = d3.svg.line(); // necessary
            var axis = d3.svg.axis().orient('left');

            /*
             *  ------------------------------------------------------------------------------
             */
            var sources = $.picaviz._parseSources(model);
            var referenceArray = $.picaviz._getDataArrayWithSourceIds(sources);

              // Create a scale and brush for every layer.
              self.layers.forEach(function(layer) {
                if(layer !== 'pos'){
                    self.y[layer] = d3.scale.linear()
                    //.domain([model.minSources, model.maxSources])
                    //.domain([0, 100])
                    .range([0,self.h]);
                }else{
                    self.y[layer] = d3.scale.linear()
                    .domain([0, model.length])// d3.extend gives the max and min value of a given array
                    .range([0,self.h]);
                }


                self.y[layer].brush = d3.svg.brush()
                    .y(self.y[layer])
                    .on('brush', $.picaviz._brush)
                    .on('brushend', $.picaviz._brushend);
             });

              // Add foreground curves.
              self.foreground = svg.append('svg:g')
                  .attr('class', 'foreground')
                  .selectAll('path')
                  .data(referenceArray)
                .enter().append('svg:path')
                  .attr('d', $.picaviz._createSvgPath)
                  //.attr("stroke-width", 0.5)
                  .attr('stroke-width', $.picaviz._getStrokeWidth);
                  //.attr("class", function(d) { return d.Kategorie.toLowerCase(); });


              // Add a group element for each layers.
              var g = svg.selectAll('.trait')
                  .data(self.layers)
                  .enter().append('svg:g')
                  .attr('class', function(d){ return 'trait '+d; })
                  .attr('transform', function(d) { return 'translate(' + self.x(d) + ')'; });

              // Add an axis and title.
              g.append('svg:g')
                  .attr('class', 'axis')
                  .each(function(d) { d3.select(this).call(axis.scale(self.y[d]).orient('left')); })
                .append('svg:text')
                  .attr('text-anchor', 'middle')
                  .attr('y', -9)
                  .text(function(d){
                    if(d === 'posSource') { return settings.sourcesLabel; }
                    if(d === 'pos') { return settings.passagesLabel; }
                    //if(d == "pos") return "";
                    return d;
                  });

              // Add a brush for each axis.
              g.append('svg:g')
                  .attr('class', 'brush')
                  .each(function(d) { d3.select(this).call(self.y[d].brush); })
                .selectAll('rect')
                  .attr('x', -8)
                  .attr('width', 16);



              //gruppen mit Quellen
             var yQuellen = self.y['posSource'];

             self.gSources = svg.selectAll('.posSource');
            $.each(sources, function(){
                var source = this;
                var ystart = yQuellen(source.start);
                var ystop = yQuellen(source.stop);
                var height = Math.abs(ystop-ystart);

                var gSource = self.gSources.append('svg:g')
                    .attr('class', 'group');

                $(gSource[0]).data('source', source);
                    //.click(self.selectSource);

                gSource.append('svg:rect')
                    .attr('height', height)
                    .attr('x', 0)
                    .attr('y', ystart)
                    .attr('width', 7);

                if(model.length*3 < windowHeight || height > 5){

                    //var finding = {sourceId : source.name, sourceTimestamp : source.timestamp};
                    var title = source.title;
                    if(title && title.length >= 25) { title = title.substring(0,22) + '...'; }

                    var text = gSource.append('svg:text')
                        .attr('class', 'groupLabel')
                        .attr('x', 0)
                        .attr('text-anchor', 'left')
                        .attr('y', ystart)
                        .attr('width', 100)
                        .attr('height', 200)
                        .text(title);
                    var $text = $(text[0]);
                    //var width = $(text[0]).width();
                    $text.attr('x', 8);

                    var textHeight = $text.height();
                    $text.attr('y', function(){
                        var y = Number($(this).attr('y'));
                        return Math.min(y + (height/2 + textHeight/2),
                            y+height);
                    });
                }
            });
        },
        _brush : function() {
            var activeRefs = [];
            var activeSource = self.activeSource;

            var actives = self.layers.filter(function(p) { return !self.y[p].brush.empty(); }),
                  extents = actives.map(function(p) { return self.y[p].brush.extent(); });

            self.foreground.classed('fade', function(d) {
                if(activeSource !== 'all' && d.source.id !== activeSource) { return true; }

                var active = !actives.every(function(p, i) {
                  return extents[i][0] <= d[p] && d[p] <= extents[i][1];
                });
                if(!active) { activeRefs.push(d.id); }

                return active;
            });
            return activeRefs;
        },
        /**
        * Called at the end of a filter action. Calls brush and sets active references
        * to be filtered
        */
        _brushend : function(){
            var activeRefs = $.picaviz._brush();
            self.$el.trigger('change', [activeRefs]);
            self.$el.trigger('change:activeRefs', [activeRefs]);
        },
        _selectSource : function(){
            var $target = $(event.target);
            var $group = $target.parent();
            var source = $group.data('source');

            self.activeSource = self.activeSource === source.id ? 'all' : source.id;
            $.picaviz._brushend();
        }
    };


    $.fn.picaviz = function(model, options){
        return this.each(function(){
            if(!model) {
                console.error('no model defined');
                return;
            }

            var settings = {
                sourcesLabel : 'sources',
                passagesLabel: 'passages'
            };

            if(options) { $.extend(settings, options); }
            $.picaviz._render(this, model, settings);
            $(this).on('click', '.group', $.picaviz._selectSource);

            //console.log($.picaviz._getDataArrayWithSourceIds(model));


        });
    };
}(jQuery));
