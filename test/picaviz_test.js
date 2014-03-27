/* globals console */
(function($) {
    /*
        ======== A Handy Little QUnit Reference ========
        http://api.qunitjs.com/

        Test methods:
          module(name, {[setup][ ,teardown]})
          test(name, callback)
          expect(numberOfAssertions)
          stop(increment)
          start(decrement)
        Test assertions:
          ok(value, [message])
          equal(actual, expected, [message])
          notEqual(actual, expected, [message])
          deepEqual(actual, expected, [message])
          notDeepEqual(actual, expected, [message])
          strictEqual(actual, expected, [message])
          notStrictEqual(actual, expected, [message])
          throws(block, [expected], [message])
    */

    module('jQuery.picaviz._parseSources', {
        setup : function(){
            this.model = [
                {
                    source : {
                        id : 0,
                        title : 'test',
                        start : 1,
                        end : 2
                    },
                    passage : {
                        start : 3,
                        end : 5
                    }
                },
                {
                    source : {
                        id : 0,
                        title : 'test',
                        start : 3,
                        end : 6
                    },
                    passage : {
                        start : 5,
                        end : 6
                    }
                },
                {
                    source : {
                        id : 1,
                        title : 'test2',
                        start : 1,
                        end : 4
                    },
                    passage : {
                        start : 2,
                        end : 3
                    }
                }
            ];
        }
    });

    test('parse sources', function() {
        var sources = $.picaviz._parseSources(this.model);
        console.log(JSON.stringify(sources));
        strictEqual(Object.keys(sources).length, 2);
    });

    module('jQuery.picaviz._getDataArrayWithSourceIds', {
        setup : function() {
            this.model = [
                {
                    source : {
                        id : 0,
                        title : 'test',
                        start : 1,
                        end : 2
                    },
                    passage : {
                        start : 3,
                        end : 5
                    }
                },
                {
                    source : {
                        id : 0,
                        title : 'test',
                        start : 3,
                        end : 6
                    },
                    passage : {
                        start : 5,
                        end : 6
                    }
                },
                {
                    source : {
                        id : 1,
                        title : 'test2',
                        start : 1,
                        end : 4
                    },
                    passage : {
                        start : 2,
                        end : 3
                    }
                }
            ];
            this.sources = $.picaviz._parseSources(this.model);
        }
    });

    test('parse model', function() {
        //expect(2);
        var parsedModel = $.picaviz._getDataArrayWithSourceIds(this.sources);
        console.log(JSON.stringify(parsedModel));
        strictEqual(parsedModel.length, 3);
        //strictEqual($.awesome(), 'awesome.', 'should be awesome');
        //strictEqual($.awesome({punctuation: '!'}), 'awesome!', 'should be thoroughly awesome');
     });

  /*module(':awesome selector', {
    // This will run before each test in this module.
    setup: function() {
      this.elems = $('#qunit-fixture').children();
    }
  });

  test('is awesome', function() {
    expect(1);
    // Use deepEqual & .get() when comparing jQuery objects.
    deepEqual(this.elems.filter(':awesome').get(), this.elems.last().get(), 'knows awesome when it sees it');
  });*/

}(jQuery));
