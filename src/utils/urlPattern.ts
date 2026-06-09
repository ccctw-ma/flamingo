export function normalizeRegexFilter(input: string) {
  const value = input.trim();
  if (!value) {
    return "";
  }

  if (value === "*") {
    return "^.*$";
  }

  const exactOriginRegex = value.match(/^(\^https?:\/\/(?:[^/\\]|\\.)+\/)\$$/i);
  if (exactOriginRegex) {
    return `${exactOriginRegex[1]}.*$`;
  }

  if (value.startsWith("^")) {
    return value;
  }

  if (!/^https?:\/\//i.test(value)) {
    return value;
  }

  const regex = value
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return regex.includes(".*") ? `^${regex}$` : `^${regex}.*$`;
}
