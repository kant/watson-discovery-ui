/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

// Variables and functions needed by both server and client code

// how many items will we show per page
const ITEMS_PER_PAGE = 7;

// query types
const QUERY_NATURAL_LANGUAGE = 0;
const QUERY_DISCO_LANGUAGE = 1;

// the index of the fillter item in the aggrgation data returned 
// from the discovery query
const ENTITY_DATA_INDEX = 0;
const CATEGORY_DATA_INDEX = 1;
const CONCEPT_DATA_INDEX = 2;
const KEYWORD_DATA_INDEX = 3;

// keys/values for menu items
const ENTITY_FILTER   = 'EN';
const CATEGORY_FILTER = 'CA';
const CONCEPT_FILTER  = 'CO';
const KEYWORD_FILTER  = 'KW';

const SENTIMENT_TERM_ITEM = 'All Terms';   // used to indicate no specific item is seleced
const TRENDING_TERM_ITEM = 'Select Term';  // used to indicate no specific item is seleced

// filter types and strings to use
const filterTypes = [
  { key: ENTITY_FILTER,   value: ENTITY_FILTER,   text: 'Entities'},
  { key: CATEGORY_FILTER, value: CATEGORY_FILTER, text: 'Categories'},
  { key: CONCEPT_FILTER,  value: CONCEPT_FILTER,  text: 'Concepts'},
  { key: KEYWORD_FILTER,  value: KEYWORD_FILTER,  text: 'Keywords'} ];

// sortBy is used as param to Discovery Service
// sortByInt is used to sort internally based on formatted data
const sortKeys = [
  { type: 'HIGHEST', 
    sortBy: '-result_metadata.score', 
    sortByInt: '-score',
    text: 'Highest Score' },
  { type: 'LOWEST', 
    sortBy: 'result_metadata.score', 
    sortByInt: 'score',
    text:  'Lowest Score' },
  { type: 'NEWEST', 
    sortBy: '-date', 
    sortByInt: '-date',
    text: 'Newest First' },
  { type: 'OLDEST', 
    sortBy: 'date', 
    sortByInt: 'date',
    text: 'Oldest First' },
  { type: 'BEST', 
    sortBy: '-enriched_text.sentiment.document.score', 
    sortByInt: '-sentimentScore',
    text: 'Highest Rated' },
  { type: 'WORST', 
    sortBy: 'enriched_text.sentiment.document.score', 
    sortByInt: 'sentimentScore',
    text: 'Lowest Rated' }
];

// sort types and strings to use for drop-down
const sortTypes = [];
sortKeys.forEach(function(item) {
  sortTypes.push({key: item.type, value: item.sortBy, text: item.text});
});  

/**
 * objectWithoutProperties - clear out unneded properties from object.
 * object: object to scan
 * properties: items in object to remove
 */
const objectWithoutProperties = (object, properties) => {
  'use strict';

  var obj = {};
  var keys = Object.keys(object);
  keys.forEach(key => {
    if (properties.indexOf(key) < 0) {
      // keep this since it is not found in list of unneeded properties
      obj[key] = object[key];
    }
  });

  return obj;
};
  
/**
 * parseData - convert raw search results into collection of matching results.
 */
const parseData = data => ({
  rawResponse: Object.assign({}, data),
  // sentiment: data.aggregations[0].results.reduce((accumulator, result) =>
  //   Object.assign(accumulator, { [result.key]: result.matching_results }), {}),
  results: data.results
});

/**
 * formatData - format search results into items we can process easier. This includes
 * only keeping fields we show in the UI, and only keep 'passages', if specified.
 */
function formatData(data, passages) {
  var formattedData = {};
  var newResults = [];

  data.results.forEach(function(dataItem) {
    // only keep the data we show
    var newResult = {
      id: dataItem.id,
      title: dataItem.title,
      text: dataItem.text,
      date: dataItem.date,
      score: dataItem.result_metadata.score,
      sentimentScore: dataItem.enriched_text.sentiment.document.score,
      sentimentLabel: dataItem.enriched_text.sentiment.document.label,
      hasPassage: false,
      passageField: '',
      passageScore: '0'
    };

    var addResult = true;
    if (passages.results) {
      addResult = false;  // only add if associated passage is found
      for (var i=0; i<passages.results.length; i++) {
        var res = passages.results[i];
        if (res.document_id === dataItem.id) {
          newResult.hasPassage = true;
          newResult.passageStart = res.start_offset;
          newResult.passageEnd = res.end_offset;
          newResult.passageField = res.field;
          newResult.passageScore = res.passage_score;
          addResult = true;
          break;
        }
      }
    }

    if (addResult) {
      newResults.push(newResult);
    }
  });

  formattedData.results = newResults;
  console.log('Formatting Data: size = ' + newResults.length);
  return formattedData;
}

/**
 * getTotals - add up sentiment types from all result items.
 */
function getTotals(data) {
  var totals = {
    numPositive: 0,
    numNegative: 0,
    numNeutral: 0
  };

  data.results.forEach(function (result) {
    if (result.sentimentLabel === 'positive') {
      totals.numPositive = totals.numPositive + 1;
    } else if (result.sentimentLabel === 'negative') {
      totals.numNegative = totals.numNegative + 1;
    } else if (result.sentimentLabel === 'neutral') {
      totals.numNeutral = totals.numNeutral + 1;
    }
  });

  // console.log('numMatches: ' + data.matching_results);
  // console.log('numPositive: ' + totals.numPositive);
  // console.log('numNegative: ' + totals.numNegative);
  // console.log('numNeutral: ' + totals.numNeutral);

  return totals;
}

module.exports = {
  objectWithoutProperties,
  parseData,
  formatData,
  getTotals,
  ITEMS_PER_PAGE,
  QUERY_NATURAL_LANGUAGE,
  QUERY_DISCO_LANGUAGE,
  ENTITY_DATA_INDEX,
  CATEGORY_DATA_INDEX,
  CONCEPT_DATA_INDEX,
  KEYWORD_DATA_INDEX,
  ENTITY_FILTER,
  CATEGORY_FILTER,
  CONCEPT_FILTER,
  KEYWORD_FILTER,
  SENTIMENT_TERM_ITEM,
  TRENDING_TERM_ITEM,
  sortKeys,
  filterTypes,
  sortTypes
};
