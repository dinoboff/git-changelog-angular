/**
 * AngularJS Git Commit Message Conventions Grammar
 *
 * <type>(<scope>): <title>
 * <BLANK LINE>
 * <body>
 * <BLANK LINE>
 * <footer>
 *
 * https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#
 *
 */

{
  function findRevertHash(commit) {
    if (commit.type !== 'revert' || commit.body == null ) {
      return null;
    }

    const [_, hash = null] = /this\s+reverts?\s+commit\s+([0-9a-f]{7,40})\b/gi.exec(commit.body) || [];

    return hash;
  }
}

commit = subject:subject? body:body? footer:footer? {
  const {breakingChanges = null, issues = null} = footer || {};
  const commit = Object.assign({}, subject, {body}, {breakingChanges, issues});

  commit.revert = findRevertHash(commit);

  return commit;
}


/*** subject ***/

subject = header:subjectHeader? title:title {
  const {type = null, scope = null} = header || {};

  return {type, scope, title};
}

subjectHeader = type:type scope:scope? COLON SPACE {
  return {type, scope}
}

/* type */
type =
  "feat" /
  "fix" /
  "docs" /
  "style" /
  "refactor" /
  "perf" /
  "test" /
  "chore" /
  "revert"


/* scope */
scope = identifier / anyScope

identifier = "(" sequence:$((SYMBOL / DIGIT / ALPHA)+) ")" {
  return sequence;
}

anyScope = "(*)" {
  return null;
}

/* title */

title = $(CHAR+)


/*** Body ***/

body = !footer BLANK_LINE content:$($(!footerHeader .))+ {
  return content;
}


/*** Footer ***/

footer = BLANK_LINE blocks:(fixes / breaking)+ {
  const issues = [].concat(...blocks.map(b => b.issues || []));
  const changes = blocks.filter(b => typeof b === 'string')

  return {
    issues: issues.length > 0 ? issues : null,
    breakingChanges: changes.length > 0 ? changes : null
  };
}

footerHeader = BLANK_LINE (shortBreakHeader / longBreakHeader / fixHeader)

/* Breaking changes */

breaking = shortBreak / longBreak

shortBreak = shortBreakHeader content:$(CHAR+) (WS / EOF) {
  return `Breaks ${content}`;
}

shortBreakHeader = "Break" "s"? SPACE

longBreak = longBreakHeader content:$(.+) (WS / EOF) {
  return content;
}

longBreakHeader = "BREAKING CHANGE" "S"? COLON WS

/* Fix footer */

fixes = fixHeader COLON? tokens:token+ (WS / EOF) {
  const issues = tokens.filter(w => w.issue);

  return {issues};
}

fixHeader =
  "closes"i /
  "closed"i /
  "close"i /
  "fixes"i /
  "fixed"i /
  "fix"i /
  "resolves"i /
  "resolved"i /
  "resolve"i

token = SPACE token:(issue / word) &(WS / EOF) {
  return token;
}

issue = repo:repo? issue:issueNumber ","? {
  return {
    repo,
    issue,

    toString() {
      return `${this.repo ? this.repo : ''}#${this.issue}`;
    }
  };
}

issueNumber = "#" num:$(DIGIT+) {
  return num;
}

repo = owner:ghName "/" project:ghName {
  return {
    owner,
    project,

    toString() {
      return `${this.owner}/${this.project}`;
    }
  };
}

ghName = $(GHCHAR+)
word   = $(TOKENCHAR+)

/* macros */

ALPHA                   = [a-zA-Z]
BLANK_LINE "blank line" = EOL EOL+
CHAR             "char" = [^\0-\x1F]
COLON                   = ":"
DIGIT                   = [0-9]
EOF       "end of file" = !.
EOL       "end of line" = "\n"
GHCHAR    "Github char" = [-_a-zA-Z0-9]
SPACE           "space" = [\t ]+
SYMBOL                  = "$" / "_"
TOKENCHAR  "token char" = [^\0-\x20]
WS         "whitespace" = [ \t\n\r]+
