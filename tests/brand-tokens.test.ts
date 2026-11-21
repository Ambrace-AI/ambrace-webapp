import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `${selector} block is missing`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const found: Record<string, string> = {};
  for (const match of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    found[match[1]] = match[2].toLowerCase();
  }
  return found;
}

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG 2 contrast ratio between two colours. */
function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (light + 0.05) / (dark + 0.05);
}

const AA_TEXT = 4.5;
const AAA_TEXT = 7;

const themes = { Paper: tokens(":root"), Ink: tokens(".dark") };

for (const [name, theme] of Object.entries(themes)) {
  test(`${name}: body text is comfortable to read for a long time`, () => {
    assert.ok(contrast(theme.foreground, theme.background) >= AAA_TEXT);
    assert.ok(contrast(theme["card-foreground"], theme.card) >= AAA_TEXT);
  });

  test(`${name}: secondary text stays readable on every surface`, () => {
    for (const surface of ["background", "card", "muted"]) {
      assert.ok(
        contrast(theme["muted-foreground"], theme[surface]) >= AA_TEXT,
        `muted text on ${surface}`,
      );
    }
  });

  test(`${name}: button labels are readable`, () => {
    assert.ok(contrast(theme["primary-foreground"], theme.primary) >= AA_TEXT);
    assert.ok(contrast(theme["ember-foreground"], theme.ember) >= AA_TEXT);
  });

  test(`${name}: coral text is readable where it is used`, () => {
    assert.ok(contrast(theme["ember-text"], theme.background) >= AA_TEXT);
  });
}

test("Ember is the brand colour in both themes, and its label is never white", () => {
  for (const theme of Object.values(themes)) {
    assert.equal(theme.ember, "#ff6b4a");
    assert.equal(theme["ember-foreground"], "#0b0b10");
  }
  // The reason for the rule above: white on Ember fails for text.
  assert.ok(contrast("#ffffff", "#ff6b4a") < AA_TEXT);
});

test("Ember itself is too light for text on Paper, so Paper uses the darker coral", () => {
  assert.ok(contrast("#ff6b4a", themes.Paper.background) < AA_TEXT);
  assert.notEqual(themes.Paper["ember-text"], "#ff6b4a");
});

test("Ember is not the general primary colour", () => {
  for (const theme of Object.values(themes)) {
    assert.notEqual(theme.primary, theme.ember);
    assert.notEqual(theme.ring, theme.ember);
  }
});

test("the stylesheet has no gradients or glows", () => {
  assert.doesNotMatch(css, /gradient\(/);
  assert.doesNotMatch(css, /box-shadow|drop-shadow|text-shadow/);
});

test("decorative motion is switched off for people who ask for less", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
