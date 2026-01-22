export type NicheForms = {
  nominative: string;
  genitive: string;
  prepositional: string;
};

/**
 * Builds basic Russian case forms for niche labels.
 */
export function getNicheForms(niche: string): NicheForms {
  const base = niche.trim();
  if (!base) {
    return { nominative: "", genitive: "", prepositional: "" };
  }

  const tokens = base.split(/\s+/).map((token) => buildTokenForms(token));
  return {
    nominative: tokens.map((item) => item.nominative).join(" "),
    genitive: tokens.map((item) => item.genitive).join(" "),
    prepositional: tokens.map((item) => item.prepositional).join(" ")
  };
}

type TokenForms = {
  nominative: string;
  genitive: string;
  prepositional: string;
};

function buildTokenForms(token: string): TokenForms {
  if (!/[А-Яа-яЁё]/.test(token)) {
    return { nominative: token, genitive: token, prepositional: token };
  }

  if (token.includes("-")) {
    const parts = token.split("-").map((part) => buildTokenForms(part));
    return {
      nominative: parts.map((item) => item.nominative).join("-"),
      genitive: parts.map((item) => item.genitive).join("-"),
      prepositional: parts.map((item) => item.prepositional).join("-")
    };
  }

  const lower = token.toLowerCase();
  const adjective = declineAdjective(lower);
  if (adjective) {
    return applyTokenCase(token, adjective);
  }

  const noun = declineNoun(lower);
  return applyTokenCase(token, noun);
}

function applyTokenCase(original: string, forms: TokenForms): TokenForms {
  if (!original) return forms;
  if (original === original.toUpperCase()) {
    return {
      nominative: forms.nominative.toUpperCase(),
      genitive: forms.genitive.toUpperCase(),
      prepositional: forms.prepositional.toUpperCase()
    };
  }
  if (original[0] === original[0].toUpperCase()) {
    return {
      nominative: capitalize(forms.nominative),
      genitive: capitalize(forms.genitive),
      prepositional: capitalize(forms.prepositional)
    };
  }
  return forms;
}

function capitalize(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function declineAdjective(word: string): TokenForms | null {
  const rules: Array<{ suffix: string; genitive: string; prepositional: string }> = [
    { suffix: "ый", genitive: "ого", prepositional: "ом" },
    { suffix: "ий", genitive: "его", prepositional: "ем" },
    { suffix: "ой", genitive: "ого", prepositional: "ом" },
    { suffix: "ая", genitive: "ой", prepositional: "ой" },
    { suffix: "яя", genitive: "ей", prepositional: "ей" },
    { suffix: "ое", genitive: "ого", prepositional: "ом" },
    { suffix: "ее", genitive: "его", prepositional: "ем" }
  ];

  for (const rule of rules) {
    if (word.endsWith(rule.suffix)) {
      const stem = word.slice(0, -rule.suffix.length);
      return {
        nominative: word,
        genitive: `${stem}${rule.genitive}`,
        prepositional: `${stem}${rule.prepositional}`
      };
    }
  }

  return null;
}

function declineNoun(word: string): TokenForms {
  const last = word.slice(-1);
  const stem = word.slice(0, -1);
  if (last === "а") {
    return {
      nominative: word,
      genitive: `${stem}${needsIEnding(stem) ? "и" : "ы"}`,
      prepositional: `${stem}е`
    };
  }
  if (last === "я") {
    return { nominative: word, genitive: `${stem}и`, prepositional: `${stem}е` };
  }
  if (last === "ь") {
    return { nominative: word, genitive: `${stem}и`, prepositional: `${stem}и` };
  }
  if (last === "о") {
    return { nominative: word, genitive: `${stem}а`, prepositional: `${stem}е` };
  }
  if (last === "е") {
    return { nominative: word, genitive: `${stem}я`, prepositional: `${stem}е` };
  }
  return {
    nominative: word,
    genitive: `${word}а`,
    prepositional: `${word}е`
  };
}

function needsIEnding(stem: string): boolean {
  return /[гкхжчшщц]$/i.test(stem);
}
