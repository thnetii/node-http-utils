module.exports = {
  /**
   * @param {string} text
   * @param {{
   *  includeTrivia?: boolean;
   * } | undefined} [options]
   */
  parse(text, options) {
    const tokenRegexp = /(?<lead_ws>\s*)(?<token>[^"=,;\s]+)(?<trail_ws>\s*)/uy;
    const quoteRegexp =
      /(?<lead_ws>\s*)(?<pre_quote>")(?<content>(?:[^\\"]+|\\.)*)(?<end_quote>")(?<trail_ws>\s*)/uy;
    // const aposRegexp =
    //   /(?<lead_ws>\s*)(?<pre_quote>')(?<content>(?:[^\\']+|\\.)*)(?<end_quote>')(?<trail_ws>\s*)/uy;
    const equRegexp = /(?<lead_ws>\s*)(?<eq>=)(?<trail_ws>\s*)/uy;
    const sepRegexp = /(?<lead_ws>\s*)(?<sep>[,;]+)(?<trail_ws>\s*)/uy;
    const contentRegexp =
      /(?<lit>[^\\"]+)|(?:(?<esc>\\)(?:(?<seq>["\\/bfnrt])|(?<uni>u)(?<hex>[a-f0-9]{2,4})|(?<char>.)))/iuy;

    const state = { lastIndex: 0 };

    /**
     * @param {string} content
     */
    const parseQuotedContentWithTrivia = (content) => {
      /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairQuotedSegmentTrivia[]} */
      const contentTrivia = [];
      if (typeof content !== 'string')
        return {
          value: /** @type {string} */ (/** @type {unknown} */ (undefined)),
          contentTrivia,
        };

      let value = '';

      contentRegexp.lastIndex = 0;
      for (
        let match = contentRegexp.exec(content);
        match?.groups;
        match = contentRegexp.exec(content)
      ) {
        const { lit, esc, seq, uni, hex, char } = match.groups;
        if (typeof lit !== 'undefined') {
          value += lit;
          contentTrivia.push({ literal: lit });
        } else if (typeof esc !== 'undefined') {
          let escValue;
          if (typeof seq !== 'undefined') {
            try {
              escValue += JSON.parse(`"\\${seq}"`);
              value += escValue;
              contentTrivia.push({
                escape: '\\',
                sequence:
                  /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairWellKnownEscapeSequence} */ (
                    seq
                  ),
              });
            } catch {
              escValue = esc + seq;
              value += escValue;
              contentTrivia.push({ literal: escValue });
            }
          } else if (typeof uni !== 'undefined' && typeof hex !== 'undefined') {
            const hexNum = parseInt(hex, 16);
            escValue = String.fromCharCode(hexNum);
            value += escValue;
            contentTrivia.push({
              escape: '\\',
              char: escValue,
              charCode: hexNum,
            });
          } else if (typeof char !== 'undefined') {
            value += char;
            contentTrivia.push({ escape: '\\', char });
          }
        }
      }

      return { value, contentTrivia };
    };

    const parseKeyOrValue = () => {
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
        let contentSegments;
        try {
          value = JSON.parse(`"${content}"`);
        } catch {
          const { value: quotedValue, contentTrivia } =
            parseQuotedContentWithTrivia(content || '');
          value = quotedValue;
          contentSegments = contentTrivia;
        }
        /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairListQuotedNode<'"'>} */
        const node = { type: 'quoted', value };
        if (options?.includeTrivia) {
          contentSegments =
            typeof contentSegments !== 'undefined'
              ? contentSegments
              : parseQuotedContentWithTrivia(content || '').contentTrivia;
          node.trivia = {
            leadingWhitespace: leadWs,
            trailingWhitespace: trailWs,
            preQuote: /** @type {'"'} */ (preQuote) || '"',
            endQuote: /** @type {'"'} */ (endQuote) || '"',
            segments: contentSegments,
          };
        }

        return node;
      }
      return undefined;
    };

    const parseInfixSeparator = () => {
      equRegexp.lastIndex = state.lastIndex;
      const match = equRegexp.exec(text);
      if (!match?.groups) return undefined;
      state.lastIndex = equRegexp.lastIndex;
      const { lead_ws: leadWs, eq, trail_ws: trailWs } = match.groups;
      /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairListInfixSeparatorNode} */
      const node = {
        type: 'infixSeparator',
        value:
          /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairListInfixSeparatorNode['value']} */ (
            eq
          ),
      };
      if (options?.includeTrivia) {
        node.trivia = {
          leadingWhitespace: leadWs,
          separator: /** @type {string} */ (eq),
          trailingWhitespace: trailWs,
        };
      }
      return node;
    };

    const parseItemSeparator = () => {
      sepRegexp.lastIndex = state.lastIndex;
      const match = sepRegexp.exec(text);
      if (!match?.groups) return undefined;
      state.lastIndex = sepRegexp.lastIndex;
      const { lead_ws: leadWs, sep, trail_ws: trailWs } = match.groups;
      /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairListItemSeparatorNode} */
      const node = {
        type: 'itemSeparator',
        value:
          /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairListInfixSeparatorNode['value']} */ (
            sep
          ),
      };
      if (options?.includeTrivia) {
        node.trivia = {
          leadingWhitespace: leadWs,
          separator: /** @type {string} */ (sep),
          trailingWhitespace: trailWs,
        };
      }
      return node;
    };

    /** @returns {import('./typings/keyValuePairList').HttpHeaderKeyValuePairListItemSemantic | undefined} */
    const parseKeyValuePair = () => {
      let valueNode = parseKeyOrValue();
      if (typeof valueNode === 'undefined') return undefined;
      /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairListItemSemantic} */
      let semantic;
      const infixNode = parseInfixSeparator();
      if (typeof infixNode !== 'undefined') {
        const keyNode = valueNode;
        valueNode = parseKeyOrValue();
        semantic = { key: keyNode, equals: infixNode, value: valueNode };
      } else semantic = { value: valueNode };
      const itemSeparator = parseItemSeparator();
      if (itemSeparator) semantic.trailingSeparator = itemSeparator;
      return semantic;
    };

    /** @type {import('./typings/keyValuePairList').HttpHeaderKeyValuePairListItemSemantic[]} */
    const list = [];
    for (
      let item = parseKeyValuePair();
      typeof item !== 'undefined';
      item = parseKeyValuePair()
    ) {
      list.push(item);
    }

    if (list.length) return list;
    return undefined;
  },
};
