// One table per language, keyed the same way. English is the reference: a
// key missing elsewhere falls back to it, and the tests refuse a language
// that lacks one.
import en from './en.js';
import de from './de.js';
import es from './es.js';
import pt from './pt.js';
import ru from './ru.js';
import ja from './ja.js';
import zh from './zh.js';
import hi from './hi.js';
import bn from './bn.js';
import ar from './ar.js';

export const messages = { en, de, es, pt, ru, ja, zh, hi, bn, ar };
