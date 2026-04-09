import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React 19 compiler regla demasiado estricta para nuestro patrón
      // actual `useEffect(() => { fetchData() })`. Degradada a warn;
      // refactorizaremos con SWR/useTransition en otro ciclo.
      "react-hooks/set-state-in-effect": "warn",
      // Falso positivo en event handlers que usan Date.now()/Math.random()
      "react-hooks/purity": "warn",
      // Advertencia común cuando queremos descartar un arg sin usarlo (_req, _i)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
