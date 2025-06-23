
import { testCases } from "./test-inputs.js";
import TnThai from "tnthai";
import { segmentsToWordMetrics } from "./segmenterUtils.js";
import { annotateLineBreakingWithSeparators, applySegmentationRules } from "./ruleEngine.js";
import ruleEngine from "./rules/ruleConfigs.js";

const analyzer = new TnThai();

function segmentText(text, locale = "en") {
  if (locale === "th") {
    const result = analyzer.segmenting(text);
    return result.solution.map((word, idx) => ({
      segment: word,
      index:
        text.indexOf(
          word,
          idx > 0
            ? text.indexOf(result.solution[idx - 1]) +
              result.solution[idx - 1].length
            : 0
        ),
      isWordLike: true,
    }));
  } else {
    const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
    return [...segmenter.segment(text)];
  }
}

console.log("\n Intl.Segmenter + Rule-aware Segmentation POC\n");

testCases.forEach(({ locale, text }) => {
  const segments = segmentText(text, locale);
  const rulesConfig = ruleEngine[locale] || {};

  // // Annotate line breaking opportunities dynamically
  // const lineBreakingAnnotations = annotateLineBreaking(segments, rulesConfig);

  // // Generate WordMetrics with dynamic lineBreaking info
  // const wordMetricsArray = segmentsToWordMetrics(
  //   segments,
  //   text,
  //   lineBreakingAnnotations
  // );

  const lineBreakingAnnotations = annotateLineBreakingWithSeparators(segments, rulesConfig);
  let wordMetricsArray = segmentsToWordMetrics(
   segments,
   text,
   lineBreakingAnnotations
  );
  wordMetricsArray = annotateLineBreakingWithSeparators(wordMetricsArray, rulesConfig);

  console.log(`Locale: ${locale}`);
  console.log(`Input: ${text}`);
  console.log(JSON.stringify(wordMetricsArray, null, 2));

  
  console.log("\nSegments:");
  console.log(wordMetricsArray.map(w => `'${w.text}'`).join(" | "));

 
  if (rulesConfig.rules && typeof applySegmentationRules === "function") {
    const violations = applySegmentationRules(
      wordMetricsArray, rulesConfig
    );
    if (violations.length > 0) {
      console.log("\nForbidden Breaks Detected:");
      violations.forEach(([i, example, reason]) => {
        console.log(`  ✘ ${example} → ${reason}`);
      });
    } else {
      console.log("\nNo forbidden breaks detected.");
    }
  }

  console.log("\n--------------------------\n");
});
