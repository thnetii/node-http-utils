type HttpHeaderKeyValuePairListWhitespaceTrivia = {
  leadingWhitespace?: string;
  trailingWhitespace?: string;
};

type HttpHeaderKeyValuePairTokenTrivia = {
  token: string;
} & HttpHeaderKeyValuePairListWhitespaceTrivia;

type HttpHeaderKeyValuePairQuotedLiteralContentTrivia = {
  literal: string;
};

type HttpHeaderKeyValuePairQuotedEscapeBaseTrivia = {
  escape: '\\';
};

type HttpHeaderKeyValuePairWellKnownEscapeSequence =
  | '"'
  | "'"
  | '\\'
  | '/'
  | 'b'
  | 'f'
  | 'n'
  | 'r'
  | 't';

type HttpHeaderKeyValuePairQuotedEscapeSequenceTrivia = {
  sequence: HttpHeaderKeyValuePairWellKnownEscapeSequence;
} & HttpHeaderKeyValuePairQuotedEscapeBaseTrivia;

type HttpHeaderKeyValuePairQuotedEscapeCharTrivia = {
  char: string;
} & HttpHeaderKeyValuePairQuotedEscapeBaseTrivia;

type HttpHeaderKeyValuePairQuotedEscapeUnicodeTrivia = {
  charCode: number;
} & HttpHeaderKeyValuePairQuotedEscapeCharTrivia;

type HttpHeaderKeyValuePairQuotedSegmentTrivia =
  | HttpHeaderKeyValuePairQuotedLiteralContentTrivia
  | HttpHeaderKeyValuePairQuotedEscapeSequenceTrivia
  | HttpHeaderKeyValuePairQuotedEscapeUnicodeTrivia
  | HttpHeaderKeyValuePairQuotedEscapeCharTrivia;

type HttpHeaderKeyValuePairQuotedTrivia<TQuote extends "'" | '"' = '"'> = {
  preQuote: TQuote;
  segments: HttpHeaderKeyValuePairQuotedSegmentTrivia[];
  endQuote: TQuote;
} & HttpHeaderKeyValuePairListWhitespaceTrivia;

type HttpHeaderKeyValuePairListSeparatorTrivia = {
  separator: string;
} & HttpHeaderKeyValuePairListWhitespaceTrivia;

export type HttpHeaderKeyValuePairListTokenNode = {
  type: 'token';
  value: string;
  trivia?: HttpHeaderKeyValuePairTokenTrivia;
};

export type HttpHeaderKeyValuePairListQuotedNode<TQuote extends "'" | '"' = '"' | "'"> = {
  type: 'quoted';
  value: string;
  trivia?: HttpHeaderKeyValuePairQuotedTrivia<TQuote>;
};

export type HttpHeaderKeyValuePairListItemSeparatorNode = {
  type: 'itemSeparator';
  value: string;
  trivia?: HttpHeaderKeyValuePairListSeparatorTrivia;
};

export type HttpHeaderKeyValuePairListInfixSeparatorNode = {
  type: 'infixSeparator';
  value: '=';
  trivia?: HttpHeaderKeyValuePairListSeparatorTrivia;
};

export type HttpHeaderKeyValuePairSemantic = {
  key: HttpHeaderKeyValuePairListTokenNode | HttpHeaderKeyValuePairListQuotedNode;
  equals: HttpHeaderKeyValuePairListInfixSeparatorNode;
  value?: HttpHeaderKeyValuePairListTokenNode | HttpHeaderKeyValuePairListQuotedNode | undefined;
}

export type HttpHeaderValueOnlySemantic = {
  value: HttpHeaderKeyValuePairListTokenNode | HttpHeaderKeyValuePairListQuotedNode;
}

export type HttpHeaderKeyValuePairListItemSemantic = {
  trailingSeparator?: HttpHeaderKeyValuePairListItemSeparatorNode;
} & (HttpHeaderKeyValuePairSemantic | HttpHeaderValueOnlySemantic);
