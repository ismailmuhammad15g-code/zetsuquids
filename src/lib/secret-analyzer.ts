// AST-based Secret Detector using @babel/parser
// Works in browser (client-side) via dynamic import
import { parse } from "@babel/parser";

export type DetectedSecret = {
  name: string;
  value: string;
  line: number;
  needs_input: boolean;
};

const SENSITIVE_KEYWORDS = [
  "KEY", "API", "SECRET", "TOKEN", "PASSWORD", "PASS",
  "CREDENTIALS", "AUTH", "SUPABASE", "FIREBASE", "HOST", "PORT",
  "PRIVATE", "ENCRYPTION", "CIPHER", "JWT",
];

const PLACEHOLDER_PATTERNS = [
  "YOUR", "PASTE", "EXAMPLE", "REPLACE", "HERE",
  "INSERT", "ADD_YOUR", "ENTER_YOUR", "TODO", "FIXME",
];

// Non-sensitive names that happen to contain sensitive keywords but aren't secrets
const IGNORE_NAMES = new Set([
  "className", "id", "type", "name", "href", "src", "alt",
  "style", "children", "key", "ref", "onClick", "onChange",
  "placeholder", "defaultValue", "ariaLabel", "aria-label",
  "dataKey", "data-key", "togglePassword", "showPassword",
  "userPassword", "confirmPassword",
]);

function isSensitiveName(name: string): boolean {
  const upper = name.toUpperCase();
  return SENSITIVE_KEYWORDS.some(k => upper.includes(k));
}

function isPlaceholderValue(value: string): boolean {
  const upper = value.toUpperCase();
  return PLACEHOLDER_PATTERNS.some(p => upper.includes(p));
}

function looksLikeSecret(value: string): boolean {
  if (!value || value.length < 4) return false;
  // Long random-looking strings (>= 20 chars, base64/alphanumeric with symbols)
  if (value.length >= 20 && /^[A-Za-z0-9_\-./+=]{16,}$/.test(value)) return true;
  // Hex-looking strings (24+ chars)
  if (value.length >= 24 && /^[A-Fa-f0-9]{24,}$/.test(value)) return true;
  // JWT-like (3 dot-separated base64 segments)
  if (value.includes('.') && value.split('.').length === 3) return true;
  // Placeholder patterns
  if (isPlaceholderValue(value)) return true;
  return false;
}

function getNodeLine(node: any): number {
  return node?.loc?.start?.line || node?.start?.line || 0;
}

// Extract string value from a Babel AST literal node
function extractStringValue(node: any): string | null {
  if (!node) return null;
  // StringLiteral (JS/TS) or Literal (legacy Babel)
  if (node.type === "StringLiteral" || node.type === "Literal") {
    if (typeof node.value === "string") return node.value;
  }
  // TemplateLiteral with no expressions → static string
  if (node.type === "TemplateLiteral" && node.expressions?.length === 0) {
    return node.quasis?.[0]?.value?.raw || node.quasis?.[0]?.value?.cooked || "";
  }
  return null;
}

export function detectSecrets(code: string): DetectedSecret[] {
  const secrets: DetectedSecret[] = [];
  const seen = new Set<string>();

  try {
    const ast = parse(code, {
      sourceType: "module",
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        "typescript",
        "jsx",
        "classProperties",
        "dynamicImport",
        "optionalChaining",
        "nullishCoalescingOperator",
        "decorators-legacy",
      ],
    });

    function walk(node: any) {
      if (!node || typeof node !== "object") return;

      // ----- Case 1: Variable Declarator -----
      // const API_KEY = "value"  or  const { API_KEY } = obj
      if (node.type === "VariableDeclarator") {
        const idNode = node.id;
        const initNode = node.init;

        if (!idNode || !initNode) {
          walkChildren(node);
          return;
        }

        // Simple identifier: const API_KEY = "sk-..."
        if (idNode.type === "Identifier") {
          const name: string = idNode.name;
          const line: number = getNodeLine(node);

          if (IGNORE_NAMES.has(name) || seen.has(name)) {
            walkChildren(node);
            return;
          }

          const value = extractStringValue(initNode);
          if (value !== null) {
            const nameSensitive = isSensitiveName(name);
            const valueSensitive = looksLikeSecret(value);
            const isPlaceholder = isPlaceholderValue(value);

            if (nameSensitive || valueSensitive) {
              seen.add(name);
              secrets.push({
                name,
                value: isPlaceholder ? "" : value,
                line,
                needs_input: isPlaceholder || valueSensitive === false && nameSensitive,
              });
            }
          }
        }

        // Object pattern: const { API_KEY = "fallback" } = obj
        if (idNode.type === "ObjectPattern") {
          for (const prop of idNode.properties || []) {
            if (prop.type === "ObjectProperty" || prop.type === "Property") {
              const key = prop.key;
              const val = prop.value;
              const actualVal = val?.type === "AssignmentPattern" ? val.right : val;

              if (!key || !actualVal) continue;

              const name: string = key.name || key.value || "";
              const line: number = getNodeLine(prop);

              if (IGNORE_NAMES.has(name) || seen.has(name)) continue;

              const value = extractStringValue(actualVal);
              if (value !== null) {
                const nameSensitive = isSensitiveName(name);
                const valueSensitive = looksLikeSecret(value);
                const isPlaceholder = isPlaceholderValue(value);

                if (nameSensitive || valueSensitive) {
                  seen.add(name);
                  secrets.push({
                    name,
                    value: isPlaceholder ? "" : value,
                    line,
                    needs_input: isPlaceholder || valueSensitive === false && nameSensitive,
                  });
                }
              }
            }
          }
        }
      }

      // ----- Case 2: Object Property (shorthand) -----
      // { API_KEY }  or  { API_KEY = "..." }
      if (node.type === "ObjectProperty" || node.type === "Property") {
        const key = node.key;
        const val = node.value;
        if (!key) {
          walkChildren(node);
          return;
        }

        const name: string = key.name || key.value || "";
        const line: number = getNodeLine(node);

        if (IGNORE_NAMES.has(name) || seen.has(name) || !isSensitiveName(name)) {
          walkChildren(node);
          return;
        }

        const value = extractStringValue(val);
        if (value !== null) {
          const isPlaceholder = isPlaceholderValue(value);
          seen.add(name);
          secrets.push({
            name,
            value: isPlaceholder ? "" : value,
            line,
            needs_input: isPlaceholder,
          });
        }
      }

      walkChildren(node);
    }

    function walkChildren(node: any) {
      if (!node || typeof node !== "object") return;
      for (const key of Object.keys(node)) {
        if (key === "loc" || key === "start" || key === "end" || key === "type") continue;
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(walk);
        } else if (child && typeof child === "object" && child.type) {
          walk(child);
        }
      }
    }

    walk(ast.program);
  } catch {
    // Parse failed silently — fallback to regex
  }

  return secrets;
}

/**
 * Convert detected secrets to .env file format string.
 * Example: API_KEY=123 → ["API_KEY=123"], needs_input: true → ["API_KEY="]
 */
export function toEnvLines(secrets: DetectedSecret[]): string[] {
  return secrets.map(s => `${s.name}=${s.value || ""}`);
}

/**
 * Convert detected secrets to a structured JSON map.
 * Use for auto-filling ENV fields.
 */
export function toEnvMap(secrets: DetectedSecret[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const s of secrets) {
    map[s.name] = s.value;
  }
  return map;
}

/**
 * Generate a complete JSON report matching the required schema.
 */
export function generateSecretReport(code: string): { secrets: DetectedSecret[] } {
  return { secrets: detectSecrets(code) };
}