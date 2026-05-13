import { readFileSync } from "node:fs";
import Ajv from "ajv";

const SCHEMA_PATH = "schemas/cip-0108.common.schema.json";

let cachedValidator:
  | ((data: unknown) => boolean & { errors?: unknown[] })
  | undefined;
let cachedErrorAccessor: () => unknown[] | null | undefined = () => undefined;

function getValidator(): {
  validate: (data: unknown) => boolean;
  errors: () => unknown[] | null | undefined;
} {
  if (!cachedValidator) {
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8")) as object;
    // strict:false because the schema uses some JSON Schema draft idioms
    // that Ajv's strict mode flags but that are valid per draft-07.
    const ajv = new Ajv({ allErrors: true, strict: false });
    const compiled = ajv.compile(schema);
    cachedValidator = compiled as unknown as (data: unknown) => boolean & {
      errors?: unknown[];
    };
    cachedErrorAccessor = () => compiled.errors;
  }
  return {
    validate: (data: unknown) => cachedValidator!(data),
    errors: () => cachedErrorAccessor(),
  };
}

/**
 * Validate an anchor JSON object against the vendored CIP-108 common
 * schema. Throws on failure with the Ajv error list inlined into the
 * message so the caller sees what's wrong without further plumbing.
 */
export function assertAnchorValid(anchor: unknown, label: string): void {
  const { validate, errors } = getValidator();
  if (validate(anchor)) return;
  const list = errors() ?? [];
  const details = list
    .map((e) => {
      const obj = e as { instancePath?: string; message?: string };
      return `  ${obj.instancePath || "<root>"}: ${obj.message ?? "(no message)"}`;
    })
    .join("\n");
  throw new Error(
    `${label} is not a valid CIP-108 anchor:\n${details}\n(schema: ${SCHEMA_PATH})`,
  );
}
