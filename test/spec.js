var combine = require('../index.js');
var _ = require('lodash');
//require('seedrandom')('Hello, World!', {global: true});

describe('make sure lists are being combine property', function() {
  it("should handle arrays of objects", function()
  {
    expect(combine([{id: "foo"}], [{id: "bar"}])).toEqual([{id: "bar"}, {id: "foo"}]);
    expect(combine(["a"], [{id: "bar"}])).toEqual([{id: "bar"}, "a"]);
    expect(combine([1,2], [{id: "bar"}])).toEqual([{id: "bar"},1,2]);
  });

  it('should handle empty arrays', function() {
    expect(combine([], [])).toEqual([]);
    expect(combine([1, 2, 3], [])).toEqual([1, 2, 3]);
    expect(combine([], [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('should handle disjoint lists', function() {
    var merged = combine([1, 2], [3]);
    expect(merged.length).toEqual(3);
    expect(merged.indexOf(1)).toBeLessThan(merged.indexOf(2));
    var merged = combine([3], [1, 2]);
    expect(merged.length).toEqual(3);
    expect(merged.indexOf(1)).toBeLessThan(merged.indexOf(2));
  });

  it('should remove duplicates', function() {
    expect(combine([1, 2], [1])).toEqual([1, 2]);
    expect(combine([1, 2], [2])).toEqual([1, 2]);
    expect(combine([1], [1, 2])).toEqual([1, 2]);
    expect(combine([2], [1, 2])).toEqual([1, 2]);
    expect(combine([1, 2, 3], [2])).toEqual([1, 2, 3]);
    expect(combine([1, 2], [2, 3])).toEqual([1, 2, 3]);
  });

  it('should preserve order of both lists when possible', function() {
    expect(combine([1, 2], [2, 3])).toEqual([1, 2, 3]);
    expect(combine([2, 3], [1, 2])).toEqual([1, 2, 3]);
    expect(combine([1, 2], [1, 3])[0]).toEqual(1);
    expect(combine([1, 3], [1, 2])[0]).toEqual(1);
    expect(combine([1, 3], [2, 3])[2]).toEqual(3);
    expect(combine([2, 3], [1, 3])[2]).toEqual(3);
  });

  it('should prioritize the order of first list', function() {
    expect(combine([1, 2], [2, 1])).toEqual([1, 2]);
    expect(combine([2, 1], [1, 2])).toEqual([2, 1]);
    expect(combine([1, 2, 3], [3, 1])).toEqual([1, 2, 3]);
    var merged = combine([3, 1], [1, 2, 3]);
    expect(merged.indexOf(3)).toBeLessThan(merged.indexOf(1));
  });

  it('should partially preserve order of second list', function() {
    expect(combine([1, 2, 3], [3, 2, 4])).toEqual([1, 2, 3, 4]);
    expect(combine([1, 2, 4, 5], [2, 1, 3, 5, 4])).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle randomized tests', function() {
    var NUM_TESTS = 20;
    var AVG_LIST_LENGTH = 50;
    var DENSITY = 0.3;

    var INTS = _.range(Math.ceil(AVG_LIST_LENGTH/DENSITY));
    var suffle = function(list, start, end) {
      for (var i = start; i < end; i++) {
        var swapTo = i + Math.floor((end - i)*Math.random());
        if (swapTo != i) {
          // Don't try this at home kids, I'm a professional code magician
          list[i] ^= list[swapTo] ^= list[i];
          list[swapTo] ^= list[i];
        }
      }
    };

    for (var n = 0; n < NUM_TESTS; n++) {
      // Make first list
      var list1_filter = INTS.map(function() {
        return Math.random() < DENSITY;
      });
      var list1 = INTS.filter(function(val, i) {
        return list1_filter[i];
      });

      // Pick points for second list
      var list2_filter = INTS.map(function() {
        return Math.random() < DENSITY;
      });
      // Pick points where order of list2 does not conflict with order of list1
      var list2_consistent_filter = list2_filter.map(function(in_list2) {
        return in_list2 && Math.random() < DENSITY;
      });
      // Make the second list
      var list2 = INTS.filter(function(val, i) {
        return list2_filter[i];
      });
      var suffleStart;
      for (var i = 0; i <= list2.length; i++) {
        var val = list2[i];
        if (list2_consistent_filter[val]) {
          if(suffleStart !== undefined) {
            suffle(list2, suffleStart, i);
            suffleStart = undefined;
          }
        } else if (suffleStart === undefined) {
          suffleStart = i;
        }
      }

      // Check the results
      var merged = combine(list1, list2);
      expect(merged.filter(function(val) {
        return list1_filter[val];
      })).toEqual(list1);
      expect(merged.filter(function(val) {
        return list2_filter[val];
      }).map(function(val) {
        return list2_consistent_filter[val] ? val : null;
      })).toEqual(list2.map(function(val) {
        return list2_consistent_filter[val] ? val : null;
      }));
    }
  });
});
