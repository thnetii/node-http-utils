module.exports = {
  /**
   * @param {string} text
   * @param {{
   *  disallowQuotedKeys?: boolean;
   *  includeTrivia?: boolean;
   * } | undefined} [options]
   */
  parse(text, options) {
    const tokenRegexp = /(?<lead_ws>\s*)(?<token>[^"=,;\s]+)(?<trail_ws>\s*)/uy;
    const quoteRegexp =
      /(?<lead_ws>\s*)(?<pre_quote>")(?<content>(?:[^\\"]+|\\.)*)(?<end_quote>")(?<trail_ws>\s*)/uy;
    const aposRegexp =
      /(?<lead_ws>\s*)(?<pre_quote>')(?<content>(?:[^\\']+|\\.)*)(?<end_quote>')(?<trail_ws>\s*)/uy;
    const equRegexp = /(?<lead_ws>\s*)(?<eq>=)(?<trail_ws>\s*)/uy;
    const sepRegexp = /(?<lead_ws>\s*)(?<sep>[,;]+)(?<trail_ws>\s*)/uy;
    const contentRegexp =
      /(?<lit>[^\\"]+)|(?:(?<esc>\\)(?:(?<seq>["\\/bfnrt])|(?<uni>u)(?<hex>[a-f0-9]{2,4})))/giu;

    const state = { lastIndex: 0 };

    const parseKey = () => {
      tokenRegexp.lastIndex = state.lastIndex;
      let match = tokenRegexp.exec(text);
      if (match?.groups) {
        state.lastIndex = tokenRegexp.lastIndex;
        const {
          lead_ws: leadWs,
          token,
          trail_ws: trailWs,
        } = /** @type {{token: string} & RegExpMatchArray['groups']} */ (
          match.groups
        );
        /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairListTokenNode} */
        const node = {
          type: 'token',
          value: /** @type {string} */ (token),
        };
        if (options?.includeTrivia)
          node.trivia = {
            leadingWhitespace: leadWs,
            token,
            trailingWhitespace: trailWs,
          };
        return node;
      }
      if (options?.disallowQuotedKeys) return undefined;
      quoteRegexp.lastIndex = state.lastIndex;
      match = quoteRegexp.exec(text);
      if (match?.groups) {
        state.lastIndex = quoteRegexp.lastIndex;
        const {
          lead_ws: leadWs,
          pre_quote: preQuote,
          content,
          end_quote: endQuote,
          trail_ws: trailWs,
        } = match.groups;
        let value;
        try {
          value = JSON.parse(`"${content}"`);
        } catch {
          // Do nothing
        }
        if (typeof value === 'undefined') {
          match = contentRegexp.exec(content || '');

        }
      }
      return undefined;
    };
  },
};
