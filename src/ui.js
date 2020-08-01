import { _, it, lift } from 'param.macro';
import { Draggable, Sortable } from '@shopify/draggable';

/**
 * The last seen word-bank answer.
 *
 * @type {Element|null}
 */
let lastWordBankAnswer = null;

/**
 * @param {string} word A button label.
 * @returns {string} The word contained in the label.
 */
function cleanButtonWord(word) {
  return word.trim().replace(/^\d+\s+/, '');
}

// Poll for new word-bank answers and adapt them as necessary.
setInterval(() => {
  const newWordBankAnswer = document.querySelector(ANSWER_SELECTOR);

  if (newWordBankAnswer !== lastWordBankAnswer) {
    lastWordBankAnswer = newWordBankAnswer;

    if (!lastWordBankAnswer) {
      return;
    }

    const sortable = new Sortable(lastWordBankAnswer, {
      draggable: DRAGGABLE_WORD_BUTTON_SELECTOR,
      distance: 5,
    });

    sortable.removePlugin(Draggable.Plugins.Mirror);

    sortable.on('sortable:stop', event => {
      const wordBankSource = document.querySelector(SOURCE_SELECTOR);

      if (!wordBankSource) {
        return;
      }

      const answerWordButtons = Array.from(lastWordBankAnswer.querySelectorAll(WORD_BUTTON_SELECTOR));

      const sortedWords = answerWordButtons.map(button => {
        // Trigger the word removal.
        button.click();
        return button.matches('.draggable--original') ? '' : cleanButtonWord(button.innerText);
      }).filter(it.length > 0);

      if (answerWordButtons.some(it.matches(CORRECT_WORD_SELECTOR))) {
        // Sometimes words aren't removed, instead the answer is directly validated. Leave it alone in that case.
        return;
      }

      // Sometimes the "draggable" plugin does not clean everything up.
      while (lastWordBankAnswer.firstChild) {
        lastWordBankAnswer.removeChild(lastWordBankAnswer.firstChild);
      }

      // The "draggable" plugin will attempt to move an element we have removed - make sure that it won't fail.
      const fakeSourceWrapper = document.createElement('div');
      fakeSourceWrapper.appendChild(event.dragEvent.source);

      const sourceButtons = Array.from(wordBankSource.querySelectorAll(WORD_BUTTON_SELECTOR));

      // Add the words back, in the right order.
      sourceButtons
        .map(button => {
          const index = sortedWords.indexOf(cleanButtonWord(button.innerText));

          if (index >= 0) {
            // Do not reuse a same word button twice.
            sortedWords[index] = null;
          }

          return [ index, button ];
        })
        .filter(it[0] >= 0)
        .sort(lift(_[0] - _[0]))
        .forEach(it[1].click());
    });
  }
}, 50);

/**
 * A CSS selector for word-bank answers.
 *
 * @type {string}
 */
const ANSWER_SELECTOR = '.word-box-response';

/**
 * A CSS selector for sources of words.
 *
 * @type {string}
 */
const SOURCE_SELECTOR = '.word-box-choice';

/**
 * A CSS selector for word tokens.
 *
 * @type {string}
 */
const WORD_BUTTON_SELECTOR = '.word.btn';

/**
 * A CSS selector for correct word tokens.
 *
 * @type {string}
 */
const CORRECT_WORD_SELECTOR = '.correct';

/**
 * A CSS selector for word buttons in word-bank answers.
 *
 * @type {string}
 */
const DRAGGABLE_WORD_BUTTON_SELECTOR = `${ANSWER_SELECTOR} ${WORD_BUTTON_SELECTOR}:not(${CORRECT_WORD_SELECTOR})`;
